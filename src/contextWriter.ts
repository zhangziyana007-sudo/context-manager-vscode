import * as vscode from 'vscode';
import { ProjectContext, Section, LogEntry } from './types';

export class ContextWriter {
  async writeSection(
    uri: vscode.Uri,
    context: ProjectContext,
    sectionId: string,
    newContent: string
  ): Promise<string> {
    const lines = context.rawContent.split('\n');
    const section = context.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section "${sectionId}" not found`);
    }

    const headerLine = lines[section.lineStart];
    const beforeSection = lines.slice(0, section.lineStart);
    const afterSection = lines.slice(section.lineEnd + 1);

    const updatedLines = [
      ...beforeSection,
      headerLine,
      '',
      newContent,
      '',
      ...afterSection,
    ];

    const updatedRaw = this.updateTimestamp(updatedLines.join('\n'));
    await vscode.workspace.fs.writeFile(uri, Buffer.from(updatedRaw, 'utf-8'));
    return updatedRaw;
  }

  async addTodo(
    uri: vscode.Uri,
    context: ProjectContext,
    text: string,
    done: boolean = false
  ): Promise<string> {
    const section = context.sections.find(s => s.id === 'status');
    if (!section) {
      throw new Error('Status section not found');
    }

    const marker = done ? '[x]' : '[ ]';
    const newLine = `- ${marker} ${text}`;
    const updatedContent = section.content + '\n' + newLine;

    return this.writeSection(uri, context, 'status', updatedContent);
  }

  async toggleTodo(
    uri: vscode.Uri,
    rawContent: string,
    absoluteLine: number
  ): Promise<string> {
    const lines = rawContent.split('\n');
    const line = lines[absoluteLine];
    if (!line) { return rawContent; }

    if (line.includes('- [ ]')) {
      lines[absoluteLine] = line.replace('- [ ]', '- [x]');
    } else if (line.match(/- \[[xX]\]/)) {
      lines[absoluteLine] = line.replace(/- \[[xX]\]/, '- [ ]');
    }

    const updatedRaw = this.updateTimestamp(lines.join('\n'));
    await vscode.workspace.fs.writeFile(uri, Buffer.from(updatedRaw, 'utf-8'));
    return updatedRaw;
  }

  async addLogEntry(
    uri: vscode.Uri,
    context: ProjectContext,
    entry: LogEntry
  ): Promise<string> {
    const section = context.sections.find(s => s.id === 'log');
    if (!section) {
      throw new Error('Log section not found');
    }

    const newRow = `| ${entry.date} | ${entry.change} | ${entry.scope} |`;
    const updatedContent = section.content + '\n' + newRow;

    return this.writeSection(uri, context, 'log', updatedContent);
  }

  private updateTimestamp(content: string): string {
    const today = new Date().toISOString().split('T')[0];
    return content.replace(
      /最后更新[：:]\s*.+/,
      `最后更新：${today}`
    );
  }
}
