import * as vscode from 'vscode';
import * as path from 'path';

export class DiffManager {
  private snapshotDir: string;

  constructor(private context: vscode.ExtensionContext) {
    this.snapshotDir = path.join(context.globalStorageUri.fsPath, 'snapshots');
  }

  async saveSnapshot(uri: vscode.Uri): Promise<string> {
    const snapshotDirUri = vscode.Uri.file(this.snapshotDir);
    try {
      await vscode.workspace.fs.createDirectory(snapshotDirUri);
    } catch {
      // already exists
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `context-${timestamp}.md`;
    const snapshotUri = vscode.Uri.file(path.join(this.snapshotDir, snapshotName));

    const content = await vscode.workspace.fs.readFile(uri);
    await vscode.workspace.fs.writeFile(snapshotUri, content);

    return snapshotUri.fsPath;
  }

  async getLatestSnapshot(): Promise<vscode.Uri | undefined> {
    const snapshotDirUri = vscode.Uri.file(this.snapshotDir);
    try {
      const entries = await vscode.workspace.fs.readDirectory(snapshotDirUri);
      const mdFiles = entries
        .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
        .map(([name]) => name)
        .sort()
        .reverse();

      if (mdFiles.length === 0) { return undefined; }
      return vscode.Uri.file(path.join(this.snapshotDir, mdFiles[0]));
    } catch {
      return undefined;
    }
  }

  async showDiff(currentUri: vscode.Uri): Promise<void> {
    const snapshot = await this.getLatestSnapshot();
    if (!snapshot) {
      await this.saveSnapshot(currentUri);
      vscode.window.showInformationMessage('已保存首个快照，下次可进行对比');
      return;
    }

    await vscode.commands.executeCommand(
      'vscode.diff',
      snapshot,
      currentUri,
      '上次快照 ↔ 当前版本'
    );
  }

  async getDiffContent(currentUri: vscode.Uri): Promise<{ oldContent: string; newContent: string } | null> {
    const snapshot = await this.getLatestSnapshot();
    if (!snapshot) { return null; }

    const oldBytes = await vscode.workspace.fs.readFile(snapshot);
    const newBytes = await vscode.workspace.fs.readFile(currentUri);

    return {
      oldContent: Buffer.from(oldBytes).toString('utf-8'),
      newContent: Buffer.from(newBytes).toString('utf-8'),
    };
  }
}
