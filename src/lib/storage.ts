import type { State, Tx, Goal, Idea } from './types';
import { uid } from './format';

export const LS_KEY = 'lifequest_v1';

export function freshState(): State {
  return { balance: 0, xp: 0, intel: 0, skills: [], transactions: [], goals: [], ideas: [] };
}

export function normalizeState(d: unknown): State | null {
  if (!d || typeof d !== 'object') return null;
  const s = d as Record<string, unknown>;
  if (!Array.isArray(s.goals) || !Array.isArray(s.transactions) || !Array.isArray(s.ideas)) return null;
  if (typeof s.balance !== 'number') s.balance = 0;
  if (typeof s.xp !== 'number') s.xp = 0;
  if (typeof s.intel !== 'number') s.intel = 0;
  if (!Array.isArray(s.skills)) s.skills = [];
  for (const g of s.goals as Goal[]) {
    if (typeof g.cycleDay !== 'number') g.cycleDay = null;
  }
  return s as unknown as State;
}

export function loadState(): State | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveState(s: State) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}

export function isToday(ts: number) {
  return new Date(ts).toDateString() === new Date().toDateString();
}