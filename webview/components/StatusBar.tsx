import React from 'react';
import type { TokenStats } from '../../src/types';

interface Props {
  lastUpdated: string;
  hasChanges: boolean;
  tokens: TokenStats;
  onRefresh: () => void;
  onGenerateMini: () => void;
}

function formatTokens(n: number): string {
  if (n >= 1000) { return `${(n / 1000).toFixed(1)}k`; }
  return String(n);
}

function budgetClass(n: number): string {
  if (n <= 2000) { return 'budget-good'; }
  if (n <= 4000) { return 'budget-warn'; }
  return 'budget-over';
}

export function StatusBar({ lastUpdated, hasChanges, tokens, onRefresh, onGenerateMini }: Props) {
  return (
    <footer className="status-bar">
      <div className="status-left">
        <span className="status-updated">
          更新：{lastUpdated || '未知'}
        </span>
        <span className={`status-tokens ${budgetClass(tokens.total)}`} title={`${tokens.total} tokens / ${tokens.lines} 行 / ${tokens.chars} 字符`}>
          {formatTokens(tokens.total)} tokens
        </span>
      </div>
      <div className="status-right">
        {hasChanges && (
          <button className="status-badge warning" onClick={onRefresh}>
            ⚠ 刷新
          </button>
        )}
        <button className="status-badge mini-btn" onClick={onGenerateMini} title="生成精简版 PROJECT_CONTEXT_MINI.md（省 Token）">
          ⚡ 精简版
        </button>
      </div>
    </footer>
  );
}
