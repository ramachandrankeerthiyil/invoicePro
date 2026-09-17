const { calculateCashFlowForecast } = require('../lib/cashFlowForecast');

describe('calculateCashFlowForecast', () => {
  const today = new Date('2026-09-17T00:00:00Z'); // 13 days remaining in September (30-day month)

  test('returns 0 when there are no paid invoices', () => {
    const invoices = [
      { status: 'unpaid', dueDate: '2026-09-30', amount: 50000 },
    ];
    expect(calculateCashFlowForecast(invoices, today)).toBe(0);
  });

  test('projects remaining-month collections from trailing 14 days, added to month-to-date', () => {
    const invoices = [
      { status: 'paid', paidDate: '2026-09-05', amount: 70000 }, // within last 14 days + this month
      { status: 'paid', paidDate: '2026-09-10', amount: 30000 }, // within last 14 days + this month
      { status: 'paid', paidDate: '2026-09-01', amount: 20000 }, // this month, outside 14-day window
      { status: 'paid', paidDate: '2026-08-25', amount: 50000 }, // outside both windows
      { status: 'unpaid', dueDate: '2026-09-30', amount: 60000 }, // not collected, excluded
    ];

    // collectedLast14Days = 70000 + 30000 = 100000 -> dailyAverage = 100000/14
    // daysRemaining = 30 (days in Sept) - 17 (today) = 13
    // collectedThisMonth = 70000 + 30000 + 20000 = 120000
    // forecast = 120000 + (100000/14)*13 = 212857 (rounded)
    expect(calculateCashFlowForecast(invoices, today)).toBe(212857);
  });

  test('ignores paid invoices without a recorded paidDate', () => {
    const invoices = [
      { status: 'paid', amount: 90000 }, // no paidDate — should be excluded, not throw
    ];
    expect(calculateCashFlowForecast(invoices, today)).toBe(0);
  });
});
