# 山支度 / YAMAJITAKU

山支度是面向日本登山者的登山准备应用。它根据山岳、季节和行程方式生成装备清单，帮助用户管理所持装备、识别不足、确认本次携带物品并完成出发前检查。

山支度不是地图或导航应用，也不能替代气象厅、自治体、山小屋和登山设施发布的最新官方信息。

## 当前产品范围

- 山岳、季节和行程方式选择
- 基于规则的装备清单与出发前确认
- 所持装备和“我的背包”管理
- 所持、已装包、不足和需要确认的状态区分
- 山岳基础资料、火山风险和当前计划状态保护
- Web应用与Capacitor iOS外壳

旧版AI推荐与历史记录继续保留兼容，但当前产品重点是山行计划、装备清单和出发前确认，不以扩展AI推荐或购物建议为主要方向。

## 技术栈

- Next.js App Router、React、TypeScript、Tailwind CSS
- Supabase Auth、Postgres和Storage
- Capacitor iOS
- OpenAI API仅用于现有兼容功能的说明文本；核心清单规则不依赖模型生成

## 开发入口

1. 先阅读 [`AGENTS.md`](AGENTS.md)。
2. 按 [`docs/index.md`](docs/index.md) 只读取当前任务需要的权威文档。
3. 修改任务使用 [`docs/codex-task-contract.md`](docs/codex-task-contract.md) 判断风险和验证范围。

安装依赖后，复制 `.env.example` 为 `.env.local` 并填写本地开发需要的值：

```bash
npm install
npm run dev
```

常用本地验证命令：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

是否需要运行全部命令由任务风险决定。push、部署、原生打包和生产数据执行都需要单独授权。
