import type { Goal, State } from './types';

const DAY = 86400000;

function dim(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

export function today0() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** ближайшая дата обновления СТРОГО после anchor */
export function renewalAfter(g: Goal, anchorTs: number) {
  const a = new Date(anchorTs);
  if (g.cycleDay) {
    let m = a.getMonth() + 1;
    const y = a.getFullYear() + Math.floor(m / 12);
    m = m % 12;
    return new Date(y, m, Math.min(g.cycleDay, dim(y, m)));
  }
  // без даты цикла — конец следующего месяца
  return new Date(a.getFullYear(), a.getMonth() + 2, 0);
}

/** последняя дата обновления <= from (для инициализации цикла) */
export function prevRenewal(g: Goal, from: Date) {
  if (g.cycleDay) {
    let y = from.getFullYear(), m = from.getMonth();
    let c = new Date(y, m, Math.min(g.cycleDay, dim(y, m)));
    if (c.getTime() > from.getTime()) {
      m--; if (m < 0) { m = 11; y--; }
      c = new Date(y, m, Math.min(g.cycleDay, dim(y, m)));
    }
    return c;
  }
  return new Date(from.getFullYear(), from.getMonth() + 1, 0);
}

/**
 * Автообновление циклов обязательных целей:
 * - исполненные в дату обновления открываются заново (saved → 0)
 * - неисполненные остаются и «горят», пока цикл не закрыт
 * Мутирует переданный state (ожидается клон). Возвращает что изменилось.
 */
export function syncCycles(s: State): { changed: boolean; renewedNames: string[] } {
  const renewedNames: string[] = [];
  const today = today0().getTime();

  for (const g of s.goals) {
    if (g.cat !== 'req') continue;
    if (!g.anchor) g.anchor = prevRenewal(g, today0()).getTime();
    let ren = renewalAfter(g, g.anchor!).getTime();
    while (today >= ren) {
      if (g.status === 'done') {
        g.anchor = ren;
        g.saved = 0;
        g.status = 'saving';
        g.fundedAt = null;
        g.doneAt = null;
        renewedNames.push(g.name);
        ren = renewalAfter(g, g.anchor!).getTime();
      } else break; // не исполнена — горит/просрочена, ждёт исполнения
    }
    g.cycleEnd = ren;
  }

  return { changed: renewedNames.length > 0, renewedNames };
}
