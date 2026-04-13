# Context Manager

可视化管理 `PROJECT_CONTEXT.md`，一键为多个 AI 工具生成配置，让每次对话 AI 都能秒懂你的项目。

## 这是什么？

每次跟 AI 聊新对话，它都不知道你的项目是什么。你得花很多时间（和 token）让它重新了解。

这个插件解决这个问题：
- 帮你维护一个「项目说明书」（PROJECT_CONTEXT.md）
- 一键生成各种 AI 工具的配置文件，让 AI 自动读取
- 节省约 **75% 的 token 消耗**

## 支持的 AI 工具

| AI 工具 | 生成的配置文件 | 工具如何读取 |
|---------|--------------|------------|
| **Cursor** | `.cursor/rules/*.mdc` + `SKILL.md` | 每次对话自动注入 |
| **Claude Code** | `CLAUDE.md` | 打开项目时自动读取 |
| **Codex (OpenAI)** | `AGENTS.md` | CLI 启动时自动读取 |
| **GitHub Copilot** | `.github/copilot-instructions.md` | 每次交互自动注入 |

## 安装

### 方法一：命令行（推荐）

下载 `.vsix` 文件后：

```bash
# Cursor
cursor --install-extension context-manager-0.1.0.vsix

# VS Code
code --install-extension context-manager-0.1.0.vsix

# Windsurf
windsurf --install-extension context-manager-0.1.0.vsix

# Trae
trae --install-extension context-manager-0.1.0.vsix
```

安装后按 `Ctrl+Shift+P` → 输入 "Reload Window" → 回车。

### 方法二：界面安装

1. 打开编辑器
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 点右上角 `...` → **"从 VSIX 安装..."**
4. 选择 `context-manager-0.1.0.vsix`
5. 安装后点 "Reload Window"

### 方法三：从源码构建

```bash
git clone https://github.com/zhangziyana007-sudo/context-manager-vscode.git
cd context-manager-vscode
npm install
npm run build
npx @vscode/vsce package --no-dependencies
# 生成的 .vsix 文件在项目根目录
```

## 兼容性

| 编辑器 | 是否支持 |
|--------|---------|
| Cursor | ✅ 完全支持 |
| VS Code | ✅ 完全支持 |
| Windsurf | ✅ 支持 |
| Trae | ✅ 支持 |
| VSCodium | ✅ 支持 |
| JetBrains 系列 | ❌ 不兼容 |
| Neovim / Vim | ❌ 不兼容 |

> 所有基于 VS Code 的编辑器都能安装本插件。

## 使用方法

### 快速开始（3 步）

1. **点击图标** — 左侧 Activity Bar 找到 Context Manager 图标
2. **切到「帮助」Tab** — 勾选你用的 AI 工具，点「一键生成配置文件」
3. **对 AI 说「生成项目上下文」** — AI 自动分析项目并生成说明文件

### 面板功能

| Tab | 干什么用 |
|-----|---------|
| **章节** | 查看/编辑项目说明的各个部分，右侧数字是 token 消耗 |
| **待办** | 点一下勾选完成，也能新增待办事项 |
| **日志** | 填个表就能记录"今天改了什么" |
| **对比** | 看看上次保存和现在有什么区别 |
| **帮助** | 选择 AI 工具、一键配置、查看使用提示 |

### 命令面板

按 `Ctrl+Shift+P`，输入 `Context:` 可以看到所有命令：

| 命令 | 说明 |
|------|------|
| `Context: 生成项目上下文` | 扫描项目，生成 PROJECT_CONTEXT.md |
| `Context: 更新项目上下文` | 刷新面板内容 |
| `Context: 保存进度` | 快速保存当前工作进度 |
| `Context: 查看变更对比` | 打开 diff 编辑器 |
| `Context: 打开上下文文件` | 直接编辑 PROJECT_CONTEXT.md |
| `Context: 生成精简版（省 Token）` | 生成 ~800 token 的精简版 |
| `Context: 一键配置 Rules & Skill` | 生成 Cursor 专属配置 |

### 关键词触发（Cursor 专属）

在 Cursor 对话框中说这些话，AI 会自动执行：

| 你说什么 | AI 做什么 |
|---------|----------|
| **生成项目上下文** | 扫描项目 → 生成完整的项目说明文件 |
| **更新项目记忆** | 重新扫描，更新有变化的部分 |
| **保存进度** | 只更新待办和日志 |
| **项目交接** | 生成可复制的交接摘要 |

## Token 节省效果

| 场景 | 没有本插件 | 有本插件 | 节省 |
|------|-----------|---------|------|
| AI 首次了解项目 | ~12,000 tokens | ~2,500 tokens | **80%** |
| 对话间接力 | ~8,000 tokens | ~1,500 tokens | **80%** |
| 10 次对话累计 | ~100,000 tokens | ~25,000 tokens | **75,000 tokens** |

底部状态栏实时显示当前文件的 token 消耗：
- 🟢 绿色 ≤ 2,000 tokens — 很好
- 🟡 黄色 ≤ 4,000 tokens — 可以接受
- 🔴 红色 > 4,000 tokens — 建议精简

## 开发

```bash
npm install       # 安装依赖
npm run build     # 构建
npm run watch     # 开发模式（自动重新构建）
```

### 调试

1. 在 VS Code / Cursor 中打开本项目
2. 按 `F5` 启动 Extension Development Host
3. 在新窗口中打开包含 PROJECT_CONTEXT.md 的项目
4. 点击侧边栏 Context Manager 图标

## 技术栈

- TypeScript + React 18
- esbuild 双 bundle（Extension Host CJS + Webview ESM）
- VS Code Webview API + CSS Variables 主题适配
- diff 库做 inline 变更预览

## 项目结构

```
context-mcp/
├── src/                        # Extension Host 代码
│   ├── extension.ts            # 入口，注册命令
│   ├── contextParser.ts        # Markdown → 结构化数据
│   ├── contextWriter.ts        # 结构化数据 → Markdown
│   ├── contextGenerator.ts     # 扫描项目生成上下文
│   ├── configGenerator.ts      # 多工具配置生成器
│   ├── miniGenerator.ts        # 精简版生成器
│   ├── tokenEstimator.ts       # Token 估算器
│   ├── fileWatcher.ts          # 文件变更监控
│   ├── diffManager.ts          # 版本快照与 diff
│   ├── types.ts                # 共享类型定义
│   └── providers/
│       └── sidebarProvider.ts  # Webview 桥接层
├── webview/                    # Webview UI (React)
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 入口
│   ├── hooks/useVSCode.ts      # VS Code API hook
│   ├── components/             # UI 组件
│   │   ├── SectionNav.tsx      # 章节导航（含 token 标注）
│   │   ├── SectionEditor.tsx   # 章节编辑器
│   │   ├── TodoPanel.tsx       # 待办面板
│   │   ├── LogPanel.tsx        # 日志面板
│   │   ├── DiffPreview.tsx     # Diff 预览
│   │   ├── HelpPanel.tsx       # 帮助面板（多工具选择）
│   │   └── StatusBar.tsx       # 状态栏（token 计数）
│   └── styles/main.css         # 主题适配样式
├── media/icon.svg              # Activity Bar 图标
├── esbuild.js                  # 构建配置
└── package.json
```

## License

MIT
