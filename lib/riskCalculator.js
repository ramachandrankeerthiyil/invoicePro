const { toDate } = require('./dateUtils');

// spec.md §5: a customer defaults on an invoice if they paid it late, or it is
// currently unpaid and past its due date.
function isDefaulted(invoice, today = new Date()) {
  const dueDate = toDate(invoice.dueDate);

  if (invoice.status === 'paid') {
    if (!invoice.paidDate) return false;
    const paidDate = toDate(invoice.paidDate);
    return paidDate.getTime() > dueDate.getTime();
  }

  return dueDate.getTime() < today.getTime();
}

function customerDefaultCount(invoices, today = new Date()) {
  return invoices.filter((inv) => isDefaulted(inv, today)).length;
}

// spec.md §5: more than 2 prior defaults => High risk, otherwise Low.
function riskLevel(defaultCount) {
  return defaultCount > 2 ? 'High' : 'Low';
}

function recommendedAction(risk) {
  return risk === 'High'
    ? 'Send payment reminder and escalate to account owner'
    : 'Send standard payment reminder';
}

module.exports = { isDefaulted, customerDefaultCount, riskLevel, recommendedAction };
