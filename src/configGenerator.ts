import * as vscode from 'vscode';
import * as path from 'path';
import { ContextParser } from './contextParser';
import type { ProjectContext } from './types';

export type ToolId = 'cursor' | 'claude-code' | 'codex' | 'copilot';

export interface ToolInfo {
  id: ToolId;
  name: string;
  files: string[];
  description: string;
}

export const SUPPORTED_TOOLS: ToolInfo[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    files: ['.cursor/rules/project-context.mdc', '.cursor/rules/context-handoff.mdc', '.cursor/skills/project-context/SKILL.md'],
    description: 'Rules 自动注入 + Skill 关键词触发',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    files: ['CLAUDE.md'],
    description: '项目根目录上下文文件，Claude Code 自动读取',
  },
  {
    id: 'codex',
    name: 'Codex / OpenAI',
    files: ['AGENTS.md'],
    description: '项目指令文件，Codex CLI 自动读取',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    files: ['.github/copilot-instructions.md'],
    description: 'Copilot 自定义指令，自动注入到每次交互',
  },
];

export class ConfigGenerator {
  private parser = new ContextParser();

  async generateForTools(rootPath: string, tools: ToolId[]): Promise<string[]> {
    const created: string[] = [];

    for (const tool of tools) {
      const files = await this.generateForTool(rootPath, tool);
      created.push(...files);
    }

    return created;
  }

  async generateAll(rootPath: string): Promise<string[]> {
    return this.generateForTools(rootPath, ['cursor']);
  }

  private async generateForTool(rootPath: string, tool: ToolId): Promise<string[]> {
    switch (tool) {
      case 'cursor': return this.generateCursor(rootPath);
      case 'claude-code': return this.generateClaudeCode(rootPath);
      case 'codex': return this.generateCodex(rootPath);
      case 'copilot': return this.generateCopilot(rootPath);
    }
  }

  private async getProjectSummary(rootPath: string): Promise<{
    name: string; description: string; structure: string; context: ProjectContext | null;
  }> {
    const name = path.basename(rootPath);
    let description = '待补充';
    let structure = `${name}/\n└── ...`;
    let context: ProjectContext | null = null;

    const contextUri = vscode.Uri.file(path.join(rootPath, 'PROJECT_CONTEXT.md'));
    try {
      context = await this.parser.parse(contextUri);
      const overview = context.sections.find(s => s.id === 'overview');
      if (overview) {
        const m = overview.content.match(/一句话描述[】：:]\s*(.+)/);
        if (m) { description = m[1].trim(); }
      }
      const structSec = context.sections.find(s => s.id === 'structure');
      if (structSec) {
        const lines = structSec.content.split('\n');
        const s = lines.findIndex(l => l.startsWith('```'));
        const e = lines.findIndex((l, i) => i > s && l.startsWith('```'));
        if (s >= 0 && e >= 0) {
          const tree = lines.slice(s + 1, e);
          structure = tree.slice(0, 12).join('\n');
          if (tree.length > 12) { structure += '\n└── ...'; }
        }
      }
    } catch { /* no context file */ }

    return { name, description, structure, context };
  }

  private async generateCursor(rootPath: string): Promise<string[]> {
    const created: string[] = [];
    const r1 = await this.generateProjectContextRule(rootPath);
    if (r1) { created.push(r1); }
    const r2 = await this.generateContextHandoffRule(rootPath);
    if (r2) { created.push(r2); }
    const r3 = await this.generateSkill(rootPath);
    if (r3) { created.push(r3); }
    return created;
  }

  private async generateClaudeCode(rootPath: string): Promise<string[]> {
    const filePath = path.join(rootPath, 'CLAUDE.md');
    const { name, description, structure, context } = await this.getProjectSummary(rootPath);

    const statusContent = context?.sections.find(s => s.id === 'status')?.content || '';
    const pending = statusContent.split('\n').filter(l => l.match(/^- \[ \]/)).join('\n') || '- [ ] 待补充';

    const conventions = context?.sections.find(s => s.id === 'conventions')?.content || '- 中文为主\n- 保持现有代码风格';

    const content = `# CLAUDE.md — ${name}

## 项目概述

${name} — ${description}

## 项目结构

\`\`\`
${structure}
\`\`\`

## 开发约定

${conventions}

## 当前待办

${pending}

## 工作指南

- 修改代码前先读 \`PROJECT_CONTEXT.md\` 了解完整上下文
- 完成任务后更新 \`PROJECT_CONTEXT.md\` 的"待办"和"维护日志"
- 不要修改不相关的文件
- 保持现有代码风格和命名约定
- 提交信息用中文，格式：\`类型: 描述\`（如 \`feat: 新增功能\`）
`;

    await this.writeFile(filePath, content);
    return ['CLAUDE.md'];
  }

  private async generateCodex(rootPath: string): Promise<string[]> {
    const filePath = path.join(rootPath, 'AGENTS.md');
    const { name, description, structure, context } = await this.getProjectSummary(rootPath);

    const conventions = context?.sections.find(s => s.id === 'conventions')?.content || '- 保持现有代码风格';

    const content = `# AGENTS.md — ${name}

## 项目信息

- **名称**: ${name}
- **描述**: ${description}

## 结构

\`\`\`
${structure}
\`\`\`

## 规则

${conventions}

## 上下文

- 详细上下文请读取 \`PROJECT_CONTEXT.md\`
- 修改后更新 \`PROJECT_CONTEXT.md\` 的"当前状态与待办"和"维护日志"

## 代码规范

- 保持现有代码风格
- 中文注释，英文变量名
- 提交信息格式：\`类型: 描述\`
`;

    await this.writeFile(filePath, content);
    return ['AGENTS.md'];
  }

  private async generateCopilot(rootPath: string): Promise<string[]> {
    const dirPath = path.join(rootPath, '.github');
    const filePath = path.join(dirPath, 'copilot-instructions.md');
    await this.ensureDir(dirPath);

    const { name, description, structure, context } = await this.getProjectSummary(rootPath);

    const conventions = context?.sections.find(s => s.id === 'conventions')?.content || '- 保持现有代码风格';

    const content = `# Copilot Instructions — ${name}

## 项目概述

${name} — ${description}

## 项目结构

\`\`\`
${structure}
\`\`\`

## 编码约定

${conventions}

## 上下文参考

如需了解项目完整上下文，请参考 \`PROJECT_CONTEXT.md\` 文件。

## 注意事项

- 使用中文编写注释和文档
- 保持现有代码风格和命名约定
- 新功能需要更新 \`PROJECT_CONTEXT.md\`
- 提交信息格式：\`类型: 描述\`
`;

    await this.writeFile(filePath, content);
    return ['.github/copilot-instructions.md'];
  }

  async generateProjectContextRule(rootPath: string): Promise<string | null> {
    const rulesDir = path.join(rootPath, '.cursor', 'rules');
    const rulePath = path.join(rulesDir, 'project-context.mdc');
    await this.ensureDir(rulesDir);

    const { name, description, structure } = await this.getProjectSummary(rootPath);

    const content = `---
description: 项目上下文自动加载 — ${name}
globs: 
alwaysApply: true
---

# 项目上下文规则

## 项目速览

- **项目**：${name}
- **描述**：${description}
- **阶段**：开发中

## 核心结构

\`\`\`
${structure}
\`\`\`

## AI 操作指南

1. **首次接触项目**：先读 \`PROJECT_CONTEXT.md\` 了解完整上下文
2. **编辑文档**：保持现有风格
3. **子项目开发**：每个子项目是独立应用，进入子目录查看其自身的 README
4. **修改后**：如有结构性变更，更新 \`PROJECT_CONTEXT.md\`
5. **上下文快满时**：将当前进度写入 \`PROJECT_CONTEXT.md\` 的"当前状态与待办"
`;

    await this.writeFile(rulePath, content);
    return '.cursor/rules/project-context.mdc';
  }

  async generateContextHandoffRule(rootPath: string): Promise<string | null> {
    const rulesDir = path.join(rootPath, '.cursor', 'rules');
    const rulePath = path.join(rulesDir, 'context-handoff.mdc');
    await this.ensureDir(rulesDir);

    const content = `---
description: 上下文接力规则 — 确保任务在对话间无缝衔接
globs: 
alwaysApply: true
---

# 上下文接力规则

## 任务开始时

1. 检查 \`PROJECT_CONTEXT.md\` 是否存在，存在则先读取
2. 特别关注"当前状态与待办"章节，了解上次中断的位置
3. 如果有进行中的任务，主动告知用户并询问是否继续

## 任务结束或上下文快满时

当完成重要任务或感知到对话较长时，主动执行以下操作：

1. **更新 PROJECT_CONTEXT.md**：
   - 更新"当前状态与待办"章节（完成的打勾，新增的补上）
   - 更新"维护日志"（记录本次做了什么）
   - 如有结构变更，更新"目录结构"和"子项目速查"

2. **生成接力摘要**（在对话末尾告知用户）：
   - 本次完成了什么
   - 还有什么未完成
   - 下次对话的建议起点

## 重要提醒

- 不要等用户要求才保存进度，主动在合适时机更新
- PROJECT_CONTEXT.md 是核心接力文件，保持它的准确性
`;

    await this.writeFile(rulePath, content);
    return '.cursor/rules/context-handoff.mdc';
  }

  async generateSkill(rootPath: string): Promise<string | null> {
    const skillDir = path.join(rootPath, '.cursor', 'skills', 'project-context');
    const skillPath = path.join(skillDir, 'SKILL.md');
    await this.ensureDir(skillDir);

    const content = `---
name: project-context
description: >-
  为项目生成或更新 AI 上下文记忆文件，让 AI 在新对话中快速了解项目全貌。
  Triggers on keywords: 项目上下文, 项目记忆, 项目交接, 保存进度, 项目地图,
  project context, project memory, context handoff, save progress, project map,
  生成上下文, 更新上下文, 记住项目, 了解项目.
---

# Project Context — 项目上下文生成器

一键为任意项目生成 AI 记忆文件，让每次新对话都能秒懂项目。

## 触发关键词

- 中文：\`生成项目上下文\`、\`更新项目记忆\`、\`项目交接\`、\`保存进度\`、\`项目地图\`
- English: \`project context\`, \`project memory\`, \`context handoff\`, \`save progress\`

## 执行流程

### 第 1 步：判断操作类型
- \`PROJECT_CONTEXT.md\` 不存在 → 首次生成
- 已存在 → 更新

### 第 2 步：首次生成
1. 扫描项目结构（目录、子项目、关键文件）
2. 生成 PROJECT_CONTEXT.md（概述/结构/待办/日志等章节）
3. 生成 .cursor/rules/project-context.mdc（项目速览 Rule）
4. 生成 .cursor/rules/context-handoff.mdc（接力 Rule）

### 第 3 步：更新
1. 读取现有 PROJECT_CONTEXT.md
2. 重新扫描项目，更新有变化的章节
3. 添加维护日志，更新日期

### 质量标准
- PROJECT_CONTEXT.md 控制在 100-200 行
- Cursor Rule 控制在 30 行以内
- 不包含敏感信息

### 特殊场景
- "保存进度" → 仅更新待办和日志
- "项目交接" → 生成完整上下文 + 交接摘要
- "了解项目" → 只读取并汇报，不修改文件
`;

    await this.writeFile(skillPath, content);
    return '.cursor/skills/project-context/SKILL.md';
  }

  private async writeFile(filePath: string, content: string) {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(filePath),
      Buffer.from(content, 'utf-8')
    );
  }

  private async ensureDir(dirPath: string) {
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
    } catch { /* already exists */ }
  }
}
