import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { seedData } from './seed'
import { nextBizId } from '../models/idGenerator'
import { canSubmitMemo } from '../utils/validators'
import { STORAGE_KEY } from './db'

const initial = seedData()

// v1 → v2：植入《个人投资体系总纲》后，用新种子替换全部示例数据（isSample），
// 保留用户已录入的非示例记录（如自定义原则、交易、备忘录）。
function migrateV2(persisted) {
  const fresh = seedData()
  const merged = {}
  for (const key of Object.keys(fresh)) {
    const oldList = Array.isArray(persisted && persisted[key]) ? persisted[key] : []
    const freshList = fresh[key] || []
    if (Array.isArray(freshList)) {
      merged[key] = [...oldList.filter((it) => !it || !it.isSample), ...freshList]
    } else {
      merged[key] = freshList
    }
  }
  return merged
}

// 实体 → 数组键 / 业务编号类型 映射
const ENTITY_META = {
  principles: { key: 'principles', idType: 'IS', idField: 'id' },
  l1: { key: 'l1', idType: null },
  methods: { key: 'methods', idType: 'M', idField: 'id' },
  targets: { key: 'targets', idType: null },
  trades: { key: 'trades', idType: null },
  reviews: { key: 'reviews', idType: null },
  observations: { key: 'observations', idType: null },
  memos: { key: 'memos', idType: 'MEMO', idField: 'id' },
  materials: { key: 'materials', idType: null },
  logs: { key: 'logs', idType: null },
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...initial,

      /** 通用创建：自动生成业务编号（IS/ERR/M/MEMO）。 */
      create: (entity, payload = {}) => {
        const meta = ENTITY_META[entity]
        if (!meta) return null
        const list = get()[meta.key] || []
        const record = { ...payload }
        if (meta.idType) record[meta.idField] = nextBizId(meta.idType, list)
        if (entity === 'reviews' && record.type === '错误清单' && !record.errId) {
          const errs = list.filter((r) => r.type === '错误清单')
          record.errId = nextBizId('ERR', errs)
        }
        if (entity === 'principles') {
          record.createdAt = record.createdAt || today()
          record.updatedAt = today()
        }
        if (entity === 'memos') record.date = record.date || today()
        if (entity === 'observations') record.createdAt = record.createdAt || today()
        if (entity === 'logs') record.createdAt = record.createdAt || today()
        set({ [meta.key]: [...list, record] })
        return record
      },

      /** 通用更新（合并字段）。 */
      update: (entity, id, payload = {}) => {
        const meta = ENTITY_META[entity]
        if (!meta) return
        const list = get()[meta.key] || []
        const next = list.map((item) => {
          if (item.id !== id) return item
          const merged = { ...item, ...payload }
          if (entity === 'principles') merged.updatedAt = today()
          return merged
        })
        set({ [meta.key]: next })
      },

      /** 通用删除。 */
      remove: (entity, id) => {
        const meta = ENTITY_META[entity]
        if (!meta) return
        const list = get()[meta.key] || []
        set({ [meta.key]: list.filter((item) => item.id !== id) })
      },

      /** 清空全部示例数据（仅删除 isSample=true 的记录）。 */
      clearSamples: () => {
        const patch = {}
        for (const meta of Object.values(ENTITY_META)) {
          const list = get()[meta.key] || []
          patch[meta.key] = list.filter((item) => !item.isSample)
        }
        set(patch)
      },

      /** 便捷：错误库（reviews 中 type=错误清单）。 */
      getErrors: () => get().reviews.filter((r) => r.type === '错误清单'),

      /** 首页「今天要处理」聚合（可点击跳转）。 */
      getTodolist: () => {
        const s = get()
        const items = []
        const boundaryTrades = s.trades.filter((t) => t.isOutOfBoundary)
        if (boundaryTrades.length) {
          items.push({
            id: 'boundary',
            type: '边界外交易',
            label: `边界外交易待人工复核（${boundaryTrades.length} 笔）`,
            count: boundaryTrades.length,
            route: '/trade',
            tone: 'warn',
          })
        }
        const pendingMemos = s.memos.filter((m) => !canSubmitMemo(m))
        if (pendingMemos.length) {
          items.push({
            id: 'gate',
            type: '备忘录闸门',
            label: `决策前闸门未通过的备忘录（${pendingMemos.length} 份）`,
            count: pendingMemos.length,
            route: '/memo',
            tone: 'warn',
          })
        }
        const pendingObs = s.observations.filter((o) => o.status === '待归档')
        if (pendingObs.length) {
          items.push({
            id: 'obs',
            type: '待归档灵感',
            label: `待归档的市场观察与灵感（${pendingObs.length} 条）`,
            count: pendingObs.length,
            route: '/inspiration',
            tone: 'ai',
          })
        }
        const verifyMethods = s.methods.filter((m) => m.status === '待验证')
        if (verifyMethods.length) {
          items.push({
            id: 'method',
            type: '待验证方法',
            label: `待验证的策略方法（${verifyMethods.length} 个）`,
            count: verifyMethods.length,
            route: '/methods',
            tone: 'neutral',
          })
        }
        const verifyErrors = s.reviews.filter((r) => r.type === '错误清单' && r.status === '待验证')
        if (verifyErrors.length) {
          items.push({
            id: 'err',
            type: '待验证错误',
            label: `待验证的错误条目（${verifyErrors.length} 条）`,
            count: verifyErrors.length,
            route: '/review',
            tone: 'neutral',
          })
        }
        return items
      },

      /** 首页看板 KPI。 */
      getKpis: () => {
        const s = get()
        const ym = today().slice(0, 7)
        const monthTrades = s.trades.filter((t) => (t.date || '').startsWith(ym)).length
        const pendingGates = s.memos.filter((m) => !canSubmitMemo(m)).length
        return {
          insights: s.observations.length,
          pendingGates,
          monthTrades,
          memoryVersion: s.version || 'v1.0',
        }
      },

      /** 交易页 KPI（胜率 / 边界外 / 累计收益）。 */
      getTradeKpis: () => {
        const s = get()
        const closed = s.trades.filter((t) => typeof t.profit === 'number')
        const wins = closed.filter((t) => t.profit > 0).length
        const winRate = closed.length ? (wins / closed.length) * 100 : 0
        const boundary = s.trades.filter((t) => t.isOutOfBoundary).length
        const cumulative = closed.reduce((sum, t) => sum + (t.profit || 0), 0)
        return { total: s.trades.length, winRate, boundary, cumulative }
      },

      /** 最近备忘录（按日期倒序）。 */
      getRecentMemos: () => {
        const s = get()
        return [...s.memos].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5)
      },

      /** 三层记忆概览数据。 */
      getMemoryLayers: () => {
        const s = get()
        const isCount = s.principles.length
        const cited = s.principles.filter((p) => (s.memos.some((m) => m.isIds?.includes(p.id)))).length
        const avgConf = isCount
          ? Math.round(s.principles.reduce((a, p) => a + Number(p.confidence || 0), 0) / isCount)
          : 0
        return {
          l1: {
            title: 'L1 核心原则',
            metrics: [
              `${isCount} 条原则`,
              `3 维度`,
              `${avgConf}% 置信`,
              `${cited}/${isCount} 被引用`,
            ],
            tone: 'primary',
          },
          l2: {
            title: 'L2 当前体系版本',
            metrics: [`${s.version || 'v1.0'}`, `${s.logs.length} 条变更`, `${s.methods.length} 个方法`, `+${s.methods.length}`],
            tone: 'warn',
          },
          l3: {
            title: 'L3 学习档案',
            metrics: [`${s.targets.length} 篇研究`, `${s.materials.length} 资料`, `${s.observations.length} 观察`, `${s.reviews.length} 复盘`],
            tone: 'ai',
          },
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: migrateV2,
    },
  ),
)

export default useStore
