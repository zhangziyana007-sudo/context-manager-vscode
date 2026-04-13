import * as vscode from 'vscode';
import * as path from 'path';

interface DirEntry {
  name: string;
  type: 'file' | 'directory';
  hasPackageJson?: boolean;
  hasRequirements?: boolean;
}

export class ContextGenerator {
  async generate(rootPath: string): Promise<void> {
    const uri = vscode.Uri.file(rootPath);
    const contextUri = vscode.Uri.file(path.join(rootPath, 'PROJECT_CONTEXT.md'));

    try {
      await vscode.workspace.fs.stat(contextUri);
      const overwrite = await vscode.window.showWarningMessage(
        'PROJECT_CONTEXT.md 已存在，是否覆盖？',
        '覆盖', '取消'
      );
      if (overwrite !== '覆盖') { return; }
    } catch {
      // File doesn't exist, proceed
    }

    const entries = await this.scanDirectory(uri);
    const projectName = path.basename(rootPath);
    const today = new Date().toISOString().split('T')[0];

    const content = this.buildTemplate(projectName, today, entries);
    await vscode.workspace.fs.writeFile(contextUri, Buffer.from(content, 'utf-8'));
  }

  private async scanDirectory(uri: vscode.Uri): Promise<DirEntry[]> {
    const result: DirEntry[] = [];
    const children = await vscode.workspace.fs.readDirectory(uri);

    const ignoreDirs = new Set([
      'node_modules', '.git', '.vscode', '.cursor', 'dist', 'build',
      '.next', '__pycache__', '.playwright-mcp', '.opencli', '.context-mcp',
    ]);

    for (const [name, type] of children) {
      if (name.startsWith('.') && ignoreDirs.has(name)) { continue; }
      if (ignoreDirs.has(name)) { continue; }

      if (type === vscode.FileType.Directory) {
        const entry: DirEntry = { name, type: 'directory' };
        const childUri = vscode.Uri.joinPath(uri, name);
        const childFiles = await vscode.workspace.fs.readDirectory(childUri);
        const childNames = childFiles.map(([n]) => n);
        entry.hasPackageJson = childNames.includes('package.json');
        entry.hasRequirements = childNames.includes('requirements.txt');
        result.push(entry);
      } else if (type === vscode.FileType.File) {
        result.push({ name, type: 'file' });
      }
    }

    return result;
  }

  private buildTemplate(name: string, date: string, entries: DirEntry[]): string {
    const dirs = entries.filter(e => e.type === 'directory');
    const files = entries.filter(e => e.type === 'file');
    const subProjects = dirs.filter(d => d.hasPackageJson || d.hasRequirements);

    const dirTree = [
      `${name}/`,
      ...dirs.map(d => {
        const marker = d.hasPackageJson ? ' (Node.js)' : d.hasRequirements ? ' (Python)' : '';
        return `├── ${d.name}/${marker}`;
      }),
      ...files.slice(0, 15).map(f => `├── ${f.name}`),
      files.length > 15 ? `└── ... 及其他 ${files.length - 15} 个文件` : '',
    ].filter(Boolean).join('\n');

    const subProjectRows = subProjects.length > 0
      ? subProjects.map(s =>
          `| ${s.name} | ${s.hasPackageJson ? 'Node.js' : 'Python'} | — | 待补充 |`
        ).join('\n')
      : '| — | — | — | 暂无子项目 |';

    return `# 项目上下文 — ${name}

> 本文件供 AI 助手快速了解项目全貌。最后更新：${date}

---

## 1. 项目概述

- **项目名称**：${name}
- **一句话描述**：待补充
- **项目阶段**：开发中
- **核心技术栈**：待补充

## 2. 目录结构

\`\`\`
${dirTree}
\`\`\`

## 3. 子项目速查

| 子项目 | 技术栈 | 一句话说明 | 状态 |
|--------|--------|-----------|------|
${subProjectRows}

## 4. 关键文件索引

| 文件 | 职责 |
|------|------|
| PROJECT_CONTEXT.md | AI 上下文记忆文件 |

## 5. 开发约定

- 待补充

## 6. 当前状态与待办

### 进行中

- [ ] 初始化项目上下文

### 待规划

- [ ] 待补充

## 7. 维护日志

| 日期 | 修改内容 | 影响范围 |
|------|----------|----------|
| ${date} | 初始化 PROJECT_CONTEXT.md | 全局 |

---

## 给 AI 的提示

- 修改代码前，先读本文件了解项目结构
- 完成任务后，如有结构性变更，请更新本文件
- 上下文快满时，将当前进度写入"当前状态与待办"和"维护日志"
`;
  }
}
