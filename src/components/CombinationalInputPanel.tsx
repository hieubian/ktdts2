import React, { useState } from 'react'
import type { CombinationalRow, CombinationalSubtype, LedPolarity, SingleRuleIgnoreMode } from '../types'
import type { SegmentName } from '../utils/sevenSegment'
import { ProblemSummaryCard } from './ProblemSummaryCard'
import { Check, CheckCheck, RefreshCw, Sparkles, Trash2 } from 'lucide-react'

interface CombinationalInputPanelProps {
  subtype: CombinationalSubtype
  onSubtypeChange: (type: CombinationalSubtype) => void
  outputPrefix: 'F' | 'G' | 'Y'
  onOutputPrefixChange: (p: 'F' | 'G' | 'Y') => void
  singleRuleRows?: CombinationalRow[]
  onSingleRuleRowsChange: (newRows: CombinationalRow[]) => void
  converterRows?: CombinationalRow[]
  onConverterRowsChange: (newRows: CombinationalRow[]) => void
  polarity: LedPolarity
  onPolarityChange: (p: LedPolarity) => void
  sevenSegChars: string
  onSevenSegCharsChange: (chars: string) => void
  selectedOutputs: string[]
  onSelectedOutputsChange: (outs: string[]) => void
  allRows?: CombinationalRow[]
  outputVars?: string[]
}

const COMMON_7SEG_EXAMPLES = [
  { label: '4, 5, 6, 7, 8, 9, A, b, C (Anot chung)', chars: '456789AbC', segs: ['e', 'f', 'g'], pol: 'anode_common' as LedPolarity },
  { label: '1, 2, 3, 4, 5, 6, 7, 8, 9, A (Cathode chung)', chars: '123456789A', segs: ['a', 'b', 'c'], pol: 'cathode_common' as LedPolarity },
  { label: '5, 6, 7, 8, 9, A, E, d, P, H (Cathode chung)', chars: '56789AEdPH', segs: ['a', 'd', 'g'], pol: 'cathode_common' as LedPolarity },
  { label: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9 (Số 0–9)', chars: '0123456789', segs: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], pol: 'cathode_common' as LedPolarity }
]

export const CombinationalInputPanel: React.FC<CombinationalInputPanelProps> = ({
  subtype,
  onSubtypeChange,
  outputPrefix,
  onOutputPrefixChange,
  singleRuleRows = [],
  onSingleRuleRowsChange,
  converterRows = [],
  onConverterRowsChange,
  polarity,
  onPolarityChange,
  sevenSegChars,
  onSevenSegCharsChange,
  selectedOutputs,
  onSelectedOutputsChange,
  allRows = [],
  outputVars = ['F']
}) => {
  const [converterSubTab, setConverterSubTab] = useState<'presets' | 'custom'>('presets')
  const [activeConverterName, setActiveConverterName] = useState<string>('Mã 5211 (BCD 0–9)')

  const [numSystemMode, setNumSystemMode] = useState<'decimal' | 'binary'>('decimal')
  const [logicLevelMode, setLogicLevelMode] = useState<'sop_high' | 'pos_low'>('sop_high')
  const [ignoreMode, setIgnoreMode] = useState<SingleRuleIgnoreMode>('bcd_10_15')
  const [activeRuleTitle, setActiveRuleTitle] = useState<string>('Chia hết cho 2 hoặc 5 (BCD 0–9)')

  const [decimalText, setDecimalText] = useState<string>('0, 2, 4, 5, 6, 8')
  const [binaryText, setBinaryText] = useState<string>('0000, 0010, 0100, 0101, 0110, 1000')
  const [customIgnoreDecimalText, setCustomIgnoreDecimalText] = useState<string>('10, 11, 12, 13, 14, 15')
  const [customIgnoreBinaryText, setCustomIgnoreBinaryText] = useState<string>('1010, 1011, 1100, 1101, 1110, 1111')
  const [customCodesText, setCustomCodesText] = useState<string>('0000, 0001, 0100, 0101, 0111, 1000, 1001, 1100, 1101, 1111')
  const [customStartDec, setCustomStartDec] = useState<number>(0)

  const [validationError, setValidationError] = useState<string | null>(null)
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null)

  const decToBin4 = (n: number): string => n.toString(2).padStart(4, '0')

  const validateAndParseDecimal = (text: string): { valid: boolean; values: number[]; error?: string } => {
    const rawTokens = text.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean)
    if (rawTokens.length === 0) return { valid: true, values: [] }

    const parsed: number[] = []
    for (const token of rawTokens) {
      if (!/^\d+$/.test(token)) {
        return { valid: false, values: [], error: `Ký tự "${token}" không phải số nguyên hợp lệ.` }
      }
      const val = parseInt(token, 10)
      if (val < 0 || val > 15) {
        return { valid: false, values: [], error: `Số ${val} nằm ngoài phạm vi 4 biến (0 đến 15).` }
      }
      parsed.push(val)
    }
    return { valid: true, values: Array.from(new Set(parsed)).sort((a, b) => a - b) }
  }

  const validateAndParseBinary = (text: string): { valid: boolean; values: number[]; error?: string } => {
    const rawTokens = text.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean)
    if (rawTokens.length === 0) return { valid: true, values: [] }

    const parsed: number[] = []
    for (const token of rawTokens) {
      const clean = token.replace(/[^01]/g, '')
      if (clean.length !== 4) {
        return { valid: false, values: [], error: `Tổ hợp "${token}" không đúng 4-bit nhị phân.` }
      }
      parsed.push(parseInt(clean, 2))
    }
    return { valid: true, values: Array.from(new Set(parsed)).sort((a, b) => a - b) }
  }

  const applySingleRuleNumbers = (
    targetNumbers: number[],
    activeHigh: boolean,
    mode: SingleRuleIgnoreMode = ignoreMode,
    customIgnoreNums?: number[]
  ) => {
    const targetSet = new Set(targetNumbers)
    const ignoreSet = new Set<number>()

    if (mode === 'remaining_are_unused') {
      for (let i = 0; i < 16; i++) {
        if (!targetSet.has(i)) ignoreSet.add(i)
      }
    } else if (mode === 'bcd_10_15') {
      for (let i = 10; i <= 15; i++) ignoreSet.add(i)
    } else if (mode === 'custom') {
      const igList =
        customIgnoreNums ??
        (numSystemMode === 'decimal'
          ? validateAndParseDecimal(customIgnoreDecimalText).values
          : validateAndParseBinary(customIgnoreBinaryText).values)
      igList.forEach((n) => ignoreSet.add(n))
    }

    const validRows: CombinationalRow[] = []
    const unusedRows: CombinationalRow[] = []

    for (let i = 0; i < 16; i++) {
      if (ignoreSet.has(i)) {
        unusedRows.push({
          id: `rule-unused-${i}`,
          decimal: i,
          inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
          outputBits: ['X'],
          isUnused: true
        })
      } else {
        const isMatch = targetSet.has(i)
        const bitVal = activeHigh ? (isMatch ? 1 : 0) : (isMatch ? 0 : 1)
        validRows.push({
          id: `rule-${i}`,
          decimal: i,
          inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
          outputBits: [bitVal],
          isUnused: false
        })
      }
    }

    onSingleRuleRowsChange([...validRows, ...unusedRows])
  }

  const handleSubmitSingleRule = (overrideLevel?: 'sop_high' | 'pos_low', overrideMode?: SingleRuleIgnoreMode) => {
    const activeLevel = overrideLevel || logicLevelMode
    const isHigh = activeLevel === 'sop_high'
    const activeMode = overrideMode || ignoreMode

    let parsedTargets: number[] = []
    if (numSystemMode === 'decimal') {
      const res = validateAndParseDecimal(decimalText)
      if (!res.valid) {
        setValidationError(res.error || 'Dữ liệu không hợp lệ')
        setValidationSuccess(null)
        return
      }
      parsedTargets = res.values
      setBinaryText(parsedTargets.map(decToBin4).join(', '))
    } else {
      const res = validateAndParseBinary(binaryText)
      if (!res.valid) {
        setValidationError(res.error || 'Dữ liệu không hợp lệ')
        setValidationSuccess(null)
        return
      }
      parsedTargets = res.values
      setDecimalText(parsedTargets.join(', '))
    }

    let parsedCustomIgnores: number[] = []
    if (activeMode === 'custom') {
      const igRes =
        numSystemMode === 'decimal'
          ? validateAndParseDecimal(customIgnoreDecimalText)
          : validateAndParseBinary(customIgnoreBinaryText)
      if (!igRes.valid) {
        setValidationError(igRes.error || 'Danh sách cấm không hợp lệ')
        setValidationSuccess(null)
        return
      }
      parsedCustomIgnores = igRes.values
    }

    setValidationError(null)
    applySingleRuleNumbers(parsedTargets, isHigh, activeMode, parsedCustomIgnores)
    setValidationSuccess(`Đã áp dụng ${parsedTargets.length} tổ hợp vào hệ thống logic.`)
  }

  const handlePresetSingleRule = (targets: number[], title: string, mode: SingleRuleIgnoreMode) => {
    setActiveRuleTitle(title)
    setIgnoreMode(mode)
    setLogicLevelMode('sop_high')
    setDecimalText(targets.join(', '))
    setBinaryText(targets.map(decToBin4).join(', '))
    setValidationError(null)

    if (mode === 'bcd_10_15') {
      setCustomIgnoreDecimalText('10, 11, 12, 13, 14, 15')
      setCustomIgnoreBinaryText('1010, 1011, 1100, 1101, 1110, 1111')
    }

    applySingleRuleNumbers(targets, true, mode)
    setValidationSuccess(`Đã chọn điều kiện: "${title}".`)
  }

  // --- PRESET HANDLERS FOR CODE CONVERTERS ---
  const handleRuleBinaryTo5211 = () => {
    setActiveConverterName('Mã 5211 (BCD 0–9)')
    onOutputPrefixChange('F')
    const mapping: Record<number, number[]> = {
      0: [0, 0, 0, 0],
      1: [0, 0, 0, 1],
      2: [0, 1, 0, 0],
      3: [0, 1, 0, 1],
      4: [0, 1, 1, 1],
      5: [1, 0, 0, 0],
      6: [1, 0, 0, 1],
      7: [1, 1, 0, 0],
      8: [1, 1, 0, 1],
      9: [1, 1, 1, 1]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `r-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: mapping[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Mã BCD 0–9 sang mã 5211 (10–15 là cấm X).')
  }

  const handleRuleBinaryToExcess3Ring = () => {
    setActiveConverterName('Mã vòng dư 3 (BCD 0–9)')
    onOutputPrefixChange('F')
    const ringMap10: Record<number, number[]> = {
      0: [0, 0, 1, 0],
      1: [0, 1, 1, 0],
      2: [0, 1, 1, 1],
      3: [0, 1, 0, 1],
      4: [0, 1, 0, 0],
      5: [1, 1, 0, 0],
      6: [1, 1, 0, 1],
      7: [1, 1, 1, 1],
      8: [1, 1, 1, 0],
      9: [1, 0, 1, 0]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `ring-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: ringMap10[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Nhị phân 0–9 sang Mã vòng dư 3 (10–15 là cấm X).')
  }

  const handleRuleBcdToGray = () => {
    setActiveConverterName('Mã Gray 4-bit (BCD 0–9)')
    onOutputPrefixChange('G')
    const grayMap10: Record<number, number[]> = {
      0: [0, 0, 0, 0],
      1: [0, 0, 0, 1],
      2: [0, 0, 1, 1],
      3: [0, 0, 1, 0],
      4: [0, 1, 1, 0],
      5: [0, 1, 1, 1],
      6: [0, 1, 0, 1],
      7: [0, 1, 0, 0],
      8: [1, 1, 0, 0],
      9: [1, 1, 0, 1]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `bcd-gray-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: grayMap10[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Mã BCD 0–9 sang mã Gray 4-bit (10–15 là cấm X).')
  }

  const handleRuleBinaryToGray = () => {
    setActiveConverterName('Mã Gray 16 tổ hợp (0–15)')
    onOutputPrefixChange('G')
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec < 16; dec++) {
      const b3 = (dec >> 3) & 1
      const b2 = (dec >> 2) & 1
      const b1 = (dec >> 1) & 1
      const b0 = dec & 1
      newRows.push({
        id: `gray-${dec}`,
        decimal: dec,
        inputBits: [b3, b2, b1, b0],
        outputBits: [b3, b3 ^ b2, b2 ^ b1, b1 ^ b0],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Đầy đủ 16 tổ hợp Nhị phân sang mã Gray phản xạ.')
  }

  const handleRuleBcdTo2421 = () => {
    setActiveConverterName('Mã 2421 / Aiken (BCD 0–9)')
    onOutputPrefixChange('F')
    const aikenMap: Record<number, number[]> = {
      0: [0, 0, 0, 0],
      1: [0, 0, 0, 1],
      2: [0, 0, 1, 0],
      3: [0, 0, 1, 1],
      4: [0, 1, 0, 0],
      5: [1, 0, 1, 1],
      6: [1, 1, 0, 0],
      7: [1, 1, 0, 1],
      8: [1, 1, 1, 0],
      9: [1, 1, 1, 1]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 0; dec <= 9; dec++) {
      newRows.push({
        id: `aiken-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: aikenMap[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Mã BCD 0–9 sang mã tự bù 2421 (10–15 là cấm X).')
  }

  const handleRuleExcess3To5211 = () => {
    setActiveConverterName('Mã Dư 3 sang 5211 (3–12)')
    onOutputPrefixChange('F')
    const mapping: Record<number, number[]> = {
      3: [0, 0, 0, 0],
      4: [0, 0, 0, 1],
      5: [0, 1, 0, 0],
      6: [0, 1, 0, 1],
      7: [0, 1, 1, 1],
      8: [1, 0, 0, 0],
      9: [1, 0, 0, 1],
      10: [1, 1, 0, 0],
      11: [1, 1, 0, 1],
      12: [1, 1, 1, 1]
    }
    const newRows: CombinationalRow[] = []
    for (let dec = 3; dec <= 12; dec++) {
      newRows.push({
        id: `r-${dec}`,
        decimal: dec,
        inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
        outputBits: mapping[dec],
        isUnused: false
      })
    }
    onConverterRowsChange(newRows)
    setValidationSuccess('Đã áp dụng: Mã Dư 3 sang mã 5211 (0–2 và 13–15 là cấm X).')
  }

  const handleApplyCustomConverterTable = () => {
    const rawTokens = customCodesText.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean)
    if (rawTokens.length === 0) {
      setValidationError('Vui lòng nhập ít nhất một từ mã đầu ra.')
      setValidationSuccess(null)
      return
    }

    if (rawTokens.length > 16) {
      setValidationError('Số lượng từ mã không được vượt quá 16 (tương ứng tổ hợp 4-bit).')
      setValidationSuccess(null)
      return
    }

    const cleanedCodes: number[][] = []
    for (let idx = 0; idx < rawTokens.length; idx++) {
      const token = rawTokens[idx]
      const cleanBits = token.replace(/[^01]/g, '')
      if (cleanBits.length !== 4) {
        setValidationError(`Từ mã thứ ${idx + 1} ("${token}") phải gồm đúng 4-bit nhị phân 0 hoặc 1.`)
        setValidationSuccess(null)
        return
      }
      cleanedCodes.push(cleanBits.split('').map((b) => parseInt(b, 10)))
    }

    const start = customStartDec
    const newRows: CombinationalRow[] = []

    cleanedCodes.forEach((bits, offset) => {
      const dec = start + offset
      if (dec < 16) {
        newRows.push({
          id: `custom-r-${dec}`,
          decimal: dec,
          inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
          outputBits: bits,
          isUnused: false
        })
      }
    })

    setActiveConverterName('Mã chuyển đổi tùy chỉnh')
    onConverterRowsChange(newRows)
    setValidationError(null)
    setValidationSuccess(`Đã áp dụng bảng gồm ${newRows.length} từ mã bắt đầu từ số ${start}.`)
  }

  const handleApply7SegExample = (ex: (typeof COMMON_7SEG_EXAMPLES)[0]) => {
    onSevenSegCharsChange(ex.chars)
    onPolarityChange(ex.pol)
    onSelectedOutputsChange(ex.segs)
    setValidationSuccess(`Đã áp dụng mẫu: "${ex.label}".`)
  }

  const handleSegmentToggle = (seg: SegmentName) => {
    if (selectedOutputs.includes(seg)) {
      if (selectedOutputs.length > 1) {
        onSelectedOutputsChange(selectedOutputs.filter((s) => s !== seg))
      }
    } else {
      const allOrder: SegmentName[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      const next = [...selectedOutputs, seg].sort(
        (a, b) => allOrder.indexOf(a as SegmentName) - allOrder.indexOf(b as SegmentName)
      )
      onSelectedOutputsChange(next)
    }
  }

  return (
    <div className="input-panel-card">
      {/* --- SUBTYPE SELECTION HEADER --- */}
      <div className="comb-type-selector-banner">
        <label className="config-label font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>Chọn dạng bài tập Mạch tổ hợp (Câu 2):</span>
        </label>
        <div className="segmented-control w-full">
          <button
            type="button"
            className={`segmented-btn flex-1 ${subtype === 'single_rule' ? 'active' : ''}`}
            onClick={() => onSubtypeChange('single_rule')}
          >
            1. Hàm logic theo điều kiện (1 ngõ ra F)
          </button>
          <button
            type="button"
            className={`segmented-btn flex-1 ${subtype === 'code_converter' ? 'active' : ''}`}
            onClick={() => onSubtypeChange('code_converter')}
          >
            2. Mạch chuyển đổi mã (4 ngõ ra)
          </button>
          <button
            type="button"
            className={`segmented-btn flex-1 ${subtype === 'seven_segment' ? 'active' : ''}`}
            onClick={() => onSubtypeChange('seven_segment')}
          >
            3. Giải mã LED 7 thanh (a–g)
          </button>
        </div>
      </div>

      {/* --- SUBTYPE 1: SINGLE RULE --- */}
      {subtype === 'single_rule' && (
        <div className="comb-subpanel-content">
          <div className="panel-config-row">
            <div className="config-item">
              <label className="config-label">Ký hiệu ngõ ra:</label>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${outputPrefix === 'F' ? 'active' : ''}`}
                  onClick={() => onOutputPrefixChange('F')}
                >
                  Hàm F
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${outputPrefix === 'Y' ? 'active' : ''}`}
                  onClick={() => onOutputPrefixChange('Y')}
                >
                  Hàm Y
                </button>
              </div>
            </div>

            <div className="config-item">
              <label className="config-label">Quy ước logic:</label>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${logicLevelMode === 'sop_high' ? 'active' : ''}`}
                  onClick={() => {
                    setLogicLevelMode('sop_high')
                    handleSubmitSingleRule('sop_high')
                  }}
                >
                  {outputPrefix} = 1 khi thỏa mãn (SOP)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${logicLevelMode === 'pos_low' ? 'active' : ''}`}
                  onClick={() => {
                    setLogicLevelMode('pos_low')
                    handleSubmitSingleRule('pos_low')
                  }}
                >
                  {outputPrefix} = 0 khi thỏa mãn (POS)
                </button>
              </div>
            </div>

            <div className="config-item">
              <label className="config-label">Trạng thái cấm (X / d):</label>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${ignoreMode === 'bcd_10_15' ? 'active' : ''}`}
                  onClick={() => {
                    setIgnoreMode('bcd_10_15')
                    handleSubmitSingleRule(undefined, 'bcd_10_15')
                  }}
                  title="Mã BCD: Chỉ xét 0..9 hợp lệ, 10..15 là trạng thái cấm"
                >
                  Mã BCD (cấm 10–15)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${ignoreMode === 'none' ? 'active' : ''}`}
                  onClick={() => {
                    setIgnoreMode('none')
                    handleSubmitSingleRule(undefined, 'none')
                  }}
                  title="Đầy đủ 16 tổ hợp 0..15, không có cấm"
                >
                  Đầy đủ 0–15
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${ignoreMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setIgnoreMode('custom')}
                >
                  Tùy chỉnh cấm
                </button>
              </div>
            </div>
          </div>

          <div className="comb-quick-presets-bar">
            <span className="helper-label font-semibold">Mẫu điều kiện nhanh:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([0, 2, 4, 5, 6, 8], 'Chia hết cho 2 hoặc 5 (BCD 0–9)', 'bcd_10_15')}
              >
                Chia hết cho 2 hoặc 5
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15], 'Số bit 1 ≥ Số bit 0', 'none')}
              >
                Số bit 1 ≥ Số bit 0
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([1, 2, 4, 7, 8, 11, 13, 14], 'Số bit 1 là số lẻ (Parity)', 'none')}
              >
                Số bit 1 lẻ (Parity)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([0, 2, 4, 6, 8, 10, 12, 14], 'Số chẵn (0, 2, 4, 6...)', 'none')}
              >
                Số chẵn (0, 2, 4...)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([1, 3, 5, 7, 9, 11, 13, 15], 'Số lẻ (1, 3, 5, 7...)', 'none')}
              >
                Số lẻ (1, 3, 5...)
              </button>
              <button
                type="button"
                className="helper-pill-btn"
                onClick={() => handlePresetSingleRule([2, 3, 5, 7], 'Số nguyên tố BCD (2, 3, 5, 7)', 'bcd_10_15')}
              >
                Số nguyên tố BCD
              </button>
            </div>
          </div>

          <div className="input-group-field mt-3">
            <div className="flex justify-between items-center mb-1">
              <label className="field-label">
                {numSystemMode === 'decimal'
                  ? `Nhập danh sách số thập phân mà ${outputPrefix} = ${logicLevelMode === 'sop_high' ? '1' : '0'}:`
                  : `Nhập danh sách mã nhị phân 4-bit mà ${outputPrefix} = ${logicLevelMode === 'sop_high' ? '1' : '0'}:`}
              </label>
              <div className="segmented-control micro">
                <button
                  type="button"
                  className={`segmented-btn ${numSystemMode === 'decimal' ? 'active' : ''}`}
                  onClick={() => setNumSystemMode('decimal')}
                >
                  Thập phân
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${numSystemMode === 'binary' ? 'active' : ''}`}
                  onClick={() => setNumSystemMode('binary')}
                >
                  Nhị phân 4-bit
                </button>
              </div>
            </div>

            <div className="input-with-button-row">
              {numSystemMode === 'decimal' ? (
                <input
                  type="text"
                  className="text-input mono font-bold"
                  value={decimalText}
                  onChange={(e) => setDecimalText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitSingleRule()}
                  placeholder="Ví dụ: 0, 2, 4, 5, 6, 8"
                />
              ) : (
                <input
                  type="text"
                  className="text-input mono font-bold"
                  value={binaryText}
                  onChange={(e) => setBinaryText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitSingleRule()}
                  placeholder="Ví dụ: 0000, 0010, 0100, 0101"
                />
              )}
              <button
                type="button"
                className="action-pill-btn active-accent"
                onClick={() => handleSubmitSingleRule()}
              >
                <Check className="w-4 h-4" />
                <span>Áp dụng</span>
              </button>
            </div>
          </div>

          {ignoreMode === 'custom' && (
            <div className="input-group-field mt-2">
              <label className="field-label">
                {numSystemMode === 'decimal' ? 'Các số trạng thái cấm (d/X):' : 'Các từ mã nhị phân trạng thái cấm (d/X):'}
              </label>
              <input
                type="text"
                className="text-input mono"
                value={numSystemMode === 'decimal' ? customIgnoreDecimalText : customIgnoreBinaryText}
                onChange={(e) => {
                  if (numSystemMode === 'decimal') setCustomIgnoreDecimalText(e.target.value)
                  else setCustomIgnoreBinaryText(e.target.value)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitSingleRule()}
                placeholder="Ví dụ: 10, 11, 12, 13, 14, 15"
              />
            </div>
          )}
        </div>
      )}

      {/* --- SUBTYPE 2: CODE CONVERTER --- */}
      {subtype === 'code_converter' && (
        <div className="comb-subpanel-content">
          <div className="panel-config-row">
            <div className="config-item">
              <label className="config-label">Ký hiệu 4 hàm ngõ ra:</label>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${outputPrefix === 'F' ? 'active' : ''}`}
                  onClick={() => onOutputPrefixChange('F')}
                >
                  F₁...F₄
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${outputPrefix === 'G' ? 'active' : ''}`}
                  onClick={() => onOutputPrefixChange('G')}
                >
                  G₃...G₀ (Gray)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${outputPrefix === 'Y' ? 'active' : ''}`}
                  onClick={() => onOutputPrefixChange('Y')}
                >
                  Y₁...Y₄
                </button>
              </div>
            </div>

            <div className="config-item">
              <label className="config-label">Phương thức chọn mã:</label>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${converterSubTab === 'presets' ? 'active' : ''}`}
                  onClick={() => setConverterSubTab('presets')}
                >
                  Mẫu mã chuẩn
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${converterSubTab === 'custom' ? 'active' : ''}`}
                  onClick={() => setConverterSubTab('custom')}
                >
                  Tự nhập bảng mã
                </button>
              </div>
            </div>
          </div>

          {converterSubTab === 'presets' ? (
            <div className="converter-presets-grid-compact mt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  className={`preset-chip-box ${activeConverterName.includes('5211 (BCD') ? 'active' : ''}`}
                  onClick={handleRuleBinaryTo5211}
                >
                  <div className="chip-header">
                    <span className="chip-name font-bold">Mã 5211 (BCD 0–9)</span>
                    <span className="chip-badge">Cấm 10–15</span>
                  </div>
                  <span className="chip-sub">10 tổ hợp BCD sang 4 bit mã 5211</span>
                </button>

                <button
                  type="button"
                  className={`preset-chip-box ${activeConverterName.includes('vòng dư 3') ? 'active' : ''}`}
                  onClick={handleRuleBinaryToExcess3Ring}
                >
                  <div className="chip-header">
                    <span className="chip-name font-bold">Mã vòng dư 3</span>
                    <span className="chip-badge">Cấm 10–15</span>
                  </div>
                  <span className="chip-sub">10 tổ hợp nhị phân 0–9 sang mã vòng</span>
                </button>

                <button
                  type="button"
                  className={`preset-chip-box ${activeConverterName.includes('Gray 4-bit') ? 'active' : ''}`}
                  onClick={handleRuleBcdToGray}
                >
                  <div className="chip-header">
                    <span className="chip-name font-bold">Mã Gray 4-bit</span>
                    <span className="chip-badge">Cấm 10–15</span>
                  </div>
                  <span className="chip-sub">BCD 0–9 sang Gray G₃, G₂, G₁, G₀</span>
                </button>

                <button
                  type="button"
                  className={`preset-chip-box ${activeConverterName.includes('Gray 16') ? 'active' : ''}`}
                  onClick={handleRuleBinaryToGray}
                >
                  <div className="chip-header">
                    <span className="chip-name font-bold">Mã Gray 16 tổ hợp</span>
                    <span className="chip-badge info">Đầy đủ 0–15</span>
                  </div>
                  <span className="chip-sub">16 tổ hợp nhị phân sang Gray phản xạ</span>
                </button>

                <button
                  type="button"
                  className={`preset-chip-box ${activeConverterName.includes('2421') ? 'active' : ''}`}
                  onClick={handleRuleBcdTo2421}
                >
                  <div className="chip-header">
                    <span className="chip-name font-bold">Mã 2421 (Aiken)</span>
                    <span className="chip-badge">Cấm 10–15</span>
                  </div>
                  <span className="chip-sub">BCD 0–9 sang mã Aiken tự bù</span>
                </button>

                <button
                  type="button"
                  className={`preset-chip-box ${activeConverterName.includes('Dư 3 sang 5211') ? 'active' : ''}`}
                  onClick={handleRuleExcess3To5211}
                >
                  <div className="chip-header">
                    <span className="chip-name font-bold">Dư 3 sang 5211</span>
                    <span className="chip-badge">Hợp lệ 3–12</span>
                  </div>
                  <span className="chip-sub">Tổ hợp 3..12 (0..2 và 13..15 là cấm X)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="custom-converter-input-box mt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="field-label">Nhập chuỗi các từ mã 4-bit đầu ra (cách nhau bằng dấu phẩy hoặc khoảng trắng):</label>
                <div className="segmented-control micro">
                  <button
                    type="button"
                    className={`segmented-btn ${customStartDec === 0 ? 'active' : ''}`}
                    onClick={() => setCustomStartDec(0)}
                  >
                    Bắt đầu từ 0
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${customStartDec === 3 ? 'active' : ''}`}
                    onClick={() => setCustomStartDec(3)}
                  >
                    Bắt đầu từ 3 (Dư 3)
                  </button>
                </div>
              </div>
              <textarea
                className="text-input mono text-sm"
                rows={2}
                value={customCodesText}
                onChange={(e) => setCustomCodesText(e.target.value)}
                placeholder="Ví dụ: 0000, 0001, 0100, 0101, 0111, 1000, 1001, 1100, 1101, 1111"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  className="action-pill-btn active-accent"
                  onClick={handleApplyCustomConverterTable}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Áp dụng bảng mã tự nhập</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTYPE 3: SEVEN SEGMENT --- */}
      {subtype === 'seven_segment' && (
        <div className="comb-subpanel-content">
          <div className="panel-config-row">
            <div className="config-item">
              <label className="config-label">Cực tính LED 7 thanh:</label>
              <div className="segmented-control mini">
                <button
                  type="button"
                  className={`segmented-btn ${polarity === 'cathode_common' ? 'active' : ''}`}
                  onClick={() => onPolarityChange('cathode_common')}
                >
                  Cathode chung (1=Sáng, 0=Tắt)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${polarity === 'anode_common' ? 'active' : ''}`}
                  onClick={() => onPolarityChange('anode_common')}
                >
                  Anot chung (0=Sáng, 1=Tắt)
                </button>
              </div>
            </div>

            <div className="config-item flex-1">
              <div className="flex justify-between items-center mb-1">
                <label className="config-label">Chọn các thanh LED cần giải mã:</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => onSelectedOutputsChange(['a', 'b', 'c', 'd', 'e', 'f', 'g'])}
                  >
                    Tất cả a–g
                  </button>
                  <span className="text-xs text-slate-400">|</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => onSelectedOutputsChange(['a', 'b', 'c'])}
                  >
                    Chỉ a,b,c
                  </button>
                  <span className="text-xs text-slate-400">|</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => onSelectedOutputsChange(['e', 'f', 'g'])}
                  >
                    Chỉ e,f,g
                  </button>
                </div>
              </div>
              <div className="segmented-control mini w-full">
                {(['a', 'b', 'c', 'd', 'e', 'f', 'g'] as SegmentName[]).map((seg) => (
                  <button
                    key={seg}
                    type="button"
                    className={`segmented-btn flex-1 ${selectedOutputs.includes(seg) ? 'active' : ''}`}
                    onClick={() => handleSegmentToggle(seg)}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="input-group-field mt-3">
            <div className="flex justify-between items-center mb-1">
              <label className="field-label">Chuỗi ký tự đề bài yêu cầu hiển thị (tối đa 16 ký tự):</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="tiny-action-btn"
                  onClick={() => onSevenSegCharsChange(sevenSegChars.slice(0, -1))}
                  title="Xóa ký tự cuối"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Xóa lùi</span>
                </button>
                <button
                  type="button"
                  className="tiny-action-btn text-rose-500"
                  onClick={() => onSevenSegCharsChange('')}
                  title="Xóa trắng"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa hết</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              className="text-input mono text-lg font-bold tracking-widest"
              value={sevenSegChars}
              onChange={(e) => onSevenSegCharsChange(e.target.value.replace(/\s+/g, ''))}
              placeholder="Nhập chuỗi ký tự, ví dụ: 456789AbC"
            />
          </div>

          <div className="comb-quick-presets-bar mt-2">
            <span className="helper-label font-semibold">Mẫu chuỗi ký tự thường gặp:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {COMMON_7SEG_EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`helper-pill-btn ${sevenSegChars === ex.chars ? 'active-pill' : ''}`}
                  onClick={() => handleApply7SegExample(ex)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- VALIDATION FEEDBACK --- */}
      {validationError && (
        <div className="validation-alert error">
          <span>{validationError}</span>
        </div>
      )}
      {validationSuccess && (
        <div className="validation-alert success">
          <span>{validationSuccess}</span>
        </div>
      )}

      {/* --- LIVE STANDARDIZED PROBLEM STATEMENT CARD --- */}
      <ProblemSummaryCard
        problemType="cau_2"
        combSubtype={subtype}
        combPolarity={polarity}
        combInputVars={['A', 'B', 'C', 'D']}
        combOutputVars={outputVars}
        combOutputPrefix={outputPrefix}
        combRows={allRows.length > 0 ? allRows : (subtype === 'single_rule' ? singleRuleRows : converterRows)}
        sevenSegChars={sevenSegChars}
        selectedSegOutputs={subtype === 'seven_segment' ? selectedOutputs : undefined}
        ruleTitle={activeRuleTitle}
        converterTitle={activeConverterName}
        title="Tổng hợp Đề bài hiện tại (Chuẩn KTDTS)"
        compact={true}
      />
    </div>
  )
}
