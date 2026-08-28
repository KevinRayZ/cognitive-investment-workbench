# Agent 协作模块 · 设定文件索引

本目录存放《个人投资体系总纲》**第十二章 Agent 协作模块**所定义的 Agent 集群系统设定（Prompt）。
架构来源：项目根目录 `# 第十二章 Agent协作模块：专家Agent + 协调Orches.md`；规则来源：根目录 `个人投资体系总纲-人机共创融合版.md`。

## 架构
- **协调 Agent（Orchestrator）**：唯一人类交互入口；负责任务解析、子任务分发、结果收集、总纲硬规则校验、冲突识别与消解、汇总各 Agent【方向建议】生成综合建议（方向 + 参考仓位区间 + 纪律结论 + 触发条件）。
- **7 个垂直专家 Agent**：各自专精单一领域，输出本领域事实/指标/局部判断 + 【方向建议】（建议级，禁自动执行）；专家间不直接通信，全部经协调 Agent 中转。

## 文件清单
| 文件 | Agent | 对应章节 |
| :--- | :--- | :--- |
| `orchestrator.md` | 协调 Agent（Orchestrator） | 第十二章 §12.5 / §12.6 |
| `financial-report.md` | 财报解读 Agent | §12.4.1 |
| `macro-cycle.md` | 宏观周期 Agent | §12.4.2 |
| `industry-sentiment.md` | 行业景气 Agent | §12.4.3 |
| `market-sentiment.md` | 市场情绪 Agent | §12.4.4 |
| `technical-pattern.md` | 技术形态 Agent | §12.4.5 |
| `compliance-risk.md` | 标的合规风控 Agent | §12.4.6 |
| `asset-allocation.md` | 大类资产配置辅助 Agent | §12.4.7 |

## 两条硬规则（来自用户指令，已落实在文件结构内）
1. **协调 Agent 必须优先加载完整《个人投资体系总纲》+ 本第十二章文档作为上下文**
   → `orchestrator.md` 内含「强制上下文加载指令」，指向：
     - `../个人投资体系总纲-人机共创融合版.md`（完整原文）
     - `../# 第十二章 Agent协作模块：专家Agent + 协调Orches.md`（完整原文）
2. **所有垂直专家 Agent 也必须知晓总纲边界，但不做全局调度，只聚焦自己领域**
   → 每个垂直 Agent 文件内含「总纲边界认知」段落（取自 `_总纲边界摘要.md`），可独立运行，不负责跨领域调度。

## 全局通用规则（用户 2026-08-24 补充，已写入各 Agent 文件）
1. **技能调用（每个 Agent 通用）**：各 Agent 在执行本职工作任务时，可主动寻找并调用合适的工作台 skill（技能）辅助分析，例如财报解析、宏观/行情数据抓取、产业链图谱、合规舆情检索、可视化、文档生成等。调用前先判断技能是否匹配当前任务，不匹配则不强行调用；技能产出仅作为分析素材，最终仍按本文件既定输出结构与边界呈现，不突破总纲。
2. **工作台优先采用 Agent 工作结果（系统级）**：工作台在工作时，凡所使用的信息或结论落在某 Agent 职责能力范围内，应**优先采用该 Agent 给出的结构化工作内容结果**，不另行以通用模型结论覆盖。协调 Agent 在产出综合报告时，须以各垂直 Agent 的结构化输出为唯一事实基础（见 `orchestrator.md` 内置硬约束第 7 条）。

## 每个垂直 Agent 文件的统一结构
```
# [Agent 名称]
> 专精领域 / 对应总纲章节 / 边界约束
## 系统设定（Prompt）        ← 用户逐条提供的设定内容写入此处
## 总纲边界认知（必须遵守）  ← 取自 _总纲边界摘要.md 的相关部分 + 通用约束
## 固定输出结构              ← 【观测事实】【指标集合】【本领域局部判断】【置信度0-100】【局限性】【风险提示】
```

## 共享参考
- `_总纲边界摘要.md`：从总纲 + 第十二章提取的不可突破约束全集，供垂直 Agent 嵌入边界认知段落。

## 实体化状态（2026-08-24 更新）：真实可调度 Skill 单元 + 真实数据底座
原 `agents/*.md` 为各 Agent 的**规范原文（单一事实源）**。已将其**实体化为真实可调度的 Skill 单元**，落点：`C:\Users\robot01\.workbuddy\skills\invest-agent-*`。

| Skill 文件 | Agent | 运行时动作 |
| :--- | :--- | :--- |
| `invest-agent-orchestrator/SKILL.md` | 协调 Agent | 强制加载总纲+第十二章 → 真实分发 7 垂直 Skill → 校验/冲突消解 → 8 段式报告 |
| `invest-agent-financial-report/SKILL.md` | 财报解读 | Read `financial-report.md` + 抓财务/估值真实数据 → 六段式 |
| `invest-agent-macro-cycle/SKILL.md` | 宏观周期 | Read `macro-cycle.md` + 抓宏观真实数据 → 六段式 |
| `invest-agent-industry-sentiment/SKILL.md` | 行业景气 | Read `industry-sentiment.md` + 抓行业真实数据 → 六段式 |
| `invest-agent-market-sentiment/SKILL.md` | 市场情绪 | Read `market-sentiment.md` + 抓情绪/资金真实数据 → 六段式 |
| `invest-agent-technical-pattern/SKILL.md` | 技术形态 | Read `technical-pattern.md` + 抓 K线/指标真实数据 → 六段式 |
| `invest-agent-compliance-risk/SKILL.md` | 标的合规风控 | Read `compliance-risk.md` + 抓风险/公告真实数据 → 六段式（最高优先级） |
| `invest-agent-asset-allocation/SKILL.md` | 大类资产配置辅助 | Read `asset-allocation.md` + 抓大类资产真实数据 → 六段式 |

**真实数据底座（已连接 MCP 连接器，实测可用）**：
- `mcp__mx-ds-mcp__*`（东方财富妙想）：A/港/美股财务估值、宏观行业指标、研报公告、条件选股
- `mcp__tdx-connector__*`（通达信）：实时行情(含PE/PB/ROE)、K线、F10深度、技术指标、资金流向
- `mcp__westock-mcp__*`（腾讯自选股）：行情/概览/财务/新闻公告研报/宏观/市场概览/资金流/风险

**调度方式**：协调 Agent 通过 Skill 工具逐个调用垂直 Skill（真实分发，非单 LLM 模拟）；每个垂直 Skill 加载其规范原文 + 调用上述连接器抓取实时数据 + 产出六段式。

**验证记录**：`演练-中国神华评估-真实分发v2.md`（2026-08-24，中国神华 601088 端到端联调，7 维度均基于实时 MCP 数据）。

## Expert 实体注册状态（2026-08-25 更新）
8 个 Agent（协调 + 7 垂直）已全部注册为 **WorkBuddy Expert 实体**，可在对话中作为独立专家角色被调用。

| Expert 目录 | 中文名 | 头像状态 | 快速调用示例 |
| :--- | :--- | :--- | :--- |
| `orchestrator-expert` | 协调 Agent | AI 生成头像（指挥台/七面屏） | `请按我的投资体系总纲，对 [标的] 做一次 7 专家综合评估并输出 8 段式报告` |
| `fin-report-expert` | 财报解读专家 | AI 生成头像（年报/ROE/现金流） | `分析 [标的] 最新财报的盈利质量与偿债安全` |
| `macro-cycle-expert` | 宏观周期专家 | AI 生成头像（周期仪表） | `当前中国经济处于美林时钟哪个象限` |
| `industry-sentiment-expert` | 行业景气专家 | AI 生成头像（平板/工厂/供需图） | `评估 [行业] 的供需格局与景气度` |
| `market-sentiment-expert` | 市场情绪专家 | AI 生成头像（市场宽度/贪婪恐惧） | `当前全市场广度与情绪面如何` |
| `tech-pattern-expert` | 技术形态专家 | AI 生成头像（K 线/MACD） | `分析 [标的] 的趋势与关键支撑阻力` |
| `compliance-risk-expert` | 合规风控专家 | AI 生成头像（盾牌/审计清单） | `核查 [标的] 是否存在合规风险` |
| `asset-allocation-expert` | 大类资产配置专家 | AI 生成头像（资产天平） | `当前股债商金现的吸引力与配置区间` |

**注册信息**：`C:\Users\robot01\.workbuddy\plugins\marketplaces\my-experts\.codebuddy-plugin\marketplace.json`

**说明**：全部 8 个头像已完成统一风格 AI 漫画头像替换，与 FinanceInvestment 分类深蓝金主题一致。

## 在 WorkBuddy 中与 Agent 集团对话
1. **入口**：WorkBuddy 左侧边栏的 **「专家」/「Expert Center」**。
2. **与协调 Agent 对话**：在 Expert 列表里找到 **「协调 Agent」**，点击「开始对话」即可新建一个独立会话。它是你**唯一的人类入口**；把任务（标的评估/组合体检/季度策略/交易计划校验）发给它，它会按总纲调度 7 个垂直 Expert。
3. **与单个垂直 Expert 对话**：同样在 Expert 列表里选择 **「财报解读专家」「宏观周期专家」** 等，新建独立会话。它们只聚焦本领域，输出六段式分析。
4. **与整个 Agent 集团协同的两种方式**：
   - **方式 A（推荐）**：在「协调 Agent」会话里发任务，由协调 Agent 统一分发、汇总、做冲突消解与总纲校验，最终给出 8 段式综合报告。你无需手动@每个垂直专家。
   - **方式 B**：在普通对话里@某个具体 Expert（例如「@合规风控专家 帮我查一下 601088 的质押和处罚情况」），做垂类专题询问。
5. **工作台网页的实时分析**：打开你的 CloudStudio 链接（见下）时，网页前端会自动用同一套 7 垂类 Agent 分析实时行情并展示结果，不依赖每次新建 Expert 会话。

## 协调 Agent 综合报告固定模板（§12.5）
1. 任务概述
2. 总纲规则校验结果（一票否决、能力圈校验）
3. 多维度专家摘要（各 Agent 关键结论简写）
4. 冲突与不确定性说明（如有）
5. 基于投资体系的综合评估：机会点、风险点
6. 体系适配策略建议（价值 / GARP / 逆向 / 不适合 / 禁止参与）
7. 参考仓位上限（严格取自总纲仓位规则，不主观创造）
8. 溯源索引：可调取各 Agent 原始输出
