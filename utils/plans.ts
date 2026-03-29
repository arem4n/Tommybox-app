export const PLAN_NAMES: Record<string, string> = {
  plan_1: 'Starter',
  plan_2: 'Performance',
  plan_3: 'Elite',
  free: 'Sin Plan',
  starter: 'Starter',
};

export const PLAN_SESSIONS_PER_WEEK: Record<string, number> = {
  starter: 1,
  Starter: 1,
  'plan_1': 1,
  '1': 1,
  performance: 2,
  Performance: 2,
  'plan_2': 2,
  '2': 2,
  elite: 3,
  Elite: 3,
  'plan_3': 3,
  '3': 3,
  free: 0,
  'Sin Plan': 0,
};

export const getPlanName = (planId: string): string => {
  return PLAN_NAMES[planId] || planId;
};

export const getPlanLimit = (planId: string): number => {
  return PLAN_SESSIONS_PER_WEEK[planId] ?? 0;
};
