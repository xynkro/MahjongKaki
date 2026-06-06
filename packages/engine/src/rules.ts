export interface RulesConfig {
  taiCap: number | null;
  zimoAsTai: boolean;
  shooterMode: 'standard' | 'halfShooter' | 'shooterPaysAll';
  concealedHandTai: number;
  anyFlowerScores: boolean;
  noFlowerBonus: boolean;
  pingWuTai: number;
  instantKongPayments: boolean;
  instantFlowerPayments: boolean;
  dealerDouble: boolean;
  limitHandsExceedCap: boolean;
  minTai: number;
  animalsEnabled: boolean;
}

export const DEFAULT_RULES: RulesConfig = {
  taiCap: 5,
  zimoAsTai: false,
  shooterMode: 'standard',
  concealedHandTai: 1,
  anyFlowerScores: true,
  noFlowerBonus: true,
  pingWuTai: 4,
  instantKongPayments: true,
  instantFlowerPayments: true,
  dealerDouble: false,
  limitHandsExceedCap: false,
  minTai: 1,
  animalsEnabled: true,
};

export function mergeRules(overrides: Partial<RulesConfig>): RulesConfig {
  return { ...DEFAULT_RULES, ...overrides };
}
