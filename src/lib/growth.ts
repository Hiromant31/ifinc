import type { State, Goal } from './types';

export const EFFORTS = [
  { v: 1, l: 'ЛЁГКАЯ · 1⭐' },
  { v: 2, l: 'СРЕДНЯЯ · 2⭐' },
  { v: 3, l: 'ТРУДНАЯ · 3⭐' },
];
export const SIZES: { id: 's' | 'm' | 'l' | 'x'; l: string; cost: number }[] = [
  { id: 's', l: 'МАЛАЯ', cost: 5 },
  { id: 'm', l: 'СРЕДНЯЯ', cost: 15 },
  { id: 'l', l: 'КРУПНАЯ', cost: 40 },
  { id: 'x', l: 'ЭПИК', cost: 100 },
];
/** стрик → бонус ⭐ (начисляется автоматически) */
export const MILES: [number, number][] = [[3, 1], [7, 2], [14, 4], [30, 8]];
/** level up даёт ⭐ */
export const LVL_BONUS = 3;

const DAY = 86400000;

function dstr2(d: Date) {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
export function todayS() { return dstr2(new Date()); }
export function yestS() { return dstr2(new Date(Date.now() - DAY)); }

/** средний темп заработка ⭐ за последние 7 дней */
export function pace7(ptLog: { ts: number; amt: number }[]) {
  const cut = Date.now() - 7 * DAY;
  let s = 0;
  for (const e of ptLog) if (e.ts >= cut) s += e.amt;
  return s / 7;
}

/** стрик считается активным, если отмечался сегодня или вчера */
export function effStreak(h: { lastCheck: string | null; streak: number }) {
  return h.lastCheck === todayS() || h.lastCheck === yestS() ? h.streak : 0;
}

/** следующая веха стрика [дней, бонус⭐] или null */
export function nextMile(st: number): [number, number] | null {
  for (const m of MILES) if (m[0] > st) return m;
  return null;
}

export function sizeLabel(id: string) {
  return SIZES.find(s => s.id === id)?.l ?? 'МАЛАЯ';
}
export function sizeCost(id: string) {
  return SIZES.find(s => s.id === id)?.cost ?? 5;
}

/** человеческий прогноз вместо математики */
export function daysPreview(need: number, ptLog: { ts: number; amt: number }[]) {
  if (need <= 0) return 'МОЖНО ЗАБИРАТЬ СЕЙЧАС';
  const p = pace7(ptLog);
  if (p < 0.05) return 'ТЕМП ПОКА НЕЯСЕН — НАЧНИ ОТМЕЧАТЬСЯ';
  return '≈ ' + Math.ceil(need / p) + ' ДН В ТВОЁМ ТЕМПЕ';
}

/** окно времени активно сейчас? */
export function inWindow(h: { from: string | null; to: string | null }) {
  if (!h.from || !h.to) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const p = h.from.split(':'), q = h.to.split(':');
  return cur >= (+p[0] * 60 + +p[1]) && cur <= (+q[0] * 60 + +q[1]);
}

/** разблокировать награды, привязанные к исполненной цели; возвращает имена разблокированных */
export function unlockTiedRewards(s: State, g: Goal): string[] {
  const names: string[] = [];
  for (const r of s.rewards) {
    if (r.tied === g.id && !r.unlocked) {
      r.unlocked = true;
      names.push(r.name);
    }
  }
  return names;
}