export interface TokenStats {
  total: number;
  lines: number;
  chars: number;
}

export interface ProjectContext {
  title: string;
  lastUpdated: string;
  sections: Section[];
  rawContent: string;
  tokens: TokenStats;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  lineStart: number;
  lineEnd: number;
  tokens: number;
}

export interface TodoItem {
  text: string;
  done: boolean;
  line: number;
}

export interface LogEntry {
  date: string;
  change: string;
  scope: string;
}

export type MessageToWebview =
  | { type: 'contextLoaded'; data: ProjectContext }
  | { type: 'contextUpdated'; data: ProjectContext }
  | { type: 'fileChanged'; file: string }
  | { type: 'error'; message: string }
  | { type: 'diffResult'; oldContent: string; newContent: string }
  | { type: 'saving'; saving: boolean };

export type MessageFromWebview =
  | { type: 'ready' }
  | { type: 'saveSection'; sectionId: string; content: string }
  | { type: 'addTodo'; text: string }
  | { type: 'toggleTodo'; line: number }
  | { type: 'addLogEntry'; entry: LogEntry }
  | { type: 'requestDiff' }
  | { type: 'runCommand'; command: string }
  | { type: 'requestContext' }
  | { type: 'generateMini' }
  | { type: 'configureRules' };
