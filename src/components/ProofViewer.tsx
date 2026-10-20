import React, { useState, useMemo } from 'react'
import type { TransformationStep } from '../types'
import { KaTeXView } from './KaTeXView'
import { Check, Copy, FileText } from 'lucide-react'

interface ProofViewerProps {
  steps: TransformationStep[]
  funcName?: string
}

export const ProofViewer: React.FC<ProofViewerProps> = ({ steps, funcName = 'Y' }) => {
  const [copied, setCopied] = useState<boolean>(false)

  // Construct complete continuous vertically-aligned LaTeX block (\begin{aligned} ... \end{aligned})
  const alignedLatex = useMemo(() => {
    if (!steps || steps.length === 0) return `${funcName} = 0`

    const lines = steps.map((step, idx) => {
      let eqPart = step.handwrittenLine || step.latex
      // Ensure first line has "Y &=" and subsequent lines have "&="
      if (idx === 0) {
        if (eqPart.includes('=')) {
          const parts = eqPart.split('=')
          eqPart = `${parts[0].trim()} &= ${parts.slice(1).join('=').trim()}`
        } else {
          eqPart = `${funcName} &= ${eqPart}`
        }
      } else {
        if (eqPart.startsWith('=')) {
          eqPart = `&= ${eqPart.substring(1).trim()}`
        } else if (eqPart.includes('=')) {
          const parts = eqPart.split('=')
          eqPart = `&= ${parts.slice(1).join('=').trim()}`
        } else {
          eqPart = `&= ${eqPart}`
        }
      }

      const noteText = step.note ? `\\quad \\text{--- ${step.note}}` : ''
      return `${eqPart} ${noteText}`
    })

    return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
  }, [steps, funcName])

  // Plain text for copying
  const plainTextCopy = useMemo(() => {
    if (!steps || steps.length === 0) return ''
    return steps
      .map((step) => {
        const line = step.handwrittenLine || step.latex
        const note = step.note ? `    # ${step.note}` : ''
        return `${line}${note}`
      })
      .join('\n')
  }, [steps])

  const handleCopy = () => {
    navigator.clipboard.writeText(plainTextCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const finalStep = steps[steps.length - 1]

  return (
    <div className="apple-handwritten-card">
      <div className="apple-handwritten-header">
        <div className="header-left">
          <div className="handwritten-icon-badge">
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="handwritten-title">Trình bày bài thi viết tay (Chuẩn chấm điểm)</h3>
            <p className="handwritten-subtitle">
              Biến đổi trực tiếp liên tục bằng chuỗi dấu bằng (=) dọc xuống dòng, không dùng biến trung gian.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="apple-copy-btn"
          onClick={handleCopy}
          title="Sao chép toàn bộ lời giải viết tay"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép bài giải'}</span>
        </button>
      </div>

      {/* Main Ruled Exam Sheet */}
      <div className="apple-exam-sheet">
        <div className="sheet-margin-line" />
        <div className="sheet-content">
          <div className="aligned-math-container">
            <KaTeXView math={alignedLatex} block={true} />
          </div>

          {/* Line by Line Breakdown with Explanatory Notes */}
          <div className="handwritten-rows-list">
            {steps.map((step, idx) => (
              <div key={idx} className="handwritten-row">
                <div className="row-index">Dòng {idx + 1}</div>
                <div className="row-math">
                  <KaTeXView math={step.handwrittenLine || step.latex} />
                </div>
                {step.note && (
                  <div className="row-note">
                    <span className="note-dash">↳</span>
                    <span>{step.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Submission Formula Box */}
      {finalStep && (
        <div className="handwritten-final-box">
          <span className="final-badge">Biểu thức kết luận nộp bài:</span>
          <div className="final-math">
            <KaTeXView
              math={`${funcName} = ${
                (finalStep.handwrittenLine || finalStep.latex).replace(/^.*?=\s*/, '')
              }`}
              block={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
