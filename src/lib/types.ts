export type TxType = 'in' | 'out' | 'corr';
export type TxSide = 'in' | 'out';

export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  cat: string;
  note: string;
  ts: number;
  virtual?: boolean;
}

export type GoalCat = 'req' | 'opt';
export type GoalStatus = 'saving' | 'funded' | 'done';

export interface Goal {
  id: string;
  name: string;
  target: number;
  cat: GoalCat;
  icon: string;
  cycleDay: number | null;
  saved: number;
  status: GoalStatus;
  created: number;
  fundedAt: number | null;
  doneAt: number | null;
  /** циклические обяз. цели: якорь последнего обновления и дата следующего */
  anchor?: number | null;
  cycleEnd?: number | null;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  pts: number;
}

export interface Idea {
  id: string;
  title: string;
  reward: number;
  success: boolean;
  tasks: Task[];
}

export interface Habit {
  id: string;
  name: string;
  effort: number; // 1..3 ⭐ за отметку
  from: string | null; // '09:00'
  to: string | null;   // '10:00'
  streak: number;
  lastCheck: string | null; // '2026-8-25'
  created: number;
}

export interface PtEvent { ts: number; amt: number }

export type RewardSize = 's' | 'm' | 'l' | 'x';

export interface Reward {
  id: string;
  name: string;
  size: RewardSize;
  cost: number;
  tied: string | null; // goalId
  unlocked: boolean;
  claimed: number;
}

export interface State {
  balance: number;
  xp: number;
  intel: number;
  skills: string[];
  transactions: Tx[];
  goals: Goal[];
  ideas: Idea[];
  habits: Habit[];
  rewards: Reward[];
  pts: number;
  ptLog: PtEvent[];
}

export interface Skill {
  id: string;
  icon: string;
  name: string;
  desc: string;
  cost: number;
}