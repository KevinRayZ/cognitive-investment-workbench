/**
 * 对话结构化判定 —— 分析对话内容，输出三类意图：知识固化 / 数据记录 / 无事发生。
 * 由 DeepSeek 以 JSON 块输出，后端解析后分流写入知识库或运行数据库。
 *
 * 返回结构：
 * {
 *   intent: 'knowledge'|'trade'|'review'|'reflection'|'position'|'nothing',
 *   confidence: 0-1,
 *   requiresHumanConfirm: boolean,   // 体系知识（底层信念/风控）修改需人类确认
 *   data: {...}                       // 待固化的结构化数据
 * }
 */
export const SYSTEM_EXTRACT_PROMPT = `你是「认知投资工作台」的数据固化引擎。请分析【用户消息】与【AI 回复】，判定是否存在需要固化的新内容，并输出结构化 JSON。

判定规则：
1. knowledge：用户表达了对投资体系的新认知/新理解/新规则建议（如对策略、原则、方法的认知提升）。若涉及底层信念（风险优先/能力圈/价值锚点/认知差/周期轮动）、核心风控规则（回撤、仓位上限）的修改或新增 → requiresHumanConfirm=true；一般策略优化/执行细则 → false。
2. trade：出现了实际发生的买卖交易（含标的、方向、数量、价格、金额）。
3. review：对某笔交易/某时段的复盘总结。
4. reflection：投资感想、心态记录、市场观察等认知沉淀（非体系规则层面）。
5. position：持仓状态变化（新建/加仓/减仓/清仓后的持仓快照）。
6. nothing：纯闲聊、问候、无新内容可固化。

【输出格式】只输出一个 JSON 对象，不要其他文字：
{
  "intent": "knowledge|trade|review|reflection|position|nothing",
  "confidence": 0到1的数字,
  "requiresHumanConfirm": true或false,
  "data": {
    // knowledge: { "type":"new|modify", "target":"如 beliefs/strategies/positionLimits", "title":"", "content":"", "reason":"" }
    // trade: { "date":"YYYY-MM-DD", "target":"标的", "direction":"买/卖", "quantity":数量, "price":价格, "amount":金额, "currency":"CNY/HKD/USD", "note":"备注" }
    // review: { "date":"YYYY-MM-DD", "title":"", "content":"", "relatedTarget":"" }
    // reflection: { "date":"YYYY-MM-DD", "title":"", "content":"" }
    // position: { "date":"YYYY-MM-DD", "target":"", "quantity":数量, "costPrice":成本价, "memo":"说明" }
    // nothing: {}
  }
}`

/**
 * 从 DeepSeek 回复文本中解析 JSON 块（支持 ```json 包裹或裸 JSON）。
 * @returns {object|null}
 */
export function parseExtractJson(text) {
  if (!text) return null
  // 1) ```json ... ``` 包裹
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  // 2) 找第一个 { 到最后一个 }
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const obj = JSON.parse(candidate.slice(start, end + 1))
    if (obj && typeof obj.intent === 'string') return obj
    return null
  } catch {
    return null
  }
}

/**
 * 构建提取请求：将对话历史交给 DeepSeek 做意图判定。
 * @param {Array} messages 前端传来的对话消息
 * @param {string} aiReply 上一步 AI 的自然回复
 */
export function buildExtractMessages(messages, aiReply) {
  const transcript = (messages || [])
    .map((m) => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n')
  return [
    { role: 'system', content: SYSTEM_EXTRACT_PROMPT },
    {
      role: 'user',
      content: `【对话记录】\n${transcript}\n\n【AI 回复】\n${aiReply}\n\n请按规则输出 JSON。`,
    },
  ]
}
