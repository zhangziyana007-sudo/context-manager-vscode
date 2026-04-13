import React, { useState } from 'react';
import type { ProjectContext, TodoItem } from '../../src/types';

export type WorkMode = 'none' | 'feature' | 'bugfix';

interface ModeOption {
  id: WorkMode;
  icon: string;
  title: string;
  subtitle: string;
  tips: string[];
  aiPrompts: string[];
}

const MODES: ModeOption[] = [
  {
    id: 'feature',
    icon: '🚀',
    title: '开发新功能',
    subtitle: '今天要写新代码',
    tips: [
      '先在「待办」Tab 确认要做的功能点',
      '开始前检查「章节」中的架构说明',
      '完成后在「日志」Tab 记录一笔',
      '对 AI 说功能需求，它已了解你的项目',
    ],
    aiPrompts: [
      '帮我实现 [功能名称]',
      '设计一下 [模块] 的架构',
      '生成 [组件] 的代码框架',
    ],
  },
  {
    id: 'bugfix',
    icon: '🔧',
    title: '维护 / 解 Bug',
    subtitle: '今天要修问题',
    tips: [
      '先在「待办」Tab 看看已知的 Bug',
      '检查「对比」Tab 看最近改了什么（可能引入了 Bug）',
      '修完后在「日志」Tab 记录修复了什么',
      '对 AI 描述 Bug 现象，它能帮你定位',
    ],
    aiPrompts: [
      '帮我排查这个错误：[错误信息]',
      '这段代码为什么会 [异常行为]？',
      '帮我优化 [模块] 的性能',
    ],
  },
];

interface Props {
  context: ProjectContext;
  currentMode: WorkMode;
  onSelectMode: (mode: WorkMode) => void;
  onSwitchToTodos: () => void;
  onSwitchToLog: () => void;
  onSwitchToDiff: () => void;
}

function parseTodos(content: string): TodoItem[] {
  const items: TodoItem[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^- \[([ xX])\]\s+(.*)/);
    if (m) { items.push({ done: m[1] !== ' ', text: m[2].trim(), line: i }); }
  }
  return items;
}

export function DailyMode({ context, currentMode, onSelectMode, onSwitchToTodos, onSwitchToLog, onSwitchToDiff }: Props) {
  const statusSection = context.sections.find(s => s.id === 'status');
  const todos = statusSection ? parseTodos(statusSection.content) : [];
  const pending = todos.filter(t => !t.done);

  if (currentMode === 'none') {
    return (
      <div className="daily-mode-select">
        <div className="daily-greeting">
          <span className="daily-hello">👋 今天做什么？</span>
          {pending.length > 0 && (
            <span className="daily-pending">你有 {pending.length} 个待办</span>
          )}
        </div>

        <div className="mode-cards">
          {MODES.map(mode => (
            <button
              key={mode.id}
              className="mode-card"
              onClick={() => onSelectMode(mode.id)}
            >
              <span className="mode-card-icon">{mode.icon}</span>
              <div className="mode-card-body">
                <strong>{mode.title}</strong>
                <span>{mode.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const mode = MODES.find(m => m.id === currentMode)!;

  return (
    <div className="daily-mode-active">
      <div className="daily-active-header">
        <div className="daily-active-title">
          <span>{mode.icon}</span>
          <strong>{mode.title}</strong>
        </div>
        <button className="daily-switch" onClick={() => onSelectMode('none')}>
          切换
        </button>
      </div>

      {pending.length > 0 && (
        <div className="daily-todos">
          <span className="daily-todos-label">未完成（{pending.length}）</span>
          <ul className="daily-todos-list">
            {pending.slice(0, 4).map((t, i) => (
              <li key={i}>{t.text}</li>
            ))}
            {pending.length > 4 && (
              <li className="daily-todos-more">还有 {pending.length - 4} 项...</li>
            )}
          </ul>
          <button className="btn btn-small" onClick={onSwitchToTodos}>管理待办 →</button>
        </div>
      )}

      <div className="daily-tips">
        <span className="daily-tips-label">今日建议</span>
        {mode.tips.map((tip, i) => (
          <div key={i} className="daily-tip-item">
            <span className="daily-tip-num">{i + 1}</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <div className="daily-prompts">
        <span className="daily-prompts-label">试试对 AI 说</span>
        {mode.aiPrompts.map((prompt, i) => (
          <code key={i} className="daily-prompt">{prompt}</code>
        ))}
      </div>

      <div className="daily-shortcuts">
        <button className="btn btn-small" onClick={onSwitchToLog}>📝 记录日志</button>
        <button className="btn btn-small" onClick={onSwitchToDiff}>🔀 查看变更</button>
      </div>
    </div>
  );
}
