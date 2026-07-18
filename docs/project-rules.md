# 山支度项目规则

状态：**当前权威**

最后复核：2026-07-18

本文集中保存产品、业务、安全、数据、UI、测试和发布规则。全项目授权规则以 [`../AGENTS.md`](../AGENTS.md) 为准，任务执行门槛见 [`codex-task-contract.md`](codex-task-contract.md)，登录/启动细节见 [`auth-launch-architecture.md`](auth-launch-architecture.md)。

## 1. 产品定位与非目标

山支度面向日本登山者，解决“出发前应该准备什么、已经有什么、还缺什么、是否已经确认携带”的问题。

核心流程：

1. 选择山岳、季节和行程方式。
2. 根据稳定山岳资料和行程条件生成装备需求。
3. 将需求与用户所持装备、我的背包和手动确认状态进行匹配。
4. 分开展示所持/已装包、不足和需要确认的项目。
5. 在出发前提示用户核对重要装备和最新官方安全信息。

非目标：

- 不提供地图、路线导航、实时定位或替代专业导航设备的承诺。
- 不把清单结果表述为绝对安全保证。
- 不根据模型自由生成、删除或改变核心装备需求。
- 不把产品变成购物推荐、升级装备或“最佳装备”导购工具。

旧AI推荐和历史页面继续保留兼容。当前重点是计划、清单和出发前确认；AI只能整理规则引擎已经确定的说明文字，不能改变核心清单结果。实现线索见 [`src/lib/actions/ai.ts`](../src/lib/actions/ai.ts) 和 [`tests/trip-requirement-engine.test.mjs`](../tests/trip-requirement-engine.test.mjs)。

## 2. 总体安全原则

- 山支度提供准备辅助，不替代气象厅、自治体、山小屋、设施运营方和现场管理者的最新信息。
- 安全相关状态未知、读取失败或来源冲突时采用 fail-closed，不把未知自动解释为可计划或安全。
- 稳定资料和动态状态必须分层；带日期、警戒等级、临时限制或事故状态的内容不能伪装成长期事实。
- 安全变更必须同时分析误报和漏报，并由项目负责人 FUMI 最终批准。
- 不为了文案简洁、UI统一或减少阻断而削弱安全提示、火山阻断或人工确认。

## 3. 装备清单与准备状态

### 3.1 规则分层

装备清单不是自由生成文本。当前实现分为：

1. 山岳基础资料和行程条件生成所需系统。
2. 系统转换为具体 requirement slots。
3. slots 与用户所持装备匹配。
4. 清单加入不依赖装备记录的人工确认项目。
5. 所持、我的背包和手动确认状态共同形成出发前摘要。

关键实现和回归依据：

- [`src/lib/trip-requirements/engine.ts`](../src/lib/trip-requirements/engine.ts)
- [`src/lib/pack-requirements/engine.ts`](../src/lib/pack-requirements/engine.ts)
- [`src/lib/plan-checklist.ts`](../src/lib/plan-checklist.ts)
- [`tests/trip-requirement-engine.test.mjs`](../tests/trip-requirement-engine.test.mjs)
- [`tests/pack-requirement-generator.test.mjs`](../tests/pack-requirement-generator.test.mjs)
- [`tests/plan-checklist-rules.test.mjs`](../tests/plan-checklist-rules.test.mjs)

### 3.2 状态语义

- `PACKED`：存在匹配的所持装备，并且该装备已加入“我的背包”。当前默认视为已确认；用户可以显式取消本次确认。
- `OWNED`：存在匹配的所持装备，但未加入本次背包。它表示“有这件装备”，不等于“已经带上”，仍需要本次确认。
- `MISSING`：当前没有匹配的所持装备。手动勾选是本次确认状态，不能反向伪造所有权或把缺失装备写成已所持。
- `CHECKLIST_ONLY`：地图、保险证、火山信息等不一定对应装备记录的项目，只能通过人工确认完成。

必须保持以下边界：

- 所持状态、装包状态和确认状态是不同事实，不能合并成一个布尔值。
- 装备覆盖变化时，过期slot应被清理，但用户对仍有效slot的明确确认应保留。
- 安全/特殊装备的未确认状态必须进入出发前摘要。
- `MISSING`和“需要确认”应分开展示，避免用户把“拥有”误解为“已装包”。
- 优先级“必須 / 推奨 / あると便利”属于规则输出，不因UI调整或AI说明而改变。

## 4. 山岳与火山数据治理

### 4.1 稳定层

`mountain_foundation_profiles`保存用于规划的稳定资料，例如名称、地区、海拔、支持季节/方式、路线严肃度、技术地形、补水、小屋/营地、积雪风险、火山属性和长期装备提示。

稳定层不得混入容易失效的：

- 当前警戒等级
- 临时入山限制
- 带明确日期的关闭或复核状态
- 当期事故、天气或设施营业信息

主要实现和测试：[`src/lib/data/mountain-foundation.ts`](../src/lib/data/mountain-foundation.ts)、[`tests/mountain-foundation.test.mjs`](../tests/mountain-foundation.test.mjs)。

### 4.2 动态状态层

`mountain_current_plan_status`用于动态的 `REVIEW_REQUIRED` 或 `BLOCKED` 状态，必须带来源、观察时间和复核时间，并保持对普通用户只读。相关schema见 [`supabase/migrations/055_mountain_current_plan_status.sql`](../supabase/migrations/055_mountain_current_plan_status.sql)。

- `REVIEW_REQUIRED`：可以继续生成计划，但必须清楚展示当前复核提示和官方来源。
- `BLOCKED`：不得生成普通登山计划。
- 山岳稳定资料标记为 `ACTIVE_RESTRICTED` 时同样阻断计划。
- 动态状态查询失败时不得降级为可计划；当前执行路径采用fail-closed。依据见 [`src/lib/mountain-current-plan-status.ts`](../src/lib/mountain-current-plan-status.ts) 和 [`tests/mountain-current-plan-status.test.mjs`](../tests/mountain-current-plan-status.test.mjs)。

### 4.3 更新要求

- 先验证实际slug、当前值、目标字段和行数。
- 一手来源优先，记录来源机构、链接、观察日期和时效。
- 明确稳定字段与动态状态，不把推测性文字写入长期备注。
- 对目标slug、允许字段、禁止字段、未触碰山岳和状态表行数建立断言。
- 保存旧值和精确回退SQL；FUMI批准内容后，生产执行仍需单独授权。

## 5. 数据库与生产数据

- 所有schema、RLS、migration和生产数据任务均为高风险，遵守任务合同的数据库附加门槛。
- `gear_products`是共享目录；普通用户不应直接修改目录产品。`user_gear`是用户自己的装备记录，RLS必须限制为本人数据。
- 官方目录装备和用户自建装备的编辑权限不同；不得通过UI或数据修正绕过 `product_id` 边界。
- 生产环境默认禁止 `supabase db push`。migration文件进入仓库、生产SQL执行、代码push和应用部署必须分别记录与授权。
- 数据修正必须先只读核对、生成快照和精确回退，再在受控事务中运行更新与断言；提交后执行独立只读复查。
- 禁止删除生产数据、扩大未确认的候选批次或把搜索/列表页证据当成精确产品事实。

核心schema与RLS事实应从 [`supabase/migrations`](../supabase/migrations) 和当前数据访问代码核对，不依赖交接文档中的历史数量。

## 6. 登录与启动

登录/启动以 [`auth-launch-architecture.md`](auth-launch-architecture.md) 为专题权威。长期不变量：

- 新版App检测只使用 `window.name`或`yj_local_app` cookie，User-Agent只保留现有旧版兼容用途。
- 本地和远程会话、OAuth回跳、退出和Splash必须按模块验证，不能只测试邮箱登录的单一路径。
- 远程应用和本地iOS资源的生效路径不同；了解路径不代表获得push、Archive或上传授权。

## 7. UI与日文文案

- 面向用户的界面文案使用自然、清楚的日文；App Store审核说明可以使用英文。
- 安全、阻断和确认文案优先表达行动与限制，不使用含糊的营销语气。
- 保持“所持”“已装包”“不足”“未确认”“确认済み”等语义一致，不为了视觉简化合并状态。
- UI调整不得改变props契约、数据获取、表单行为、状态恢复、装备匹配、清单优先级或安全判断，除非任务明确授权行为修改。
- 普通展示修改优先复用已有组件和设计语言；历史UI交接中的具体Tier和禁区只适用于当时任务。
- 日文或静态UI小改使用低风险简版和针对性验证；涉及认证、安全、状态或表单时升级风险等级。

文案回归线索见 [`tests/trip-planning-ui.test.mjs`](../tests/trip-planning-ui.test.mjs) 和 [`tests/phase4-component-baseline.test.mjs`](../tests/phase4-component-baseline.test.mjs)。

## 8. 测试与验证

- 验证按风险分级，不要求每个文档或文案步骤运行完整build和全量测试。
- 低风险：Markdown链接、关键词、文案/布局差异和相关页面检查。
- 中风险：复现、针对性回归测试、相关lint/typecheck和受影响场景。
- 高风险：针对性断言、完整相关测试、lint、typecheck、build及人工/真机/预览场景。
- 发布前才执行完整发布矩阵；build、typecheck和依赖生成的 `.next/types` 检查不要并发运行。
- 测试数量、warning数量和某次“全部通过”只能作为带日期的执行证据，不能写成长期基线。

基础检查见 [`dev-checklist.md`](dev-checklist.md)。

## 9. 发布与回退

- 本地修改、本地提交、push、合并、部署、原生上传和生产数据执行彼此独立，每个远程/生产动作都需明确授权。
- 远程Next应用只有push并完成Vercel部署后才影响Web和加载远程站点的App用户。
- 本地iOS资源只有同步、提高唯一build号、重新Archive、上传并经用户更新后才影响新二进制。
- 代码/文档通过小提交回退；数据库通过变更前旧值生成的精确SQL回退；原生和Web必须记录上一可用build/部署。
- 最终报告必须明确“本地完成”与“已上线”，不能把commit、push或部署混写成完成。

## 10. 规则追踪表

| 规则领域 | 主要实现 | 主要回归证据 |
| --- | --- | --- |
| 装备需求 | `src/lib/trip-requirements`、`src/lib/pack-requirements` | `trip-requirement-engine.test.mjs`、`pack-requirement-generator.test.mjs` |
| 清单状态 | `src/lib/plan-checklist.ts`、`src/components/trip-planning-ui.tsx` | `plan-checklist-rules.test.mjs`、`plan-status-consistency.test.mjs`、`my-pack.test.mjs` |
| 山岳稳定资料 | `src/lib/data/mountain-foundation.ts`、相关migration | `mountain-foundation.test.mjs`、`mountain-notes-migration.test.mjs` |
| 动态山岳状态 | `src/lib/mountain-current-plan-status.ts`、migration 055 | `mountain-current-plan-status.test.mjs`、`trip-planning-ui.test.mjs` |
| 数据权限 | Supabase migrations、`src/lib/data`、`src/lib/actions` | 数据/认证/目录相关测试 |
| 登录启动 | `capacitor-www`、auth routes、AppDelegate、Capacitor config | `auth-validation.test.mjs`、`capacitor-ios.test.mjs`、`splash-screen.test.mjs` |

修改本文中的业务语义前，必须同时核对对应实现和测试。若三者无法一致解释，停止并由负责人确认真实业务规则。
