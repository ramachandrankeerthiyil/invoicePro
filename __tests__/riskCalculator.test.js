const {
  isDefaulted,
  customerDefaultCount,
  riskLevel,
  recommendedAction,
} = require('../lib/riskCalculator');

const today = new Date('2026-09-17T00:00:00Z');

describe('isDefaulted', () => {
  test('unpaid invoice past due date counts as defaulted', () => {
    const invoice = { status: 'unpaid', dueDate: '2026-08-31' };
    expect(isDefaulted(invoice, today)).toBe(true);
  });

  test('unpaid invoice not yet due does not count as defaulted', () => {
    const invoice = { status: 'unpaid', dueDate: '2026-09-30' };
    expect(isDefaulted(invoice, today)).toBe(false);
  });

  test('paid invoice with paidDate after dueDate counts as defaulted', () => {
    const invoice = { status: 'paid', dueDate: '2026-08-31', paidDate: '2026-09-05' };
    expect(isDefaulted(invoice, today)).toBe(true);
  });

  test('paid invoice with paidDate on or before dueDate does not count as defaulted', () => {
    const invoice = { status: 'paid', dueDate: '2026-08-31', paidDate: '2026-08-20' };
    expect(isDefaulted(invoice, today)).toBe(false);
  });

  test('paid invoice with no paidDate recorded does not count as defaulted', () => {
    const invoice = { status: 'paid', dueDate: '2026-08-31' };
    expect(isDefaulted(invoice, today)).toBe(false);
  });
});

describe('customerDefaultCount + riskLevel', () => {
  test('customer with 3 defaults is High risk (spec.md: more than 2)', () => {
    const invoices = [
      { status: 'paid', dueDate: '2026-06-30', paidDate: '2026-07-10' }, // late
      { status: 'paid', dueDate: '2026-05-31', paidDate: '2026-06-15' }, // late
      { status: 'unpaid', dueDate: '2026-08-31' }, // overdue now
    ];
    const count = customerDefaultCount(invoices, today);
    expect(count).toBe(3);
    expect(riskLevel(count)).toBe('High');
  });

  test('customer with exactly 2 defaults is still Low risk (boundary)', () => {
    const invoices = [
      { status: 'paid', dueDate: '2026-06-30', paidDate: '2026-07-10' },
      { status: 'unpaid', dueDate: '2026-08-31' },
    ];
    const count = customerDefaultCount(invoices, today);
    expect(count).toBe(2);
    expect(riskLevel(count)).toBe('Low');
  });

  test('customer with no defaults is Low risk', () => {
    const invoices = [
      { status: 'paid', dueDate: '2026-06-30', paidDate: '2026-06-25' },
      { status: 'unpaid', dueDate: '2026-09-30' },
    ];
    expect(riskLevel(customerDefaultCount(invoices, today))).toBe('Low');
  });
});

describe('recommendedAction', () => {
  test('High risk maps to escalation action', () => {
    expect(recommendedAction('High')).toMatch(/escalate/i);
  });

  test('Low risk maps to standard reminder action', () => {
    expect(recommendedAction('Low')).toMatch(/standard/i);
  });
});
