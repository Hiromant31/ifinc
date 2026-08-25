'use client';

import { useState } from 'react';
import type { State } from '@/lib/types';
import { fmt } from '@/lib/format';
import { levelInfo } from '@/lib/level';
import {
  EFFORTS, SIZES, MILES,
  effStreak, nextMile, daysPreview, inWindow, sizeLabel, todayS,
} from '@/lib/growth';

interface Props {
  state: State;
  onOpenHabit: () => void;
  onOpenReward: () => void;
  onCheckHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onClaimReward: (id: string) => void;
  onDeleteReward: (id: string) => void;
}

export default function GrowthScreen(p: Props) {
  const s = p.state;
  const li = levelInfo(s.xp);

  return (
    <section id="screenGrow">
      <div className="xpblock">
        <div className="lrow"><b>LVL {li.lvl}</b><b>⭐ {fmt(s.pts)}</b></div>
        <div className="hbar"><div className="hbar-fill" style={{ width: Math.min(100, li.cur / li.need * 100) + '%' }} /></div>
        <div className="xptxt">{fmt(li.cur)} / {fmt(li.need)} XP</div>
        <div className="xptxt" style={{ marginTop: 4 }}>
          XP — ИЗ ЛЮБЫХ ДЕЙСТВИЙ → УРОВЕНЬ · LEVEL UP = +3⭐ · ⭐ — ТОЛЬКО ПРИВЫЧКИ, СТРИКИ И НАГРАДЫ
        </div>
      </div>

      <div className="shead">
        <h2>ПРИВЫЧКИ</h2><span className="hint">⭐ ЗА ОТМЕТКУ</span>
        <div className="sp" />
        <button type="button" className="btn sm acc" onClick={p.onOpenHabit}>＋ Привычка</button>
      </div>
      <div id="habitList">
        {s.habits.length === 0 && (
          <div className="empty">ДОБАВЬ ПРИВЫЧКУ — ОДНА КНОПКА «ОТМЕТИТЬСЯ» В ДЕНЬ</div>
        )}
        {s.habits.map(h => {
          const st = effStreak(h);
          const nm = nextMile(st);
          const wPct = nm ? Math.min(100, st / nm[0] * 100) : 100;
          const winOn = !!h.from && !!h.to;
          const winNow = inWindow(h);
          const done = h.lastCheck === todayS();
          const hint = nm ? ('ДО БОНУСА +' + nm[1] + '⭐: ' + (nm[0] - st) + ' ДН') : 'ВСЕ БОНУСЫ СТРИКА СОБРАНЫ';
          return (
            <article key={h.id} className="goal">
              <header>
                <span className="g-ico">🔁</span>
                <b>{h.name}</b>
                <span className="tag dim2">×{h.effort}⭐</span>
                {winOn && <span className="tag dim2">{h.from}–{h.to}</span>}
                <span className="tag ink">🔥 {st}</span>
              </header>
              <div className="hbar thin"><div className="hbar-fill" style={{ width: wPct + '%' }} /></div>
              <div className="row2">
                <span>{hint}</span>
                <span>{done ? 'СЕГОДНЯ ✔' : 'СЕГОДНЯ —'}</span>
              </div>
              <div className="acts">
                {done
                  ? <button type="button" className="btn ink" disabled>✔ Отмечено</button>
                  : (winOn && !winNow
                    ? <button type="button" className="btn" disabled>Окно {h.from}–{h.to}</button>
                    : <button type="button" className="btn acc" onClick={() => p.onCheckHabit(h.id)}>✔ Отметиться +{h.effort}⭐</button>)}
                <button type="button" className="sq" onClick={() => p.onDeleteHabit(h.id)}>✕</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="shead">
        <h2>НАГРАДЫ</h2><span className="hint">ТРАТИШЬ ⭐ ИЛИ ПРИВЯЖИ К ЦЕЛИ</span>
        <div className="sp" />
        <button type="button" className="btn sm ink" onClick={p.onOpenReward}>＋ Награда</button>
      </div>
      <div id="rewardList">
        {s.rewards.length === 0 && (
          <div className="empty">ПРИДУМАЙ СЕБЕ ПРИЗ — ИГРА САМА ПОДСКАЖЕТ ЦЕНУ</div>
        )}
        {s.rewards.map(r => {
          const need = Math.max(0, r.cost - s.pts);
          const fg = s.goals.find(g => g.id === r.tied);
          const claimable = r.unlocked || s.pts >= r.cost;
          return (
            <article key={r.id} className={'goal' + (claimable ? ' funded' : '')}>
              <header>
                <span className="g-ico">🎁</span>
                <b>{r.name}</b>
                <span className="tag dim2">{sizeLabel(r.size)} · {r.cost}⭐</span>
                {fg && <span className="tag dim2">🎯 {fg.name}</span>}
                {r.unlocked && <span className="tag acc">РАЗБЛОКИРОВАНА</span>}
              </header>
              <div className={'hbar' + (claimable ? ' acc' : '')}>
                <div className="hbar-fill" style={{ width: Math.min(100, s.pts / r.cost * 100) + '%' }} />
              </div>
              <div className="row2">
                <span><b>{fmt(Math.min(s.pts, r.cost))}</b> ИЗ {r.cost}⭐</span>
                <span>{daysPreview(need, s.ptLog)}{r.claimed ? ' · ПОЛУЧЕНО ×' + r.claimed : ''}</span>
              </div>
              <div className="acts">
                {r.unlocked
                  ? <button type="button" className="btn gold" onClick={() => p.onClaimReward(r.id)}>🎁 Забрать (цель)</button>
                  : (s.pts >= r.cost
                    ? <button type="button" className="btn gold" onClick={() => p.onClaimReward(r.id)}>🎁 Забрать</button>
                    : <button type="button" className="btn" disabled>🎁 {fmt(s.pts)}/{r.cost}⭐</button>)}
                <button type="button" className="sq" onClick={() => p.onDeleteReward(r.id)}>✕</button>
              </div>
            </article>
          );
        })}
      </div>

      {/* легенда вех для подсказки (не настройки) */}
      <div className="xptxt" style={{ marginTop: 14, textAlign: 'center' }}>
        БОНУСЫ СТРИКА: {MILES.map(m => m[0] + ' ДН → +' + m[1] + '⭐').join(' · ')} · РАЗМЕРЫ: {SIZES.map(z => z.l + ' ' + z.cost + '⭐').join(' · ')}
      </div>
    </section>
  );
}
