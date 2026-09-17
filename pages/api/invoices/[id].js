const { prisma } = require('../../../lib/prisma');
const { enrichInvoices } = require('../../../lib/enrichInvoices');

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        followUps: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const customerInvoices = await prisma.invoice.findMany({
      where: { customerId: invoice.customerId },
      include: { customer: true },
    });

    const [enriched] = enrichInvoices(customerInvoices, new Date()).filter((i) => i.id === id);

    return res.status(200).json({
      ...enriched,
      followUps: invoice.followUps,
      // No historical audit trail is kept (spec.md §10) — payment "history"
      // for the POC is just this invoice's own paid status.
      paymentHistory: invoice.status === 'paid'
        ? [{ amount: invoice.amount, paidDate: invoice.paidDate }]
        : [],
    });
  }

  if (req.method === 'PATCH') {
    const { action, tone } = req.body || {};

    if (action === 'followedUp') {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { lastFollowUpDate: new Date() },
      });
      if (tone) {
        await prisma.followUpLog.create({ data: { invoiceId: id, tone } });
      }
      return res.status(200).json(updated);
    }

    if (action === 'paid') {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: 'paid', paidDate: new Date() },
      });
      return res.status(200).json(updated);
    }

    return res.status(400).json({ error: "action must be 'followedUp' or 'paid'" });
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
};
