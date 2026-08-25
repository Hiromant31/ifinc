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

export interface State {
  balance: number;
  xp: number;
  intel: number;
  skills: string[];
  transactions: Tx[];
  goals: Goal[];
  ideas: Idea[];
}

export interface Skill {
  id: string;
  icon: string;
  name: string;
  desc: string;
  cost: number;
}