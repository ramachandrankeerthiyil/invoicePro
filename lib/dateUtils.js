function parseDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

function toDate(value) {
  return value instanceof Date ? value : parseDate(value);
}

function daysOverdue(invoice, today = new Date()) {
  if (!invoice || invoice.status === 'paid') return 0;
  const due = toDate(invoice.dueDate);
  const diffMs = today.getTime() - due.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

module.exports = { parseDate, toDate, daysOverdue };
