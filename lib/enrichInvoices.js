const { daysOverdue } = require('./dateUtils');
const { customerDefaultCount, riskLevel, recommendedAction } = require('./riskCalculator');

// Takes raw Prisma invoices (each with a `customer` relation included) and
// attaches the computed fields from design.md §3: daysOverdue, riskLevel,
// recommendedAction. Risk is computed per customer across all of that
// customer's invoices, so this must see the customer's full invoice list.
function enrichInvoices(invoices, today = new Date()) {
  const byCustomer = new Map();
  for (const inv of invoices) {
    if (!byCustomer.has(inv.customerId)) byCustomer.set(inv.customerId, []);
    byCustomer.get(inv.customerId).push(inv);
  }

  const riskByCustomer = new Map();
  for (const [customerId, customerInvoices] of byCustomer.entries()) {
    const count = customerDefaultCount(customerInvoices, today);
    riskByCustomer.set(customerId, { defaultCount: count, risk: riskLevel(count) });
  }

  return invoices.map((inv) => {
    const { defaultCount, risk } = riskByCustomer.get(inv.customerId);
    return {
      ...inv,
      daysOverdue: daysOverdue(inv, today),
      customerDefaultCount: defaultCount,
      riskLevel: risk,
      recommendedAction: recommendedAction(risk),
    };
  });
}

module.exports = { enrichInvoices };
