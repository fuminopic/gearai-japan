# 项目全局地图使用说明

## 在 Obsidian 中打开

在 Obsidian 中将本仓库作为 Vault 打开，然后在文件浏览器中打开 [`YAMAJITAKU-project-map.canvas`](YAMAJITAKU-project-map.canvas)。Canvas 节点可拖动、编辑和折叠查看；完成视觉调整后保留 JSON Canvas 格式并提交到仓库。

## 何时更新地图

以下全局关系变化时，应更新受影响的节点和箭头：

- 代码托管、默认分支、Web 域名或部署平台变化。
- iOS 打包、测试、审核或发布链路变化。
- Supabase、身份认证、数据存储或数据发布边界变化。
- 产品形态、核心用户流程或运行时 AI 集成变化。
- 技术栈、平台关系或核心架构变化。
- 项目负责人的固定检查项、授权边界或回退路径变化。

普通 UI 微调、单页文案、独立 Bug 修复、测试补充或不会改变上述全局关系的内部重构，不需要更新地图或技术栈文档。

## Codex 维护规则

Canvas 用于理解全局关系；[`tech-stack.md`](tech-stack.md) 保存技术名称、版本、用途和配置位置等详细信息。Codex 更新时只修改受影响的节点、边和对应说明；不应为了局部变化重做整张画布、重排无关模块或改写无关关系。更新前先只读核对实际配置、源码和权威文档；更新后验证 JSON、唯一 ID、文件节点和 Markdown 链接。

## 权威边界

Canvas 用于快速理解全局，不替代正式规则文档。权威信息仍以 [`../AGENTS.md`](../AGENTS.md)、[`index.md`](index.md)、[`project-rules.md`](project-rules.md) 及实际源码和配置为准。涉及 push、部署、原生上传、Supabase schema 或生产数据时，地图展示的是生效路径，不构成操作授权。
