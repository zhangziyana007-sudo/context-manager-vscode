import React from 'react';
import type { Section } from '../../src/types';

interface Props {
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
}

const SECTION_ICONS: Record<string, string> = {
  overview: '📋',
  structure: '📁',
  architecture: '🏗️',
  subprojects: '📦',
  files: '📄',
  conventions: '📐',
  business: '💼',
  deploy: '🚀',
  status: '✅',
  log: '📝',
  'ai-tips': '🤖',
};

function formatTokens(n: number): string {
  if (n >= 1000) { return `${(n / 1000).toFixed(1)}k`; }
  return String(n);
}

function tokenColor(n: number): string {
  if (n <= 300) { return 'token-low'; }
  if (n <= 800) { return 'token-mid'; }
  return 'token-high';
}

export function SectionNav({ sections, activeId, onSelect }: Props) {
  return (
    <nav className="section-nav">
      {sections.map(section => (
        <button
          key={section.id}
          className={`nav-item ${section.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(section.id)}
          title={`${section.title} (${section.tokens} tokens)`}
        >
          <span className="nav-icon">{SECTION_ICONS[section.id] || '📄'}</span>
          <span className="nav-label">{section.title}</span>
          <span className={`nav-tokens ${tokenColor(section.tokens)}`}>
            {formatTokens(section.tokens)}
          </span>
        </button>
      ))}
    </nav>
  );
}
