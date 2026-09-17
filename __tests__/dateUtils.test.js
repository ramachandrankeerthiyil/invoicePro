const { daysOverdue } = require('../lib/dateUtils');

describe('daysOverdue', () => {
  const today = new Date('2026-09-17T00:00:00Z');

  test('returns 0 for a paid invoice regardless of due date', () => {
    const invoice = { status: 'paid', dueDate: '2026-08-01' };
    expect(daysOverdue(invoice, today)).toBe(0);
  });

  test('returns 0 for an unpaid invoice not yet due', () => {
    const invoice = { status: 'unpaid', dueDate: '2026-09-30' };
    expect(daysOverdue(invoice, today)).toBe(0);
  });

  test('returns 0 for an unpaid invoice due today', () => {
    const invoice = { status: 'unpaid', dueDate: '2026-09-17' };
    expect(daysOverdue(invoice, today)).toBe(0);
  });

  test('returns the correct number of days for an overdue unpaid invoice', () => {
    // matches the spec.md example: due 2026-08-31, 13 days overdue on 2026-09-13
    const invoice = { status: 'unpaid', dueDate: '2026-08-31' };
    expect(daysOverdue(invoice, new Date('2026-09-13T00:00:00Z'))).toBe(13);
  });
});
