const { validateRow, validateCsvRows } = require('../lib/csvValidator');

describe('validateRow', () => {
  const validRow = {
    invoice_number: 'INV-1001',
    customer_name: 'Acme Technologies',
    amount: '185000',
    invoice_date: '2026-08-01',
    due_date: '2026-08-31',
    status: 'unpaid',
  };

  test('accepts a fully valid row', () => {
    expect(validateRow(validRow, 2)).toEqual({ valid: true, errors: [] });
  });

  test('rejects a row missing a required field', () => {
    const row = { ...validRow, customer_name: '' };
    const result = validateRow(row, 2);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/customer_name/);
  });

  test('rejects a non-positive amount', () => {
    const result = validateRow({ ...validRow, amount: '-500' }, 2);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/amount/);
  });

  test('rejects an unparseable due_date', () => {
    const result = validateRow({ ...validRow, due_date: 'not-a-date' }, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('due_date'))).toBe(true);
  });

  test('rejects due_date before invoice_date', () => {
    const result = validateRow({ ...validRow, invoice_date: '2026-09-20', due_date: '2026-09-10' }, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('cannot be before'))).toBe(true);
  });

  test('rejects an invalid status value', () => {
    const result = validateRow({ ...validRow, status: 'cancelled' }, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('status'))).toBe(true);
  });
});

describe('validateCsvRows', () => {
  test('splits rows into valid and error lists', () => {
    const rows = [
      {
        invoice_number: 'INV-1001',
        customer_name: 'Acme Technologies',
        amount: '185000',
        invoice_date: '2026-08-01',
        due_date: '2026-08-31',
        status: 'unpaid',
      },
      {
        invoice_number: 'INV-1002',
        customer_name: '',
        amount: '-1',
        invoice_date: '2026-08-01',
        due_date: '2026-08-31',
        status: 'unpaid',
      },
    ];

    const { validRows, errors } = validateCsvRows(rows);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].invoice_number).toBe('INV-1001');
    expect(errors.length).toBeGreaterThan(0);
  });
});
