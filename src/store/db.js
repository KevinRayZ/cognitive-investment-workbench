/**
 * localStorage 数据层封装。
 * 提供版本前缀、读写、迁移占位与清空示例所需的键管理。
 * Zustand persist 直接使用原生 localStorage；本文件作为统一键与兜底工具。
 */

export const STORAGE_KEY = 'ciw_store_v1'

/** 读取持久化原始 JSON（带异常兜底）。 */
export function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn('[db] loadRaw failed', e)
    return null
  }
}

/** 写入持久化 JSON（带异常兜底）。 */
export function saveRaw(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    return true
  } catch (e) {
    console.warn('[db] saveRaw failed', e)
    return false
  }
}

/** 清空全部持久化数据（危险操作，仅用于调试）。 */
export function clearAll() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('[db] clearAll failed', e)
  }
}
