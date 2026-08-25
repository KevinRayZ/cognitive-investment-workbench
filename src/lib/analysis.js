/**
 * 实时分析层 —— 把 7 个垂类 Agent（财报/宏观/行业/情绪/技术/合规/大类配置）的研判能力
 * 落为前端可调用的分析函数。每次打开网页、或缓存过期时调用：
 *   抓实时行情(quotes.js) → 注入《总纲》+ 7 垂类视角 → DeepSeek 结构化分析 → 结果写回 store + GitHub 缓存。
 *
 * 频率策略（用户要求）：
 *   - 宏观（梅林时钟 / 大类资产）：约一个月更新一次（TTL 30 天）
 *   - 标的级（观察池 / 持仓：吸引力、财务、合规、技术）：约 6 小时更新一次
 *
 * 说明：纯前端无法调用 WorkBuddy Skill 工具，故「垂类 skill」在此工程化为内置的垂类分析
 * prompt（源自 agents/*.md 精华）。用户在对话中仍可直接调用对应 Expert/垂直 Agent。
 */
import { chatCompletion } from './deepseek'
import { getQuote } from './quotes'
import { buildSystemPrompt, getKnowledge } from './knowledge'
import { useStore } from '../store/useStore'

const TTL = {
  macro: 30 * 24 * 3600 * 1000, // 30 天
  target: 6 * 3600 * 1000, // 6 小时
}

// 7 垂类视角精华（取自 agents/*.md 系统设定，注入单次分析的 system 段）
const VERTICAL_BRIEF = `你是「认知投资工作台」协调 Agent，须依《个人投资体系总纲》统筹以下 7 个垂类视角对标的做结构化研判。每个视角只给局部判断，严禁输出买卖/仓位指令：
1) 财报解读：ROE / 扣非净利 / 经营现金流 / 负债率 / 分红；量化打分 + 一票否决项（连续两年经营现金流转负 / 商誉>净资产30% / 审计非标 / 造假嫌疑）。
2) 宏观周期：标的所处周期相位与流动性环境（复苏/过热/滞胀/衰退）。
3) 行业景气：供需格局 / 价格趋势 / 产业链位置；能力圈校验（科技/消费/医药/资源/红利/黄金/债券，圈外谨慎）。
4) 市场情绪：广度 / 资金流向 / 风险偏好；逆向信号必须有基本面佐证。
5) 技术形态：趋势 / 关键支撑阻力 / 量价；震荡市信号失效，不独立构成依据。
6) 标的合规风控（最高优先级）：ST/退市/处罚/立案/治理瑕疵；命中否决即阻断。
7) 大类资产配置：与组合战略配置的关系（权益≥30% 底线等）。`

let _systemCache = { at: 0, prompt: '' }
async function ensureSystem() {
  if (_systemCache.prompt && Date.now() - _systemCache.at < 10 * 60 * 1000) return _systemCache.prompt
  const k = await getKnowledge()
  _systemCache = { at: Date.now(), prompt: buildSystemPrompt(k || {}) }
  return _systemCache.prompt
}

/** 从模型文本中尽量解析出 JSON（兼容 ```json 围栏与前后多余文字）。 */
function extractJson(text) {
  if (!text) return null
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fence ? fence[1] : text
  const s = raw.indexOf('{')
  const e = raw.lastIndexOf('}')
  if (s === -1 || e === -1) return null
  try {
    return JSON.parse(raw.slice(s, e + 1))
  } catch {
    return null
  }
}

/**
 * 分析单个标的（组合 7 垂类视角，单次 DeepSeek 调用）。
 * @returns {Promise<object>} 结构化结果 + { code, name, quote, updatedAt, ok }
 */
export async function analyzeTarget({ code, name, sector }) {
  const quote = await getQuote(code).catch((e) => ({ error: String(e && e.message ? e.message : e) }))
  const system = await ensureSystem()
  const marketInfo = quote && !quote.error
    ? JSON.stringify(quote)
    : `（实时行情获取失败：${quote && quote.error ? quote.error : '未知'}，请基于已知信息谨慎研判）`
  const user = `标的：${name}（${code}），所属行业/板块：${sector || '未知'}。
实时行情快照：${marketInfo}
请综合 7 个垂类视角，严格输出 JSON（不要任何 markdown 代码块外多余文字）：
{
  "attractiveness": 0-100 整数（当前相对吸引力，结合估值分位与基本面），
  "thesis": "一句话投资逻辑",
  "financials": "财务要点（ROE/现金流/负债/分红，1-2 句）",
  "industry": "行业景气判断（1 句）",
  "sentiment": "情绪/资金面（1 句）",
  "technical": "技术形态（1 句）",
  "compliance": "合规结论（通过/阻断 及命中项）",
  "verdict": "持有型/观察型/逆向型/规避",
  "confidence": "高/中/低",
  "caveat": "主要局限或需核实项"
}`
  const text = await chatCompletion(
    [
      { role: 'system', content: system + '\n\n' + VERTICAL_BRIEF },
      { role: 'user', content: user },
    ],
    { temperature: 0.3, maxTokens: 1200 },
  )
  const json = extractJson(text)
  return {
    ...(json || {}),
    code,
    name,
    quote: quote && !quote.error ? quote : null,
    updatedAt: new Date().toISOString(),
    ok: !!json,
  }
}

/**
 * 宏观分析：梅林时钟定位 + 大类资产吸引力评分。
 * 注：前端无实时宏观数据接口，依赖模型知识；结果标注时间敏感点，建议人工核对最新 PMI/CPI。
 */
export async function analyzeMacro() {
  const system = await ensureSystem()
  const user = `请基于你对中国宏观经济最新阶段（复苏/过热/滞胀/衰退）的判断，严格输出 JSON：
{
  "phase": "复苏|过热|滞胀|衰退",
  "rationale": "定位理由（1-2 句，含增长/通胀判断）",
  "assetViews": {
    "equity": 0-100, "hkequity": 0-100, "usequity": 0-100,
    "bond": 0-100, "gold": 0-100, "commodity": 0-100, "cash": 0-100
  },
  "assetNotes": "大类资产一句话配置建议",
  "confidence": "高/中/低"
}
注：宏观数据可能非最新，请在 rationale 中标注判断所依据的时间点或数据敏感点。`
  const text = await chatCompletion([{ role: 'system', content: system }, { role: 'user', content: user }], {
    temperature: 0.3,
    maxTokens: 900,
  })
  const json = extractJson(text)
  return { ...(json || {}), updatedAt: new Date().toISOString(), ok: !!json }
}

/** 收集待分析标的（持仓 + 观察池，去重）。 */
function collectTargets() {
  const s = useStore.getState()
  const targets = s.targets || []
  const trades = s.trades || []
  const openIds = new Set(trades.filter((t) => t.status !== '已平仓' && t.targetId).map((t) => t.targetId))
  const held = targets.filter((t) => openIds.has(t.id))
  const watch = targets.filter((t) => !openIds.has(t.id))
  return [...held, ...watch].filter((t) => t && t.code)
}

/**
 * 运行实时分析（首页挂载或手动刷新时调用）。
 * @param {{force?:boolean, onlyCode?:string}} opts force=忽略 TTL 强制重算；onlyCode=仅重算某标的
 * @returns {Promise<{analyzedTargets:number, macro:boolean, skipped:boolean, noKey:boolean}>}
 */
export async function runRealtimeAnalysis({ force = false, onlyCode = null } = {}) {
  const now = Date.now()
  const s = useStore.getState()
  const cache = (s.analysis && s.analysis.targets) || {}
  const all = collectTargets()

  const due = onlyCode
    ? all.filter((t) => (t.code || '').toLowerCase() === String(onlyCode).toLowerCase())
    : all.filter((t) => {
        if (force) return true
        const c = cache[t.code]
        return !c || !c.updatedAt || now - new Date(c.updatedAt).getTime() > TTL.target
      })

  let analyzedTargets = 0
  if (due.length) {
    const results = {}
    // 并发限制 3，避免打开即风暴
    for (let i = 0; i < due.length; i += 3) {
      const batch = due.slice(i, i + 3)
      const outs = await Promise.all(
        batch.map((t) =>
          analyzeTarget({ code: t.code, name: t.name, sector: t.industry }).catch((e) => ({
            code: t.code,
            name: t.name,
            error: String(e && e.message ? e.message : e),
            updatedAt: new Date().toISOString(),
            ok: false,
          })),
        ),
      )
      outs.forEach((o) => {
        if (o && o.code) {
          results[o.code] = o
          analyzedTargets += 1
        }
      })
    }
    s.setAnalysisTargets({ ...cache, ...results })
  }

  // 宏观分析
  const macroCache = s.analysis && s.analysis.macro
  const macroDue =
    force ||
    !macroCache ||
    !macroCache.updatedAt ||
    now - new Date(macroCache.updatedAt).getTime() > TTL.macro
  let macro = false
  if (macroDue) {
    const m = await analyzeMacro().catch((e) => ({
      error: String(e && e.message ? e.message : e),
      updatedAt: new Date().toISOString(),
      ok: false,
    }))
    s.setAnalysisMacro(m)
    macro = true
  }

  return { analyzedTargets, macro, skipped: due.length === 0 && !macroDue, noKey: false }
}
