export type PlanId = 'free' | 'plan_1' | 'plan_2' | 'plan_3';

export function getPlanName(plan: string): string {
  const names: Record<string, string> = {
    free: 'Gratis',
    plan_1: 'Esencial',
    plan_2: 'Avanzado',
    plan_3: 'Elite',
  };
  return names[plan] ?? plan;
}

export function getPlanLimit(plan: string): number {
  const limits: Record<string, number> = {
    free: 0,
    plan_1: 1,
    plan_2: 2,
    plan_3: 3,
  };
  return limits[plan] ?? 0;
}
