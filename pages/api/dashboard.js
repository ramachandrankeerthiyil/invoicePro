const { prisma } = require('../../lib/prisma');
const { enrichInvoices } = require('../../lib/enrichInvoices');
const { calculateCashFlowForecast } = require('../../lib/cashFlowForecast');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const today = new Date();
  const invoices = await prisma.invoice.findMany({ include: { customer: true } });
  const enriched = enrichInvoices(invoices, today);

  const unpaid = enriched.filter((i) => i.status === 'unpaid');
  const totalOutstanding = unpaid.reduce((sum, i) => sum + i.amount, 0);
  const overdueAmount = unpaid
    .filter((i) => i.daysOverdue > 0)
    .reduce((sum, i) => sum + i.amount, 0);

  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueInNext7Days = unpaid
    .filter((i) => i.daysOverdue === 0 && new Date(i.dueDate) <= sevenDaysFromNow)
    .reduce((sum, i) => sum + i.amount, 0);

  // POC simplification: "expected collections this week" uses the same
  // window as "due in next 7 days" (see design.md §3).
  const expectedCollectionsThisWeek = dueInNext7Days;

  const highRiskCustomerNames = [
    ...new Set(enriched.filter((i) => i.riskLevel === 'High').map((i) => i.customer.name)),
  ];

  const cashFlowForecast = calculateCashFlowForecast(enriched, today);

  res.status(200).json({
    totalOutstanding,
    overdueAmount,
    dueInNext7Days,
    expectedCollectionsThisWeek,
    highRiskCustomers: highRiskCustomerNames,
    cashFlowForecast,
  });
};
