import * as vscode from 'vscode';

/**
 * 从 README.md 文件中提取第一个 # 标题
 * @param readmeUri README.md 文件的 URI
 * @returns 标题文本，如果没有找到则返回 null
 */
export async function extractFirstHeading(readmeUri: vscode.Uri): Promise<string | null> {
    try {
        // 读取文件内容
        const fileData = await vscode.workspace.fs.readFile(readmeUri);
        const content = Buffer.from(fileData).toString('utf-8');

        // 使用正则表达式匹配第一个 # 标题
        // 匹配格式: # 标题 或 #标题（# 后可能有空格）
        const headingMatch = content.match(/^#\s+(.+)$/m);

        if (headingMatch && headingMatch[1]) {
            // 返回标题文本，去除首尾空格
            const heading = headingMatch[1].trim();
            return heading;
        }

        return null;
    } catch (error) {
        // 文件不存在、权限问题等错误，静默处理
        console.error(`Dir Scrope: Error reading ${readmeUri.fsPath}:`, error);
        return null;
    }
}

/**
 * 检查目录下是否存在 README.md 文件（不区分大小写）
 * @param dirUri 目录的 URI
 * @returns README.md 文件的 URI，如果不存在则返回 null
 */
export async function findReadmeFile(dirUri: vscode.Uri): Promise<vscode.Uri | null> {
    try {
        // 尝试读取目录内容
        const entries = await vscode.workspace.fs.readDirectory(dirUri);

        // 查找 README.md 文件（不区分大小写）
        for (const [name, type] of entries) {
            if (type === vscode.FileType.File) {
                const lowerName = name.toLowerCase();
                if (lowerName === 'readme.md') {
                    const readmeUri = vscode.Uri.joinPath(dirUri, name);
                    return readmeUri;
                }
            }
        }

        return null;
    } catch (error) {
        // 目录不存在或无法访问
        console.error(`Dir Scrope: Error reading directory ${dirUri.fsPath}:`, error);
        return null;
    }
}

