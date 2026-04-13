import * as vscode from 'vscode';
import { ContextParser } from '../contextParser';
import { ContextWriter } from '../contextWriter';
import { DiffManager } from '../diffManager';
import type { MessageFromWebview, MessageToWebview, ProjectContext } from '../types';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private currentContext?: ProjectContext;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly parser: ContextParser,
    private readonly writer: ContextWriter,
    private readonly diffManager: DiffManager
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: MessageFromWebview) => {
      this.handleMessage(msg);
    });
  }

  postMessage(msg: MessageToWebview) {
    this.view?.webview.postMessage(msg);
  }

  async refresh() {
    const ctx = await this.loadContext();
    if (ctx) {
      this.postMessage({ type: 'contextUpdated', data: ctx });
    }
  }

  private async loadContext(): Promise<ProjectContext | undefined> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) { return undefined; }

    const contextUri = vscode.Uri.joinPath(workspaceFolder.uri, 'PROJECT_CONTEXT.md');
    try {
      const ctx = await this.parser.parse(contextUri);
      this.currentContext = ctx;
      return ctx;
    } catch {
      return undefined;
    }
  }

  private getContextUri(): vscode.Uri | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) { return undefined; }
    return vscode.Uri.joinPath(workspaceFolder.uri, 'PROJECT_CONTEXT.md');
  }

  private async handleMessage(msg: MessageFromWebview) {
    switch (msg.type) {
      case 'ready':
      case 'requestContext': {
        const ctx = await this.loadContext();
        if (ctx) {
          this.postMessage({ type: 'contextLoaded', data: ctx });
        } else {
          this.postMessage({
            type: 'error',
            message: '未找到 PROJECT_CONTEXT.md，请先运行"生成项目上下文"命令',
          });
        }
        break;
      }

      case 'saveSection': {
        const uri = this.getContextUri();
        if (!uri || !this.currentContext) { return; }
        try {
          await this.diffManager.saveSnapshot(uri);
          const updated = await this.writer.writeSection(
            uri, this.currentContext, msg.sectionId, msg.content
          );
          this.currentContext = this.parser.parseContent(updated);
          this.postMessage({ type: 'contextUpdated', data: this.currentContext });
        } catch (e: any) {
          this.postMessage({ type: 'error', message: e.message });
        }
        break;
      }

      case 'addTodo': {
        const uri = this.getContextUri();
        if (!uri || !this.currentContext) { return; }
        try {
          const updated = await this.writer.addTodo(uri, this.currentContext, msg.text);
          this.currentContext = this.parser.parseContent(updated);
          this.postMessage({ type: 'contextUpdated', data: this.currentContext });
        } catch (e: any) {
          this.postMessage({ type: 'error', message: e.message });
        }
        break;
      }

      case 'toggleTodo': {
        const uri = this.getContextUri();
        if (!uri || !this.currentContext) { return; }
        try {
          const updated = await this.writer.toggleTodo(
            uri, this.currentContext.rawContent, msg.line
          );
          this.currentContext = this.parser.parseContent(updated);
          this.postMessage({ type: 'contextUpdated', data: this.currentContext });
        } catch (e: any) {
          this.postMessage({ type: 'error', message: e.message });
        }
        break;
      }

      case 'addLogEntry': {
        const uri = this.getContextUri();
        if (!uri || !this.currentContext) { return; }
        try {
          const updated = await this.writer.addLogEntry(
            uri, this.currentContext, msg.entry
          );
          this.currentContext = this.parser.parseContent(updated);
          this.postMessage({ type: 'contextUpdated', data: this.currentContext });
        } catch (e: any) {
          this.postMessage({ type: 'error', message: e.message });
        }
        break;
      }

      case 'requestDiff': {
        const uri = this.getContextUri();
        if (!uri) { return; }
        const diff = await this.diffManager.getDiffContent(uri);
        if (diff) {
          this.postMessage({ type: 'diffResult', ...diff });
        }
        break;
      }

      case 'runCommand': {
        vscode.commands.executeCommand(msg.command);
        break;
      }

      case 'generateMini': {
        vscode.commands.executeCommand('contextManager.generateMini');
        break;
      }

      case 'configureRules': {
        vscode.commands.executeCommand('contextManager.configureRules');
        break;
      }
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js')
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src 'nonce-${nonce}';
      font-src ${webview.cspSource};">
  <link href="${cssUri}" rel="stylesheet" />
  <title>Context Manager</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
