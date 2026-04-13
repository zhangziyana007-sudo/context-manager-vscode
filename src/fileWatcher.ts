import * as vscode from 'vscode';
import type { SidebarProvider } from './providers/sidebarProvider';

export class FileWatcher implements vscode.Disposable {
  private watchers: vscode.FileSystemWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private sidebarProvider: SidebarProvider) {
    this.setupWatchers();
  }

  private setupWatchers() {
    const contextWatcher = vscode.workspace.createFileSystemWatcher(
      '**/PROJECT_CONTEXT.md'
    );
    contextWatcher.onDidChange(() => this.onContextFileChanged());
    contextWatcher.onDidCreate(() => this.onContextFileChanged());
    contextWatcher.onDidDelete(() => this.onContextFileDeleted());
    this.watchers.push(contextWatcher);

    const structureWatcher = vscode.workspace.createFileSystemWatcher(
      '**/{package.json,requirements.txt,go.mod,Cargo.toml}'
    );
    structureWatcher.onDidCreate(uri => this.onStructureChanged(uri));
    structureWatcher.onDidDelete(uri => this.onStructureChanged(uri));
    this.watchers.push(structureWatcher);

    const folderWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    folderWatcher.onDidCreate(uri => this.onFileCreatedOrDeleted(uri));
    folderWatcher.onDidDelete(uri => this.onFileCreatedOrDeleted(uri));
    this.watchers.push(folderWatcher);
  }

  private onContextFileChanged() {
    this.debounce(() => {
      this.sidebarProvider.refresh();
    }, 500);
  }

  private onContextFileDeleted() {
    this.sidebarProvider.postMessage({
      type: 'error',
      message: 'PROJECT_CONTEXT.md 已被删除',
    });
  }

  private onStructureChanged(uri: vscode.Uri) {
    this.debounce(() => {
      this.sidebarProvider.postMessage({
        type: 'fileChanged',
        file: uri.fsPath,
      });
      vscode.window.showInformationMessage(
        '项目结构已变更，建议更新上下文',
        '更新'
      ).then(choice => {
        if (choice === '更新') {
          vscode.commands.executeCommand('contextManager.update');
        }
      });
    }, 2000);
  }

  private onFileCreatedOrDeleted(_uri: vscode.Uri) {
    this.debounce(() => {
      this.sidebarProvider.postMessage({
        type: 'fileChanged',
        file: _uri.fsPath,
      });
    }, 3000);
  }

  private debounce(fn: () => void, ms: number) {
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); }
    this.debounceTimer = setTimeout(fn, ms);
  }

  dispose() {
    for (const w of this.watchers) { w.dispose(); }
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); }
  }
}
