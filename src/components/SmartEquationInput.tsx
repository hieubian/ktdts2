import React, { useState, useEffect, useMemo } from 'react'
import { Sparkles, Clipboard, X } from 'lucide-react'
import { parseProblemEquation } from '../utils/equationParser'
import { EXAM_PRESETS, type ExamPreset } from '../utils/examPresets'
import { KaTeXView } from './KaTeXView'
import type { OptimizationForm, TargetGateType, VariableCount } from '../types'

interface SmartEquationInputProps {
  currentEquation: string
  form: OptimizationForm
  variableCount: VariableCount
  variables: string[]
  targetGateType: TargetGateType
  onApplyParsedEquation: (result: {
    variableCount: VariableCount
    variables: string[]
    form: OptimizationForm
    terms: number[]
    dontCares: number[]
    targetGateType?: TargetGateType
  }) => void
  onSelectPreset: (preset: ExamPreset) => void
  activePresetId?: string
}

export const SmartEquationInput: React.FC<SmartEquationInputProps> = ({
  currentEquation,
  form,
  variableCount,
  variables,
  targetGateType,
  onApplyParsedEquation,
  onSelectPreset,
  activePresetId
}) => {
  const [inputText, setInputText] = useState<string>(currentEquation)

  // Synchronize when currentEquation changes externally
  useEffect(() => {
    setInputText(currentEquation)
  }, [currentEquation])

  // Derive parsed equation in real-time
  const parsedPreview = useMemo(() => {
    if (!inputText.trim()) return ''
    const parsed = parseProblemEquation(inputText)
    return parsed.hasEquation ? (parsed.displayLatex || '') : ''
  }, [inputText])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputText(val)

    const parsed = parseProblemEquation(val)
    if (parsed.hasEquation) {
      onApplyParsedEquation({
        variableCount: parsed.variableCount || variableCount,
        variables: parsed.variables || variables,
        form: parsed.form || form,
        terms: parsed.terms,
        dontCares: parsed.dontCares,
        targetGateType: parsed.targetGateType || targetGateType
      })
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setInputText(text)
        const parsed = parseProblemEquation(text)
        if (parsed.hasEquation) {
          onApplyParsedEquation({
            variableCount: parsed.variableCount || variableCount,
            variables: parsed.variables || variables,
            form: parsed.form || form,
            terms: parsed.terms,
            dontCares: parsed.dontCares,
            targetGateType: parsed.targetGateType || targetGateType
          })
        }
      }
    } catch {
      // Ignore clipboard read permission errors
    }
  }

  const handleClear = () => {
    setInputText('')
  }

  return (
    <div className="apple-hero-card">
      <div className="apple-hero-header">
        <div className="apple-badge-row">
          <span className="apple-badge">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Nhận diện đề bài thông minh (Smart Input)
          </span>
          <span className="apple-sub-badge">Chuẩn đề thi PDF Chương 1, 2</span>
        </div>
      </div>

      <div className="apple-input-wrapper">
        <div className="apple-input-inner">
          <input
            type="text"
            className="apple-spotlight-input"
            placeholder="Dán hoặc gõ đề bài... Ví dụ: Y(A,B,C,D) = ∏(0,3,5,7,8,13,15) .D(9,11,12) hoặc ∑(0,1,4,5,7,9) + d(3,6,14)"
            value={inputText}
            onChange={handleInputChange}
          />

          <div className="apple-input-actions">
            {inputText ? (
              <button
                type="button"
                className="apple-icon-action-btn"
                onClick={handleClear}
                title="Xóa trắng"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              className="apple-paste-btn"
              onClick={handlePaste}
              title="Dán từ Clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Dán đề</span>
            </button>
          </div>
        </div>

        {parsedPreview && (
          <div className="apple-parsed-live-bar">
            <div className="live-bar-left">
              <span className="live-label">Đã nhận diện:</span>
              <div className="live-katex">
                <KaTeXView math={parsedPreview} />
              </div>
            </div>
            <div className="live-bar-right">
              <span className="live-tag">{form === 'POS' ? 'Dạng Hội ∏ (POS)' : 'Dạng Tuyển ∑ (SOP)'}</span>
              <span className="live-tag">{variableCount} biến ({variables.join(', ')})</span>
              <span className="live-tag live-tag-blue">Cổng {targetGateType.toUpperCase().replace('_', ' ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* PDF Presets Row */}
      <div className="apple-presets-section">
        <div className="presets-label-row">
          <span className="presets-title">Đề bài trong PDF (Chương 1, 2) — 1 chạm giải ngay:</span>
        </div>
        <div className="apple-presets-scroll">
          {EXAM_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                className={`apple-preset-chip ${isActive ? 'active' : ''}`}
                onClick={() => onSelectPreset(preset)}
                title={preset.description}
              >
                <span className="chip-badge">{preset.badge}</span>
                <span className="chip-label">{preset.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
