# 山支度项目文档索引

状态：**当前权威入口**

最后复核：2026-07-18

本文件说明项目文档的权威关系和读取范围。先读根目录 [`AGENTS.md`](../AGENTS.md)，再根据任务类型只读取本页列出的必要资料。

## 权威顺序

1. 当前任务中负责人明确给出的目标、范围和限制。
2. 根目录 [`AGENTS.md`](../AGENTS.md) 的长期项目规则。
3. 本索引标记为“当前权威”的专题文档。
4. 源码、测试和 migration 所体现的当前实现事实。
5. 标记为“参考资料”或“历史快照”的文档。

当文档与当前实现不一致时，先只读核对源码、测试和 migration，再修正文档。涉及真实业务冲突、安全行为或生产规则且无法判断时，停止并请负责人决定。

状态快照、测试数量、App审核状态、某次是否已push等内容都有时效性，不能成为长期规则。

## 当前权威文档

| 文档 | 权威范围 | 何时读取 |
| --- | --- | --- |
| [`../AGENTS.md`](../AGENTS.md) | 全项目长期安全、授权和工作规则 | 所有任务 |
| [`auth-launch-architecture.md`](auth-launch-architecture.md) | 登录、启动、OAuth、Splash、App新旧版本检测 | 仅相关任务 |
| [`dev-checklist.md`](dev-checklist.md) | 开发前、提交前的基础检查 | 需要修改或提交时 |
| [`codex-task-contract.md`](codex-task-contract.md) | 通用任务合同、风险分级、数据库/山岳/安全最低门槛 | 所有修改任务；高风险任务必须完整读取 |
| [`project-rules.md`](project-rules.md) | 产品、清单、山岳火山、数据库、UI、测试、发布和回退规则 | 涉及对应业务或系统时读取相关章节 |

[`project-rules.md`](project-rules.md) 是核心项目规则的综合权威。若其内容与实现证据冲突，按本页“权威顺序”处理，不能用历史快照覆盖当前规则。

## 历史快照与交接资料

以下文件保留历史上下文，但其中的版本、测试数量、待办、分支或发布动作不再具有长期权威：

- [`../DEV-交接文档.md`](../DEV-交接文档.md)
- [`../PM-交接文档.md`](../PM-交接文档.md)
- [`phase-1-4-checkpoint.md`](phase-1-4-checkpoint.md)
- [`ui-agent-handoff.md`](ui-agent-handoff.md)
- [`cold-start-splash-checklist.md`](cold-start-splash-checklist.md)
- [`app-store-m0-capacitor-ios.md`](app-store-m0-capacitor-ios.md)
- [`sprint-1-plan.md`](sprint-1-plan.md)
- [`development-task-breakdown.md`](development-task-breakdown.md)

## 参考资料

以下文件用于特定调查或历史数据处理，不应被所有任务默认读取：

- [`gear-image-pipeline.md`](gear-image-pipeline.md)：装备图片处理参考。
- [`popular-brand-image-candidate-audit.md`](popular-brand-image-candidate-audit.md)：品牌图片候选审计记录。
- [`safety-essentials-catalog-candidates.md`](safety-essentials-catalog-candidates.md)：安全装备目录候选及证据模板。
- [`project-folder-structure.md`](project-folder-structure.md)：早期目录说明；实际结构以仓库为准。

## 最小读取规则

- 普通文档、文案或低风险UI：`AGENTS.md`、本索引、`project-rules.md`相关章节和相关页面/测试；不要读取登录或数据库章节。
- 登录、启动、OAuth、Splash：加读 `auth-launch-architecture.md`和任务合同高风险要求。
- 数据库、山岳、火山、安全、装备清单：读取`project-rules.md`对应章节和完整任务合同，并只读核对相关源码、测试和migration。
- 发布或原生打包：必须先确认任务是否明确授权 push、部署、Archive 或上传；了解生效路径不等于获得执行授权。
