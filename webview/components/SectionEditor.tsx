import React, { useState, useRef, useEffect } from 'react';
import type { Section } from '../../src/types';

interface Props {
  section: Section;
  onSave: (sectionId: string, content: string) => void;
}

export function SectionEditor({ section, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(section.content);
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(section.content);
    setEditing(false);
    setDirty(false);
  }, [section.id, section.content]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [editing]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function handleSave() {
    onSave(section.id, content);
    setEditing(false);
    setDirty(false);
  }

  function handleCancel() {
    setContent(section.content);
    setEditing(false);
    setDirty(false);
  }

  return (
    <div className="section-editor">
      <div className="section-header">
        <h3 className="section-title">{section.title}</h3>
        <div className="section-actions">
          {!editing ? (
            <button className="btn btn-sm" onClick={() => setEditing(true)}>
              编辑
            </button>
          ) : (
            <>
              <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={!dirty}>
                保存
              </button>
              <button className="btn btn-sm" onClick={handleCancel}>
                取消
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          className="section-textarea"
          value={content}
          onChange={e => {
            setContent(e.target.value);
            setDirty(e.target.value !== section.content);
            autoResize(e.target);
          }}
          spellCheck={false}
        />
      ) : (
        <div className="section-content">
          <pre>{section.content || '（空章节）'}</pre>
        </div>
      )}
    </div>
  );
}
