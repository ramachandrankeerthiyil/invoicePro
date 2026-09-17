const { parse } = require('csv-parse/sync');
const { validateCsvRows } = require('./csvValidator');

function importCsv(csvString) {
  const rows = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const { validRows, errors } = validateCsvRows(rows);

  return {
    importedCount: validRows.length,
    rejectedCount: errors.length > 0 ? rows.length - validRows.length : 0,
    validRows,
    errors,
  };
}

module.exports = { importCsv };
