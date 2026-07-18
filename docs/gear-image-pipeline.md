# 装備画像 透明化・トリミング パイプライン（codex 作业指令）

> 文档状态：**历史任务方案/参考资料**。其中数据现状、实现步骤和发布文字不能作为当前授权；执行前按 [`index.md`](index.md)、[`project-rules.md`](project-rules.md) 和任务合同重新核对。
>
> 目标:把**现有所有装備画像**处理成「**透明底 + 按商品边界裁切**」,集中到一个专用存储位置;**今后新录入的装備图也自动同样处理**。首页「最近追加した装備」及装備一覧/詳細都改用处理后的图。

## 0. 先读 & 铁律（必须遵守）

- 先读 `AGENTS.md`、`docs/index.md`、项目规则和任务合同；只有实际涉及登录、启动或Splash时才读 `docs/auth-launch-architecture.md`。
- **按模块来**:一次一个步骤,做完给出验证方式,确认通过再下一个。
- **动 Supabase 数据结构 / Storage / 本番配置前,必须先取得用户明确授权**。
- **绝不删原图**,原图单独保留(回退用)。
- 改动 `app/` 或 `src/` 后，只有经明确授权push并完成部署才会影响远程应用和相关App用户；本地完成不代表已经上线，发布前必须准备回退。
- 不要重做首页布局。首页卡片布局已完成(`app/(app)/dashboard/page.tsx` 的 `RecentGearSection` / `GearImage`),你只需:**切换图片来源 + 去掉临时的 `mix-blend-multiply`**。

## 1. 现状（数据所在）

- 装備表:`public.user_gear`,含列 `image_url`、`image_storage_path`。
- 图片在 **Supabase Storage**(bucket/路径从 `image_storage_path` 推断)。
- 首页临时方案:`GearImage` 用 `object-contain` + `mix-blend-multiply`(白底缓解)。处理完成后**移除 mix-blend-multiply**。
- 已有手动旋钮 `GEAR_DISPLAY_SCALE`(按商品名,默认 1.0,`transform: scale`)。

## 2. 步骤

### 步骤 A — 棚卸し（清点 + 下载原图）
1. 查 `user_gear` 所有「有图」记录(`id, image_url, image_storage_path`)。
2. 用 Supabase Storage download API 把原图下到 `tmp/gear-images/original/<gearId>.<ext>`。
3. 输出一份清单(总数、缺图数、各 bucket/路径分布),给用户确认。

### 步骤 B — 处理（透明 + 裁边）
- 背景去除:**用 `rembg`(U2Net)**最稳(背景白/灰/杂混合)。`pip install rembg pillow`,`rembg.remove(bytes) -> alpha PNG`。
  - 若确认背景都是一样的纯白/浅灰,也可用 PIL 角点阈值/flood-fill,更轻;但混合情况下优先 rembg。
- 裁边:对 alpha 取 `getbbox()` 裁掉四周空白,四周留**均匀内边距(约 6%)**。
- (可选)居中放到正方形透明画布,让 `object-contain` 视觉更稳;或只裁边,大小交给 `displayScale`。
- 导出 PNG(带 alpha),长边约 512px,存 `tmp/gear-images/processed/<gearId>.png`。
- 先处理 **3~4 张**给用户看 before/after,确认效果(透明干净、产品撑满、无残底)再批量。

### 步骤 C — 集中存储（专用位置）
1. 建专用 Storage bucket `gear-images-processed`(public read)——**需用户授权**。
2. 处理后的图按 `<gearId>.png` 上传。
3. `user_gear` 加列 `processed_image_url text`(或 `image_processed_path`)——**migration,需用户授权**。把处理后 URL/路径写回每条记录。
4. 原图、原 `image_url` 不动(回退用)。

### 步骤 D — 渲染切换
- `app/(app)/dashboard/page.tsx` 的 `GearImage`,以及装備一覧/詳細的图片显示:**有 `processed_image_url` 就优先用,否则回退 `image_url`**(保证旧数据/处理失败不崩)。
- 图片变透明后,**去掉 `mix-blend-multiply`**。
- 保持 `object-fit: contain` + 容器统一内边距 + `displayScale`(`transform: scale`)。
  - `displayScale` 现在是 page.tsx 的 `GEAR_DISPLAY_SCALE` map(按商品名)。如要持久化按商品存,给 `user_gear` 加 `display_scale numeric default 1`(migration,需授权),并改成读该列。

### 步骤 E — 今后自动化（上传时处理）
1. 找到装備图上传的 server action / API(`src/lib/actions/` 下,gear 新增/编辑)。
2. 上传后跑同一处理(rembg + trim)→ 存进 `gear-images-processed` → 更新 `processed_image_url`。
3. 处理失败时回退原图,绝不阻断上传。

### 步骤 F — 验证
- 抽几件目视 before/after(透明、裁切、大小)。
- 首页「最近追加」、装備一覧/詳細检查:无错位、无残底、大小一致。
- **旧版二进制安全**:远程改动对所有用户生效,务必保证 `processed_image_url` 为空时完全回退原行为。
- 按任务风险运行针对性检查、相关测试和typecheck；push和部署需分别获得明确授权。

## 3. 注意

- rembg 首次要下模型(几十 MB)。**重 ML 处理建议放离线批处理(一次性)→ 存 Storage,前端只读处理好的静态图**,别放进每次渲染的请求里(慢且贵)。
- `displayScale` 是**手动旋钮**,不是自动视觉平衡(CSS object-fit 做不到自动平衡)。每个商品填多少由设计逐个定。
- 这套只碰「装備图处理 + 渲染来源 + 上传流程」,**不要改首页其它已定稿的布局/配色**。
