const fs = require('fs');
const path = require('path');
const { importCsv } = require('../lib/csvImporter');

function loadTestData(filename) {
  return fs.readFileSync(path.join(__dirname, '..', 'test-data', filename), 'utf8');
}

describe('importCsv', () => {
  test('imports every row from a fully valid CSV', () => {
    const csv = loadTestData('valid-invoices.csv');
    const result = importCsv(csv);

    expect(result.importedCount).toBe(8);
    expect(result.rejectedCount).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.validRows[0].invoice_number).toBe('INV-1001');
  });

  test('imports only the valid rows from a CSV with mixed errors, reporting the rest', () => {
    const csv = loadTestData('invoices-with-errors.csv');
    const result = importCsv(csv);

    // INV-2001 and INV-2008 are the only clean rows in test-data/invoices-with-errors.csv
    expect(result.importedCount).toBe(2);
    expect(result.validRows.map((r) => r.invoice_number)).toEqual(['INV-2001', 'INV-2008']);
    expect(result.rejectedCount).toBe(6);
    expect(result.errors.length).toBeGreaterThanOrEqual(6);
  });
});
