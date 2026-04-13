import * as vscode from 'vscode';
import { ProjectContext, Section, TodoItem, LogEntry } from './types';
import { estimateTokens } from './tokenEstimator';

const SECTION_ID_MAP: Record<string, string> = {
  '项目概述': 'overview',
  '目录结构': 'structure',
  '核心架构': 'architecture',
  '子项目速查': 'subprojects',
  '关键文件索引': 'files',
  '开发约定': 'conventions',
  '商业模型概要': 'business',
  '环境与部署': 'deploy',
  '当前状态与待办': 'status',
  '维护日志': 'log',
  '给 AI 的提示': 'ai-tips',
};

export class ContextParser {
  async parse(uri: vscode.Uri): Promise<ProjectContext> {
    const raw = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf-8');
    return this.parseContent(raw);
  }

  parseContent(raw: string): ProjectContext {
    const lines = raw.split('\n');
    let title = '';
    let lastUpdated = '';
    const sections: Section[] = [];

    let currentSection: Partial<Section> | null = null;
    const contentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('# ') && !title) {
        title = line.replace(/^#\s+/, '').trim();
        continue;
      }

      if (!lastUpdated && line.includes('最后更新')) {
        const match = line.match(/最后更新[：:]\s*(.+)/);
        if (match) {
          lastUpdated = match[1].trim();
        }
        continue;
      }

      if (line.startsWith('## ')) {
        if (currentSection) {
          currentSection.content = contentLines.join('\n').trim();
          currentSection.lineEnd = i - 1;
          sections.push(currentSection as Section);
          contentLines.length = 0;
        }

        const sectionTitle = line.replace(/^##\s+/, '').trim();
        const id = this.getSectionId(sectionTitle);
        currentSection = {
          id,
          title: sectionTitle,
          content: '',
          lineStart: i,
          lineEnd: i,
          tokens: 0,
        };
        continue;
      }

      if (currentSection) {
        contentLines.push(line);
      }
    }

    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim();
      currentSection.lineEnd = lines.length - 1;
      sections.push(currentSection as Section);
    }

    for (const section of sections) {
      section.tokens = estimateTokens(section.content).total;
    }

    const tokens = estimateTokens(raw);

    return { title, lastUpdated, sections, rawContent: raw, tokens };
  }

  private getSectionId(title: string): string {
    const cleaned = title.replace(/^\d+\.\s*/, '').trim();
    return SECTION_ID_MAP[cleaned] || cleaned.toLowerCase().replace(/\s+/g, '-');
  }

  parseTodos(sectionContent: string): TodoItem[] {
    const items: TodoItem[] = [];
    const lines = sectionContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^- \[([ xX])\]\s+(.*)/);
      if (match) {
        items.push({
          done: match[1] !== ' ',
          text: match[2].trim(),
          line: i,
        });
      }
    }
    return items;
  }

  parseLogEntries(sectionContent: string): LogEntry[] {
    const entries: LogEntry[] = [];
    const lines = sectionContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/);
      if (match) {
        entries.push({ date: match[1], change: match[2], scope: match[3] });
      }
    }
    return entries;
  }
}
