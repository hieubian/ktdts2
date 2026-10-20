import React from 'react'
import type { CircuitDiagram, KMapGroup, OptimizationForm, TargetGateType, TransformationStep, VariableCount } from '../types'
import { KMapGrid } from './KMapGrid'
import { CircuitViewer } from './CircuitViewer'
import { ProofViewer } from './ProofViewer'
import { KaTeXView } from './KaTeXView'
import { CheckCircle2 } from 'lucide-react'

import { ProblemSummaryCard } from './ProblemSummaryCard'

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
  const gateLabelMap: Record<TargetGateType, string> = {
    basic: 'cổng logic cơ bản (AND, OR, NOT)',
    nand_2: 'cổng NAND 2 đầu vào',
    nand_n: 'cổng NAND nhiều đầu vào',
    nor_2: 'cổng NOR 2 đầu vào',
    nor_n: 'cổng NOR nhiều đầu vào'
  }

  const targetGateText = gateLabelMap[targetGateType]


  return (
    <div className="exam-report-container">
      <ProblemSummaryCard
        problemType="cau_1"
        variableCount={variableCount}
        variables={variables}
        form={form}
        targetGateType={targetGateType}
        gridValues={gridValues}
      />

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Câu a</span>
          <h3>Bảng Karnaugh và biểu thức tối thiểu</h3>
        </div>

        <div className="exam-kmap-layout">
          <div className="exam-kmap-pane">
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

          <div className="exam-groups-pane">
            <div className="exam-summary-badge">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Khoanh {groups.length} vòng (
                {[
                  groups.filter((g) => g.cells.length === 8).length > 0 && `${groups.filter((g) => g.cells.length === 8).length}×8ô`,
                  groups.filter((g) => g.cells.length === 4).length > 0 && `${groups.filter((g) => g.cells.length === 4).length}×4ô`,
                  groups.filter((g) => g.cells.length === 2).length > 0 && `${groups.filter((g) => g.cells.length === 2).length}×2ô`,
                  groups.filter((g) => g.cells.length === 1).length > 0 && `${groups.filter((g) => g.cells.length === 1).length}×1ô`
                ].filter(Boolean).join(', ')}
                )
              </span>
            </div>
            <div className="exam-groups-list">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className={`exam-group-row ${hoveredGroup === g.id ? 'active-hover' : ''}`}
                  onMouseEnter={() => onGroupHover(g.id)}
                  onMouseLeave={() => onGroupHover(null)}
                >
                  <div className="exam-group-pill" style={{ backgroundColor: g.color }}>
                    <KaTeXView math={g.label} />
                  </div>
                  <div className="exam-group-content">
                    <div className="exam-group-formula">
                      <KaTeXView math={`${g.label}({${g.cells.join(', ')}}) = ${g.termLatex}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="exam-final-result-box">
              <div className="result-label">
                <span>Kết quả:</span>
              </div>
              <div className="result-formula">
                <KaTeXView math={`Y = ${simplifiedLatex}`} block={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Câu b</span>
          <h3>Sơ đồ mạch logic cơ bản (AND, OR, NOT)</h3>
        </div>
        <CircuitViewer
          diagram={circuitBasic}
          title="Mạch logic cơ bản"
        />
      </div>

      <div className="exam-section-card">
        <div className="exam-section-title">
          <span className="exam-part-label">Câu c</span>
          <h3>Biến đổi sang {targetGateText}</h3>
        </div>

        <div className="exam-algebraic-box">
          <ProofViewer steps={transformationSteps} funcName="Y" />
        </div>

        <div className="exam-circuit-target-box">
          <CircuitViewer
            diagram={circuitTarget}
            title={`Sơ đồ ${targetGateText}`}
          />
        </div>
      </div>
    </div>
  )
}
