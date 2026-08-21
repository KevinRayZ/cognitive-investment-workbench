# 认知投资工作台 · 项目长期笔记

## 项目定位
人机协同认知成长型个人投资工作台（纯前端 MVP → 在线化中）+ 个人投资体系知识库（git 版本管理）。

## 权威准则与数据源
- **《个人投资体系总纲-人机共创融合版》** = 投资认知最高行为准则（5 条永久信念 + 11 章 + 附录）
- **知识库（在线权威源）**：GitHub 私有仓库 `KevinRayZ/investment-system`（v1.2.0）
  - 本地镜像：`D:\workbuddy 存储目录\金融投资\个人投资体系知识库\`
  - `system.json` = 机器可读主数据（13 模块）｜`docs/` = 人可读 12 章｜`schemas/system.schema.json` = 数据契约
  - **维护规则**：改 docs → 同步 system.json → VERSION+CHANGELOG → commit+tag+push
- **投资工作台**：GitHub 公开仓库 `KevinRayZ/cognitive-investment-workbench`（v1.1.0）
  - 本地：`D:\workbuddy 存储目录\金融投资\个人工作台 agent\`
  - 工作台 seed.js 是知识库快照；在线化后以 GitHub API 拉取 system.json 为准

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
- esbuild 不查运行时引用（build 通过但运行崩溃）→ 每页浏览器实开验证
- chrome headless 截图需 `?_t=timestamp` cache-busting 绕过 vite ETag/304
- 数据持久化迁移：persist version + migrate 函数（替换 isSample，保留用户数据）
