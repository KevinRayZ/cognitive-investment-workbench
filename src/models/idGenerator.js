import { nanoid } from 'nanoid'

/**
 * 业务编号生成器。
 * 原则 IS-YYYY-NNN / 错误 ERR-YYYY-NNN / 方法 M-YYYY-NNN / 备忘录 MEMO-YYYY-NNN
 * 按创建年份自增（每年重置），通过对已有记录扫描最大值 +1 得到，保证稳定可重现。
 * 内部实体唯一 id 走 nanoid。
 */

export const PREFIX = {
  IS: 'IS',
  ERR: 'ERR',
  M: 'M',
  MEMO: 'MEMO',
}

export const WIDTH = {
  IS: 3,
  ERR: 3,
  M: 3,
  MEMO: 4,
}

/**
 * 计算下一个业务编号。
 * @param {('IS'|'ERR'|'M'|'MEMO')} type 编号类型
 * @param {Array<{id?:string}>} existing 已存在的同类型记录
 * @param {number} [year] 年份，默认当前年
 * @returns {string} 形如 IS-2026-001
 */
export function nextBizId(type, existing = [], year = new Date().getFullYear()) {
  const prefix = PREFIX[type]
  const width = WIDTH[type]
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const item of existing) {
    const m = re.exec(item?.id || '')
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(width, '0')}`
}

/** 内部实体唯一 id（用于 L1 / 标的 / 交易 / 复盘 / 观察 / 资料 / 日志 等非业务编号实体）。 */
export function uid(prefix = 'id') {
  return `${prefix}_${nanoid(8)}`
}

export default { nextBizId, uid, PREFIX, WIDTH }
