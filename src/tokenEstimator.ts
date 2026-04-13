/**
 * Approximate token counter for LLM context estimation.
 *
 * Uses a heuristic based on character and word counts:
 * - English text: ~4 characters per token (GPT/Claude average)
 * - Chinese text: ~1.5 characters per token (CJK tokenization)
 * - Markdown syntax adds ~5-10% overhead
 *
 * Accuracy: within ~15% of actual tokenizer output, which is
 * sufficient for budgeting purposes.
 */

const CJK_RANGE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;
const WHITESPACE = /\s+/g;

export interface TokenStats {
  total: number;
  lines: number;
  chars: number;
}

export function estimateTokens(text: string): TokenStats {
  if (!text) { return { total: 0, lines: 0, chars: 0 }; }

  const lines = text.split('\n').length;
  const chars = text.length;

  const cjkMatches = text.match(CJK_RANGE);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  const nonCjkText = text.replace(CJK_RANGE, ' ');
  const words = nonCjkText.split(WHITESPACE).filter(w => w.length > 0);

  // CJK: ~1.5 chars per token; English: ~0.75 words per token
  const cjkTokens = Math.ceil(cjkCount / 1.5);
  const englishTokens = Math.ceil(words.length * 1.33);

  // Markdown formatting overhead (~8%)
  const total = Math.ceil((cjkTokens + englishTokens) * 1.08);

  return { total, lines, chars };
}

export function formatTokenCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

export function getTokenBudgetColor(tokens: number): 'good' | 'warn' | 'over' {
  if (tokens <= 2000) { return 'good'; }
  if (tokens <= 4000) { return 'warn'; }
  return 'over';
}
