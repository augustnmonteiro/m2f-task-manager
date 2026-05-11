export function uniqueEmail(): string {
  return `e2e+${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
}

export const testPassword = 'TestPassword123!';
