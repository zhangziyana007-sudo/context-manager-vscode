import React, { useState } from 'react';

interface ToolOption {
  id: string;
  name: string;
  files: string[];
  description: string;
  icon: string;
}

const AI_TOOLS: ToolOption[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    files: ['.cursor/rules/project-context.mdc', '.cursor/rules/context-handoff.mdc', '.cursor/skills/project-context/SKILL.md'],
    description: 'Rules 自动注入 + Skill 关键词触发',
    icon: '🖥️',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    files: ['CLAUDE.md'],
    description: '项目根目录上下文文件，Claude Code 自动读取',
    icon: '🤖',
  },
  {
    id: 'codex',
    name: 'Codex / OpenAI',
    files: ['AGENTS.md'],
    description: '项目指令文件，Codex CLI 自动读取',
    icon: '⚡',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    files: ['.github/copilot-instructions.md'],
    description: 'Copilot 自定义指令，自动注入到每次交互',
    icon: '🐙',
  },
];

const SKILL_COMMANDS = [
  {
    category: '生成与更新',
    items: [
      { keyword: '生成项目上下文', desc: 'AI 扫描项目结构，首次生成 PROJECT_CONTEXT.md + Rules' },
      { keyword: '更新项目记忆', desc: 'AI 重新扫描项目，更新有变化的章节' },
      { keyword: '保存进度', desc: 'AI 仅更新"待办"和"维护日志"，不全量扫描' },
    ],
  },
  {
    category: '了解与交接',
    items: [
      { keyword: '了解项目', desc: 'AI 读取 PROJECT_CONTEXT.md 并口头汇报概况' },
      { keyword: '项目交接', desc: 'AI 生成完整上下文 + 交接摘要文本' },
    ],
  },
];

const PANEL_TIPS = [
  { icon: '📋', text: '「章节」— 查看/编辑内容，右侧数字是 token 消耗' },
  { icon: '✅', text: '「待办」— 勾选/新增 TODO，自动写回文件' },
  { icon: '📝', text: '「日志」— 填表单添加维护日志' },
  { icon: '🔀', text: '「对比」— 查看新旧版本差异' },
  { icon: '⚡', text: '底部「精简版」— 一键生成省 token 的 MINI 版' },
];

interface Props {
  onConfigureRules: () => void;
  onConfigureTools: (tools: string[]) => void;
}

export function HelpPanel({ onConfigureRules, onConfigureTools }: Props) {
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(['cursor']));

  function toggleTool(id: string) {
    setSelectedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function handleGenerate() {
    const tools = Array.from(selectedTools);
    if (tools.length === 0) { return; }
    onConfigureTools(tools);
  }

  const totalFiles = AI_TOOLS
    .filter(t => selectedTools.has(t.id))
    .reduce((sum, t) => sum + t.files.length, 0);

  return (
    <div className="help-panel">
      <section className="help-section">
        <h3 className="help-section-title">一键配置 AI 工具</h3>
        <p className="help-desc">选择你使用的 AI 工具，一键生成对应的配置文件：</p>

        <div className="tool-grid">
          {AI_TOOLS.map(tool => (
            <label
              key={tool.id}
              className={`tool-card ${selectedTools.has(tool.id) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedTools.has(tool.id)}
                onChange={() => toggleTool(tool.id)}
              />
              <div className="tool-card-body">
                <div className="tool-card-header">
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-name">{tool.name}</span>
                </div>
                <span className="tool-desc">{tool.description}</span>
                <div className="tool-files">
                  {tool.files.map(f => (
                    <code key={f} className="tool-file">{f}</code>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>

        <button
          className="btn btn-primary config-btn"
          onClick={handleGenerate}
          disabled={selectedTools.size === 0}
        >
          ⚙ 生成 {totalFiles} 个配置文件
        </button>
      </section>

      <section className="help-section">
        <h3 className="help-section-title">对 AI 说这些关键词</h3>
        <p className="help-desc">在 Cursor 对话框中输入关键词，AI 自动执行：</p>
        {SKILL_COMMANDS.map(group => (
          <div key={group.category} className="help-group">
            <h4 className="help-group-title">{group.category}</h4>
            {group.items.map(item => (
              <div key={item.keyword} className="help-item">
                <code className="help-keyword">{item.keyword}</code>
                <span className="help-item-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="help-section">
        <h3 className="help-section-title">面板速查</h3>
        {PANEL_TIPS.map((tip, i) => (
          <div key={i} className="help-tip">
            <span className="help-tip-icon">{tip.icon}</span>
            <span className="help-tip-text">{tip.text}</span>
          </div>
        ))}
      </section>

      <section className="help-section">
        <h3 className="help-section-title">推荐工作流</h3>
        <ol className="help-workflow">
          <li>在本面板选择工具并点击「生成配置文件」</li>
          <li>对 AI 说<code>生成项目上下文</code>→ AI 自动生成文件</li>
          <li>在「章节」Tab 检查和微调内容</li>
          <li>看底部 token 数，太大就点<code>⚡ 精简版</code></li>
          <li>日常开发中，AI 会自动更新待办和日志</li>
        </ol>
      </section>
    </div>
  );
}
