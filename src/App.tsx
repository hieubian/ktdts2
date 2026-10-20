import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import type {
  CellValue,
  CombinationalRow,
  CombinationalSubtype,
  ExamProblemType,
  LedPolarity,
  OptimizationForm,
  TargetGateType,
  VariableCount
} from './types'
import { getVariableNames, solveKMap } from './utils/kmapSolver'
import { generateTransformations } from './utils/algebraicTransformer'
import {
  generateBasicCircuit,
  generateMultiOutputBasicCircuit,
  generateTargetGateCircuit
} from './utils/circuitGenerator'
import { parseSevenSegmentBits, type SegmentName } from './utils/sevenSegment'
import { Navbar } from './components/Navbar'
import { SmartEquationInput } from './components/SmartEquationInput'
import { InputPanel } from './components/InputPanel'
import { KMapGrid } from './components/KMapGrid'
import { CircuitViewer } from './components/CircuitViewer'
import { ProofViewer } from './components/ProofViewer'
import { ExamReportView } from './components/ExamReportView'
import { TruthTableView } from './components/TruthTableView'
import { CombinationalInputPanel } from './components/CombinationalInputPanel'
import { CombinationalReportView } from './components/CombinationalReportView'
import { CombinationalTruthTable } from './components/CombinationalTruthTable'
import { HelpModal } from './components/HelpModal'
import { KaTeXView } from './components/KaTeXView'
import { CheckCircle2 } from 'lucide-react'
import { type ExamPreset } from './utils/examPresets'

export const App: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<ExamProblemType>('cau_1')
  const [activePresetId, setActivePresetId] = useState<string | undefined>('cau_1_pdf')

  const [variableCount, setVariableCount] = useState<VariableCount>(4)
  const [form, setForm] = useState<OptimizationForm>('POS')
  const [targetGateType, setTargetGateType] = useState<TargetGateType>('nand_2')
  const [activeTab, setActiveTab] = useState<string>('report')
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)

  // Default state matches Câu 1 of the PDF: Y(A,B,C,D) = ∏(0,3,5,7,8,13,15) .D(9,11,12)
  const [gridValues, setGridValues] = useState<Record<number, CellValue>>(() => {
    const initial: Record<number, CellValue> = {}
    for (let i = 0; i < 16; i++) initial[i] = 1
    const zeros = [0, 3, 5, 7, 8, 13, 15]
    const dcs = [9, 11, 12]
    zeros.forEach((m) => { initial[m] = 0 })
    dcs.forEach((d) => { initial[d] = 'd' })
    return initial
  })

  const [combSubtype, setCombSubtype] = useState<CombinationalSubtype>('single_rule')
  const [combPolarity, setCombPolarity] = useState<LedPolarity>('cathode_common')
  const [combOutputPrefix, setCombOutputPrefix] = useState<'F' | 'G' | 'Y'>('F')
  const [sevenSegChars, setSevenSegChars] = useState<string>('56789AEdPH')
  const [selectedSegOutputs, setSelectedSegOutputs] = useState<string[]>(['a', 'd', 'g'])

  const [singleRuleRows, setSingleRuleRows] = useState<CombinationalRow[]>(() => {
    const mod2or5 = new Set([0, 2, 4, 5, 6, 8, 10, 12, 14, 15])
    return Array.from({ length: 16 }, (_, i) => ({
      id: `rule-${i}`,
      decimal: i,
      inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
      outputBits: [mod2or5.has(i) ? 1 : 0],
      isUnused: false
    }))
  })

  const [customConverterRows, setCustomConverterRows] = useState<CombinationalRow[]>(() => {
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
    return Array.from({ length: 10 }, (_, dec) => ({
      id: `r-${dec}`,
      decimal: dec,
      inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
      outputBits: mapping[dec],
      isUnused: false
    }))
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const variables = useMemo(() => getVariableNames(variableCount), [variableCount])

  const { groups, simplifiedLatex, simplifiedPlain } = useMemo(() => {
    return solveKMap(variableCount, gridValues, form)
  }, [variableCount, gridValues, form])

  const transformationSteps = useMemo(() => {
    return generateTransformations(groups, form, targetGateType, 'Y')
  }, [groups, form, targetGateType])

  const circuitBasic = useMemo(() => {
    return generateBasicCircuit(groups, variableCount, form, 'Y')
  }, [groups, variableCount, form])

  const circuitTarget = useMemo(() => {
    return generateTargetGateCircuit(groups, variableCount, form, targetGateType, 'Y')
  }, [groups, variableCount, form, targetGateType])

  const currentEquationString = useMemo(() => {
    const activeMainCells = Object.entries(gridValues)
      .filter(([, v]) => v === (form === 'SOP' ? 1 : 0))
      .map(([k]) => Number(k))
      .sort((a, b) => a - b)
    const activeDcCells = Object.entries(gridValues)
      .filter(([, v]) => v === 'd')
      .map(([k]) => Number(k))
      .sort((a, b) => a - b)

    if (form === 'POS') {
      return `Y(${variables.join(',')}) = ∏(${activeMainCells.join(',')})${
        activeDcCells.length > 0 ? ` .D(${activeDcCells.join(',')})` : ''
      }`
    }
    return `Y(${variables.join(',')}) = ∑(${activeMainCells.join(',')})${
      activeDcCells.length > 0 ? ` + d(${activeDcCells.join(',')})` : ''
    }`
  }, [gridValues, form, variables])

  const handleApplyParsedEquation = (parsed: {
    variableCount: VariableCount
    variables: string[]
    form: OptimizationForm
    terms: number[]
    dontCares: number[]
    targetGateType?: TargetGateType
  }) => {
    setActivePresetId(undefined)
    setCurrentProblem('cau_1')
    setVariableCount(parsed.variableCount)
    setForm(parsed.form)
    if (parsed.targetGateType) {
      setTargetGateType(parsed.targetGateType)
    }

    const total = 1 << parsed.variableCount
    const next: Record<number, CellValue> = {}
    const defaultVal: CellValue = parsed.form === 'SOP' ? 0 : 1
    const targetVal: CellValue = parsed.form === 'SOP' ? 1 : 0

    for (let i = 0; i < total; i++) {
      next[i] = defaultVal
    }
    for (const t of parsed.terms) {
      if (t < total) next[t] = targetVal
    }
    for (const d of parsed.dontCares) {
      if (d < total) next[d] = 'd'
    }
    setGridValues(next)
  }

  const handleSelectPreset = (preset: ExamPreset) => {
    setActivePresetId(preset.id)
    if (preset.problemType === 'cau_1') {
      setCurrentProblem('cau_1')
      setActiveTab('report')
      const vCount = preset.variableCount || 4
      const pForm = preset.form || 'POS'
      const pTarget = preset.targetGateType || 'nand_2'
      setVariableCount(vCount)
      setForm(pForm)
      setTargetGateType(pTarget)

      const total = 1 << vCount
      const next: Record<number, CellValue> = {}
      const defaultVal: CellValue = pForm === 'SOP' ? 0 : 1
      const targetVal: CellValue = pForm === 'SOP' ? 1 : 0
      for (let i = 0; i < total; i++) next[i] = defaultVal
      if (preset.terms) {
        preset.terms.forEach((t) => { if (t < total) next[t] = targetVal })
      }
      if (preset.dontCares) {
        preset.dontCares.forEach((d) => { if (d < total) next[d] = 'd' })
      }
      setGridValues(next)
    } else {
      setCurrentProblem('cau_2')
      setActiveTab('report')
      if (preset.combSubtype) setCombSubtype(preset.combSubtype)

      if (preset.combConverterType === '5211') {
        const mapping5211: Record<number, number[]> = {
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
        setCustomConverterRows(
          Array.from({ length: 10 }, (_, dec) => ({
            id: `r-${dec}`,
            decimal: dec,
            inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
            outputBits: mapping5211[dec],
            isUnused: false
          }))
        )
      } else if (preset.combConverterType === 'excess3_cyclic') {
        const mappingExcess3Cyclic: Record<number, number[]> = {
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
        setCustomConverterRows(
          Array.from({ length: 10 }, (_, dec) => ({
            id: `r-${dec}`,
            decimal: dec,
            inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
            outputBits: mappingExcess3Cyclic[dec],
            isUnused: false
          }))
        )
      } else if (preset.combRuleMode === 'moreOnes') {
        setSingleRuleRows(
          Array.from({ length: 16 }, (_, i) => {
            const ones = ((i >> 3) & 1) + ((i >> 2) & 1) + ((i >> 1) & 1) + (i & 1)
            return {
              id: `rule-${i}`,
              decimal: i,
              inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
              outputBits: [ones >= 2 ? 1 : 0],
              isUnused: false
            }
          })
        )
      } else if (preset.combRuleMode === 'mod2or5') {
        const mod2or5 = new Set([0, 2, 4, 5, 6, 8, 10, 12, 14, 15])
        setSingleRuleRows(
          Array.from({ length: 16 }, (_, i) => ({
            id: `rule-${i}`,
            decimal: i,
            inputBits: [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1],
            outputBits: [mod2or5.has(i) ? 1 : 0],
            isUnused: false
          }))
        )
      } else if (preset.combSubtype === 'seven_segment') {
        if (preset.combSegPolarity) setCombPolarity(preset.combSegPolarity)
        if (preset.combSegChars) setSevenSegChars(preset.combSegChars)
        if (preset.combSegOutputs) setSelectedSegOutputs(preset.combSegOutputs)
      }
    }
  }

  const combInputVars = useMemo(() => ['A', 'B', 'C', 'D'], [])

  const combOutputVars = useMemo(() => {
    if (combSubtype === 'seven_segment') {
      return selectedSegOutputs
    }
    if (combSubtype === 'single_rule') {
      return [combOutputPrefix === 'Y' ? 'Y' : 'F']
    }
    const outCount = customConverterRows[0]?.outputBits?.length || 4
    if (combOutputPrefix === 'G') {
      if (outCount === 4) return ['G_3', 'G_2', 'G_1', 'G_0']
      return Array.from({ length: outCount }, (_, i) => `G_${outCount - 1 - i}`)
    }
    if (combOutputPrefix === 'Y') {
      return Array.from({ length: outCount }, (_, i) => `Y_${i + 1}`)
    }
    return Array.from({ length: outCount }, (_, i) => `F_${i + 1}`)
  }, [combSubtype, selectedSegOutputs, customConverterRows, combOutputPrefix])

  const combAllRows = useMemo(() => {
    if (combSubtype === 'single_rule') {
      return singleRuleRows
    }
    if (combSubtype === 'seven_segment') {
      const validRows: CombinationalRow[] = []
      const charArr = Array.from(sevenSegChars)

      charArr.forEach((ch, idx) => {
        const dec = idx
        const bitsMap = parseSevenSegmentBits(ch, combPolarity)
        const rowOutputBits = selectedSegOutputs.map((s) => bitsMap[s as SegmentName] ?? 0)

        validRows.push({
          id: `seg-row-${idx}`,
          decimal: dec,
          inputBits: [(dec >> 3) & 1, (dec >> 2) & 1, (dec >> 1) & 1, dec & 1],
          outputBits: rowOutputBits,
          displayChar: ch,
          isUnused: false
        })
      })

      const unusedRows: CombinationalRow[] = []
      for (let m = charArr.length; m < 16; m++) {
        unusedRows.push({
          id: `seg-unused-${m}`,
          decimal: m,
          inputBits: [(m >> 3) & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1],
          outputBits: selectedSegOutputs.map(() => 'X'),
          isUnused: true
        })
      }

      return [...validRows, ...unusedRows]
    }

    const validRows = customConverterRows.filter((r) => !r.isUnused)
    const presentDecimals = new Set(validRows.map((r) => r.decimal))
    const missingDecimals = Array.from({ length: 16 }, (_, i) => i)
      .filter((i) => !presentDecimals.has(i))
      .sort((a, b) => a - b)

    const unusedRows: CombinationalRow[] = missingDecimals.map((m) => ({
      id: `conv-unused-${m}`,
      decimal: m,
      inputBits: [(m >> 3) & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1],
      outputBits: combOutputVars.map(() => 'X'),
      isUnused: true
    }))

    return [...validRows, ...unusedRows]
  }, [combSubtype, singleRuleRows, sevenSegChars, combPolarity, selectedSegOutputs, customConverterRows, combOutputVars])

  const combOutputsResults = useMemo(() => {
    return combOutputVars.map((outVarName, outIdx) => {
      const gValues: Record<number, CellValue> = {}
      for (let m = 0; m < 16; m++) {
        const row = combAllRows.find((r) => r.decimal === m)
        if (row && !row.isUnused) {
          const bit = row.outputBits[outIdx]
          gValues[m] = bit === 1 ? 1 : 0
        } else {
          gValues[m] = 'd'
        }
      }

      const { groups: gList, simplifiedLatex: sLatex, simplifiedPlain: sPlain } = solveKMap(4, gValues, 'SOP')

      const uniqueGroups = gList.map((g, gIdx) => ({
        ...g,
        id: `${outVarName}-grp-${gIdx}`
      }))

      return {
        name: outVarName,
        groups: uniqueGroups,
        simplifiedLatex: sLatex,
        simplifiedPlain: sPlain,
        gridValues: gValues
      }
    })
  }, [combOutputVars, combAllRows])

  const combCircuit = useMemo(() => {
    return generateMultiOutputBasicCircuit(combOutputsResults, 4, 'SOP')
  }, [combOutputsResults])

  const handleCombToggleOutputBit = (rowId: string, outIdx: number) => {
    if (combSubtype === 'single_rule') {
      setSingleRuleRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r
          const currentBit = r.outputBits[outIdx]
          const nextBit = currentBit === 1 ? 0 : 1
          const newBits = [...r.outputBits]
          newBits[outIdx] = nextBit
          return { ...r, outputBits: newBits }
        })
      )
      return
    }
    if (combSubtype === 'code_converter') {
      setCustomConverterRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r
          const currentBit = r.outputBits[outIdx]
          const nextBit = currentBit === 1 ? 0 : 1
          const newBits = [...r.outputBits]
          newBits[outIdx] = nextBit
          return { ...r, outputBits: newBits }
        })
      )
    }
  }

  const handleVariableCountChange = (newCount: VariableCount) => {
    setActivePresetId(undefined)
    setVariableCount(newCount)
    const total = 1 << newCount
    setGridValues((prev) => {
      const next: Record<number, CellValue> = {}
      for (let i = 0; i < total; i++) {
        next[i] = prev[i] ?? 0
      }
      return next
    })
  }

  const handleCellToggle = (minterm: number) => {
    setActivePresetId(undefined)
    setGridValues((prev) => {
      const current = prev[minterm] ?? 0
      let next: CellValue = 0
      if (current === 0) next = 1
      else if (current === 1) next = 'd'
      else next = 0
      return { ...prev, [minterm]: next }
    })
  }

  const handleApplyMinterms = (terms: number[], dontCares: number[]) => {
    setActivePresetId(undefined)
    const total = 1 << variableCount
    const next: Record<number, CellValue> = {}
    const defaultVal: CellValue = form === 'SOP' ? 0 : 1
    const targetVal: CellValue = form === 'SOP' ? 1 : 0

    for (let i = 0; i < total; i++) {
      next[i] = defaultVal
    }
    for (const t of terms) {
      if (t < total) next[t] = targetVal
    }
    for (const d of dontCares) {
      if (d < total) next[d] = 'd'
    }

    setGridValues(next)
  }

  const handleClear = () => {
    setActivePresetId(undefined)
    const total = 1 << variableCount
    const next: Record<number, CellValue> = {}
    const defaultVal: CellValue = form === 'SOP' ? 0 : 1
    for (let i = 0; i < total; i++) {
      next[i] = defaultVal
    }
    setGridValues(next)
  }

  const handleSetAll = (val: CellValue) => {
    setActivePresetId(undefined)
    const total = 1 << variableCount
    const next: Record<number, CellValue> = {}
    for (let i = 0; i < total; i++) {
      next[i] = val
    }
    setGridValues(next)
  }

  return (
    <div className="app-layout">
      <Navbar
        currentProblem={currentProblem}
        onProblemChange={setCurrentProblem}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((d) => !d)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="main-content">
        {/* Apple Spotlight Smart Hero Input */}
        <div className="no-print">
          <SmartEquationInput
            currentEquation={currentEquationString}
            form={form}
            variableCount={variableCount}
            variables={variables}
            targetGateType={targetGateType}
            onApplyParsedEquation={handleApplyParsedEquation}
            onSelectPreset={handleSelectPreset}
            activePresetId={activePresetId}
          />
        </div>

        {currentProblem === 'cau_1' ? (
          <>
            {/* Quick Config Drawer */}
            <div className="no-print">
              <InputPanel
                variableCount={variableCount}
                form={form}
                targetGateType={targetGateType}
                gridValues={gridValues}
                onVariableCountChange={handleVariableCountChange}
                onFormChange={(newForm) => {
                  setActivePresetId(undefined)
                  setForm(newForm)
                }}
                onTargetGateChange={(newGate) => {
                  setActivePresetId(undefined)
                  setTargetGateType(newGate)
                }}
                onApplyMinterms={handleApplyMinterms}
                onClear={handleClear}
                onSetAll={handleSetAll}
              />
            </div>

            {/* Main Solutions Tabs */}
            {activeTab === 'report' && (
              <ExamReportView
                variableCount={variableCount}
                variables={variables}
                form={form}
                targetGateType={targetGateType}
                gridValues={gridValues}
                groups={groups}
                simplifiedLatex={simplifiedLatex}
                transformationSteps={transformationSteps}
                circuitBasic={circuitBasic}
                circuitTarget={circuitTarget}
                hoveredGroup={hoveredGroup}
                onGroupHover={setHoveredGroup}
                onCellToggle={handleCellToggle}
              />
            )}

            {activeTab === 'kmap' && (
              <div className="apple-solution-card">
                <div className="apple-card-header">
                  <div className="apple-card-badge">Câu a</div>
                  <h2 className="apple-card-title">Bìa Karnaugh & Các Vòng Khoanh Tối Ưu Y({variables.join(', ')})</h2>
                </div>
                <div className="apple-kmap-layout">
                  <div className="apple-kmap-pane">
                    <div className="kmap-instruction">
                      Bìa Karnaugh {variables.length} biến ({variables.join(', ')}). Bấm ô để đổi giá trị (0 → 1 → d).
                    </div>
                    <KMapGrid
                      variableCount={variableCount}
                      gridValues={gridValues}
                      groups={groups}
                      form={form}
                      hoveredGroup={hoveredGroup}
                      onCellToggle={handleCellToggle}
                      onGroupHover={setHoveredGroup}
                    />
                  </div>
                  <div className="apple-groups-pane">
                    <div className="apple-group-summary-header">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Chi tiết các nhóm khoanh tối ưu:</span>
                    </div>
                    <div className="apple-groups-list">
                      {groups.map((g) => (
                        <div
                          key={g.id}
                          className={`apple-group-row ${hoveredGroup === g.id ? 'active-hover' : ''}`}
                          onMouseEnter={() => setHoveredGroup(g.id)}
                          onMouseLeave={() => setHoveredGroup(null)}
                        >
                          <div className="group-color-pill" style={{ backgroundColor: g.color }}>
                            <KaTeXView math={g.label} />
                          </div>
                          <div className="group-details">
                            <div className="group-formula">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                <KaTeXView math={g.label} /> = Nhóm các ô ({g.cells.join(', ')}) ={' '}
                              </span>
                              <KaTeXView math={g.termLatex} />
                            </div>
                            {g.eliminatedVariables.length > 0 && (
                              <div className="group-meta">
                                Triệt tiêu: {g.eliminatedVariables.join(', ')} • Giữ lại: {g.keptVariables.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="apple-final-box">
                      <span className="final-label">Biểu thức tối thiểu:</span>
                      <div className="final-formula">
                        <KaTeXView math={`Y(${variables.join(', ')}) = ${simplifiedLatex}`} block={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'circuit_basic' && (
              <div className="apple-solution-card">
                <div className="apple-card-header">
                  <div className="apple-card-badge">Câu b</div>
                  <h2 className="apple-card-title">Sơ đồ mạch sử dụng cổng LOGIC cơ bản (AND, OR, NOT)</h2>
                </div>
                <div className="apple-circuit-wrapper">
                  <CircuitViewer
                    diagram={circuitBasic}
                    title="Mạch Logic cơ bản"
                    subtitle={`Biểu thức thực hiện: Y = ${simplifiedPlain}`}
                  />
                </div>
              </div>
            )}

            {activeTab === 'circuit_target' && (
              <div className="apple-solution-card">
                <div className="apple-card-header">
                  <div className="apple-card-badge">Câu c</div>
                  <h2 className="apple-card-title">Biến Đổi Đại Số Boole & Sơ Đồ Mạch Chuyên Dụng</h2>
                </div>
                <div className="apple-proof-section">
                  <ProofViewer steps={transformationSteps} funcName="Y" />
                </div>
                <div className="apple-circuit-wrapper" style={{ marginTop: '16px' }}>
                  <CircuitViewer
                    diagram={circuitTarget}
                    title={`Sơ đồ mạch chỉ sử dụng ${targetGateType.toUpperCase().replace('_', ' ')}`}
                    subtitle="Được xây dựng chính xác theo từng bước phân tầng gạch ngang trên đầu"
                  />
                </div>
              </div>
            )}

            {activeTab === 'truthtable' && (
              <div className="apple-solution-card">
                <div className="apple-card-header">
                  <div className="apple-card-badge">Bảng chân lý</div>
                  <h2 className="apple-card-title">Bảng chân lý hàm Boolean Y({variables.join(', ')})</h2>
                </div>
                <TruthTableView
                  variableCount={variableCount}
                  gridValues={gridValues}
                  form={form}
                  onCellToggle={handleCellToggle}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Combinational Problems (Câu 4 - 9 in PDF) */}
            <div className="no-print">
              <CombinationalInputPanel
                subtype={combSubtype}
                onSubtypeChange={setCombSubtype}
                outputPrefix={combOutputPrefix}
                onOutputPrefixChange={setCombOutputPrefix}
                singleRuleRows={singleRuleRows}
                onSingleRuleRowsChange={setSingleRuleRows}
                converterRows={customConverterRows}
                onConverterRowsChange={setCustomConverterRows}
                polarity={combPolarity}
                onPolarityChange={setCombPolarity}
                sevenSegChars={sevenSegChars}
                onSevenSegCharsChange={setSevenSegChars}
                selectedOutputs={selectedSegOutputs}
                onSelectedOutputsChange={setSelectedSegOutputs}
              />
            </div>

            {activeTab === 'report' && (
              <CombinationalReportView
                subtype={combSubtype}
                polarity={combPolarity}
                inputVars={combInputVars}
                outputVars={combOutputVars}
                rows={combAllRows}
                outputsResults={combOutputsResults}
                combinedCircuit={combCircuit}
                onToggleOutputBit={handleCombToggleOutputBit}
              />
            )}

            {activeTab === 'truthtable' && (
              <div className="apple-solution-card">
                <div className="apple-card-header">
                  <div className="apple-card-badge">Bảng trạng thái</div>
                  <h2 className="apple-card-title">Bảng chuyển mã & Bảng trạng thái đầy đủ</h2>
                </div>
                <CombinationalTruthTable
                  inputVars={combInputVars}
                  outputVars={combOutputVars}
                  rows={combAllRows}
                  isSevenSegment={combSubtype === 'seven_segment'}
                  polarity={combPolarity}
                  onToggleOutputBit={handleCombToggleOutputBit}
                />
              </div>
            )}

            {activeTab === 'kmap' && (
              <div className="apple-solution-card">
                <div className="apple-card-header">
                  <div className="apple-card-badge">Bìa Karnaugh đa đầu ra</div>
                  <h2 className="apple-card-title">Bìa Karnaugh cho từng hàm đầu ra ({combOutputVars.join(', ')})</h2>
                </div>
                <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {combOutputsResults.map((out) => (
                    <div key={out.name} className="apple-sub-card">
                      <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        Bìa Karnaugh cho hàm {out.name} = {out.simplifiedPlain}
                      </h4>
                      <KMapGrid
                        variableCount={4}
                        gridValues={out.gridValues}
                        groups={out.groups}
                        form="SOP"
                        hoveredGroup={null}
                        onCellToggle={() => {}}
                        onGroupHover={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'circuit_basic' && (
              <div className="apple-solution-card">
                <div className="apple-card-header">
                  <div className="apple-card-badge">Sơ đồ mạch</div>
                  <h2 className="apple-card-title">Sơ đồ mạch tổ hợp hoàn chỉnh</h2>
                </div>
                <div className="apple-circuit-wrapper">
                  <CircuitViewer
                    diagram={combCircuit}
                    title="Mạch tổ hợp đa đầu ra"
                    subtitle={`Các đầu ra: ${combOutputVars.join(', ')}`}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}

export default App
