import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { formatCurrency } from '../../lib/format';

export default function InvoiceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState(null);
  const [messages, setMessages] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copiedTone, setCopiedTone] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/invoices/${id}`).then((r) => r.json()).then(setInvoice);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function generateMessages() {
    setGenerating(true);
    const res = await fetch('/api/followup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ invoiceId: id }),
    });
    setMessages(await res.json());
    setGenerating(false);
  }

  async function copyMessage(tone, text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API may be unavailable (e.g. insecure context); ignore.
    }
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone(null), 1500);
  }

  async function markFollowedUp(tone) {
    setBusy(true);
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'followedUp', tone }),
    });
    setBusy(false);
    load();
  }

  async function markPaid() {
    setBusy(true);
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'paid' }),
    });
    setBusy(false);
    load();
  }

  if (!invoice) return <p>Loading…</p>;
  if (invoice.error) return <p className="text-red-600">{invoice.error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{invoice.invoiceNumber}</h1>
      <p className="text-gray-500 mb-4">{invoice.customer.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card space-y-1">
          <p><span className="text-gray-500">Amount:</span> {formatCurrency(invoice.amount)}</p>
          <p><span className="text-gray-500">Invoice date:</span> {invoice.invoiceDate.slice(0, 10)}</p>
          <p><span className="text-gray-500">Due date:</span> {invoice.dueDate.slice(0, 10)}</p>
          <p><span className="text-gray-500">Status:</span> <span className="capitalize">{invoice.status}</span></p>
          <p><span className="text-gray-500">Days overdue:</span> {invoice.daysOverdue}</p>
          <p>
            <span className="text-gray-500">Risk:</span>{' '}
            <span className={invoice.riskLevel === 'High' ? 'badge-high' : 'badge-low'}>{invoice.riskLevel}</span>
          </p>
          <p><span className="text-gray-500">Recommended action:</span> {invoice.recommendedAction}</p>

          {invoice.status === 'unpaid' && (
            <button className="btn mt-2" disabled={busy} onClick={markPaid}>
              Mark as paid
            </button>
          )}
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 mb-2">Payment history</p>
          {invoice.paymentHistory.length === 0 ? (
            <p className="text-gray-400 text-sm">No payment recorded yet.</p>
          ) : (
            invoice.paymentHistory.map((p, idx) => (
              <p key={idx} className="text-sm">{formatCurrency(p.amount)} on {p.paidDate?.slice(0, 10)}</p>
            ))
          )}

          <p className="text-sm text-gray-500 mt-4 mb-2">Follow-up history</p>
          {invoice.followUps.length === 0 ? (
            <p className="text-gray-400 text-sm">No follow-ups logged yet.</p>
          ) : (
            invoice.followUps.map((f) => (
              <p key={f.id} className="text-sm capitalize">{f.tone} — {f.createdAt.slice(0, 10)}</p>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Follow-up assistant</p>
          <button className="btn" disabled={generating} onClick={generateMessages}>
            {generating ? 'Generating…' : 'Generate messages'}
          </button>
        </div>

        {messages && !messages.error && (
          <div className="space-y-3">
            {['polite', 'firm', 'escalation'].map((tone) => (
              <div key={tone} className="border rounded p-3">
                <p className="text-xs uppercase text-gray-400 mb-1">{tone}</p>
                <p className="text-sm mb-2">{messages[tone]}</p>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => copyMessage(tone, messages[tone])}>
                    {copiedTone === tone ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="btn-secondary" disabled={busy} onClick={() => markFollowedUp(tone)}>
                    Mark as followed up
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">Source: {messages.source === 'llm' ? 'AI-generated' : 'template'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
