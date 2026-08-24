import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import tokens from '../../theme/tokens'
import { suggestedRange, ASSET_CAP } from '../../utils/dashboard'

const VIEW_COLOR = { 乐观: tokens.up, 中性: tokens.ink500, 谨慎: tokens.down }
const VIEW_OPTS = ['乐观', '中性', '谨慎']

function scoreTone(score) {
  if (score >= 66) return tokens.up
  if (score >= 40) return tokens.primary
  return tokens.down
}

function AssetCard({ asset, onChange }) {
  const { cap, center, low, high } = suggestedRange(asset)
  const bandLeft = (low / cap) * 100
  const bandWidth = ((high - low) / cap) * 100
  const centerLeft = (center / cap) * 100
  const tone = VIEW_COLOR[asset.view] || tokens.ink500

  return (
    <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink900 }}>{asset.name}</Typography>
        <FormControl size="small" sx={{ minWidth: 84 }}>
          <Select
            value={asset.view}
            onChange={(e) => onChange(asset.id, { view: e.target.value })}
            sx={{ fontSize: 12, height: 30, '& .MuiSelect-select': { py: 0.5 } }}
          >
            {VIEW_OPTS.map((v) => (
              <MenuItem key={v} value={v} sx={{ fontSize: 12 }}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 建议仓位区间条 */}
      <Box sx={{ position: 'relative', height: 12, borderRadius: 6, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}`, mb: 0.5 }}>
        <Box sx={{ position: 'absolute', left: `${bandLeft}%`, width: `${bandWidth}%`, top: 0, bottom: 0, borderRadius: 6, bgcolor: scoreTone(asset.score), opacity: 0.55 }} />
        <Box sx={{ position: 'absolute', left: `calc(${centerLeft}% - 1.5px)`, width: 3, top: -2, bottom: -2, borderRadius: 2, bgcolor: scoreTone(asset.score) }} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: scoreTone(asset.score) }}>
          建议 {low}%–{high}%
        </Typography>
        <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>上限 {cap}%</Typography>
      </Box>

      {/* 客观评分 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 11.5, color: tokens.ink500, whiteSpace: 'nowrap' }}>吸引力</Typography>
        <Slider
          value={Number(asset.score)}
          min={0}
          max={100}
          onChange={(_, v) => onChange(asset.id, { score: v })}
          size="small"
          sx={{ color: scoreTone(asset.score), flex: 1 }}
        />
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: scoreTone(asset.score), width: 30, textAlign: 'right', fontFamily: '"Roboto Mono", monospace' }}>
          {asset.score}
        </Typography>
      </Box>
    </Box>
  )
}

export default function AssetAttractiveness({ assets = [], onChange }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
      {assets.map((a) => (
        <AssetCard key={a.id} asset={a} onChange={onChange} />
      ))}
      {assets.length === 0 && (
        <Typography sx={{ color: tokens.ink400, gridColumn: '1 / -1', p: 2 }}>暂无资产数据。</Typography>
      )}
    </Box>
  )
}
