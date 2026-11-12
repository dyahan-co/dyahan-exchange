const STORAGE_KEY = 'dyahan.bank.demoLoan';

export interface DemoLoan {
  id: string;
  amount: number;
  dueAt: string;
}

export function getDemoLoan(): DemoLoan | null {
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return null;

  try {
    const loan = JSON.parse(value) as DemoLoan;
    if (loan.id !== 'L42' || loan.amount !== 10 || !Number.isFinite(Date.parse(loan.dueAt))) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return loan;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function startDemoLoan(): DemoLoan {
  const loan: DemoLoan = {
    id: 'L42',
    amount: 10,
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loan));
  return loan;
}

export function repayDemoLoan(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
