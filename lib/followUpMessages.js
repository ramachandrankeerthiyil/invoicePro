const { formatCurrency } = require('./format');

function templateMessages({ customerName, invoiceNumber, amount, dueDate, daysOverdue }) {
  const amountStr = formatCurrency(amount);
  const dueDateStr = new Date(dueDate).toISOString().slice(0, 10);

  return {
    polite: `Hi ${customerName}, just a friendly reminder that invoice ${invoiceNumber} for ${amountStr} was due on ${dueDateStr}. Let us know if you have any questions.`,
    firm: `Hi ${customerName}, invoice ${invoiceNumber} for ${amountStr} is now ${daysOverdue} day(s) overdue. Please arrange payment at your earliest convenience.`,
    escalation: `This is to formally notify you that invoice ${invoiceNumber} (${amountStr}) is significantly overdue (${daysOverdue} days) and has been escalated to the account owner.`,
  };
}

// design.md §5: call Claude if configured, otherwise fall back to templates.
// Kept dependency-free (plain fetch to the Messages API) since this is the
// only place in the POC that would need an LLM SDK.
async function generateFollowUpMessages(invoiceFacts) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fallback = templateMessages(invoiceFacts);

  if (!apiKey) {
    return { source: 'template', ...fallback };
  }

  try {
    const prompt = `Write three short payment follow-up messages (polite, firm, escalation) for this invoice:
Customer: ${invoiceFacts.customerName}
Invoice: ${invoiceFacts.invoiceNumber}
Amount: ${formatCurrency(invoiceFacts.amount)}
Due date: ${invoiceFacts.dueDate}
Days overdue: ${invoiceFacts.daysOverdue}
Risk level: ${invoiceFacts.riskLevel}

Respond with strict JSON only, in this shape: {"polite": "...", "firm": "...", "escalation": "..."}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API returned ${response.status}`);

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const parsed = JSON.parse(text);

    if (!parsed.polite || !parsed.firm || !parsed.escalation) {
      throw new Error('Malformed LLM response');
    }

    return { source: 'llm', ...parsed };
  } catch (err) {
    return { source: 'template', ...fallback };
  }
}

module.exports = { templateMessages, generateFollowUpMessages };
