/**
 * 知识库上下文 —— 从 investment-system 私有仓库拉取体系知识，构建 AI 的 system prompt。
 * 双入口（工作台网页 / WorkBuddy 外部）共用同一权威体系源。
 */
import { readJson, REPO_KNOWLEDGE } from './githubClient'
import { getGithubToken } from './credentials'

const CACHE_TTL = 10 * 60 * 1000 // 10 分钟缓存
let cache = { at: 0, data: null }

/** 拉取最新体系知识（system.json），带短缓存。无 token 返回 null。 */
export async function getKnowledge() {
  const token = getGithubToken()
  if (!token) return null
  if (cache.data && Date.now() - cache.at < CACHE_TTL) return cache.data
  const { data } = await readJson(REPO_KNOWLEDGE, 'system.json', token)
  cache = { at: Date.now(), data: data || null }
  return cache.data
}

/** 生成 AI system prompt（注入体系核心：信念/策略/仓位/风控/优先级/权责）。 */
export function buildSystemPrompt(k) {
  const beliefs = (k.beliefs || []).map((b) => `- ${b.id} ${b.title}：${b.statement}`).join('\n')
  const strategies = (k.strategies || [])
    .map(
      (s) =>
        `- ${s.id} ${s.name}（${s.layer}，权重${s.weight}）：场景[${(s.scenario || []).join('、')}]；红线[${(s.redlines || []).join('；')}]`,
    )
    .join('\n')
  const pp = k.personalProfile || {}
  const limits = k.positionLimits || {}

  return `你是「认知投资工作台」的 AI 认知搭档，严格遵循以下《个人投资体系总纲》行事：

【角色权责】人类主导底层信念、能力圈、风控底线、最终决策；AI 只做拆解学习资料、校验逻辑、排查冲突、思辨质疑、沉淀认知、迭代建议、跟踪宏观周期与大类资产性价比。AI 无交易决策权，不做收益承诺。

【执行优先级】底层信念 > 风控规则 > 仓位约束 > 选股标准 > 交易流程 > 策略建议。

【5 条永久底层信念】
${beliefs}

【六大策略与边界红线】
${strategies}

【个人硬约束】资金周期 ${pp.capitalPeriod || '2年'}；最大回撤 ${pp.maxDrawdown || '30%'}；能力圈：${(pp.capabilityCircle || []).join('、')}。
【仓位约束】单票上限：价值 15% / GARP 10% / 逆向 5%；行业 ≤ 权益 30%；逆向总仓 ≤ 15%；分批建仓、逻辑止损优先。
【周期矩阵】${(k.cycleMatrix || [])
    .map((c) => `${c.phase}：权益${c.equities} 债券${c.bonds} 黄金${c.gold} 现金${c.cash}`)
    .join('；')}

【用户持续沉淀的新认知】（均经本人确认后写入）
${(k.additions || []).map((a) => `- ${a.title}：${a.content}`).join('\n') || '（暂无）'}

【回答要求】专业、结构化、给结论先给主见再展开；涉及参数标注来源；对违背体系的操作主动提示风险；不做收益承诺。`
}
