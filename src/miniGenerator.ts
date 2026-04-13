import * as vscode from 'vscode';
import * as path from 'path';
import { ContextParser } from './contextParser';
import { estimateTokens, formatTokenCount } from './tokenEstimator';

/**
 * Generates a compact PROJECT_CONTEXT_MINI.md (~50 lines, ~800 tokens)
 * suitable for automatic injection via Cursor Rules.
 *
 * Strategy:
 * - Keep title + last-updated
 * - Keep "项目概述" verbatim (small, high-value)
 * - Compress "目录结构" to top-level only
 * - Keep "子项目速查" table (if exists)
 * - Summarize "当前状态与待办" to only uncompleted items
 * - Skip log, conventions, AI tips (available in full file)
 * - Add pointer to full PROJECT_CONTEXT.md
 */
export class MiniGenerator {
  private parser = new ContextParser();

  async generate(rootPath: string): Promise<{ path: string; tokens: number }> {
    const fullUri = vscode.Uri.file(path.join(rootPath, 'PROJECT_CONTEXT.md'));
    const miniUri = vscode.Uri.file(path.join(rootPath, 'PROJECT_CONTEXT_MINI.md'));

    let fullContent: string;
    try {
      fullContent = Buffer.from(await vscode.workspace.fs.readFile(fullUri)).toString('utf-8');
    } catch {
      throw new Error('PROJECT_CONTEXT.md 不存在，请先生成完整版');
    }

    const ctx = this.parser.parseContent(fullContent);
    const today = new Date().toISOString().split('T')[0];

    const miniSections: string[] = [];

    miniSections.push(`# ${ctx.title} (精简版)`);
    miniSections.push('');
    miniSections.push(`> 自动生成的精简上下文，供 Cursor Rule 注入。最后更新：${today}`);
    miniSections.push(`> 完整版请查看 PROJECT_CONTEXT.md（${formatTokenCount(ctx.tokens.total)} tokens）`);
    miniSections.push('');

    const overview = ctx.sections.find(s => s.id === 'overview');
    if (overview) {
      miniSections.push(`## 概述`);
      miniSections.push('');
      miniSections.push(overview.content);
      miniSections.push('');
    }

    const structure = ctx.sections.find(s => s.id === 'structure');
    if (structure) {
      miniSections.push(`## 结构`);
      miniSections.push('');
      const compressed = this.compressStructure(structure.content);
      miniSections.push(compressed);
      miniSections.push('');
    }

    const subprojects = ctx.sections.find(s => s.id === 'subprojects');
    if (subprojects && subprojects.content.includes('|')) {
      miniSections.push(`## 子项目`);
      miniSections.push('');
      miniSections.push(subprojects.content);
      miniSections.push('');
    }

    const status = ctx.sections.find(s => s.id === 'status');
    if (status) {
      const pending = status.content
        .split('\n')
        .filter(l => l.match(/^- \[ \]/));

      if (pending.length > 0) {
        miniSections.push(`## 当前待办`);
        miniSections.push('');
        miniSections.push(pending.join('\n'));
        miniSections.push('');
      }
    }

    miniSections.push('---');
    miniSections.push('');
    miniSections.push('> 需要详细信息时请读取 `PROJECT_CONTEXT.md`');

    const miniContent = miniSections.join('\n');
    const tokens = estimateTokens(miniContent);

    await vscode.workspace.fs.writeFile(miniUri, Buffer.from(miniContent, 'utf-8'));

    return { path: miniUri.fsPath, tokens: tokens.total };
  }

  private compressStructure(content: string): string {
    const lines = content.split('\n');
    const compressed: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        compressed.push(line);
        continue;
      }
      if (inCodeBlock) {
        // Only keep first-level entries (├── or └── without leading │)
        if (line.match(/^[├└]/) || line.match(/^[a-zA-Z]/) || line.trim() === '') {
          compressed.push(line);
        }
      } else {
        compressed.push(line);
      }
    }

    return compressed.join('\n');
  }
}
