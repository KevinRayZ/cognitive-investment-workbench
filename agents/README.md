# Agent 协作模块 · 设定文件索引

本目录存放《个人投资体系总纲》**第十二章 Agent 协作模块**所定义的 Agent 集群系统设定（Prompt）。
架构来源：项目根目录 `# 第十二章 Agent协作模块：专家Agent + 协调Orches.md`；规则来源：根目录 `个人投资体系总纲-人机共创融合版.md`。

## 架构
- **协调 Agent（Orchestrator）**：唯一人类交互入口；负责任务解析、子任务分发、结果收集、总纲硬规则校验、冲突识别与消解、生成综合报告。
- **7 个垂直专家 Agent**：各自专精单一领域，仅输出本领域事实/指标/局部判断，**禁止输出最终买卖/仓位/交易指令**；专家间不直接通信，全部经协调 Agent 中转。

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

## 协调 Agent 综合报告固定模板（§12.5）
1. 任务概述
2. 总纲规则校验结果（一票否决、能力圈校验）
3. 多维度专家摘要（各 Agent 关键结论简写）
4. 冲突与不确定性说明（如有）
5. 基于投资体系的综合评估：机会点、风险点
6. 体系适配策略建议（价值 / GARP / 逆向 / 不适合 / 禁止参与）
7. 参考仓位上限（严格取自总纲仓位规则，不主观创造）
8. 溯源索引：可调取各 Agent 原始输出
