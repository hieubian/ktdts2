import React, { useState } from 'react'
import type { TransformationStep } from '../types'
import { KaTeXView } from './KaTeXView'
import { FormattedMathText } from './FormattedMathText'
import { Check, ChevronDown, ChevronUp, Copy } from 'lucide-react'

interface ProofViewerProps {
  steps: TransformationStep[]
  funcName?: string
}

export const ProofViewer: React.FC<ProofViewerProps> = ({ steps, funcName = 'Y' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const copyStepLatex = (latex: string, idx: number) => {
    navigator.clipboard.writeText(latex)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const finalStep = steps[steps.length - 1]
  const cascadeStep = steps.find(
    (s) => (s.latex.includes('S_{12}') || s.latex.includes('P_{12}')) && s !== finalStep
  )

  return (
    <div className="proof-viewer-card">
      <div className="proof-summary-box">
        <div className="proof-summary-left">
          <span className="summary-tag">Biểu thức sau biến đổi</span>
          <div className="summary-math">
            <KaTeXView math={finalStep ? finalStep.latex : `${funcName} = 0`} />
          </div>
          {cascadeStep && (
            <div className="summary-cascade-sub">
              <span className="summary-cascade-label">Hệ tín hiệu:</span>
              <KaTeXView math={cascadeStep.latex} />
            </div>
          )}
        </div>

        <button
          type="button"
          className="steps-toggle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{isOpen ? 'Thu gọn' : 'Xem các bước'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="steps-detail-container">
          <div className="proof-steps-container">
            {steps.map((step, idx) => {
              const isCopied = copiedIdx === idx

              return (
                <div key={idx} className="step-card">
                  <div className="step-card-header">
                    <div className="step-card-header-left">
                      <div className="step-badge">Bước {idx + 1}</div>
                      <h4 className="step-title">{step.title}</h4>
                    </div>
                    <button
                      type="button"
                      className="step-copy-btn"
                      onClick={() => copyStepLatex(step.latex, idx)}
                      title="Sao chép LaTeX"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{isCopied ? 'Đã sao chép' : 'Copy'}</span>
                    </button>
                  </div>

                  {step.description && (
                    <p className="step-description">
                      <FormattedMathText text={step.description} />
                    </p>
                  )}

                  <div className="step-math-box">
                    <KaTeXView math={step.latex} block={true} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
