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
