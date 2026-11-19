export interface DemoFeeQuote {
  gross: number;
  fee: number;
  net: number;
  tier: 'standard' | 'large';
}

// Демонстрация G3.5: для этой функции намеренно нет теста.
export function createDemoFeeQuote(amount: number): DemoFeeQuote {
  const normalizedAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const tier = normalizedAmount >= 1000 ? 'large' : 'standard';
  const rate = tier === 'large' ? 0.01 : 0.025;
  const fee = Math.round(normalizedAmount * rate * 100) / 100;

  return {
    gross: normalizedAmount,
    fee,
    net: Math.max(0, normalizedAmount - fee),
    tier,
  };
}
