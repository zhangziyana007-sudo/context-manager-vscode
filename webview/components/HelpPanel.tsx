import React from 'react';

const SKILL_COMMANDS = [
  {
    category: '生成与更新',
    items: [
      { keyword: '生成项目上下文', desc: 'AI 扫描项目结构，首次生成 PROJECT_CONTEXT.md + Cursor Rules' },
      { keyword: '更新项目记忆', desc: 'AI 重新扫描项目，更新有变化的章节' },
      { keyword: '保存进度', desc: 'AI 仅更新"待办"和"维护日志"，不全量扫描' },
    ],
  },
  {
    category: '了解与交接',
    items: [
      { keyword: '了解项目', desc: 'AI 读取 PROJECT_CONTEXT.md 并口头汇报概况，不修改文件' },
      { keyword: '项目交接', desc: 'AI 生成完整上下文 + 交接摘要文本，可复制到新对话' },
    ],
  },
  {
    category: '其他触发词',
    items: [
      { keyword: '项目地图 / project map', desc: '同"生成项目上下文"' },
      { keyword: '记住项目 / project memory', desc: '同"生成项目上下文"' },
      { keyword: 'context handoff', desc: '同"项目交接"' },
    ],
  },
];

const PANEL_TIPS = [
  { icon: '📋', text: '「章节」Tab — 点击章节查看/编辑内容，右侧数字是 token 消耗' },
  { icon: '✅', text: '「待办」Tab — 勾选/新增 TODO，自动写回 Markdown' },
  { icon: '📝', text: '「日志」Tab — 填表单即可添加维护日志，不用编辑表格' },
  { icon: '🔀', text: '「对比」Tab — 查看上次保存和当前版本的差异' },
  { icon: '⚡', text: '底部「精简版」按钮 — 一键生成省 token 的 MINI 版' },
];

interface Props {
  onConfigureRules: () => void;
}

export function HelpPanel({ onConfigureRules }: Props) {
  return (
    <div className="help-panel">
      <section className="help-section">
        <h3 className="help-section-title">快速配置</h3>
        <p className="help-desc">为当前项目一键生成 Cursor Rules 和 Skill 配置文件：</p>
        <button className="btn btn-primary config-btn" onClick={onConfigureRules}>
          ⚙ 一键配置 Rules & Skill
        </button>
        <div className="config-files">
          <div className="config-file">
            <code>.cursor/rules/project-context.mdc</code>
            <span className="config-file-desc">AI 自动加载的项目速览</span>
          </div>
          <div className="config-file">
            <code>.cursor/rules/context-handoff.mdc</code>
            <span className="config-file-desc">AI 对话间自动接力进度</span>
          </div>
          <div className="config-file">
            <code>.cursor/skills/project-context/SKILL.md</code>
            <span className="config-file-desc">AI 关键词触发的上下文技能</span>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h3 className="help-section-title">对 AI 说这些关键词</h3>
        <p className="help-desc">在 Cursor 对话框中输入以下关键词，AI 会自动执行对应操作：</p>
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
        <h3 className="help-section-title">面板功能速查</h3>
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
          <li>对 AI 说<code>生成项目上下文</code>→ AI 自动生成文件</li>
          <li>在面板「章节」Tab 检查和微调内容</li>
          <li>看底部 token 数，太大就点<code>⚡ 精简版</code></li>
          <li>日常开发中，AI 会自动更新待办和日志</li>
          <li>定期在「对比」Tab 审查 AI 的改动</li>
        </ol>
      </section>
    </div>
  );
}
