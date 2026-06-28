import * as vscode from 'vscode';
import { extractFirstHeading, findReadmeFile } from './readmeParser';

/**
 * LRU 缓存实现
 */
class LRUCache<K, V> {
    private cache: Map<K, V>;
    private maxSize: number;

    constructor(maxSize: number = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        if (this.cache.has(key)) {
            // 将访问的项移到末尾（最近使用）
            const value = this.cache.get(key)!;
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return undefined;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            // 更新现有项
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 删除最旧的项（第一个）
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

/**
 * 文件装饰提供者
 * 在文件浏览器中为目录添加备注信息
 */
export class DirScropeFileDecorationProvider implements vscode.FileDecorationProvider {
    private cache: LRUCache<string, string | null>;
    private disposables: vscode.Disposable[] = [];
    private pendingRequests: Map<string, AbortController> = new Map();
    private debounceTimer: NodeJS.Timeout | undefined;

    constructor() {
        try {
            console.log('Dir Scrope: FileDecorationProvider constructor called');
            const config = vscode.workspace.getConfiguration('dirScrope');
            const cacheSize = config.get<number>('cacheSize', 1000);
            console.log(`Dir Scrope: Cache size: ${cacheSize}`);
            this.cache = new LRUCache<string, string | null>(cacheSize);
            console.log('Dir Scrope: FileDecorationProvider constructor completed');
        } catch (error) {
            console.error('Dir Scrope: Error in FileDecorationProvider constructor:', error);
            console.error('Dir Scrope: Error stack:', error instanceof Error ? error.stack : 'No stack');
            throw error;
        }
    }

    /**
     * 检查路径是否应该被排除
     */
    private shouldExclude(uri: vscode.Uri): boolean {
        const path = uri.fsPath;
        const config = vscode.workspace.getConfiguration('dirScrope');
        const excludePatterns = config.get<string[]>('excludePatterns', []);

        // 检查排除模式
        for (const pattern of excludePatterns) {
            // 简单的 glob 模式匹配
            if (this.matchPattern(path, pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 简单的 glob 模式匹配
     */
    private matchPattern(path: string, pattern: string): boolean {
        // 将 glob 模式转换为正则表达式
        const regexPattern = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');
        
        try {
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(path);
        } catch {
            // 如果正则表达式无效，使用简单的字符串包含检查
            return path.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''));
        }
    }

    /**
     * 提供文件装饰
     */
    provideFileDecoration(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): vscode.FileDecoration | undefined | Promise<vscode.FileDecoration | undefined> {
        const path = uri.fsPath;

        // 立即返回一个 Promise 来处理异步操作
        const result = this.processFileDecoration(uri, token);

        // 添加Promise链调试
        if (result && typeof (result as any).then === 'function') {
            (result as Promise<vscode.FileDecoration | undefined>).then(decoration => {
                if (decoration) {
                    console.log(`✅ Decoration for: ${path}`);
                } else {
                    // 只记录有 README.md 的目录的 "No decoration"
                }
            }).catch(error => {
                console.error(`❌ Error for ${path}:`, error);
            });
        }

        return result;
    }

    /**
     * 实际处理文件装饰的异步方法
     */
    private async processFileDecoration(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): Promise<vscode.FileDecoration | undefined> {
        try {
            const path = uri.fsPath;

            // 只处理文件 URI
            if (uri.scheme !== 'file') {
                return undefined;
            }

            // 检查是否为目录
            let stat: vscode.FileStat;
            try {
                stat = await vscode.workspace.fs.stat(uri);
                if (stat.type !== vscode.FileType.Directory) {
                    return undefined;
                }
            } catch (error) {
                return undefined;
            }

            const uriString = uri.toString();

            // 检查缓存
            const cached = this.cache.get(uriString);
            if (cached !== undefined) {
                if (cached === null) {
                    return undefined;
                }
                const tooltip = cached;
                console.log(`📝 Using cached: ${path}`);
                return new vscode.FileDecoration('📝', tooltip);
            }

            // 创建新的 AbortController
            const controller = new AbortController();
            this.pendingRequests.set(uriString, controller);

            try {
                // 查找 README.md 文件
                const readmeUri = await findReadmeFile(uri);

                if (token.isCancellationRequested || controller.signal.aborted) {
                    return undefined;
                }

                if (!readmeUri) {
                    // 没有 README.md，缓存 null
                    this.cache.set(uriString, null);
                    return undefined;
                }

                // 提取标题
                let heading: string | null = null;
                try {
                    heading = await extractFirstHeading(readmeUri);
                } catch (error) {
                    console.error(`Error extracting heading:`, error);
                    heading = null;
                }

                if (token.isCancellationRequested || controller.signal.aborted) {
                    return undefined;
                }

                // 缓存结果
                this.cache.set(uriString, heading);

                if (heading) {
                    console.log(`📝 Found: ${path} -> "${heading}"`);
                    return new vscode.FileDecoration('📝', heading);
                }

                return undefined;
            } finally {
                this.pendingRequests.delete(uriString);
            }
        } catch (error) {
            console.error(`Fatal error:`, error);
            return undefined;
        }
    }

    /**
     * 刷新装饰（防抖处理）
     */
    refresh(uris?: vscode.Uri[]): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            // 传递特定 URI 或空数组来刷新所有
            const urisToRefresh = (uris && uris.length > 0) ? uris : [];
            this._onDidChangeFileDecorations.fire(urisToRefresh as any);
            console.log('🔄 Refreshed decorations');
        }, 100);
    }

    /**
     * 清除缓存
     */
    clearCache(uri?: vscode.Uri): void {
        if (uri) {
            const uriString = uri.toString();
            this.cache.delete(uriString);
            // 如果是目录，也清除其父目录的缓存（如果 README.md 在该目录下）
            const parentUri = vscode.Uri.joinPath(uri, '..');
            this.cache.delete(parentUri.toString());
        } else {
            this.cache.clear();
        }
    }

    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri[]>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    dispose(): void {
        // 取消所有待处理的请求
        for (const controller of this.pendingRequests.values()) {
            controller.abort();
        }
        this.pendingRequests.clear();

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this._onDidChangeFileDecorations.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}

