const { prisma } = require('../../lib/prisma');
const { importCsv } = require('../../lib/csvImporter');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { csv } = req.body || {};
  if (!csv) return res.status(400).json({ error: 'csv text is required' });

  let result;
  try {
    result = importCsv(csv);
  } catch (err) {
    return res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
  }

  for (const row of result.validRows) {
    const customer = await prisma.customer.upsert({
      where: { name: row.customer_name.trim() },
      update: {},
      create: { name: row.customer_name.trim() },
    });

    await prisma.invoice.upsert({
      where: { invoiceNumber: row.invoice_number.trim() },
      update: {
        customerId: customer.id,
        amount: Number(row.amount),
        invoiceDate: new Date(row.invoice_date),
        dueDate: new Date(row.due_date),
        status: row.status.trim().toLowerCase(),
      },
      create: {
        invoiceNumber: row.invoice_number.trim(),
        customerId: customer.id,
        amount: Number(row.amount),
        invoiceDate: new Date(row.invoice_date),
        dueDate: new Date(row.due_date),
        status: row.status.trim().toLowerCase(),
      },
    });
  }

  res.status(200).json({
    importedCount: result.importedCount,
    rejectedCount: result.rejectedCount,
    errors: result.errors,
  });
};
