# 认知投资工作台 · 项目长期笔记

## 项目定位
人机协同认知成长型个人投资工作台（纯前端 MVP → 在线化中）+ 个人投资体系知识库（git 版本管理）。

## 权威准则与数据源
- **《个人投资体系总纲-人机共创融合版》** = 投资认知最高行为准则
  - 本地文件（工作台根目录，**最新，已扩至 15 章 + 附录**，2026-09 核对）
  - 已含：一信念/二哲学辨析/三适配/四策略/五权责/六能力圈/七仓位/八选股/九交易/
    十宏观/十一复盘/**十二 Agent协作/十三 基金管理/十四 行业观察/十五 决策闭环**
- **知识库（在线权威源）**：GitHub 私有仓库 `KevinRayZ/investment-system`（v1.2.0）
  - 本地镜像：`D:\workbuddy 存储目录\金融投资\个人投资体系知识库\`
  - `system.json` = 机器可读主数据｜`docs/` = 人可读 **11 章 + 附录**｜`schemas/` = 数据契约
  - ⚠️ **知识库已滞后于总纲**（缺十二~十五章，2026-09-01 核对）——改总纲后必须回灌知识库
  - **维护规则**：改 docs → 同步 system.json → VERSION+CHANGELOG → commit+tag+push
- **投资工作台**：GitHub 公开仓库 `KevinRayZ/cognitive-investment-workbench`（**v2.11.0**）
  - 本地：`D:\workbuddy 存储目录\金融投资\个人工作台 agent\`
  - 形态：纯前端（Vite+React），浏览器直连 DeepSeek + GitHub，无后端
  - 数据源：小密圈（张湧）自动抓取 + GitHub 数据层 + localStorage persist v12

## 版本规则（用户确认）
- 成熟命名 = **SemVer**（major.minor.patch）
- 局部更新 → patch+1；内容/功能新增 → minor+1；体系重构 → major+1
- 每次大改 commit message 含版本号 + 变更摘要；知识库同步打 git tag

## 体系关键约束（执行时遵循）
- **执行优先级**：底层信念 > 风控 > 仓位 > 选股 > 交易流程 > 策略建议
- **底层信念（B-01~05）/核心风控修改须人类确认**，不得擅自改（总纲 §11.3）
- 个人硬约束：2 年资金 / 回撤 ≤30% / 单票 15-10-5% / 行业 ≤30% / 逆向总仓 ≤15%
- 能力圈：一级（红利/黄金/利率债）二级（消费/资源）三级（科技/医药）+ 4 条禁区
- AI 无交易决策权；红涨绿跌（中国惯例）；¥/YYYY-MM-DD 本地化

## 技术栈
- 工作台：Vite 5 + React 18 + MUI 5 + Tailwind 3 + Zustand 4（localStorage persist）+ date-fns + nanoid + lucide/MUI icons
- 知识库：GitHub 私有仓库 + JSON（system.json）+ JSON Schema + Markdown docs + git tag 版本
- 未来在线化方向：GitHub API 读写 system.json + 交易数据（跨设备不损失信息）

## 已知技术要点
- vite dev 生成 `vite.config.js.timestamp-*.mjs` 到根目录 → 必须 .gitignore
- esbuild 不查运行时引用（build 通过但运行崩溃）→ **用 `scripts/smoke-pages.mjs` 全路由冒烟**
  （零依赖 CDP，起 dev server 后 `node scripts/smoke-pages.mjs http://localhost:5173`）
- CDP 两个坑：`/json/new` 必须用 PUT（GET 返 405）；vite 按需编译，固定 sleep 会误判白屏 → 轮询等 `#root`
- 本机无 playwright/puppeteer/agent-browser，用 Edge(x86) + CDP；`schtasks.exe` 被安全策略拦截，
  查计划任务改列 `C:\Windows\System32\Tasks\`
- vite build 清空 dist 会触发沙箱批量删除保护 → 用 `--outDir dist-verify`
- 数据持久化：persist version + migrate 链（v12）。⚠️ migrateV11 会用 seed 覆盖
  HOLDINGS_KEYS(targets/trades/funds/industryWatches)，升版本前必须改成"保留用户记录"策略

## ⚠️ 已知最大短板（2026-09-01）
**云端同步只覆盖 3 个实体**：App.jsx `SYNC_MAP = { trades, reviews, dashboard }`。
assetViews/targetStates/dailyBriefs/weeklyReports/monthlyBriefs/strategies/scoreCards/
targets/funds/memos/observations 等 17 个实体只存 localStorage，换设备/清缓存全丢。
跨设备目标未达成，是下一次迭代的头号任务。
