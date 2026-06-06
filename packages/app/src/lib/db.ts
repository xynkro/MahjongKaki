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

class MahjongKakiDB extends Dexie {
  sessions!: Dexie.Table<Session, number>;
  rounds!: Dexie.Table<Round, number>;

  constructor() {
    super('mahjongkaki');
    this.version(1).stores({
      sessions: '++id, createdAt, isActive',
      rounds: '++id, sessionId, timestamp',
    });
  }
}

export const db = new MahjongKakiDB();
