const { enrichInvoices } = require('../lib/enrichInvoices');

describe('enrichInvoices', () => {
  const today = new Date('2026-09-17T00:00:00Z');

  test('computes risk per customer across their full invoice set', () => {
    const invoices = [
      { id: 'i1', customerId: 'c1', status: 'unpaid', dueDate: '2026-08-01', amount: 1000 },
      { id: 'i2', customerId: 'c1', status: 'paid', dueDate: '2026-07-01', paidDate: '2026-07-15', amount: 2000 },
      { id: 'i3', customerId: 'c1', status: 'paid', dueDate: '2026-06-01', paidDate: '2026-06-20', amount: 3000 },
      { id: 'i4', customerId: 'c2', status: 'unpaid', dueDate: '2026-09-30', amount: 4000 },
    ];

    const result = enrichInvoices(invoices, today);
    const c1Invoices = result.filter((i) => i.customerId === 'c1');
    const c2Invoices = result.filter((i) => i.customerId === 'c2');

    // customer c1 has 3 defaults (1 overdue unpaid + 2 paid late) -> High risk
    expect(c1Invoices.every((i) => i.riskLevel === 'High')).toBe(true);
    expect(c1Invoices[0].customerDefaultCount).toBe(3);

    // customer c2 has 0 defaults -> Low risk, not yet due -> 0 days overdue
    expect(c2Invoices[0].riskLevel).toBe('Low');
    expect(c2Invoices[0].daysOverdue).toBe(0);

    // i1 is overdue since 2026-08-01
    const i1 = result.find((i) => i.id === 'i1');
    expect(i1.daysOverdue).toBeGreaterThan(0);
    expect(i1.recommendedAction).toMatch(/escalate/i);
  });
});
