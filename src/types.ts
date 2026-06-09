export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Cell {
  row: number;
  col: number;
  value: number; // 0 represents empty
  solution: number;
  isGiven: boolean;
  pencilMarks: number[];
}

export type Board = Cell[][];

export type GameStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'failed';

export interface Move {
  row: number;
  col: number;
  type: 'value' | 'pencil';
  oldValue?: number;
  newValue?: number;
  oldPencil?: number[];
  newPencil?: number[];
}

export interface DifficultyConfig {
  clues: number;
  label: string;
  color: string;
}

export interface GameStats {
  gamesPlayed: Record<Difficulty, number>;
  gamesWon: Record<Difficulty, number>;
  bestTime: Record<Difficulty, number | null>; // in seconds
  currentStreak: Record<Difficulty, number>;
}
