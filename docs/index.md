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

## 项目全局地图

- [`YAMAJITAKU-project-map.canvas`](YAMAJITAKU-project-map.canvas)：可在 Obsidian Canvas 中查看和维护的全局关系图，仅用于快速理解，不替代正式规则。
- [`project-map-guide.md`](project-map-guide.md)：Canvas 的打开方式、更新边界和 Codex 维护规则。
- [`tech-stack.md`](tech-stack.md)：由当前仓库文件核实的技术栈、配置位置和无法从仓库确认的边界。

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

## 按任务读取路由

| 任务 | 最小上下文 | 不应默认读取 |
| --- | --- | --- |
| 文档、日文文案、小型展示UI | `AGENTS.md`、本索引、项目规则相关章节、目标文件/相关测试 | 登录架构、数据库migration、全部交接文档 |
| 普通Bug | 上述文件、完整任务合同、复现路径、直接相关源码和测试 | 全仓库源码、无关历史计划 |
| 装备清单或状态语义 | 项目规则第3节、完整任务合同、清单/匹配源码和对应测试 | 登录、图片处理和早期Sprint文档 |
| 山岳、火山、安全 | 项目规则第2/4节、完整任务合同、目标数据源码/测试/migration、当前一手来源 | 旧状态快照作为当前事实 |
| 数据库/RLS/生产数据 | 项目规则第5节、完整任务合同、目标migration/schema/访问代码 | 与目标表无关的全量migration内容 |
| 登录/启动/OAuth/Splash | 登录专题文档、完整任务合同、相关源码与真机矩阵 | 清单、山岳和产品候选资料 |
| 发布/原生打包 | 项目规则第9节、相关专题文档、任务授权和当前发布基线 | 没有日期的旧发布状态 |

## 上下文控制

1. 先用文件列表、关键词和当前差异定位范围，再读取目标文件；不要把扫描整个仓库作为默认起点。
2. 同一任务中已经读取且未变化的权威文档不重复加载。只在文件已修改、任务范围变化或事实可能过期时重新核对。
3. 稳定背景固化在 `AGENTS.md`、本索引、项目规则和任务合同中；任务Prompt只补充本次目标、范围、证据和授权，不复制全部项目背景。
4. 登录诊断、复杂Bug、数据库方案和山岳安全审计应保留同一任务的推理上下文，直到完成验证或形成可在仓库中恢复的交接材料。
5. 聊天摘要可以帮助连续工作，但生产步骤、回退和权威规则必须落在仓库文档、SQL或可审查的任务产物中。

## 模型能力原则

- 高推理能力：含糊的多模块问题、架构决策、复杂Bug根因、数据库方案、登录、安全、山岳火山判断和最终高风险审查。
- 较轻能力：只读文件盘点、Markdown链接检查、确定性关键词分类、格式整理、已有测试日志摘要和互不依赖的支持性调查。
- 较轻模型的结果不能直接批准安全结论、生产数据或发布；高风险任务由主要执行者结合权威证据复核。
- 不在长期规则中固定具体Codex模型名。根据当前可用能力、成本和延迟选择，并优先保证任务风险所需的判断质量。
- 不为了Codex Token优化修改山支度产品中的OpenAI API、模型或业务提示词。

## 工具与并行原则

适合并行的工作仅限相互独立的只读调查，例如：

- 文档清单和链接检查
- 测试覆盖与migration历史分类
- 不同模块的只读证据收集
- 日志、报告和候选列表的独立摘要

禁止或不适合并行：

- 多个执行者修改同一文件或同一业务链路
- 数据库写入、production migration和相互依赖的SQL
- 登录、OAuth、火山阻断、装备清单核心规则和安全行为写入
- build与依赖同一生成状态的typecheck并发执行
- 需要前一步结果才能确定范围的连续修改

并行前必须定义互不重叠的范围和返回格式。若协调成本、重复读取或Token消耗高于串行收益，使用单一工作线。

## 验证与输出控制

- 针对性验证：修改后立即验证直接受影响的链接、规则、测试或场景。
- 阶段验证：一个逻辑阶段结束后运行相关测试、静态检查和差异审查。
- 发布前完整验证：仅在真正准备发布时运行全量门槛、人工回归、真机/预览和部署检查。
- 相同失败重复出现时，先重新读取错误和检查前提，不无效重试同一命令或反复扫描整个仓库。
- 中间输出保留决策所需证据，不粘贴大段无关日志。最终报告按任务合同区分结果、验证、提交、push、部署、生产执行、未执行和回退。
- 普通小任务使用短报告；只有高风险或跨模块任务需要完整证据表。
