# Context Manager — VS Code / Cursor 扩展

可视化管理 `PROJECT_CONTEXT.md`，让 AI 上下文接力更高效。

## 功能

- **章节浏览与编辑** — 侧边栏面板展示 PROJECT_CONTEXT.md 各章节，支持就地编辑和保存
- **待办管理** — 可视化查看/勾选/新增"当前状态与待办"章节中的 TODO
- **维护日志** — 快速添加日志条目，无需手动编辑 Markdown 表格
- **变更对比** — 内置 inline diff 预览 + VS Code diff editor 对接
- **文件监控** — 自动检测工作区文件变更，提醒更新上下文
- **一键生成** — 扫描项目结构自动生成 PROJECT_CONTEXT.md

## 命令

| 命令 | 说明 |
|------|------|
| `Context: 生成项目上下文` | 扫描项目结构，生成 PROJECT_CONTEXT.md |
| `Context: 更新项目上下文` | 重新加载并刷新侧边栏内容 |
| `Context: 保存进度` | 快速保存当前工作进度 |
| `Context: 查看变更对比` | 打开 VS Code diff editor 对比快照 |
| `Context: 打开上下文文件` | 在编辑器中打开 PROJECT_CONTEXT.md |

## 开发

```bash
# 安装依赖
npm install

# 开发构建（watch 模式）
npm run watch

# 生产构建
npm run build
```

### 调试

1. 在 VS Code 中打开本项目
2. 按 `F5` 启动 Extension Development Host
3. 在新窗口中打开一个包含 `PROJECT_CONTEXT.md` 的项目
4. 点击侧边栏 Context Manager 图标

## 技术栈

- TypeScript + React 18
- esbuild 双 bundle（Extension Host + Webview）
- VS Code Webview API + CSS Variables 主题适配
- diff 库做 inline 变更预览

## 项目结构

```
context-mcp/
├── src/                    # Extension Host 代码
│   ├── extension.ts        # 入口，注册命令和 Provider
│   ├── contextParser.ts    # Markdown → 结构化数据
│   ├── contextWriter.ts    # 结构化数据 → Markdown 写回
│   ├── contextGenerator.ts # 扫描项目生成上下文
│   ├── fileWatcher.ts      # 文件变更监控
│   ├── diffManager.ts      # 版本快照与 diff
│   ├── types.ts            # 共享类型
│   └── providers/
│       └── sidebarProvider.ts
├── webview/                # Webview UI (React)
│   ├── App.tsx
│   ├── main.tsx
│   ├── hooks/
│   ├── components/
│   └── styles/
├── media/                  # 图标
├── dist/                   # 构建输出
├── esbuild.js             # 构建脚本
└── package.json
```
