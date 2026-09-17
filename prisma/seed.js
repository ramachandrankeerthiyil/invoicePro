const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { importCsv } = require('../lib/csvImporter');

const prisma = new PrismaClient();

async function main() {
  const csv = fs.readFileSync(path.join(__dirname, '..', 'test-data', 'valid-invoices.csv'), 'utf8');
  const { validRows, errors } = importCsv(csv);

  for (const row of validRows) {
    const customer = await prisma.customer.upsert({
      where: { name: row.customer_name.trim() },
      update: {},
      create: { name: row.customer_name.trim() },
    });

    await prisma.invoice.upsert({
      where: { invoiceNumber: row.invoice_number.trim() },
      update: {},
      create: {
        invoiceNumber: row.invoice_number.trim(),
        customerId: customer.id,
        amount: Number(row.amount),
        invoiceDate: new Date(row.invoice_date),
        dueDate: new Date(row.due_date),
        status: row.status.trim().toLowerCase(),
        // Seed paid invoices as paid 5 days late, so risk scoring has
        // something to demonstrate (Acme Technologies crosses the >2
        // defaults threshold and shows as High risk on the dashboard).
        paidDate:
          row.status.trim().toLowerCase() === 'paid'
            ? new Date(new Date(row.due_date).getTime() + 5 * 24 * 60 * 60 * 1000)
            : null,
      },
    });
  }

  console.log(`Seeded ${validRows.length} invoices (${errors.length} rows skipped).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
