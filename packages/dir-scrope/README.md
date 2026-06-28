# Dir Scrope

一个 VS Code/Cursor 扩展，在文件浏览器中为目录添加备注信息。备注信息来自该目录下 README.md 文件的第一个 `#` 标题，显示在目录名称的右侧。

## 功能特性

- 📝 自动从 README.md 提取第一个标题作为目录备注
- 🚀 高性能缓存机制，避免重复读取文件
- ⚡ 延迟加载，只在需要时解析 README.md
- 🔍 智能排除规则，自动跳过 `node_modules`、`.git` 等目录
- 🔄 实时更新，当 README.md 文件变化时自动刷新

## 安装方法

### 从 VS Code Marketplace 安装（推荐）

1. 打开 VS Code/Cursor
2. 按 `Cmd+Shift+X` (Mac) 或 `Ctrl+Shift+X` (Windows/Linux) 打开扩展面板
3. 搜索 "Dir Scrope"
4. 点击 "Install" 安装

### 从 .vsix 文件安装

1. 下载 `.vsix` 文件
2. 在 VS Code/Cursor 中按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
3. 输入 "Extensions: Install from VSIX..."
4. 选择下载的 `.vsix` 文件

### 从源码安装

1. 克隆或下载此仓库
2. 在 `packages/dir-scrope` 目录下运行：
   ```bash
   npm install
   npm run compile
   ```
3. 在 VS Code/Cursor 中按 `F5` 启动扩展开发主机进行测试
4. 或使用 `npm run package` 打包为 `.vsix` 文件进行安装

## 使用方法

安装扩展后，扩展会自动激活。当你在文件浏览器中浏览目录时，如果目录下有 `README.md` 文件，扩展会自动提取第一个 `#` 标题并显示在目录名称的右侧。

### 示例

假设你有一个目录结构：

```
project/
├── README.md          # 内容: # 项目说明
├── src/
│   └── README.md      # 内容: # 源代码目录
└── docs/
    └── README.md      # 内容: # 文档目录
```

在文件浏览器中，你会看到：

```
📁 project (项目说明)
📁 src (源代码目录)
📁 docs (文档目录)
```

## 配置选项

扩展提供以下配置选项（在 `settings.json` 中配置）：

### `dirScrope.excludePatterns`

排除的目录模式，使用 glob 模式。默认值：

```json
{
  "dirScrope.excludePatterns": [
    "**/node_modules/**",
    "**/.git/**",
    "**/.vscode/**",
    "**/.cursor/**",
    "**/dist/**",
    "**/build/**",
    "**/.tmp/**",
    "**/temp/**",
    "**/tmp/**"
  ]
}
```

### `dirScrope.cacheSize`

缓存大小限制。默认值：`1000`

```json
{
  "dirScrope.cacheSize": 1000
}
```

## 性能优化

扩展实现了多种性能优化策略：

1. **LRU 缓存**：缓存已解析的 README.md 标题，避免重复读取
2. **延迟加载**：只在文件浏览器展开目录时才解析 README.md
3. **防抖处理**：合并短时间内多次文件系统事件
4. **异步处理**：使用超时机制和 AbortController 避免长时间等待
5. **智能排除**：早期排除不需要的目录，减少不必要的处理

## 开发

### 项目结构

```
packages/dir-scrope/
├── src/
│   ├── extension.ts              # 扩展入口
│   ├── readmeParser.ts           # README.md 解析器
│   └── fileDecorationProvider.ts # 文件装饰提供者
├── package.json                  # 扩展清单
├── tsconfig.json                 # TypeScript 配置
└── README.md                     # 说明文档
```

### 构建

```bash
npm run compile
```

### 监听模式

```bash
npm run watch
```

## 发布扩展

### 准备工作

1. **安装 vsce 工具**：
   ```bash
   npm install -g @vscode/vsce
   ```

2. **更新 package.json**：
   - 设置 `publisher` 字段（你的发布者名称）
   - 设置 `repository` 字段（GitHub 仓库地址）
   - 更新 `version` 字段（遵循语义化版本）

3. **创建 Personal Access Token**：
   - 访问 https://dev.azure.com
   - 登录你的 Microsoft 账户
   - 进入 User Settings > Personal Access Tokens
   - 创建新 token，设置：
     - Name: "VS Code Extension Publishing"
     - Organization: "All accessible organizations"
     - Scopes: "Full access" 或至少 "Marketplace (Manage)"

### 发布步骤

1. **编译扩展**：
   ```bash
   npm run compile
   ```

2. **打包扩展**（可选，用于本地测试）：
   ```bash
   npm run package
   ```
   这会生成 `dir-scrope-0.0.1.vsix` 文件

3. **发布到 Marketplace**：
   ```bash
   vsce publish
   ```
   首次发布会提示输入 Personal Access Token

4. **更新版本**（后续发布）：
   ```bash
   # 更新 package.json 中的 version
   # 然后运行
   vsce publish
   ```

### 发布选项

- `vsce publish <version>` - 发布指定版本
- `vsce publish minor` - 发布次要版本更新
- `vsce publish major` - 发布主要版本更新
- `vsce publish patch` - 发布补丁版本更新

### 验证发布

发布成功后，扩展会在几分钟内出现在 VS Code Marketplace：
https://marketplace.visualstudio.com/vscode

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

