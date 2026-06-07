import Dexie from 'dexie';

export interface Round {
  id?: number;
  sessionId: number;
  timestamp: number;
  winnerIndex: number;
  winnerName: string;
  tai: number;
  winType: 'zimo' | 'discard';
  deltas: [number, number, number, number];
}

export interface Session {
  id?: number;
  createdAt: number;
  updatedAt: number;
  playerNames: [string, string, string, string];
  stakeLabel: string;
  isActive: 0 | 1;
}

export interface GameSave {
  id?: number;
  createdAt: number;
  updatedAt: number;
  state: string;
  difficulty: string;
  speed: string;
  isActive: 0 | 1;
}

export interface TrainerStat {
  id?: number;
  drillType: string;
  timestamp: number;
  isCorrect: 0 | 1;
  score: number;
}

class MahjongKakiDB extends Dexie {
  sessions!: Dexie.Table<Session, number>;
  rounds!: Dexie.Table<Round, number>;
  gameSaves!: Dexie.Table<GameSave, number>;
  trainerStats!: Dexie.Table<TrainerStat, number>;

  constructor() {
    super('mahjongkaki');
    this.version(1).stores({
      sessions: '++id, createdAt, isActive',
      rounds: '++id, sessionId, timestamp',
    });
    this.version(2).stores({
      sessions: '++id, createdAt, isActive',
      rounds: '++id, sessionId, timestamp',
      gameSaves: '++id, createdAt, isActive',
      trainerStats: '++id, drillType, timestamp',
    });
  }
}

export const db = new MahjongKakiDB();
