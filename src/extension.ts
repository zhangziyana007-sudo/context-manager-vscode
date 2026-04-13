import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';
import { ContextParser } from './contextParser';
import { ContextWriter } from './contextWriter';
import { ContextGenerator } from './contextGenerator';
import { MiniGenerator } from './miniGenerator';
import { ConfigGenerator } from './configGenerator';
import { FileWatcher } from './fileWatcher';
import { DiffManager } from './diffManager';
import { formatTokenCount } from './tokenEstimator';

let fileWatcher: FileWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  const parser = new ContextParser();
  const writer = new ContextWriter();
  const generator = new ContextGenerator();
  const miniGenerator = new MiniGenerator();
  const configGenerator = new ConfigGenerator();
  const diffManager = new DiffManager(context);

  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    parser,
    writer,
    diffManager
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'contextManager.sidebar',
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  fileWatcher = new FileWatcher(sidebarProvider);
  context.subscriptions.push(fileWatcher);

  context.subscriptions.push(
    vscode.commands.registerCommand('contextManager.generate', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
      }
      try {
        await generator.generate(workspaceFolder.uri.fsPath);
        vscode.window.showInformationMessage('PROJECT_CONTEXT.md 已生成');
        sidebarProvider.refresh();
      } catch (e: any) {
        vscode.window.showErrorMessage(`生成失败: ${e.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('contextManager.update', async () => {
      sidebarProvider.refresh();
      vscode.window.showInformationMessage('项目上下文已刷新');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('contextManager.saveProgress', async () => {
      sidebarProvider.postMessage({ type: 'saving', saving: true });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('contextManager.showDiff', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) { return; }
      const contextPath = vscode.Uri.joinPath(workspaceFolder.uri, 'PROJECT_CONTEXT.md');
      try {
        await diffManager.showDiff(contextPath);
      } catch (e: any) {
        vscode.window.showErrorMessage(`Diff 失败: ${e.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('contextManager.openFile', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) { return; }
      const contextPath = vscode.Uri.joinPath(workspaceFolder.uri, 'PROJECT_CONTEXT.md');
      try {
        const doc = await vscode.workspace.openTextDocument(contextPath);
        await vscode.window.showTextDocument(doc);
      } catch {
        vscode.window.showWarningMessage('PROJECT_CONTEXT.md 不存在，请先生成');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('contextManager.generateMini', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
      }
      try {
        const result = await miniGenerator.generate(workspaceFolder.uri.fsPath);
        vscode.window.showInformationMessage(
          `精简版已生成（${formatTokenCount(result.tokens)} tokens），适合注入 Cursor Rule`
        );
      } catch (e: any) {
        vscode.window.showErrorMessage(`生成精简版失败: ${e.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('contextManager.configureRules', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
      }
      try {
        const created = await configGenerator.generateAll(workspaceFolder.uri.fsPath);
        if (created.length === 0) {
          vscode.window.showInformationMessage('所有配置文件已是最新');
        } else {
          vscode.window.showInformationMessage(
            `已生成 ${created.length} 个配置文件：${created.join(', ')}`
          );
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(`配置生成失败: ${e.message}`);
      }
    })
  );
}

export function deactivate() {
  fileWatcher?.dispose();
}
