/**
 * 10 张数据表字段定义与默认值工厂。
 * 语义严格对应《需求规格书》§2 与《架构设计》§3.4。
 * 状态枚举：原则 草稿/已采纳/已弃用；方法 启用/草稿/待验证；备忘录 草稿/已决策/已执行/已放弃；观察 待归档/已归档。
 */

import { uid } from '../models/idGenerator'

// ---------- 1. 投资原则 L1（宪法级细分视图，只读；数据来自 IS 的 constitution 标记） ----------
export function createL1(partial = {}) {
  return {
    id: uid('L1'),
    category: '赚钱逻辑', // 赚钱逻辑 / 不碰什么 / 风险底线
    title: '',
    rule: '',
    boundary: '',
    reason: '',
    sourceIsId: '',
    isConstitution: true,
    ...partial,
  }
}

// ---------- 2. 投资方法 L2 ----------
export function createMethod(partial = {}) {
  return {
    id: '', // M-YYYY-NNN，由 store 生成
    name: '',
    scenario: '',
    assumptions: '',
    steps: [],
    limitations: '',
    status: '草稿', // 启用 / 草稿 / 待验证
    relatedIsIds: [],
    version: 'v1.0',
    isSample: false,
    ...partial,
  }
}

// ---------- 3. 标的研究 L3 ----------
export function createTarget(partial = {}) {
  return {
    id: uid('T'),
    name: '',
    code: '',
    currency: 'HKD', // CNY / HKD / USD
    businessModel: '',
    moat: '',
    keyFinancials: {
      currentPrice: undefined,
      pe: undefined,
      roe: undefined,
      marketCap: '',
    },
    riskPoints: [],
    valuationRange: {
      currentPercentile: undefined,
      tiers: ['极冷', '冷', '中', '热', '极热'],
    },
    trackingPoints: [],
    relatedIsIds: [],
    relatedErrIds: [],
    stage: '研究中', // 研究中 / 深度 / 跟踪中
    isSample: false,
    ...partial,
  }
}

// ---------- 4. 交易日志 L4（仅人工录入） ----------
export function createTrade(partial = {}) {
  return {
    id: uid('TR'),
    date: '',
    targetId: '',
    targetName: '',
    direction: '做多', // 做多 / 做空
    quantity: 0,
    price: 0,
    currency: 'HKD',
    amount: 0,
    industry: '',
    memoId: '',
    status: '已归档', // 已归档 / 已平仓 / 边界外·待核
    isOutOfBoundary: false,
    profit: undefined, // 平仓后盈亏（本币），用于胜率 / 累计收益
    decisionContext: {
      marketEnvironment: '',
      valuation: '',
      mentality: '',
      expectedReturn: '',
      stopLoss: '',
    },
    isSample: false,
    ...partial,
  }
}

// ---------- 5. 复盘与错误 L5（交易复盘 / 错误清单） ----------
export function createReview(partial = {}) {
  return {
    id: uid('RV'),
    type: '错误清单', // 交易复盘 / 错误清单
    errId: '', // ERR-YYYY-NNN，错误清单时由 store 生成
    category: '认知', // 认知 / 心态 / 执行
    title: '',
    description: '',
    relatedIsIds: [],
    relatedTradeIds: [],
    reviewRecords: [], // { date, content, result }
    status: '待验证', // 已验证 / 待验证
    isSample: false,
    ...partial,
  }
}

// ---------- 6. 观察灵感 L6 ----------
export function createObservation(partial = {}) {
  return {
    id: uid('OB'),
    title: '',
    source: '',
    sourceType: '灵感', // 研报 / 公众号 / 新闻 / 突发 / 灵感
    summary: '',
    status: '待归档', // 待归档 / 已归档
    relatedTargetIds: [],
    relatedMethodIds: [],
    relatedErrIds: [],
    createdAt: '',
    isSample: false,
    ...partial,
  }
}

// ---------- 7. 原则卡片 IS（唯一权威原则源） ----------
export function createIS(partial = {}) {
  return {
    id: '', // IS-YYYY-NNN，由 store 生成
    title: '',
    module: '投资哲学',
    category: '可复用', // 宪法级 / 可复用 / 工作流
    confidence: 80, // 0-100
    validationPlan: '',
    status: '草稿', // 草稿 / 已采纳 / 已弃用
    statement: '',
    source: '',
    scope: '',
    relatedErrIds: [],
    isConstitution: false,
    createdAt: '',
    updatedAt: '',
    isSample: false,
    ...partial,
  }
}

// ---------- 8. 资料-卡片索引 ----------
export function createMaterial(partial = {}) {
  return {
    id: uid('MT'),
    materialTitle: '',
    materialUrl: '',
    isIds: [],
    methodIds: [],
    targetIds: [],
    createdAt: '',
    ...partial,
  }
}

// ---------- 9. 体系变更日志 ----------
export function createChangeLog(partial = {}) {
  return {
    id: uid('CL'),
    type: '待验证', // + / ~ / - / 待验证
    description: '',
    version: 'v1.0',
    createdAt: '',
    ...partial,
  }
}

// ---------- 10. 投资备忘录 ----------
export function createMemo(partial = {}) {
  return {
    id: '', // MEMO-YYYY-NNN，由 store 生成
    date: '',
    targetId: '',
    targetName: '',
    direction: '拟买', // 拟买 / 拟卖 / 做多 / 做空
    logic: '',
    expectedReturn: '',
    timeFrame: '',
    catalyst: '',
    risk: '',
    redTeamChallenge: '', // 必填反方意见
    exitConditions: '',
    confidence: 60, // 0-100，>=60 通过最后闸门
    isIds: [], // 引用原则
    errIds: [], // 引用错误
    status: '草稿', // 草稿 / 已决策 / 已执行 / 已放弃
    gateChecks: [false, false, false, false, false], // 5 步闸门
    decisionHistory: [], // { at, action, note }
    isSample: false,
    ...partial,
  }
}

// ---------- 11. 主动型基金 ----------
export function createFund(partial = {}) {
  return {
    id: uid('F'),
    code: '', // 基金代码
    name: '', // 基金名称
    fundType: '主动股票型', // 主动股票型 / 混合型 / 债券型 / QDII / 行业主题
    investmentStyle: '成长', // 价值 / 成长 / 均衡 / 红利 / 逆向
    manager: '', // 基金经理
    managerTenure: 0, // 任职年限（年）
    inceptionDate: '', // 成立日期
    currency: 'CNY',
    aum: 0, // 管理规模（亿）
    // 业绩指标
    performance: {
      ytdReturn: undefined, // 今年以来收益率 %
      oneYearReturn: undefined, // 近1年收益率 %
      threeYearReturn: undefined, // 近3年年化收益率 %
      maxDrawdown: undefined, // 最大回撤 %
      sharpeRatio: undefined, // 夏普比率
      volatility: undefined, // 波动率 %
    },
    // 风险指标
    riskMetrics: {
      trackingError: undefined, // 跟踪误差 %
      informationRatio: undefined, // 信息比率
      downsideRisk: undefined, // 下行风险 %
    },
    // 持仓分析
    holdings: {
      topHoldings: [], // 前十大重仓股 [{ name, weight }]
      industryDistribution: [], // 行业分布 [{ industry, weight }]
      styleExposure: { growth: 0, value: 0, quality: 0, momentum: 0 }, // 风格暴露
      turnoverRate: undefined, // 换手率 %
    },
    // 估值与定位
    valuation: {
      pePercentile: undefined, // PE分位 %
      categoryRank: undefined, // 同类排名 / 总数
    },
    // 状态
    status: '观察中', // 观察中 / 已入选 / 已持仓 / 已淘汰
    score: 0, // 综合评分 0-100
    analysisNotes: '', // 分析备注
    relatedIsIds: [], // 关联原则
    relatedErrIds: [], // 关联错误
    isSample: false,
    ...partial,
  }
}

// ---------- 12. 行业趋势观察 ----------
export function createIndustryWatch(partial = {}) {
  return {
    id: uid('IW'),
    name: '', // 行业名称
    code: '', // 行业代码 / 分类
    category: '二级重点', // 一级核心 / 二级重点 / 三级机会
    // 趋势状态
    trend: {
      current: '拐点待确认', // 上升趋势 / 下降趋势 / 平稳震荡 / 拐点待确认
      direction: '中性', // 看多 / 看空 / 中性
      score: 50, // 趋势评分 0-100
    },
    // 观察状态
    status: '待观察', // 待观察 / 趋势确认 / 择时入场 / 已入场 / 已放弃
    // 景气指标
    prosperity: {
      score: 3, // 景气度评分 1-5
      revenueGrowth: undefined, // 行业营收增速 %
      profitGrowth: undefined, // 行业净利润增速 %
      capacityUtilization: undefined, // 产能利用率 %
      orderVisibility: undefined, // 订单能见度 %
      pmiNewOrders: undefined, // PMI新订单指数
      change: '稳定', // 上行 / 稳定 / 下行
    },
    // 估值指标
    valuation: {
      pe: undefined, // PE-TTM
      pePercentile: undefined, // PE分位 %
      pb: undefined, // PB
      pbPercentile: undefined, // PB分位 %
      dividendYield: undefined, // 股息率 %
      fairValue: undefined, // 合理估值区间
    },
    // 资金流向
    capitalFlow: {
      mainFlow: undefined, // 主力资金净流入（亿）
      northFlow: undefined, // 北向资金净流入（亿）
      etfShareChange: undefined, // 行业ETF份额变化 %
      trend: '中性', // 流入 / 流出 / 中性
    },
    // 政策导向
    policy: {
      supportLevel: '中性', // 强支持 / 支持 / 中性 / 限制
      keyPolicies: [], // 关键政策文件 [{ name, date, impact }]
      notes: '', // 政策备注
    },
    // 核心指标汇总（趋势判断用）
    indicators: {
      prosperityTrend: false, // 景气度向好
      capitalFlowTrend: false, // 资金面向好
      valuationTrend: false, // 估值面向好
      policyTrend: false, // 政策面向好
      confirmed: false, // 趋势已确认
    },
    // 触发条件
    triggerConditions: {
      entry: [], // 入场条件
      exit: [], // 离场条件
    },
    // 关联标的
    relatedTargets: [], // [{ targetId, targetName, weight }]
    // 研究记录
    researchNotes: [], // [{ date, content, author }]
    // 配置建议
    allocationSuggestion: {
      position: 0, // 建议仓位 %
      type: '底仓', // 底仓 / 加仓 / 观望 / 减仓
      timing: '等待信号', // 可建仓 / 等待信号 / 减仓 / 清仓
    },
    isSample: false,
    ...partial,
  }
}

// ---------- 13. L3 中长期投资策略（季度级，战略性配置） ----------
export function createStrategy(partial = {}) {
  return {
    id: uid('ST'),
    ym: '', // 策略季度 YYYY-QN 如 2026-Q3
    title: '',
    macroPhase: '', // 复苏期 / 过热期 / 滞胀期 / 衰退末期 / 过渡期
    macroPhaseConfidence: 50,
    macroKeyRationale: '',
    macroSignalConflicts: '',
    assetAllocation: {
      equityRange: { min: 50, max: 70 },
      bondRange: { min: 20, max: 30 },
      goldRange: { min: 5, max: 10 },
      cashRange: { min: 5, max: 15 },
      equityTone: '中性', // 偏上/中性/偏下
    },
    industryFocus: { overweight: [], neutral: [], underweight: [] },
    styleBias: '均衡', // 价值侧重 / GARP侧重 / 逆向侧重 / 均衡
    coreAssumptions: [],
    humans: { phaseJudgement: false, industryPriority: false, finalApproval: false },
    ais: { macroEvidence: '', industryEvidence: '', allocationSuggestion: '', conflicts: [] },
    version: 'v1.0',
    status: '草稿', // 草稿 / 已审定 / 执行中 / 已失效
    parentQuarter: '',
    createdAt: '',
    updatedAt: '',
    isSample: false,
    ...partial,
  }
}

// ---------- 14. L4 月度投资策略（战术层，可直接执行） ----------
export function createMonthlyStrategy(partial = {}) {
  return {
    id: uid('MS'),
    ym: '', // YYYY-MM
    title: '',
    strategyId: '',
    strategyTitle: '',
    keyObservations: [],
    rebalancePlan: { equityChange: 0, bondChange: 0, goldChange: 0, cashChange: 0, rationale: '' },
    industryRebalance: [],
    targetActionPlan: [],
    tradeSchedule: {
      batchCount: 3,
      batches: [
        { order: 1, ratio: 0.30, timing: '首周初', done: false },
        { order: 2, ratio: 0.40, timing: '月中回调', done: false },
        { order: 3, ratio: 0.30, timing: '月末确认', done: false },
      ],
      addOnlyWhenProfitable: true,
      noAverageDown: true,
    },
    riskScripts: [
      { trigger: '宏观黑天鹅', script: '暂停所有新开仓，权益下调至下限' },
      { trigger: '行业负面事件', script: '立即评估持仓，逻辑破坏则减仓/清仓' },
      { trigger: '个股暴雷', script: '清仓对应标的，不抱侥幸' },
      { trigger: '回撤达到15%', script: '权益降至≤60%，停新开成长/逆向' },
    ],
    disciplineAudit: {
      allActionsHavePlan: true,
      noIntradayDecisions: true,
      withinPositionLimits: true,
      complianceChecksPassed: true,
      notes: '',
    },
    strategyDeviationReasons: [],
    createdAt: '',
    updatedAt: '',
    isSample: false,
    ...partial,
  }
}

// ---------- 15. L5 胜率赔率评估 + L6 仓位建议（统一评分引擎，个股/基金通用） ----------
export function createScoreCard(partial = {}) {
  return {
    id: uid('SC'),
    targetCode: '',
    targetName: '',
    targetType: '个股', // 个股 / 基金
    strategyId: '',
    monthlyId: '',
    evaluationDate: '',
    l1Passed: true,
    l1Violations: [],
    winRate: {
      total: 0,
      breakdown: {
        macroMatch: { score: 0, weight: 15, note: '', agent: '宏观周期Agent' },
        industryProsperity: { score: 0, weight: 25, note: '', agent: '行业景气Agent' },
        fundamentalQuality: { score: 0, weight: 25, note: '', agent: '财报解读Agent' },
        complianceRisk: { score: 0, weight: 20, note: '', agent: '合规风控Agent' },
        sentimentAlignment: { score: 0, weight: 15, note: '', agent: '市场情绪Agent' },
      },
      vetoByCompliance: false,
      vetoByIndustryDeclineHighBeta: false,
      grade: '低',
    },
    oddRate: {
      total: 0,
      breakdown: {
        valuationAttractiveness: { score: 0, weight: 30, note: '', agent: '财报/行业景气' },
        upsidePotential: { score: 0, weight: 30, note: '', agent: '行业景气/技术形态' },
        downsideProtection: { score: 0, weight: 25, note: '', agent: '市场情绪/合规' },
        strategyFit: { score: 0, weight: 15, note: '', agent: '协调Agent' },
      },
      grade: '低',
      rewardRiskRatio: '1:1',
    },
    attractiveness: 0, // 胜率×0.6 + 赔率×0.4
    humanAdjustment: 0, // ±10分
    humanAdjustmentReason: '',
    finalAttractiveness: 0,
    priorityTier: 'C', // S≥85 / A70-84 / B50-69 / C<50
    positionAdvice: {
      matrixRange: { min: 0, max: 0 },
      ruleCap: 0,
      finalRange: { min: 0, max: 0 },
      strategyType: '价值', // 价值 / GARP / 逆向
      priorityRank: 0,
      rebalanceTriggers: { addPosition: '', trimPosition: '', takeProfit: '', stopLoss: '' },
      industryExposures: [],
      sameIndustryExposureTotal: 0,
      industryConcentrationOk: true,
    },
    l7Checks: {
      hasMemo: false,
      withinTradingPlan: true,
      noIntradayDecision: true,
      stopLossDefined: true,
      l7Passed: true,
      blockedReasons: [],
    },
    agentSources: [],
    updatedAt: '',
    isSample: false,
    ...partial,
  }
}

// ---------- 16. 基金代码穿透分析任务（第十五章 §15.9 五步流程） ----------
export function createFundAnalysisJob(partial = {}) {
  return {
    id: uid('FA'),
    code: '', // 输入入口：基金代码
    submittedAt: '',
    submittedBy: '手动', // 手动 / 协调Agent / 自动扫描
    step1: {
      status: '待执行', // 待执行 / 成功 / 失败
      fullName: '', fundType: '', fundCompany: '',
      manager: '', managerTenure: 0, inceptionDate: '',
      aum: 0, latestNav: 0, equityRatio: 0,
      dataSource: '', errorNote: '',
    },
    step2: {
      status: '待执行',
      topHoldings: [],
      industryDistribution: [],
      styleBox: '',
      primaryIndustry: '',
      capabilityCircleMatch: true,
      capabilityCircleGap: '',
    },
    step3: {
      status: '待执行',
      ytdReturn: 0, oneYearReturn: 0, threeYearAnnualReturn: 0,
      maxDrawdown: 0, sharpeRatio: 0, volatility: 0,
      trackingError: 0, informationRatio: 0,
      aumCheck: true,
      managerStyleStable: true,
      styleMatchCapability: true,
      companyComplianceClean: true,
      vetoHits: [],
      vetoPassed: true,
      finalFundScore: 0,
    },
    step4: { status: '待执行', scoreCardId: '', note: '' },
    step5: {
      status: '待执行',
      industryExposureCheck: true,
      totalEquityCheck: true,
      finalDecision: '待处理',
      decisionNote: '',
    },
    overallStatus: '进行中', // 进行中 / 已准入 / 已拒绝 / 待人工复核
    isSample: false,
    ...partial,
  }
}
