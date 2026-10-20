import React, { useEffect, useState } from 'react'
import type { CellValue, OptimizationForm, TargetGateType, VariableCount } from '../types'
import { parseNumberList } from '../utils/kmapSolver'
import { RotateCcw } from 'lucide-react'

interface InputPanelProps {
  variableCount: VariableCount
  form: OptimizationForm
  targetGateType: TargetGateType
  gridValues: Record<number, CellValue>
  onVariableCountChange: (count: VariableCount) => void
  onFormChange: (form: OptimizationForm) => void
  onTargetGateChange: (gate: TargetGateType) => void
  onApplyMinterms: (terms: number[], dontCares: number[]) => void
  onClear: () => void
  onSetAll: (val: CellValue) => void
}

export const InputPanel: React.FC<InputPanelProps> = ({
  variableCount,
  form,
  targetGateType,
  gridValues,
  onVariableCountChange,
  onFormChange,
  onTargetGateChange,
  onApplyMinterms,
  onClear,
  onSetAll
}) => {
  const [termsText, setTermsText] = useState<string>('')
  const [dcText, setDcText] = useState<string>('')

  const targetValue: CellValue = form === 'SOP' ? 1 : 0

  useEffect(() => {
    if (!gridValues) return
    const total = 1 << variableCount
    const activeTerms: number[] = []
    const activeDc: number[] = []

    for (let i = 0; i < total; i++) {
      const v = gridValues?.[i]
      if (v === targetValue) {
        activeTerms.push(i)
      } else if (v === 'd') {
        activeDc.push(i)
      }
    }

    const currentParsedTerms = parseNumberList(termsText)
    const isTermsIdentical =
      currentParsedTerms.length === activeTerms.length &&
      currentParsedTerms.every((val, idx) => val === activeTerms[idx])

    if (!isTermsIdentical) {
      setTermsText(activeTerms.join(', '))
    }

    const currentParsedDc = parseNumberList(dcText)
    const isDcIdentical =
      currentParsedDc.length === activeDc.length &&
      currentParsedDc.every((val, idx) => val === activeDc[idx])

    if (!isDcIdentical) {
      setDcText(activeDc.join(', '))
    }
  }, [gridValues, form, variableCount, targetValue, termsText, dcText])

  const handleTermsInput = (newTerms: string, newDc: string) => {
    setTermsText(newTerms)
    setDcText(newDc)
    const parsedTerms = parseNumberList(newTerms)
    const parsedDc = parseNumberList(newDc)
    onApplyMinterms(parsedTerms, parsedDc)
  }

  const handleTermsBlur = () => {
    const parsedTerms = parseNumberList(termsText)
    setTermsText(parsedTerms.join(', '))
  }

  const handleDcBlur = () => {
    const parsedDc = parseNumberList(dcText)
    setDcText(parsedDc.join(', '))
  }

  return (
    <div className="apple-config-panel">
      {/* Top Segmented Controls Row */}
      <div className="apple-controls-grid">
        <div className="apple-control-group">
          <label className="apple-control-label">Dạng chuẩn tắc</label>
          <div className="apple-segmented">
            <button
              type="button"
              className={`apple-seg-btn ${form === 'SOP' ? 'active' : ''}`}
              onClick={() => onFormChange('SOP')}
            >
              ∑ Tuyển (SOP)
            </button>
            <button
              type="button"
              className={`apple-seg-btn ${form === 'POS' ? 'active' : ''}`}
              onClick={() => onFormChange('POS')}
            >
              ∏ Hội (POS)
            </button>
          </div>
        </div>

        <div className="apple-control-group">
          <label className="apple-control-label">Số biến Boolean</label>
          <div className="apple-segmented">
            {([2, 3, 4] as VariableCount[]).map((v) => (
              <button
                key={v}
                type="button"
                className={`apple-seg-btn ${variableCount === v ? 'active' : ''}`}
                onClick={() => onVariableCountChange(v)}
              >
                {v} biến {v === 2 ? '(A,B)' : v === 3 ? '(A,B,C)' : '(A,B,C,D)'}
              </button>
            ))}
          </div>
        </div>

        <div className="apple-control-group">
          <label className="apple-control-label">Cổng câu c</label>
          <select
            className="apple-select"
            value={targetGateType}
            onChange={(e) => onTargetGateChange(e.target.value as TargetGateType)}
          >
            <option value="nand_2">Cổng NAND 2 đầu vào (Chuẩn thi)</option>
            <option value="nor_2">Cổng NOR 2 đầu vào (Chuẩn thi)</option>
            <option value="nand_n">Cổng NAND nhiều đầu vào</option>
            <option value="nor_n">Cổng NOR nhiều đầu vào</option>
            <option value="basic">Cổng logic cơ bản (AND, OR, NOT)</option>
          </select>
        </div>
      </div>

      {/* Manual Index Inputs & Helper Actions */}
      <div className="apple-fields-row">
        <div className="apple-field-col">
          <div className="apple-field-header">
            <span className="apple-field-name">
              {form === 'SOP' ? 'Chỉ số Minterm m(ô = 1):' : 'Chỉ số Maxterm M(ô = 0):'}
            </span>
            <span className="apple-field-hint">Phân tách bằng dấu phẩy</span>
          </div>
          <input
            type="text"
            className="apple-text-field"
            placeholder={form === 'SOP' ? 'Ví dụ: 0, 1, 4, 5, 7, 9' : 'Ví dụ: 0, 3, 5, 7, 8, 13, 15'}
            value={termsText}
            onChange={(e) => handleTermsInput(e.target.value, dcText)}
            onBlur={handleTermsBlur}
          />
        </div>

        <div className="apple-field-col">
          <div className="apple-field-header">
            <span className="apple-field-name">
              {form === 'SOP' ? 'Chỉ số Tùy định d (Don\'t care):' : 'Chỉ số Tùy định D (Don\'t care):'}
            </span>
            <span className="apple-field-hint">Ô có thể là 0 hoặc 1</span>
          </div>
          <input
            type="text"
            className="apple-text-field"
            placeholder={form === 'SOP' ? 'Ví dụ: 3, 6, 14' : 'Ví dụ: 9, 11, 12'}
            value={dcText}
            onChange={(e) => handleTermsInput(termsText, e.target.value)}
            onBlur={handleDcBlur}
          />
        </div>

        <div className="apple-quick-actions">
          <button
            type="button"
            className="apple-btn-secondary"
            onClick={onClear}
            title="Xóa toàn bộ các ô về mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
          <button
            type="button"
            className="apple-btn-secondary"
            onClick={() => onSetAll(1)}
            title="Đặt tất cả ô = 1"
          >
            Tất cả 1
          </button>
          <button
            type="button"
            className="apple-btn-secondary"
            onClick={() => onSetAll(0)}
            title="Đặt tất cả ô = 0"
          >
            Tất cả 0
          </button>
        </div>
      </div>
    </div>
  )
}
