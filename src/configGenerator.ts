import * as vscode from 'vscode';
import * as path from 'path';
import { ContextParser } from './contextParser';

/**
 * Generates Cursor Rules (.mdc) and Skill (SKILL.md) files
 * for the project-context workflow.
 */
export class ConfigGenerator {
  private parser = new ContextParser();

  async generateAll(rootPath: string): Promise<string[]> {
    const created: string[] = [];

    const ruleResult = await this.generateProjectContextRule(rootPath);
    if (ruleResult) { created.push(ruleResult); }

    const handoffResult = await this.generateContextHandoffRule(rootPath);
    if (handoffResult) { created.push(handoffResult); }

    const skillResult = await this.generateSkill(rootPath);
    if (skillResult) { created.push(skillResult); }

    return created;
  }

  async generateProjectContextRule(rootPath: string): Promise<string | null> {
    const rulesDir = path.join(rootPath, '.cursor', 'rules');
    const rulePath = path.join(rulesDir, 'project-context.mdc');

    await this.ensureDir(rulesDir);

    const projectName = path.basename(rootPath);
    let description = '待补充';
    let structureSnippet = `${projectName}/\n└── ...`;

    const contextUri = vscode.Uri.file(path.join(rootPath, 'PROJECT_CONTEXT.md'));
    try {
      const ctx = await this.parser.parse(contextUri);
      const overview = ctx.sections.find(s => s.id === 'overview');
      if (overview) {
        const descMatch = overview.content.match(/一句话描述[】：:]\s*(.+)/);
        if (descMatch) { description = descMatch[1].trim(); }
      }
      const structure = ctx.sections.find(s => s.id === 'structure');
      if (structure) {
        const lines = structure.content.split('\n');
        const codeStart = lines.findIndex(l => l.startsWith('```'));
        const codeEnd = lines.findIndex((l, i) => i > codeStart && l.startsWith('```'));
        if (codeStart >= 0 && codeEnd >= 0) {
          const treeLines = lines.slice(codeStart + 1, codeEnd);
          structureSnippet = treeLines.slice(0, 12).join('\n');
          if (treeLines.length > 12) { structureSnippet += '\n└── ...'; }
        }
      }
    } catch {
      // PROJECT_CONTEXT.md doesn't exist yet, use defaults
    }

    const content = `---
description: 项目上下文自动加载 — ${projectName}
globs: 
alwaysApply: true
---

# 项目上下文规则

## 项目速览

- **项目**：${projectName}
- **描述**：${description}
- **阶段**：开发中

## 核心结构

\`\`\`
${structureSnippet}
\`\`\`

## AI 操作指南

1. **首次接触项目**：先读 \`PROJECT_CONTEXT.md\` 了解完整上下文
2. **编辑文档**：保持现有风格
3. **子项目开发**：每个子项目是独立应用，进入子目录查看其自身的 README
4. **修改后**：如有结构性变更，更新 \`PROJECT_CONTEXT.md\`
5. **上下文快满时**：将当前进度写入 \`PROJECT_CONTEXT.md\` 的"当前状态与待办"
`;

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(rulePath),
      Buffer.from(content, 'utf-8')
    );
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

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(rulePath),
      Buffer.from(content, 'utf-8')
    );
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
  触发场景：用户说"生成项目上下文"、"更新项目记忆"、"项目交接"、"保存进度"、"项目地图"，
  或用户要求 AI 快速熟悉一个项目、减少 token 消耗、做上下文接力。
  Triggers on keywords: 项目上下文, 项目记忆, 项目交接, 保存进度, 项目地图,
  project context, project memory, context handoff, save progress, project map,
  生成上下文, 更新上下文, 记住项目, 了解项目.
---

# Project Context — 项目上下文生成器

一键为任意项目生成 AI 记忆文件，让每次新对话都能秒懂项目。

## 触发关键词

以下任何一个关键词都会触发此 Skill：
- 中文：\`生成项目上下文\`、\`更新项目记忆\`、\`项目交接\`、\`保存进度\`、\`项目地图\`、\`记住项目\`、\`了解项目\`
- English: \`project context\`, \`project memory\`, \`context handoff\`, \`save progress\`, \`project map\`

## 执行流程

### 第 1 步：判断操作类型

检查项目根目录是否已有 \`PROJECT_CONTEXT.md\`：
- **不存在** → 执行「首次生成」
- **已存在** → 执行「更新」

### 第 2 步：首次生成（项目无上下文文件时）

1. **扫描项目结构**
   - 列出根目录文件和文件夹
   - 识别子项目（有 package.json / requirements.txt / go.mod 等的目录）
   - 读取关键文件的前 10-20 行（README、入口文件等）

2. **生成 PROJECT_CONTEXT.md**，包含以下章节：

\`\`\`markdown
# 项目上下文 — [项目名称]

> 本文件供 AI 助手快速了解项目全貌。最后更新：[日期]

## 1. 项目概述
- 项目名称、一句话描述、阶段、核心技术栈

## 2. 目录结构
- 关键目录树（只列重要的，不穷举）

## 3. 核心架构
- 数据流/系统架构简图
- 关键设计决策表

## 4. 关键文件索引
- 最重要的文件路径 + 职责表

## 5. 开发约定
- 分支策略、代码风格、提交规范

## 6. 环境与部署
- 本地运行、构建、部署命令

## 7. 当前状态与待办
- 最近完成的、进行中的、已知问题

## 8. 维护日志
- 日期 + 修改内容 + 影响范围

## 给 AI 的提示
- 修改代码前先读本文件
- 完成任务后更新本文件
- 上下文快满时将进度写入"待办"和"维护日志"
\`\`\`

3. **生成 Cursor Rule**（\`.cursor/rules/project-context.mdc\`）
   - \`alwaysApply: true\`
   - 包含项目速览（50 字以内）和核心结构（5 行以内）
   - 指引 AI 首次接触时读取 PROJECT_CONTEXT.md

4. **生成接力规则**（\`.cursor/rules/context-handoff.mdc\`）
   - \`alwaysApply: true\`
   - 规定任务结束时自动更新 PROJECT_CONTEXT.md
   - 规定上下文快满时保存进度

### 第 3 步：更新（项目已有上下文文件时）

1. 读取现有 \`PROJECT_CONTEXT.md\`
2. 重新扫描项目结构，与现有内容对比
3. 更新有变化的章节（新增文件、删除文件、结构变化等）
4. 在"维护日志"添加本次更新记录
5. 更新 \`最后更新\` 日期

### 第 4 步：确认与反馈

向用户展示：
- 生成/更新了哪些文件
- 项目上下文的摘要（3-5 行）
- 下次新对话时如何使用（提示：直接开新对话即可，Rule 会自动加载）

## 质量标准

- PROJECT_CONTEXT.md 控制在 **100-200 行**，不要过长
- Cursor Rule 控制在 **30 行以内**，只放核心摘要
- 用中文撰写（除非项目本身是英文项目）
- 不包含敏感信息（密钥、密码等）
- 目录结构只列关键目录，不深入 node_modules 等

## 特殊场景

### 用户说"保存进度"
仅更新 PROJECT_CONTEXT.md 的第 7 节（当前状态与待办）和第 8 节（维护日志），不重新扫描整个项目。

### 用户说"项目交接"
生成完整上下文 + 额外输出一段「交接摘要」文本，用户可以直接复制粘贴到新对话中。

### 用户说"了解项目"
不生成文件，只读取现有的 PROJECT_CONTEXT.md 并向用户口头汇报项目概况。
`;

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(skillPath),
      Buffer.from(content, 'utf-8')
    );
    return '.cursor/skills/project-context/SKILL.md';
  }

  private async ensureDir(dirPath: string) {
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
    } catch {
      // already exists
    }
  }
}
