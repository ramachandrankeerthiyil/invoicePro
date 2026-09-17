// design.md §7: required columns and validation rules for CSV import.
const REQUIRED_COLUMNS = ['invoice_number', 'customer_name', 'amount', 'invoice_date', 'due_date', 'status'];
const VALID_STATUSES = ['unpaid', 'paid'];

function validateRow(row, rowNumber) {
  const errors = [];

  for (const col of REQUIRED_COLUMNS) {
    if (row[col] === undefined || String(row[col]).trim() === '') {
      errors.push(`Row ${rowNumber}: missing required field '${col}'`);
    }
  }

  if (row.amount !== undefined && String(row.amount).trim() !== '') {
    const amount = Number(row.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      errors.push(`Row ${rowNumber}: amount must be a positive number`);
    }
  }

  const invoiceDate = row.invoice_date ? new Date(row.invoice_date) : null;
  const dueDate = row.due_date ? new Date(row.due_date) : null;

  if (row.invoice_date && Number.isNaN(invoiceDate.getTime())) {
    errors.push(`Row ${rowNumber}: invoice_date is not a valid date`);
  }
  if (row.due_date && Number.isNaN(dueDate.getTime())) {
    errors.push(`Row ${rowNumber}: due_date is not a valid date`);
  }
  if (
    invoiceDate && dueDate &&
    !Number.isNaN(invoiceDate.getTime()) && !Number.isNaN(dueDate.getTime()) &&
    dueDate < invoiceDate
  ) {
    errors.push(`Row ${rowNumber}: due_date cannot be before invoice_date`);
  }

  if (row.status && !VALID_STATUSES.includes(String(row.status).trim().toLowerCase())) {
    errors.push(`Row ${rowNumber}: status must be one of ${VALID_STATUSES.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

function validateCsvRows(rows) {
  const validRows = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header row
    const result = validateRow(row, rowNumber);
    if (result.valid) {
      validRows.push(row);
    } else {
      errors.push(...result.errors);
    }
  });

  return { validRows, errors };
}

module.exports = { validateRow, validateCsvRows, REQUIRED_COLUMNS, VALID_STATUSES };
