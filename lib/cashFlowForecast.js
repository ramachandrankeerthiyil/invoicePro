const { toDate } = require('./dateUtils');

// spec.md §6 / design.md §3: project current-month collections from the
// trailing 14 days of actual collections, added to what's already been
// collected so far this month.
function calculateCashFlowForecast(invoices, today = new Date()) {
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.paidDate);

  const collectedLast14Days = paidInvoices
    .filter((inv) => {
      const paidDate = toDate(inv.paidDate);
      return paidDate >= fourteenDaysAgo && paidDate <= today;
    })
    .reduce((sum, inv) => sum + inv.amount, 0);

  const dailyAverage = collectedLast14Days / 14;

  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysRemaining = Math.max(daysInMonth - today.getUTCDate(), 0);

  const collectedThisMonth = paidInvoices
    .filter((inv) => {
      const paidDate = toDate(inv.paidDate);
      return paidDate.getUTCFullYear() === year && paidDate.getUTCMonth() === month;
    })
    .reduce((sum, inv) => sum + inv.amount, 0);

  const projectedRemaining = dailyAverage * daysRemaining;

  return Math.round(collectedThisMonth + projectedRemaining);
}

module.exports = { calculateCashFlowForecast };
