const { templateMessages, generateFollowUpMessages } = require('../lib/followUpMessages');

describe('templateMessages', () => {
  const facts = {
    customerName: 'Acme Technologies',
    invoiceNumber: 'INV-1042',
    amount: 185000,
    dueDate: '2026-08-31',
    daysOverdue: 13,
  };

  test('produces all three tones with invoice facts interpolated', () => {
    const messages = templateMessages(facts);
    expect(messages.polite).toContain('Acme Technologies');
    expect(messages.polite).toContain('INV-1042');
    expect(messages.firm).toContain('13');
    expect(messages.escalation).toMatch(/escalated/i);
  });
});

describe('generateFollowUpMessages fallback', () => {
  const facts = {
    customerName: 'Acme Technologies',
    invoiceNumber: 'INV-1042',
    amount: 185000,
    dueDate: '2026-08-31',
    daysOverdue: 13,
    riskLevel: 'High',
  };

  test('falls back to templates when ANTHROPIC_API_KEY is not configured', async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await generateFollowUpMessages(facts);
    expect(result.source).toBe('template');
    expect(result.polite).toContain('Acme Technologies');

    if (original) process.env.ANTHROPIC_API_KEY = original;
  });
});
