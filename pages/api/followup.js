const { prisma } = require('../../lib/prisma');
const { enrichInvoices } = require('../../lib/enrichInvoices');
const { generateFollowUpMessages } = require('../../lib/followUpMessages');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId } = req.body || {};
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { customer: true } });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const customerInvoices = await prisma.invoice.findMany({
    where: { customerId: invoice.customerId },
    include: { customer: true },
  });
  const [enriched] = enrichInvoices(customerInvoices, new Date()).filter((i) => i.id === invoiceId);

  const messages = await generateFollowUpMessages({
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    daysOverdue: enriched.daysOverdue,
    riskLevel: enriched.riskLevel,
  });

  res.status(200).json(messages);
};
