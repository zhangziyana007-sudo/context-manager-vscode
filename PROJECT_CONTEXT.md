# 项目上下文 — Context Manager (VS Code 扩展)

> 本文件供 AI 助手快速了解项目全貌。最后更新：2026-04-13

---

## 1. 项目概述

- **项目名称**：Context Manager
- **一句话描述**：VS Code/Cursor 侧边栏扩展，可视化管理 PROJECT_CONTEXT.md，一键为多个 AI 工具生成配置
- **项目阶段**：v0.1.0 已发布，持续迭代中
- **核心技术栈**：TypeScript + React 18 + esbuild + VS Code Webview API
- **GitHub**：https://github.com/zhangziyana007-sudo/context-manager-vscode

## 2. 目录结构

```
context-mcp/
├── src/                        # Extension Host 代码 (Node.js)
│   ├── extension.ts            # 入口，注册命令和 Provider
│   ├── contextParser.ts        # Markdown → 结构化数据
│   ├── contextWriter.ts        # 结构化数据 → Markdown 写回
│   ├── contextGenerator.ts     # 扫描项目生成上下文
│   ├── configGenerator.ts      # 多工具配置生成器
│   ├── miniGenerator.ts        # 精简版生成器
│   ├── tokenEstimator.ts       # Token 估算器
│   ├── fileWatcher.ts          # 文件变更监控
│   ├── diffManager.ts          # 版本快照与 diff
│   ├── types.ts                # 共享类型
│   └── providers/
│       └── sidebarProvider.ts  # Webview 桥接层
├── webview/                    # Webview UI (React)
│   ├── App.tsx                 # 根组件，管理 5 个 Tab
│   ├── main.tsx                # 入口
│   ├── hooks/useVSCode.ts      # VS Code API hook
│   ├── components/
│   │   ├── SectionNav.tsx      # 章节导航 + token 标注
│   │   ├── SectionEditor.tsx   # 章节编辑器
│   │   ├── TodoPanel.tsx       # 待办面板
│   │   ├── LogPanel.tsx        # 日志面板
│   │   ├── DiffPreview.tsx     # Diff 预览
│   │   ├── HelpPanel.tsx       # 帮助面板 + 多工具选择 + 工作流
│   │   ├── DailyMode.tsx       # 每日模式选择器
│   │   ├── ResumeBanner.tsx    # 接力卡片
│   │   └── StatusBar.tsx       # 状态栏 + token 计数
│   └── styles/main.css         # 主题适配样式
├── media/icon.svg              # Activity Bar 图标
├── esbuild.js                  # 构建配置
├── package.json                # 扩展配置
└── README.md
```

## 3. 核心功能

| 功能 | 说明 |
|------|------|
| 章节浏览/编辑 | 按 ## 分割展示，就地编辑保存 |
| 待办管理 | 勾选/新增 TODO，自动写回 |
| 日志记录 | 表单式添加维护日志 |
| 版本对比 | 内置 inline diff + VS Code diff editor |
| Token 估算 | 每章节 + 总计 token 数，颜色编码 |
| 精简版生成 | 一键生成 ~800 token 的 MINI 版 |
| 多工具配置 | 支持 Cursor / Claude Code / Codex / Copilot |
| 每日模式 | 开发新功能 / 维护解Bug 模式切换 |
| 启动提醒 | 打开项目时自动提醒待办事项 |
| 帮助引导 | 傻瓜式操作指南 + 完整工作流 |

## 4. 关键文件索引

| 文件 | 职责 |
|------|------|
| src/extension.ts | 入口：注册 8 个命令 + 启动提醒 |
| src/configGenerator.ts | 多工具配置生成（Cursor/Claude/Codex/Copilot） |
| src/tokenEstimator.ts | 中英混合文本 token 估算 |
| src/providers/sidebarProvider.ts | Webview 桥接层，消息路由 |
| webview/App.tsx | React 根组件，5 Tab + 每日模式 |
| webview/components/HelpPanel.tsx | 帮助面板：工具选择 + 关键词 + 工作流 |
| webview/components/DailyMode.tsx | 每日模式选择器 |

## 5. 开发约定

- TypeScript 严格模式
- esbuild 双 bundle（Extension CJS + Webview ESM）
- CSS Variables 适配 VS Code 主题
- postMessage 双向通信
- 中文 UI + 中文注释

## 6. 当前状态与待办

### 已完成

- [x] 核心面板（章节/待办/日志/对比）
- [x] Token 估算 + 精简版生成
- [x] 多工具配置（Cursor/Claude Code/Codex/Copilot）
- [x] 帮助面板 + 傻瓜式引导
- [x] 启动提醒 + 继续上次任务命令
- [x] 每日模式选择器（开发/维护）
- [x] 完整工作流指南
- [x] README 安装教程（多编辑器）
- [x] GitHub 仓库创建并推送

### 可优化方向

- [ ] 发布到 VS Code 插件市场
- [ ] Markdown 渲染（富文本展示而非纯文本）
- [ ] 支持更多 AI 工具（Windsurf / Aider / Cline）
- [ ] 多项目支持（同时管理多个上下文文件）
- [ ] 版本号自动升级

## 7. 维护日志

| 日期 | 修改内容 | 影响范围 |
|------|----------|----------|
| 2026-04-13 | 初始化项目，实现核心功能（章节/待办/日志/对比） | 全局 |
| 2026-04-13 | 添加 Token 估算 + 精简版生成 | tokenEstimator, miniGenerator, StatusBar |
| 2026-04-13 | 多工具配置支持（Cursor/Claude/Codex/Copilot） | configGenerator, HelpPanel |
| 2026-04-13 | 简化帮助面板 + 完整工作流指南 | HelpPanel, CSS |
| 2026-04-13 | 继续上次任务 + 启动提醒 + 每日模式选择器 | extension, DailyMode, ResumeBanner |

---

## 给 AI 的提示

- 修改代码前，先读本文件了解项目结构
- Extension Host 代码在 src/，Webview 代码在 webview/
- 两侧通过 postMessage 通信，类型定义在 src/types.ts
- 构建命令：`npm run build`，打包命令：`npx @vscode/vsce package --no-dependencies`
- 完成任务后更新本文件的"当前状态与待办"和"维护日志"
