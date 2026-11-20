import { describe, it, expect } from 'vitest';
import { parseLeadScoreOutput } from '../lib/utils';

describe('Gemini Lead Scoring Parser', () => {
  it('parses valid JSON response with hot score and reason', () => {
    const raw = JSON.stringify({
      lead_score: 'hot',
      reason: 'Lead has pre-approved budget of 1.5 Cr and booked site visit for tomorrow.',
      ai_summary: 'Dr. Alok Mishra is ready to purchase 4 BHK in Ganga Heights.'
    });

    const parsed = parseLeadScoreOutput(raw);
    expect(parsed.lead_score).toBe('hot');
    expect(parsed.reason).toContain('pre-approved');
    expect(parsed.ai_summary).toContain('Dr. Alok Mishra');
  });

  it('handles markdown formatted responses with ```json code fence', () => {
    const raw = `\`\`\`json
{
  "lead_score": "warm",
  "reason": "Clear interest in Swaroop Nagar, budget defined, site visit not booked yet.",
  "ai_summary": "Pooja Gupta exploring 3 BHK under 1.2 Cr in Emerald Park."
}
\`\`\``;

    const parsed = parseLeadScoreOutput(raw);
    expect(parsed.lead_score).toBe('warm');
    expect(parsed.reason).toContain('Swaroop Nagar');
  });

  it('gracefully handles unstructured fallback text without crashing', () => {
    const raw = 'Based on the conversation, the lead is very HOT because they want immediate possession.';
    const parsed = parseLeadScoreOutput(raw);
    expect(parsed.lead_score).toBe('hot');
  });
});
