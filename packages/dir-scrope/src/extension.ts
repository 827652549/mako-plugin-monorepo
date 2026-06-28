import * as vscode from 'vscode';
import { DirScropeFileDecorationProvider } from './fileDecorationProvider';

let decorationProvider: DirScropeFileDecorationProvider;
let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Dir Scrope: Starting activation...');

    // 创建装饰提供者
    try {
        decorationProvider = new DirScropeFileDecorationProvider();
        console.log('✅ Dir Scrope: Decoration provider created');
    } catch (error) {
        console.error('❌ Dir Scrope: Failed to create provider:', error);
        vscode.window.showErrorMessage(`Dir Scrope: Failed to create provider - ${error}`);
        return;
    }

    // 注册文件装饰提供者
    try {
        const decorationProviderDisposable = vscode.window.registerFileDecorationProvider(decorationProvider);
        context.subscriptions.push(decorationProviderDisposable);
        console.log('✅ Dir Scrope: Provider registered');
    } catch (error) {
        console.error('❌ Dir Scrope: Failed to register provider:', error);
        vscode.window.showErrorMessage(`Dir Scrope: Failed to register - ${error}`);
        return;
    }

    // 显示激活通知
    vscode.window.showInformationMessage('Dir Scrope 已激活！检查文件浏览器中的目录装饰。');

    // 测试并强制刷新
    setTimeout(async () => {
        console.log('🔍 Testing...');

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const root = vscode.workspace.workspaceFolders[0].uri;
            const testUri = vscode.Uri.joinPath(root, 'test-plugin');

            try {
                const decoration = await decorationProvider.provideFileDecoration(
                    testUri,
                    new vscode.CancellationTokenSource().token
                );

                if (decoration) {
                    console.log(`✅ Decoration: ${decoration.tooltip}`);
                    vscode.window.showInformationMessage(`找到装饰: ${decoration.tooltip}`);

                    // 强制刷新多次以确保显示
                    decorationProvider.refresh([testUri]);
                    setTimeout(() => decorationProvider.refresh(), 500);
                    setTimeout(() => decorationProvider.refresh(), 1000);
                } else {
                    console.log('❌ No decoration');
                    vscode.window.showWarningMessage('未找到装饰');
                }
            } catch (error) {
                console.error('❌ Error:', error);
                vscode.window.showErrorMessage(`错误: ${error}`);
            }
        }
    }, 1000);

    // 监听 README.md 文件变化
    const readmeWatcher = vscode.workspace.createFileSystemWatcher('**/README.md');
    
    readmeWatcher.onDidCreate(async (uri) => {
        // README.md 被创建，清除父目录缓存并刷新
        const parentUri = vscode.Uri.joinPath(uri, '..');
        decorationProvider.clearCache(parentUri);
        decorationProvider.refresh([parentUri]);
    });

    readmeWatcher.onDidChange(async (uri) => {
        // README.md 被修改，清除父目录缓存并刷新
        const parentUri = vscode.Uri.joinPath(uri, '..');
        decorationProvider.clearCache(parentUri);
        decorationProvider.refresh([parentUri]);
    });

    readmeWatcher.onDidDelete(async (uri) => {
        // README.md 被删除，清除父目录缓存并刷新
        const parentUri = vscode.Uri.joinPath(uri, '..');
        decorationProvider.clearCache(parentUri);
        decorationProvider.refresh([parentUri]);
    });

    context.subscriptions.push(readmeWatcher);

    // 监听目录变化（重命名、删除等）
    const dirWatcher = vscode.workspace.createFileSystemWatcher('**/');
    
    dirWatcher.onDidDelete(async (uri) => {
        // 目录被删除，清除缓存
        decorationProvider.clearCache(uri);
    });

    context.subscriptions.push(dirWatcher);

    // 监听配置变化
    const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('dirScrope')) {
            // 配置变化，清除所有缓存并刷新
            decorationProvider.clearCache();
            decorationProvider.refresh();
        }
    });

    context.subscriptions.push(configWatcher);

    // 监听工作区文件夹变化
    const workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders(() => {
        // 工作区变化，清除所有缓存并刷新
        decorationProvider.clearCache();
        decorationProvider.refresh();
    });

    context.subscriptions.push(workspaceWatcher);

    // 注册刷新命令
    const refreshCommand = vscode.commands.registerCommand('dirScrope.refresh', () => {
        console.log('Dir Scrope: Manual refresh triggered');
        decorationProvider.clearCache();
        decorationProvider.refresh();
        vscode.window.showInformationMessage('Dir Scrope: Refreshed directory notes');
    });
    context.subscriptions.push(refreshCommand);

    // 添加调试命令
    const debugCommand = vscode.commands.registerCommand('dirScrope.debug', () => {
        console.log('Dir Scrope: Debug command triggered');

        // 测试当前工作区根目录
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const rootUri = vscode.workspace.workspaceFolders[0].uri;
            console.log(`Dir Scrope: Testing decoration for workspace root: ${rootUri.fsPath}`);

            // 手动调用装饰提供者
            const decoration = decorationProvider.provideFileDecoration(rootUri, new vscode.CancellationTokenSource().token);

            // 处理可能是Promise的情况
            if (decoration && typeof (decoration as any).then === 'function') {
                (decoration as Promise<vscode.FileDecoration | undefined>)
                    .then((result: vscode.FileDecoration | undefined) => {
                        if (result) {
                            console.log(`Dir Scrope: ✅ Root decoration: badge="${result.badge}", tooltip="${result.tooltip}"`);
                            vscode.window.showInformationMessage(`Decoration found: ${result.badge}`);
                        } else {
                            console.log('Dir Scrope: ⭕ No decoration for root');
                            vscode.window.showWarningMessage('No decoration found for root directory');
                        }
                    })
                    .catch((error: any) => {
                        console.error('Dir Scrope: ❌ Error in debug decoration:', error);
                        vscode.window.showErrorMessage(`Decoration error: ${error}`);
                    });
            } else if (decoration) {
                const syncDecoration = decoration as vscode.FileDecoration;
                console.log(`Dir Scrope: ✅ Root decoration (sync): badge="${syncDecoration.badge}", tooltip="${syncDecoration.tooltip}"`);
                vscode.window.showInformationMessage(`Decoration found: ${syncDecoration.badge}`);
            } else {
                console.log('Dir Scrope: ⭕ No decoration for root (sync)');
                vscode.window.showWarningMessage('No decoration found for root directory');
            }

            // 强制刷新
            decorationProvider.refresh([rootUri]);
        }
    });
    context.subscriptions.push(debugCommand);

    // 添加清除缓存命令
    const clearCacheCommand = vscode.commands.registerCommand('dirScrope.clearCache', () => {
        console.log('Dir Scrope: Clear cache command triggered');
        decorationProvider.clearCache();
        decorationProvider.refresh();
        vscode.window.showInformationMessage('Dir Scrope: Cache cleared and refreshed');
    });
    context.subscriptions.push(clearCacheCommand);

    // 添加强制刷新命令
    const forceRefreshCommand = vscode.commands.registerCommand('dirScrope.forceRefresh', async () => {
        console.log('🔄 Force refresh triggered');

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const root = vscode.workspace.workspaceFolders[0].uri;

            // 清除缓存
            decorationProvider.clearCache();

            // 测试 test-plugin 目录
            const testUri = vscode.Uri.joinPath(root, 'test-plugin');
            const decoration = await decorationProvider.provideFileDecoration(
                testUri,
                new vscode.CancellationTokenSource().token
            );

            if (decoration) {
                vscode.window.showInformationMessage(`强制刷新成功！装饰: ${decoration.tooltip}`);
            } else {
                vscode.window.showWarningMessage('强制刷新：未找到装饰');
            }

            // 多次刷新
            for (let i = 0; i < 3; i++) {
                setTimeout(() => decorationProvider.refresh([testUri]), i * 300);
            }
        }
    });
    context.subscriptions.push(forceRefreshCommand);

    // 保存所有 disposable
    disposables.push(...context.subscriptions);

    console.log('Dir Scrope extension is now active!');
}

export function deactivate() {
    // 清理资源
    if (decorationProvider) {
        decorationProvider.dispose();
    }
    disposables.forEach(d => d.dispose());
    disposables = [];
}

