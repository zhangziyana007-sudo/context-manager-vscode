import React, { useState } from 'react';

interface ToolOption {
  id: string;
  name: string;
  files: string[];
  whatItDoes: string;
  icon: string;
}

const AI_TOOLS: ToolOption[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    files: ['project-context.mdc', 'context-handoff.mdc', 'SKILL.md'],
    whatItDoes: '让 Cursor 每次对话都自动了解你的项目',
    icon: '🖥️',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    files: ['CLAUDE.md'],
    whatItDoes: '让 Claude Code 打开项目就知道该怎么做',
    icon: '🤖',
  },
  {
    id: 'codex',
    name: 'Codex',
    files: ['AGENTS.md'],
    whatItDoes: '让 OpenAI Codex 理解你的项目规范',
    icon: '⚡',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    files: ['copilot-instructions.md'],
    whatItDoes: '让 Copilot 按你的风格写代码',
    icon: '🐙',
  },
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
      {/* Step 1 */}
      <section className="help-section">
        <div className="step-header">
          <span className="step-number">1</span>
          <h3 className="help-section-title">你用哪些 AI 工具？</h3>
        </div>
        <p className="help-desc">勾选后点按钮，自动帮你配好配置文件。不确定就只选 Cursor。</p>

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
                <span className="tool-desc">{tool.whatItDoes}</span>
              </div>
            </label>
          ))}
        </div>

        <button
          className="btn btn-primary config-btn"
          onClick={handleGenerate}
          disabled={selectedTools.size === 0}
        >
          ⚙ 一键生成 {totalFiles} 个配置文件
        </button>
      </section>

      {/* Step 2 */}
      <section className="help-section">
        <div className="step-header">
          <span className="step-number">2</span>
          <h3 className="help-section-title">让 AI 帮你写上下文</h3>
        </div>
        <p className="help-desc">在 Cursor 对话框里输入下面的话，AI 会自动分析你的项目并生成文件：</p>

        <div className="keyword-cards">
          <div className="keyword-card primary">
            <span className="keyword-text">生成项目上下文</span>
            <span className="keyword-effect">AI 扫描项目 → 生成完整的项目说明文件</span>
          </div>
          <div className="keyword-card">
            <span className="keyword-text">更新项目记忆</span>
            <span className="keyword-effect">项目结构变了？让 AI 重新扫一遍</span>
          </div>
          <div className="keyword-card">
            <span className="keyword-text">保存进度</span>
            <span className="keyword-effect">快下线了？让 AI 记住你做到哪了</span>
          </div>
          <div className="keyword-card">
            <span className="keyword-text">项目交接</span>
            <span className="keyword-effect">需要把上下文发给别人？AI 帮你打包</span>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="help-section">
        <div className="step-header">
          <span className="step-number">3</span>
          <h3 className="help-section-title">用面板管理内容</h3>
        </div>
        <p className="help-desc">顶部的 Tab 切换不同功能，都是帮你管理上下文的：</p>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <div className="feature-body">
              <strong>章节</strong>
              <span>看项目说明的各个部分，可以直接编辑</span>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✅</span>
            <div className="feature-body">
              <strong>待办</strong>
              <span>点一下就能勾选完成，也能新增</span>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📝</span>
            <div className="feature-body">
              <strong>日志</strong>
              <span>填个表就能记录"今天改了什么"</span>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔀</span>
            <div className="feature-body">
              <strong>对比</strong>
              <span>看看 AI 或你自己改了哪些内容</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom tips */}
      <section className="help-section">
        <div className="step-header">
          <span className="step-number">💡</span>
          <h3 className="help-section-title">小贴士</h3>
        </div>
        <div className="tips-box">
          <p>底部的数字（如 <strong>2.1k tokens</strong>）表示这个文件有多"重"。</p>
          <p>数字越大，AI 读它消耗越多。绿色好，黄色一般，红色建议精简。</p>
          <p>点底部 <strong>⚡ 精简版</strong> 可以生成一个轻量版，省 70% token。</p>
        </div>
      </section>
    </div>
  );
}
