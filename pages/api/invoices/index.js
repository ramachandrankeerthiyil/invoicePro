const { prisma } = require('../../../lib/prisma');
const { enrichInvoices } = require('../../../lib/enrichInvoices');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customer, status, risk, minAge, maxAge, minAmount, maxAmount } = req.query;

  const invoices = await prisma.invoice.findMany({ include: { customer: true } });
  let enriched = enrichInvoices(invoices, new Date());

  if (customer) {
    const needle = String(customer).toLowerCase();
    enriched = enriched.filter((i) => i.customer.name.toLowerCase().includes(needle));
  }
  if (status) {
    enriched = enriched.filter((i) => i.status === status);
  }
  if (risk) {
    enriched = enriched.filter((i) => i.riskLevel.toLowerCase() === String(risk).toLowerCase());
  }
  if (minAge) {
    enriched = enriched.filter((i) => i.daysOverdue >= Number(minAge));
  }
  if (maxAge) {
    enriched = enriched.filter((i) => i.daysOverdue <= Number(maxAge));
  }
  if (minAmount) {
    enriched = enriched.filter((i) => i.amount >= Number(minAmount));
  }
  if (maxAmount) {
    enriched = enriched.filter((i) => i.amount <= Number(maxAmount));
  }

  res.status(200).json({ invoices: enriched });
};
