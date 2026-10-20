import React, { useState } from 'react'
import type { CircuitDiagram, KMapGroup, OptimizationForm, TargetGateType, TransformationStep, VariableCount } from '../types'
import { KMapGrid } from './KMapGrid'
import { CircuitViewer } from './CircuitViewer'
import { ProofViewer } from './ProofViewer'
import { KaTeXView } from './KaTeXView'
import { CheckCircle2, Copy, Check } from 'lucide-react'

interface ExamReportViewProps {
  variableCount: VariableCount
  variables: string[]
  form: OptimizationForm
  targetGateType: TargetGateType
  gridValues: Record<number, any>
  groups: KMapGroup[]
  simplifiedLatex: string
  transformationSteps: TransformationStep[]
  circuitBasic: CircuitDiagram
  circuitTarget: CircuitDiagram
  hoveredGroup: string | null
  onGroupHover: (id: string | null) => void
  onCellToggle: (minterm: number) => void
}

export const ExamReportView: React.FC<ExamReportViewProps> = ({
  variableCount,
  variables,
  form,
  targetGateType,
  gridValues,
  groups,
  simplifiedLatex,
  transformationSteps,
  circuitBasic,
  circuitTarget,
  hoveredGroup,
  onGroupHover,
  onCellToggle
}) => {
  const [copied, setCopied] = useState<boolean>(false)

  const gateLabelMap: Record<TargetGateType, string> = {
    basic: 'cổng logic cơ bản (AND, OR, NOT)',
    nand_2: 'cổng NAND 2 đầu vào',
    nand_n: 'cổng NAND nhiều đầu vào',
    nor_2: 'cổng NOR 2 đầu vào',
    nor_n: 'cổng NOR nhiều đầu vào'
  }

  const targetGateText = gateLabelMap[targetGateType]

  // Compute formal statement latex
  const activeMainCells = Object.entries(gridValues)
    .filter(([, v]) => v === (form === 'SOP' ? 1 : 0))
    .map(([k]) => Number(k))
    .sort((a, b) => a - b)

  const activeDcCells = Object.entries(gridValues)
    .filter(([, v]) => v === 'd')
    .map(([k]) => Number(k))
    .sort((a, b) => a - b)

  const problemLatex = form === 'SOP'
    ? `Y(${variables.join(', ')}) = \\sum(${activeMainCells.join(', ') || '\\emptyset'})${
        activeDcCells.length > 0 ? ` + d(${activeDcCells.join(', ')})` : ''
      }`
    : `Y(${variables.join(', ')}) = \\prod(${activeMainCells.join(', ') || '\\emptyset'})${
        activeDcCells.length > 0 ? ` \\cdot D(${activeDcCells.join(', ')})` : ''
      }`

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(problemLatex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="exam-report-container">
      {/* Problem Statement Card */}
      <div className="apple-solution-card">
        <div className="apple-card-header">
          <div className="apple-card-badge">Đề bài</div>
          <h2 className="apple-card-title">Đề bài & Yêu cầu bài thi</h2>
          <button
            type="button"
            className="apple-copy-btn"
            onClick={handleCopyLatex}
            title="Sao chép công thức LaTeX đề bài"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép đề'}</span>
          </button>
        </div>

        <div className="apple-problem-statement">
          <p className="statement-intro">
            Cho hàm Boolean {variables.length} biến theo dạng {form === 'SOP' ? 'Chuẩn tắc Tuyển (SOP)' : 'Chuẩn tắc Hội (POS)'}:
          </p>
          <div className="statement-equation-box">
            <KaTeXView math={problemLatex} block={true} />
          </div>

          <div className="statement-questions">
            <span className="questions-title">Yêu cầu lời giải:</span>
            <div className="questions-list">
              <div className="question-item">
                <span className="q-badge">a</span>
                <span className="q-text">Rút gọn hàm Boolean <em>Y</em> bằng bảng Karnaugh</span>
              </div>
              <div className="question-item">
                <span className="q-badge">b</span>
                <span className="q-text">Vẽ sơ đồ mạch logic sử dụng các cổng LOGIC cơ bản (AND, OR, NOT)</span>
              </div>
              <div className="question-item">
                <span className="q-badge">c</span>
                <span className="q-text">Biến đổi đại số Boole và vẽ sơ đồ mạch chỉ sử dụng <strong>{targetGateText}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question a: K-Map & Minimization */}
      <div className="apple-solution-card">
        <div className="apple-card-header">
          <div className="apple-card-badge">Câu a</div>
          <h2 className="apple-card-title">Bảng Karnaugh và hàm tối thiểu</h2>
        </div>

        <div className="apple-kmap-layout">
          <div className="apple-kmap-pane">
            <div className="kmap-instruction">
              Bìa Karnaugh {variables.length} biến ({variables.join(', ')}). Nhấp vào ô để thay đổi giá trị (0 → 1 → d).
            </div>
            <KMapGrid
              variableCount={variableCount}
              gridValues={gridValues}
              groups={groups}
              form={form}
              hoveredGroup={hoveredGroup}
              onCellToggle={onCellToggle}
              onGroupHover={onGroupHover}
            />
          </div>

          <div className="apple-groups-pane">
            <div className="apple-group-summary-header">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Khoanh {groups.length} vòng tối ưu (
                {[
                  groups.filter((g) => g.cells.length === 8).length > 0 && `${groups.filter((g) => g.cells.length === 8).length}×8ô`,
                  groups.filter((g) => g.cells.length === 4).length > 0 && `${groups.filter((g) => g.cells.length === 4).length}×4ô`,
                  groups.filter((g) => g.cells.length === 2).length > 0 && `${groups.filter((g) => g.cells.length === 2).length}×2ô`,
                  groups.filter((g) => g.cells.length === 1).length > 0 && `${groups.filter((g) => g.cells.length === 1).length}×1ô`
                ].filter(Boolean).join(', ')}
                )
              </span>
            </div>

            <div className="apple-groups-list">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className={`apple-group-row ${hoveredGroup === g.id ? 'active-hover' : ''}`}
                  onMouseEnter={() => onGroupHover(g.id)}
                  onMouseLeave={() => onGroupHover(null)}
                >
                  <div className="group-color-pill" style={{ backgroundColor: g.color }}>
                    <KaTeXView math={g.label} />
                  </div>
                  <div className="group-details">
                    <div className="group-formula">
                      <KaTeXView math={`${g.label}({${g.cells.join(', ')}}) = ${g.termLatex}`} />
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

      {/* Question b: Basic Circuit */}
      <div className="apple-solution-card">
        <div className="apple-card-header">
          <div className="apple-card-badge">Câu b</div>
          <h2 className="apple-card-title">Sơ đồ mạch sử dụng cổng LOGIC cơ bản (AND, OR, NOT)</h2>
        </div>
        <div className="apple-circuit-wrapper">
          <CircuitViewer
            diagram={circuitBasic}
            title="Sơ đồ mạch logic cơ bản"
          />
        </div>
      </div>

      {/* Question c: Algebraic Transformations & Target Circuit */}
      <div className="apple-solution-card">
        <div className="apple-card-header">
          <div className="apple-card-badge">Câu c</div>
          <h2 className="apple-card-title">Biến đổi đại số Boole và sơ đồ {targetGateText}</h2>
        </div>

        <div className="apple-proof-section">
          <ProofViewer steps={transformationSteps} funcName="Y" />
        </div>

        <div className="apple-circuit-wrapper" style={{ marginTop: '16px' }}>
          <CircuitViewer
            diagram={circuitTarget}
            title={`Sơ đồ mạch sử dụng ${targetGateText}`}
          />
        </div>
      </div>
    </div>
  )
}
