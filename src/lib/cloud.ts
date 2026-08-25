'use client';

import type { State } from './types';

const API_BASE = '/api/state';

let cloudAvailable = false;

export function isCloudEnabled(): boolean {
  return cloudAvailable;
}

/**
 * Fetch state from Vercel Blob via API route.
 * 404 = no saved state yet (but cloud itself reachable).
 */
export async function fetchCloudState(): Promise<{ ok: boolean; empty: boolean; state: State | null }> {
  try {
    const res = await fetch(API_BASE, { method: 'GET' });
    if (res.status === 404) {
      cloudAvailable = true;
      return { ok: true, empty: true, state: null };
    }
    if (!res.ok) {
      cloudAvailable = false;
      return { ok: false, empty: false, state: null };
    }
    cloudAvailable = true;
    return { ok: true, empty: false, state: (await res.json()) as State };
  } catch {
    cloudAvailable = false;
    return { ok: false, empty: false, state: null };
  }
}

export async function uploadCloudState(state: State): Promise<boolean> {
  try {
    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}
