import type { ScoringResult, StakeConfig, PayoutResult, PlayerPayout, ShooterMode } from './types.js';
import type { RulesConfig } from './rules.js';
import { DEFAULT_RULES } from './rules.js';

export interface PayoutInput {
  scoring: ScoringResult;
  stake: StakeConfig;
  winnerIndex: number;
  shooterIndex?: number;
  playerNames: [string, string, string, string];
  rules?: RulesConfig;
}

export function calculatePayout(input: PayoutInput): PayoutResult {
  const { scoring, stake, winnerIndex, shooterIndex, playerNames } = input;
  const rules = input.rules ?? DEFAULT_RULES;
  const isZimo = shooterIndex === undefined;

  const basePayout = stake.base * Math.pow(2, scoring.cappedTai);

  const payments: PlayerPayout[] = [];
  const netPerPlayer: Record<string, number> = {};

  for (let i = 0; i < 4; i++) {
    netPerPlayer[playerNames[i]] = 0;
  }

  if (isZimo) {
    // Self-draw: all 3 losers pay doubled amount
    for (let i = 0; i < 4; i++) {
      if (i === winnerIndex) continue;
      const amount = basePayout * 2;
      payments.push({ playerIndex: i, name: playerNames[i], amount: -amount });
      netPerPlayer[playerNames[i]] -= amount;
      netPerPlayer[playerNames[winnerIndex]] += amount;
    }
  } else {
    // Discard win: depends on shooter mode
    for (let i = 0; i < 4; i++) {
      if (i === winnerIndex) continue;

      let amount: number;

      switch (rules.shooterMode) {
        case 'shooterPaysAll':
          amount = i === shooterIndex ? basePayout * 4 : 0;
          break;
        case 'halfShooter':
          amount = i === shooterIndex ? basePayout * 3 : basePayout * 0.5;
          break;
        case 'standard':
        default:
          amount = i === shooterIndex ? basePayout * 2 : basePayout;
          break;
      }

      if (amount > 0) {
        payments.push({ playerIndex: i, name: playerNames[i], amount: -amount });
        netPerPlayer[playerNames[i]] -= amount;
        netPerPlayer[playerNames[winnerIndex]] += amount;
      }
    }
  }

  return {
    winner: playerNames[winnerIndex],
    winnerIndex,
    payments,
    netPerPlayer,
  };
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0.00';
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-' : '';
  if (abs < 1) {
    return `${prefix}${(abs * 100).toFixed(0)}¢`;
  }
  return `${prefix}$${abs.toFixed(2)}`;
}

export function formatSettlement(netPerPlayer: Record<string, number>): string[] {
  const debts: { from: string; to: string; amount: number }[] = [];

  const balances = Object.entries(netPerPlayer)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => a.amount - b.amount);

  let i = 0;
  let j = balances.length - 1;

  while (i < j) {
    const debtor = balances[i];
    const creditor = balances[j];
    const transfer = Math.min(-debtor.amount, creditor.amount);

    if (transfer > 0.001) {
      debts.push({ from: debtor.name, to: creditor.name, amount: transfer });
      debtor.amount += transfer;
      creditor.amount -= transfer;
    }

    if (Math.abs(debtor.amount) < 0.001) i++;
    if (Math.abs(creditor.amount) < 0.001) j--;
  }

  return debts.map(d =>
    `${d.from} pays ${d.to} ${formatCurrency(d.amount)}`
  );
}
