import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '../../lib/format';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState(null);
  const [filters, setFilters] = useState({ customer: '', status: '', risk: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.customer) params.set('customer', filters.customer);
    if (filters.status) params.set('status', filters.status);
    if (filters.risk) params.set('risk', filters.risk);

    fetch(`/api/invoices?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices));
  }, [filters]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Invoices</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          placeholder="Search customer…"
          className="border rounded px-2 py-1 text-sm"
          value={filters.customer}
          onChange={(e) => setFilters((f) => ({ ...f, customer: e.target.value }))}
        />
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filters.risk}
          onChange={(e) => setFilters((f) => ({ ...f, risk: e.target.value }))}
        >
          <option value="">All risk levels</option>
          <option value="Low">Low</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-4">Invoice</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Days overdue</th>
              <th className="py-2 pr-4">Risk</th>
            </tr>
          </thead>
          <tbody>
            {(invoices || []).map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 pr-4">
                  <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4">{inv.customer.name}</td>
                <td className="py-2 pr-4">{formatCurrency(inv.amount)}</td>
                <td className="py-2 pr-4 capitalize">{inv.status}</td>
                <td className="py-2 pr-4">{inv.daysOverdue}</td>
                <td className="py-2 pr-4">
                  <span className={inv.riskLevel === 'High' ? 'badge-high' : 'badge-low'}>
                    {inv.riskLevel}
                  </span>
                </td>
              </tr>
            ))}
            {invoices && invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-400">
                  No invoices match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
