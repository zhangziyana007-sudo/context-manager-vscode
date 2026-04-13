import React, { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './hooks/useVSCode';
import { SectionNav } from './components/SectionNav';
import { SectionEditor } from './components/SectionEditor';
import { TodoPanel } from './components/TodoPanel';
import { LogPanel } from './components/LogPanel';
import { DiffPreview } from './components/DiffPreview';
import { HelpPanel } from './components/HelpPanel';
import { ResumeBanner } from './components/ResumeBanner';
import { StatusBar } from './components/StatusBar';
import type { ProjectContext, MessageToWebview, Section, TodoItem } from '../src/types';

type ViewMode = 'sections' | 'todos' | 'log' | 'diff' | 'help';

export function App() {
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('sections');
  const [error, setError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [diffData, setDiffData] = useState<{ oldContent: string; newContent: string } | null>(null);

  const handleMessage = useCallback((msg: MessageToWebview) => {
    switch (msg.type) {
      case 'contextLoaded':
      case 'contextUpdated':
        setContext(msg.data);
        setError('');
        if (!activeSection && msg.data.sections.length > 0) {
          setActiveSection(msg.data.sections[0].id);
        }
        break;
      case 'error':
        setError(msg.message);
        break;
      case 'fileChanged':
        setHasChanges(true);
        break;
      case 'diffResult':
        setDiffData({ oldContent: msg.oldContent, newContent: msg.newContent });
        setViewMode('diff');
        break;
    }
  }, [activeSection]);

  const { postMessage } = useVSCode(handleMessage);

  useEffect(() => {
    postMessage({ type: 'ready' });
  }, [postMessage]);

  const handleSaveSection = useCallback((sectionId: string, content: string) => {
    postMessage({ type: 'saveSection', sectionId, content });
  }, [postMessage]);

  const handleAddTodo = useCallback((text: string) => {
    postMessage({ type: 'addTodo', text });
  }, [postMessage]);

  const handleToggleTodo = useCallback((line: number) => {
    postMessage({ type: 'toggleTodo', line });
  }, [postMessage]);

  const handleAddLogEntry = useCallback((entry: { date: string; change: string; scope: string }) => {
    postMessage({ type: 'addLogEntry', entry });
  }, [postMessage]);

  const handleRequestDiff = useCallback(() => {
    postMessage({ type: 'requestDiff' });
  }, [postMessage]);

  const handleRunCommand = useCallback((command: string) => {
    postMessage({ type: 'runCommand', command });
  }, [postMessage]);

  if (error && !context) {
    return (
      <div className="app-empty">
        <div className="empty-icon">📄</div>
        <p className="empty-text">{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => handleRunCommand('contextManager.generate')}
        >
          生成项目上下文
        </button>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  const currentSection = context.sections.find(s => s.id === activeSection);

  const statusSection = context.sections.find(s => s.id === 'status');
  const todos = statusSection ? parseTodosFromContent(statusSection.content) : [];
  const pendingTodos = todos.filter(t => !t.done);
  const doneTodos = todos.filter(t => t.done);

  return (
    <div className="app">
      <header className="app-header">
        <h2 className="app-title">{context.title || '项目上下文'}</h2>
        <div className="view-tabs">
          <button
            className={`tab ${viewMode === 'sections' ? 'active' : ''}`}
            onClick={() => setViewMode('sections')}
          >
            章节
          </button>
          <button
            className={`tab ${viewMode === 'todos' ? 'active' : ''}`}
            onClick={() => setViewMode('todos')}
          >
            待办
          </button>
          <button
            className={`tab ${viewMode === 'log' ? 'active' : ''}`}
            onClick={() => setViewMode('log')}
          >
            日志
          </button>
          <button
            className={`tab ${viewMode === 'diff' ? 'active' : ''}`}
            onClick={() => { setViewMode('diff'); handleRequestDiff(); }}
          >
            对比
          </button>
          <button
            className={`tab ${viewMode === 'help' ? 'active' : ''}`}
            onClick={() => setViewMode('help')}
          >
            帮助
          </button>
        </div>
      </header>

      <main className="app-main">
        {viewMode === 'sections' && pendingTodos.length > 0 && (
          <ResumeBanner
            pendingCount={pendingTodos.length}
            doneCount={doneTodos.length}
            lastUpdated={context.lastUpdated}
            topPending={pendingTodos.slice(0, 3).map(t => t.text)}
            onViewTodos={() => setViewMode('todos')}
          />
        )}

        {viewMode === 'sections' && (
          <div className="sections-view">
            <SectionNav
              sections={context.sections}
              activeId={activeSection}
              onSelect={setActiveSection}
            />
            {currentSection && (
              <SectionEditor
                key={currentSection.id}
                section={currentSection}
                onSave={handleSaveSection}
              />
            )}
          </div>
        )}

        {viewMode === 'todos' && (
          <TodoPanel
            context={context}
            onToggle={handleToggleTodo}
            onAdd={handleAddTodo}
          />
        )}

        {viewMode === 'log' && (
          <LogPanel
            context={context}
            onAddEntry={handleAddLogEntry}
          />
        )}

        {viewMode === 'diff' && (
          <DiffPreview data={diffData} />
        )}

        {viewMode === 'help' && (
          <HelpPanel
            onConfigureRules={() => postMessage({ type: 'configureRules' })}
            onConfigureTools={(tools) => postMessage({ type: 'configureTools', tools })}
          />
        )}
      </main>

      <StatusBar
        lastUpdated={context.lastUpdated}
        hasChanges={hasChanges}
        tokens={context.tokens}
        onRefresh={() => {
          setHasChanges(false);
          postMessage({ type: 'requestContext' });
        }}
        onGenerateMini={() => postMessage({ type: 'generateMini' })}
      />
    </div>
  );
}

function parseTodosFromContent(content: string): TodoItem[] {
  const items: TodoItem[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^- \[([ xX])\]\s+(.*)/);
    if (match) {
      items.push({ done: match[1] !== ' ', text: match[2].trim(), line: i });
    }
  }
  return items;
}
