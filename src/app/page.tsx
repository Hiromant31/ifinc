'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Goal, State } from '@/lib/types';
import { fmt, money } from '@/lib/format';
import { csvJoin, downloadCSV } from '@/lib/csv';
import { freshState, loadState, normalizeState, saveState } from '@/lib/storage';
import { fetchCloudState, uploadCloudState } from '@/lib/cloud';

import Header from '@/components/Header';
import GoalsScreen from '@/components/GoalsScreen';
import JournalScreen from '@/components/JournalScreen';
import GrowthScreen from '@/components/GrowthScreen';
import BottomNav from '@/components/BottomNav';
import Toasts, { type ToastItem } from '@/components/Toasts';
import TxSheet from '@/components/sheets/TxSheet';
import GoalSheet from '@/components/sheets/GoalSheet';
import AmountSheet from '@/components/sheets/AmountSheet';
import AdjustSheet from '@/components/sheets/AdjustSheet';
import MenuSheet from '@/components/sheets/MenuSheet';
import { SKILLS } from '@/lib/constants';

type Tab = 'goals' | 'fin' | 'grow';
type SheetKind = 'tx' | 'goal' | 'amount' | 'adjust' | 'menu' | null;

function levelInfo(xp: number) {
  let lvl = 1, need = 150, rem = xp;
  while (rem >= need) { rem -= need; lvl++; need = Math.round(150 * Math.pow(lvl, 1.35)); }
  return { lvl, cur: rem, need };
}

function boom(n: number) {
  try {
    const c = (window as unknown as { confetti?: (o: object) => void }).confetti;
    if (typeof c === 'function') {
      c({ particleCount: n, spread: 75, origin: { y: 0.55 }, colors: ['#D2694A', '#242A20', '#B0B7A2', '#F2E8DA'] });
    }
  } catch {}
}

export default function Page() {
  const [state, setState] = useState<State>(freshState);
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState<Tab>('goals');
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [amountModal, setAmountModal] = useState<{ title: string; btnText: string; preset?: string; cb: (v: number) => boolean }>({ title: '', btnText: 'Ок', cb: () => true });
  const cloudRef = useRef(false);

  /* ---------- helpers ---------- */
  const toast = useCallback((msg: string, type?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const clone = (s: State): State => JSON.parse(JSON.stringify(s));

  /** добавляет XP с бустом навыков; возвращает true при level up */
  function gainXp(s: State, base: number): boolean {
    const before = levelInfo(s.xp).lvl;
    s.xp += Math.round(base * (1 + 0.15 * s.skills.length));
    return levelInfo(s.xp).lvl > before;
  }

  function checkGoalStatus(s: State, g: Goal) {
    if (g.status === 'done') return;
    if (g.saved >= g.target) {
      if (g.status !== 'funded') {
        g.status = 'funded'; g.fundedAt = Date.now();
        toast('💰 ЦЕЛЬ «' + g.name + '» НАКОПЛЕНА! МОЖНО ИСПОЛНЯТЬ.', 'gold');
        boom(120); gainXp(s, 50);
      }
    } else if (g.status === 'funded') {
      g.status = 'saving'; g.fundedAt = null;
    }
  }

  /* ---------- boot: localStorage + cloud ---------- */
  useEffect(() => {
    const local = loadState();
    setState(local || freshState());
    setBooted(true);

    fetchCloudState().then(({ ok, empty, state: cloud }) => {
      if (!ok) return;
      if (!empty && cloud) {
        const norm = normalizeState(cloud);
        if (norm) {
          const loc = loadState();
          // облако главнее локальных данных
          setState(norm);
          saveState(norm);
          toast('☁ ДАННЫЕ ЗАГРУЖЕНЫ ИЗ ОБЛАКА', 'green');
          void loc;
        }
      }
    });

    setTimeout(() => toast('👋 LIFEQUEST: ЗАПИСЫВАЙ ДОХОДЫ → РАСПРЕДЕЛЯЙ ПО ЦЕЛЯМ → ИСПОЛНЯЙ', 'gold'), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- persist ---------- */
  useEffect(() => {
    if (!booted) return;
    saveState(state);
    if (cloudRef.current) {
      uploadCloudState(state).then(ok => {
        if (!ok) console.warn('[cloud] sync failed');
      });
    }
  }, [state, booted]);

  /* ---------- Escape закрывает шторки ---------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  /* ---------- действия журнала ---------- */
  function addTx(type: 'in' | 'out', amount: number, cat: string, note: string) {
    setState(prev => {
      const s = clone(prev);
      s.transactions.push({ id: uid(), type, amount, cat, note, ts: Date.now() });
      if (type === 'in') { s.balance += amount; toast('+' + fmt(amount), 'green'); gainXp(s, 5); }
      else { s.balance -= amount; toast('−' + fmt(amount)); gainXp(s, 2); }
      return s;
    });
    setSheet(null);
  }

  function delTx(id: string) {
    setState(prev => {
      const s = clone(prev);
      const i = s.transactions.findIndex(t => t.id === id);
      if (i < 0) return prev;
      const t = s.transactions[i];
      if (!t.virtual) {
        if (t.type === 'in') s.balance -= t.amount;
        else if (t.type === 'out') s.balance += t.amount;
        else s.balance -= t.amount;
      }
      s.transactions.splice(i, 1);
      toast('ОПЕРАЦИЯ УДАЛЕНА, БАЛАНС ПЕРЕСЧИТАН');
      return s;
    });
  }

  function adjustBalance(v: number) {
    setState(prev => {
      const s = clone(prev);
      const diff = v - s.balance;
      s.balance = v;
      s.transactions.push({ id: uid(), type: 'corr', amount: diff, cat: 'Корректировка', note: 'сверка баланса', ts: Date.now() });
      toast('⚖ БАЛАНС СВЕРЕН: ' + money(v), 'green');
      return s;
    });
    setSheet(null);
  }

  /* ---------- цели ---------- */
  function saveGoal(data: { name: string; target: number; cat: 'req' | 'opt'; cycleDay: number | null; icon: string }) {
    setState(prev => {
      const s = clone(prev);
      if (editGoal) {
        const g = s.goals.find(x => x.id === editGoal.id);
        if (g) {
          g.name = data.name; g.target = data.target; g.cat = data.cat;
          g.icon = data.icon; g.cycleDay = data.cycleDay;
          checkGoalStatus(s, g);
          toast('ЦЕЛЬ ОБНОВЛЕНА');
        }
      } else {
        s.goals.push({
          id: uid(), name: data.name, target: data.target, cat: data.cat,
          icon: data.icon, cycleDay: data.cycleDay, saved: 0,
          status: 'saving', created: Date.now(), fundedAt: null, doneAt: null,
        });
        toast('🎯 ЦЕЛЬ «' + data.name.toUpperCase() + '» В ДЕРЕВЕ', 'green');
        gainXp(s, 10);
      }
      return s;
    });
    setEditGoal(null);
    setSheet(null);
  }

  function goalPut(g: Goal, v: number): boolean {
    let okResult = true;
    setState(prev => {
      const s = clone(prev);
      const gg = s.goals.find(x => x.id === g.id);
      if (!gg) { okResult = false; return prev; }
      const need = gg.target - gg.saved;
      if (need <= 0) { toast('ЦЕЛЬ УЖЕ ЗАКРЫТА', 'err'); okResult = false; return prev; }
      const put = Math.min(v, need);
      if (put > s.balance) { toast('НЕДОСТАТОЧНО ДЕНЕГ НА РУКАХ', 'err'); okResult = false; return prev; }
      gg.saved += put;
      s.balance -= put;
      if (put < v) toast('ВЛОЖЕНО ' + money(put) + ' — ОСТАТОК ДО ЦЕЛИ', 'green');
      checkGoalStatus(s, gg);
      gainXp(s, 6);
      return s;
    });
    return okResult;
  }

  function goalTake(g: Goal, v: number): boolean {
    let ok = true;
    setState(prev => {
      const s = clone(prev);
      const gg = s.goals.find(x => x.id === g.id);
      if (!gg || v > gg.saved) { toast('В ЦЕЛИ СТОЛЬКО НЕТ', 'err'); ok = false; return prev; }
      gg.saved -= v;
      s.balance += v;
      checkGoalStatus(s, gg);
      return s;
    });
    return ok;
  }

  function execGoal(g: Goal) {
    setState(prev => {
      const s = clone(prev);
      const gg = s.goals.find(x => x.id === g.id);
      if (!gg) return prev;
      gg.status = 'done'; gg.doneAt = Date.now();
      s.transactions.push({
        id: uid(), type: 'out', amount: gg.saved, cat: 'Цели',
        note: 'исполнена: ' + gg.name, ts: Date.now(), virtual: true,
      });
      gainXp(s, 100); boom(220); setShelfOpen(true);
      toast('🏆 ЦЕЛЬ «' + gg.name + '» ИСПОЛНЕНА! +100 XP · РАСХОД ЗАПИСАН', 'gold');
      return s;
    });
  }

  function deleteGoal(id: string) {
    setState(prev => {
      const s = clone(prev);
      const g = s.goals.find(x => x.id === id);
      if (!g) return prev;
      s.balance += g.saved;
      s.goals = s.goals.filter(x => x.id !== id);
      toast('ЦЕЛЬ УДАЛЕНА, ' + money(g.saved) + ' ВЕРНУЛИСЬ НА РУКИ');
      return s;
    });
  }

  function autoDistribute() {
    setState(prev => {
      const s = clone(prev);
      let avail = s.balance, moved = 0;
      if (avail <= 0) { toast('НА РУКАХ ПУСТО — СНАЧАЛА ЗАПИШИ ДОХОД', 'err'); return prev; }
      const order = s.goals
        .filter(g => g.status !== 'done')
        .sort((a, b) => a.cat === b.cat ? a.created - b.created : (a.cat === 'req' ? -1 : 1));
      for (const g of order) {
        if (avail <= 0) break;
        const need = g.target - g.saved;
        if (need <= 0) continue;
        const put = Math.min(need, avail);
        g.saved += put; avail -= put; moved += put;
        checkGoalStatus(s, g);
      }
      s.balance = avail;
      if (moved > 0) { toast('⚡ РАСПРЕДЕЛЕНО ' + money(moved) + ' · ОСТАТОК ' + money(s.balance), 'green'); gainXp(s, 8); }
      else toast('ВСЕ ЦЕЛИ УЖЕ ЗАКРЫТЫ ИЛИ ДЕНЕГ НЕ ХВАТАЕТ', 'err');
      return s;
    });
  }

  /* ---------- идеи / навыки ---------- */
  function addIdea(title: string, reward: number) {
    setState(prev => {
      const s = clone(prev);
      s.ideas.unshift({ id: uid(), title, reward, success: false, tasks: [] });
      gainXp(s, 5);
      toast('💡 ИДЕЯ ЗАПИСАНА — ПОСТРОЙ ДЕРЕВО ЗАДАЧ', 'green');
      return s;
    });
  }

  function addTask(ideaId: string, text: string) {
    setState(prev => {
      const s = clone(prev);
      const it = s.ideas.find(i => i.id === ideaId);
      if (!it) return prev;
      it.tasks.push({ id: uid(), text, done: false, pts: 5 });
      gainXp(s, 3);
      return s;
    });
  }

  function toggleTask(ideaId: string, taskId: string, done: boolean) {
    setState(prev => {
      const s = clone(prev);
      const it = s.ideas.find(i => i.id === ideaId);
      const t = it?.tasks.find(x => x.id === taskId);
      if (!it || !t) return prev;
      t.done = done;
      if (done) { s.intel += t.pts; gainXp(s, 4); toast('+' + t.pts + ' INT', 'green'); }
      else s.intel -= t.pts;
      return s;
    });
  }

  function deleteTask(ideaId: string, taskId: string) {
    setState(prev => {
      const s = clone(prev);
      const it = s.ideas.find(i => i.id === ideaId);
      if (!it) return prev;
      const t = it.tasks.find(x => x.id === taskId);
      if (t && t.done) s.intel -= t.pts;
      it.tasks = it.tasks.filter(x => x.id !== taskId);
      return s;
    });
  }

  function ideaSuccess(ideaId: string) {
    setState(prev => {
      const s = clone(prev);
      const it = s.ideas.find(i => i.id === ideaId);
      if (!it || it.success) return prev;
      it.success = true;
      s.intel += it.reward;
      gainXp(s, 30); boom(90);
      toast('🧪 ИДЕЯ «' + it.title.toUpperCase() + '» УСПЕШНА! +' + it.reward + ' INT', 'gold');
      return s;
    });
  }

  function deleteIdea(id: string) {
    setState(prev => {
      const s = clone(prev);
      s.ideas = s.ideas.filter(x => x.id !== id);
      toast('ИДЕЯ УДАЛЕНА');
      return s;
    });
  }

  function buySkill(id: string) {
    setState(prev => {
      const s = clone(prev);
      const sk = SKILLS.find(k => k.id === id);
      if (!sk || s.skills.includes(id)) return prev;
      if (s.intel < sk.cost) { toast('НУЖНО INT ' + sk.cost + ' — ВЫПОЛНЯЙ ЗАДАЧИ ИДЕЙ', 'err'); return prev; }
      s.intel -= sk.cost;
      s.skills.push(id);
      gainXp(s, 20); boom(70);
      toast('🧬 НАВЫК «' + sk.name.toUpperCase() + '» ИЗУЧЕН! БУСТ РАСТЁТ', 'gold');
      return s;
    });
  }

  /* ---------- экспорт / сброс ---------- */
  function exportTx() {
    const rows: string[][] = [['Дата', 'Время', 'Тип', 'Категория', 'Сумма', 'Комментарий']];
    const list = [...state.transactions].sort((a, b) => a.ts - b.ts);
    for (const t of list) {
      const d = new Date(t.ts);
      const sign = t.type === 'in' ? 1 : t.type === 'out' ? -1 : (t.amount >= 0 ? 1 : -1);
      const label = t.type === 'in' ? 'Доход' : t.type === 'out' ? 'Расход' : 'Корректировка';
      rows.push([
        d.toLocaleDateString('ru-RU'),
        d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        label, t.cat, (sign * Math.abs(t.amount)).toFixed(2), t.note || '',
      ]);
    }
    downloadCSV('lifequest_операции.csv', csvJoin(rows));
    toast('📊 ЭКСПОРТ ОПЕРАЦИЙ ГОТОВ', 'green');
  }

  function exportGoals() {
    const rows: string[][] = [['Цель', 'Категория', 'Статус', 'Целевая сумма', 'Накоплено', 'Осталось', 'Дата цикла', 'Создана', 'Накоплена', 'Исполнена']];
    const d2 = (ts?: number | null) => ts ? new Date(ts).toLocaleDateString('ru-RU') : '';
    for (const g of state.goals) {
      const st = g.status === 'saving' ? 'Накопление' : g.status === 'funded' ? 'Накоплена' : 'Исполнена';
      rows.push([
        g.name,
        g.cat === 'req' ? 'Обязательная' : 'Дополнительная',
        st, String(g.target), String(g.saved), String(Math.max(0, g.target - g.saved)),
        g.cycleDay ? String(g.cycleDay) : '', d2(g.created), d2(g.fundedAt), d2(g.doneAt),
      ]);
    }
    downloadCSV('lifequest_цели.csv', csvJoin(rows));
    toast('🎯 ЭКСПОРТ ЦЕЛЕЙ ГОТОВ', 'green');
  }

  function resetProgress() {
    if (!confirm('Вы уверены, что хотите сбросить прогресс?')) return;
    localStorage.removeItem('lifequest_v1');
    setState(freshState());
    setShelfOpen(false);
    toast('♻ ПРОГРЕСС СБРОШЕН ПО НУЛЯМ');
  }

  /* ---------- производные значения ---------- */
  const li = levelInfo(state.xp);
  const isToday = (ts: number) => new Date(ts).toDateString() === new Date().toDateString();
  let todayIn = 0, todayOut = 0;
  for (const t of state.transactions) {
    if (!isToday(t.ts)) continue;
    if (t.type === 'in') todayIn += t.amount;
    else if (t.type === 'out') todayOut += t.amount;
  }

  function openDeposit(g: Goal) {
    setAmountModal({
      title: '💰 ПОПОЛНИТЬ «' + g.name.toUpperCase() + '»',
      btnText: 'ВЛОЖИТЬ',
      preset: String(Math.max(0, g.target - g.saved)),
      cb: v => goalPut(g, v),
    });
    setSheet('amount');
  }
  function openWithdraw(g: Goal) {
    setAmountModal({
      title: '↩ ВЕРНУТЬ С «' + g.name.toUpperCase() + '»',
      btnText: 'ВЕРНУТЬ',
      cb: v => goalTake(g, v),
    });
    setSheet('amount');
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  return (
    <div className="wrap">
      <Header
        balance={state.balance}
        todayIn={todayIn}
        todayOut={todayOut}
        goalsSavedPct={0}
        lvl={li.lvl}
        intel={Math.round(state.intel)}
        xpCur={li.cur}
        xpNeed={li.need}
        onMenu={() => setSheet('menu')}
      />

      {tab === 'goals' && (
        <GoalsScreen
          state={state}
          shelfOpen={shelfOpen}
          onToggleShelf={() => setShelfOpen(o => !o)}
          onAddTx={t => { setSheet('tx'); }}
          onAdjust={() => setSheet('adjust')}
          onAuto={autoDistribute}
          onNewGoal={() => { setEditGoal(null); setSheet('goal'); }}
          onEditGoal={id => {
            const g = state.goals.find(x => x.id === id) || null;
            setEditGoal(g);
            setSheet('goal');
          }}
          onDeleteGoal={deleteGoal}
          onDeposit={openDeposit}
          onWithdraw={openWithdraw}
          onExec={execGoal}
        />
      )}

      {tab === 'fin' && (
        <JournalScreen
          state={state}
          onDelTx={delTx}
          onExportTx={exportTx}
          onExportGoals={exportGoals}
        />
      )}

      {tab === 'grow' && (
        <GrowthScreen
          state={state}
          onAddIdea={addIdea}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onIdeaSuccess={ideaSuccess}
          onDeleteIdea={deleteIdea}
          onBuySkill={buySkill}
        />
      )}

      <footer>LIFEQUEST · ДАННЫЕ ЛОКАЛЬНО{cloudRef.current ? ' · ОБЛАКО ПОДКЛЮЧЕНО' : ''}</footer>

      <BottomNav tab={tab} onSelect={setTab} />

      <TxSheet open={sheet === 'tx'} initialType="in" onSubmit={addTx} onClose={() => setSheet(null)} />
      <GoalSheet open={sheet === 'goal'} editGoal={editGoal} onSubmit={saveGoal} onClose={() => { setEditGoal(null); setSheet(null); }} />
      <AmountSheet
        open={sheet === 'amount'}
        title={amountModal.title}
        btnText={amountModal.btnText}
        presetValue={amountModal.preset}
        onSubmit={v => { if (amountModal.cb(v)) setSheet(null); }}
        onClose={() => setSheet(null)}
      />
      <AdjustSheet open={sheet === 'adjust'} onSubmit={adjustBalance} onClose={() => setSheet(null)} />
      <MenuSheet
        open={sheet === 'menu'}
        onAdjust={() => setSheet('adjust')}
        onExportTx={exportTx}
        onExportGoals={exportGoals}
        onReset={resetProgress}
        onClose={() => setSheet(null)}
      />

      <Toasts items={toasts} />
    </div>
  );
}
