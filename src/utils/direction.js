/**
 * 标的动态方向建议（状态机 + 触发条件 + 纪律校验聚合）—— 应用逻辑完善·改造蓝图 §3.5 C5。
 * 把「每个标的的动态方向」从「每日临时拍方向」升级为「状态机 + 触发条件 + 纪律依据」，
 * 稳定、可审计、抗短期噪音。日频只刷新触发状态（triggers），不轻易改变方向。
 */

// 标的观察状态机（沿用总纲 §14.4）：任何环节可流转到已放弃
export const TARGET_STATES = ['待观察', '趋势确认', '择时入场', '已入场', '已放弃']

// 方向建议枚举（§3.1 C1：建议级，无执行权）
export const DIRECTIONS = ['买入建议', '加仓候选', '持有维持', '减仓预警', '止损触发', '一票否决拦截']

export const STATE_TONE = {
  待观察: 'neutral',
  趋势确认: 'ai',
  择时入场: 'up',
  已入场: 'primary',
  已放弃: 'warn',
}

export const DIRECTION_TONE = {
  买入建议: 'up',
  加仓候选: 'up',
  持有维持: 'hold',
  减仓预警: 'warn',
  止损触发: 'error',
  一票否决拦截: 'error',
}

// 合法状态迁移表（§14.4 状态流转）
export const STATE_FLOW = {
  待观察: ['趋势确认', '已放弃'],
  趋势确认: ['择时入场', '待观察', '已放弃'],
  择时入场: ['已入场', '趋势确认', '已放弃'],
  已入场: ['择时入场', '已放弃'],
  已放弃: [],
}

/** 判断状态迁移是否合法（同态返回 true）。 */
export function canTransition(from, to) {
  if (from === to) return true
  return (STATE_FLOW[from] || []).includes(to)
}

/**
 * 为一个标的构造默认 targetState（key=targetId）。
 * @param {{id:string, name:string, code:string}} target
 */
export function buildDefaultTargetState(target) {
  return {
    targetId: target.id,
    targetName: target.name || '',
    code: target.code || '',
    state: '待观察',
    prevState: '待观察',
    direction: '持有维持',
    directionReason: '',
    triggers: [],
    discipline: {
      l7Pass: true,
      violation: '',
      stopLossHit: false,
      drawdownRisk: 'green',
      positionLimit: { min: 0, max: 0 },
    },
    agentVotes: [],
    confidence: 50,
    updatedAt: new Date().toISOString().slice(0, 10),
    updatedBy: 'auto',
  }
}

/**
 * 汇聚各 Agent 方向建议投票 → 多数方向（平票取最高置信度）。
 * @param {Array<{agent:string, direction:string, confidence:number}>} votes
 */
export function voteDirection(votes = []) {
  if (!votes.length) return '持有维持'
  const tally = {}
  for (const v of votes) {
    const d = DIRECTIONS.includes(v.direction) ? v.direction : '持有维持'
    tally[d] = tally[d] || { count: 0, confSum: 0 }
    tally[d].count += 1
    tally[d].confSum += Number(v.confidence || 0)
  }
  return Object.entries(tally).sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count
    return b[1].confSum / b[1].count - a[1].confSum / a[1].count
  })[0][0]
}

/**
 * 由静态输入汇出方向建议（无触发时默认「持有维持/观察」，不因单日波动漂移）。
 * 优先级：合规否决 > 止损触发 > 超权重上限 > 吸引力阈值。
 * @param {{weight:number, isOutOfBoundary?:boolean}} holding
 * @param {{attractiveness?:number, blocked?:boolean, state?:string}} ai
 */
export function resolveDirection(holding, ai = {}) {
  if (holding.isOutOfBoundary) return '一票否决拦截'
  if (ai.blocked) return '一票否决拦截'
  if (ai.stopLossHit) return '止损触发'
  if (holding.weight > 20) return '减仓预警'
  if (holding.weight > 15) return '减仓预警'
  const a = ai.attractiveness
  if (typeof a === 'number') {
    if (a >= 66) return '加仓候选'
    if (a >= 40) return '持有维持'
    return '减仓预警'
  }
  return '持有维持'
}

/** 总纲 §7.1 大类资产配置区间（按周期阶段；用于资产观点校验与 L6 注入）。 */
export const ASSET_PHASE_RANGES = {
  复苏: { equity: [60, 85], bond: [10, 25], gold: [5, 10], cash: [0, 10], commodity: [0, 15], hkequity: [0, 40], usequity: [0, 30] },
  过热: { equity: [40, 60], bond: [15, 30], gold: [10, 20], cash: [5, 15], commodity: [0, 25], hkequity: [0, 40], usequity: [0, 30] },
  滞胀: { equity: [30, 50], bond: [20, 30], gold: [15, 25], cash: [10, 20], commodity: [0, 30], hkequity: [0, 40], usequity: [0, 30] },
  衰退: { equity: [50, 70], bond: [20, 30], gold: [5, 10], cash: [5, 15], commodity: [0, 20], hkequity: [0, 40], usequity: [0, 30] },
}

/** 资产观点 assetClass → 总纲 §7.1 区间键。 */
export function systemRangeForAsset(assetClass, phase = '衰退') {
  const map = { 权益: 'equity', 债券: 'bond', 黄金: 'gold', 现金: 'cash', 红利: 'equity', 成长: 'equity', 其他: 'equity' }
  const key = map[assetClass] || 'equity'
  const ranges = ASSET_PHASE_RANGES[phase] || ASSET_PHASE_RANGES['衰退']
  return ranges[key] || [0, 30]
}

/**
 * AI 校验资产观点是否落在总纲区间内（§3.2 C2：冲突仅提示，不阻止录入）。
 * @returns {{inRange:boolean, conflict:string[]}}
 */
export function checkAssetViewRange(assetClass, targetPct, phase = '衰退') {
  const [low, high] = systemRangeForAsset(assetClass, phase)
  const inRange = Number(targetPct) >= low && Number(targetPct) <= high
  return {
    inRange,
    conflict: inRange ? [] : [`人观点 ${targetPct}% 越出总纲 §7.1 区间 [${low}%–${high}%]（${phase}）`],
  }
}