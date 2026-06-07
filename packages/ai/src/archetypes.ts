export interface AiProfile {
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  claimRate: number;
  defenseSensitivity: number;
  handValueTarget: number;
  concealedPreference: number;
  riskTolerance: number;
  efficiencySkill: number;
}

export const CAUTIOUS: AiProfile = {
  name: 'Cautious',
  difficulty: 'easy',
  claimRate: 0.15,
  defenseSensitivity: 0.10,
  handValueTarget: 0,
  concealedPreference: 0.10,
  riskTolerance: 0.90,
  efficiencySkill: 0.30,
};

export const BALANCED: AiProfile = {
  name: 'Balanced',
  difficulty: 'medium',
  claimRate: 0.50,
  defenseSensitivity: 0.40,
  handValueTarget: 1,
  concealedPreference: 0.40,
  riskTolerance: 0.60,
  efficiencySkill: 0.65,
};

export const STRATEGIC: AiProfile = {
  name: 'Strategic',
  difficulty: 'hard',
  claimRate: 0.75,
  defenseSensitivity: 0.75,
  handValueTarget: 2,
  concealedPreference: 0.70,
  riskTolerance: 0.40,
  efficiencySkill: 0.85,
};

export const EXPERT: AiProfile = {
  name: 'Expert',
  difficulty: 'expert',
  claimRate: 0.90,
  defenseSensitivity: 0.95,
  handValueTarget: 2,
  concealedPreference: 0.85,
  riskTolerance: 0.40,
  efficiencySkill: 0.98,
};

export const ALL_PROFILES = [CAUTIOUS, BALANCED, STRATEGIC, EXPERT] as const;

export function getProfile(difficulty: AiProfile['difficulty']): AiProfile {
  return ALL_PROFILES.find(p => p.difficulty === difficulty) ?? BALANCED;
}
