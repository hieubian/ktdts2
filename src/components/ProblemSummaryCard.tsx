import React, { useState } from 'react'
import type {
  CellValue,
  CombinationalRow,
  CombinationalSubtype,
  LedPolarity,
  OptimizationForm,
  TargetGateType,
  VariableCount
} from '../types'
import { KaTeXView } from './KaTeXView'
import { Check, Copy, FileText } from 'lucide-react'

export interface ProblemSummaryCardProps {
  problemType: 'cau_1' | 'cau_2'
  // Props for cau_1
  variableCount?: VariableCount
  variables?: string[]
  form?: OptimizationForm
  targetGateType?: TargetGateType
  gridValues?: Record<number, CellValue>

  // Props for cau_2
  combSubtype?: CombinationalSubtype
  combPolarity?: LedPolarity
  combInputVars?: string[]
  combOutputVars?: string[]
  combOutputPrefix?: 'F' | 'G' | 'Y'
  combRows?: CombinationalRow[]
  sevenSegChars?: string
  selectedSegOutputs?: string[]
  ruleTitle?: string
  converterTitle?: string

  title?: string
  subtitle?: string
  className?: string
  compact?: boolean
}

const GATE_LABELS: Record<TargetGateType, string> = {
  basic: 'cổng LOGIC cơ bản (AND, OR, NOT)',
  nand_2: 'cổng NAND 2 đầu vào',
  nand_n: 'cổng NAND nhiều đầu vào',
  nor_2: 'cổng NOR 2 đầu vào',
  nor_n: 'cổng NOR nhiều đầu vào'
}

export const ProblemSummaryCard: React.FC<ProblemSummaryCardProps> = ({
  problemType,
  variableCount = 4,
  variables = ['A', 'B', 'C', 'D'],
  form = 'SOP',
  targetGateType = 'nand_2',
  gridValues = {},
  combSubtype = 'single_rule',
  combPolarity = 'cathode_common',
  combInputVars = ['A', 'B', 'C', 'D'],
  combOutputVars = ['F'],
  combOutputPrefix = 'F',
  combRows = [],
  sevenSegChars = '456789AbC',
  selectedSegOutputs = ['a', 'b', 'c'],
  ruleTitle,
  converterTitle,
  title,
  subtitle,
  className = '',
  compact = false
}) => {
  const [copied, setCopied] = useState<boolean>(false)

  // --- CÂU 1 LOGIC ---
  const c1ActiveTerms: number[] = []
  const c1DcTerms: number[] = []
  const totalCells = 1 << variableCount

  for (let i = 0; i < totalCells; i++) {
    const val = gridValues[i]
    if (form === 'SOP') {
      if (val === 1) c1ActiveTerms.push(i)
      else if (val === 'd') c1DcTerms.push(i)
    } else {
      if (val === 0) c1ActiveTerms.push(i)
      else if (val === 'd') c1DcTerms.push(i)
    }
  }

  const inVarsStr = variables.join(', ')
  const targetGateText = GATE_LABELS[targetGateType]

  let c1LatexFormula = ''
  if (form === 'SOP') {
    const termsPart = c1ActiveTerms.length > 0 ? `\\sum(${c1ActiveTerms.join(', ')})` : '\\emptyset'
    const dcPart = c1DcTerms.length > 0 ? ` + d(${c1DcTerms.join(', ')})` : ''
    c1LatexFormula = `Y(${inVarsStr}) = ${termsPart}${dcPart}`
  } else {
    const termsPart = c1ActiveTerms.length > 0 ? `\\prod(${c1ActiveTerms.join(', ')})` : '\\emptyset'
    const dcPart = c1DcTerms.length > 0 ? ` \\cdot D(${c1DcTerms.join(', ')})` : ''
    c1LatexFormula = `Y(${inVarsStr}) = ${termsPart}${dcPart}`
  }

  // --- CÂU 2 LOGIC ---
  const c2InVarsStr = combInputVars.join(', ')
  const unusedRows = combRows.filter((r) => r.isUnused)
  const validRows = combRows.filter((r) => !r.isUnused)

  // Single rule terms
  const c2SingleRule1s: number[] = []
  const c2SingleRuleDcs: number[] = []
  if (combSubtype === 'single_rule') {
    combRows.forEach((r) => {
      if (r.isUnused || r.outputBits[0] === 'X') {
        c2SingleRuleDcs.push(r.decimal)
      } else if (r.outputBits[0] === 1) {
        c2SingleRule1s.push(r.decimal)
      }
    })
  }

  const c2SingleLatex =
    combSubtype === 'single_rule'
      ? `${combOutputPrefix}(${c2InVarsStr}) = \\sum(${c2SingleRule1s.join(', ') || '\\emptyset'})${
          c2SingleRuleDcs.length > 0 ? ` + d(${c2SingleRuleDcs.join(', ')})` : ''
        }`
      : ''

  const getProblemPlainText = (): string => {
    if (problemType === 'cau_1') {
      const formText = form === 'SOP' ? 'tuyển (SOP)' : 'hội (POS)'
      return `ĐỀ BÀI CÂU 1 (Rút gọn hàm Boolean - Chuẩn KTDTS):
Cho hàm Boolean sau: ${c1LatexFormula}
(Dạng ${formText}, ${variableCount} biến: ${inVarsStr})

Yêu cầu:
a. Rút gọn hàm Y bằng bảng Karnaugh?
b. Vẽ mạch sử dụng cổng LOGIC cơ bản?
c. Vẽ mạch chỉ sử dụng ${targetGateText}?`
    }

    if (combSubtype === 'single_rule') {
      return `ĐỀ BÀI CÂU 2 (Thiết kế mạch tổ hợp - 1 Hàm logic):
Cho mạch tổ hợp có 4 biến đầu vào là ${c2InVarsStr} có 1 hàm đầu ra là ${combOutputPrefix}.
${ruleTitle ? `Quy ước: ${ruleTitle}` : `Biểu thức: ${c2SingleLatex}`}
${unusedRows.length > 0 ? `Trạng thái cấm: {${unusedRows.map((r) => r.decimal).join(', ')}} (gán X)` : 'Xét đầy đủ 16 tổ hợp (không có trạng thái cấm).'}

Yêu cầu:
a. Tìm hàm đầu ra tối ưu cho mạch tổ hợp.
b. Vẽ sơ đồ mạch tổ hợp.`
    }

    if (combSubtype === 'code_converter') {
      const codeName = converterTitle || 'mã chuyển đổi'
      return `ĐỀ BÀI CÂU 2 (Thiết kế mạch tổ hợp chuyển mã):
Thiết kế mạch tổ hợp thực hiện quá trình chuyển đổi đầu vào là mã nhị phân 4 bít (${c2InVarsStr}) đầu ra là ${codeName} (${combOutputVars.join(', ')}) như bảng trạng thái.
${unusedRows.length > 0 ? `Trạng thái cấm: {${unusedRows.map((r) => r.decimal).join(', ')}} (gán X trên bảng, d trên bìa Karnaugh)` : ''}

Yêu cầu:
a. Tìm các hàm đầu ra tối ưu cho mạch tổ hợp chuyển mã (${combOutputVars.join(', ')}).
b. Vẽ sơ đồ mạch tổ hợp chuyển mã.`
    }

    // seven_segment
    const polStr = combPolarity === 'cathode_common' ? 'Cathode chung' : 'Anot chung'
    return `ĐỀ BÀI CÂU 2 (Thiết kế mạch giải mã LED 7 thanh):
Thiết kế mạch giải mã hiển thị thanh ${selectedSegOutputs.map((s) => `thanh ${s}`).join(', ')} của Led 7 thanh (${polStr}) để hiển thị chuỗi ký tự sau: ${Array.from(sevenSegChars).join(', ')}
(4 biến đầu vào ${c2InVarsStr} mã hóa thứ tự các ký tự 0..${Math.max(0, Array.from(sevenSegChars).length - 1)}; các tổ hợp còn lại là trạng thái cấm X).

Yêu cầu:
a. Tìm các hàm đầu ra tối ưu cho mạch giải mã (${selectedSegOutputs.map((s) => `thanh ${s}`).join(', ')}).
b. Vẽ sơ đồ mạch giải mã.`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getProblemPlainText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`problem-statement-card ${compact ? 'compact' : ''} ${className}`}>
      <div className="psc-header">
        <div className="psc-title-group">
          <div className="psc-badge">
            <FileText className="w-3.5 h-3.5" />
            <span>{title || (problemType === 'cau_1' ? 'Đề bài Câu 1' : 'Đề bài Câu 2')}</span>
          </div>
          <span className="psc-subtitle">
            {subtitle || (problemType === 'cau_1' ? 'Rút gọn hàm Boolean & Thiết kế mạch (Chuẩn KTDTS)' : 'Thiết kế mạch logic tổ hợp (Chuẩn KTDTS)')}
          </span>
        </div>

        <button
          type="button"
          className="psc-copy-btn"
          onClick={handleCopy}
          title="Sao chép đề bài vào bộ nhớ tạm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Chép đề bài</span>
            </>
          )}
        </button>
      </div>

      <div className="psc-body">
        {problemType === 'cau_1' ? (
          <div className="psc-cau1-content">
            <p className="psc-intro-text">
              Cho hàm Boolean sau:{' '}
              <span className="psc-tag-info">
                {variableCount} biến ({inVarsStr}) | {form === 'SOP' ? 'Chuẩn tắc Tuyển' : 'Chuẩn tắc Hội'}
              </span>
            </p>

            <div className="psc-math-box">
              <KaTeXView math={c1LatexFormula} block={true} />
            </div>

            <div className="psc-requirements-box">
              <span className="req-header">Yêu cầu:</span>
              <ol className="req-list-items">
                <li>
                  <span className="req-index">a.</span> Rút gọn hàm <em>Y</em> bằng bảng Karnaugh?
                </li>
                <li>
                  <span className="req-index">b.</span> Vẽ sơ đồ mạch sử dụng cổng LOGIC cơ bản (AND, OR, NOT)?
                </li>
                <li>
                  <span className="req-index">c.</span> Vẽ sơ đồ mạch chỉ sử dụng <strong>{targetGateText}</strong>?
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="psc-cau2-content">
            {combSubtype === 'single_rule' && (
              <>
                <p className="psc-intro-text">
                  Thiết kế mạch tổ hợp có <strong>4 biến đầu vào</strong> là{' '}
                  <span className="mono font-bold text-blue-600 dark:text-blue-400">{c2InVarsStr}</span> có{' '}
                  <strong>1 hàm đầu ra</strong> là{' '}
                  <span className="mono font-bold text-emerald-600 dark:text-emerald-400">{combOutputPrefix}</span>:
                </p>

                {ruleTitle && (
                  <div className="psc-rule-desc">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Quy ước điều kiện:</span>{' '}
                    <span>{ruleTitle}</span>
                  </div>
                )}

                <div className="psc-math-box">
                  <KaTeXView math={c2SingleLatex} block={true} />
                </div>

                <div className="psc-status-summary">
                  {c2SingleRuleDcs.length > 0 ? (
                    <div className="psc-status-line">
                      <span className="badge-dc">Trạng thái cấm (d/X):</span>{' '}
                      <span>
                        Gồm {c2SingleRuleDcs.length} tổ hợp: <code className="mono">{`{${c2SingleRuleDcs.join(', ')}}`}</code>
                      </span>
                    </div>
                  ) : (
                    <div className="psc-status-line">
                      <span className="badge-normal">Tổ hợp khảo sát:</span>{' '}
                      <span>Đầy đủ 16 tổ hợp (0 đến 15), không có trạng thái cấm.</span>
                    </div>
                  )}
                </div>

                <div className="psc-requirements-box">
                  <span className="req-header">Yêu cầu:</span>
                  <ol className="req-list-items">
                    <li>
                      <span className="req-index">a.</span> Tìm hàm đầu ra tối ưu cho mạch tổ hợp bằng bảng Karnaugh?
                    </li>
                    <li>
                      <span className="req-index">b.</span> Vẽ sơ đồ mạch logic tổ hợp?
                    </li>
                  </ol>
                </div>
              </>
            )}

            {combSubtype === 'code_converter' && (
              <>
                <p className="psc-intro-text">
                  Thiết kế mạch tổ hợp thực hiện quá trình chuyển đổi đầu vào là mã nhị phân 4 bít{' '}
                  <span className="mono font-bold text-blue-600 dark:text-blue-400">{c2InVarsStr}</span> đầu ra là{' '}
                  <strong>{converterTitle || 'mã chuyển đổi 4-bit'}</strong> (
                  <span className="mono font-bold text-emerald-600 dark:text-emerald-400">{combOutputVars.join(', ')}</span>) như bảng trạng thái:
                </p>

                <div className="psc-codes-preview-bar">
                  <span className="preview-label">Các từ mã chuyển đổi ({validRows.length} tổ hợp hợp lệ):</span>
                  <div className="preview-chips-row">
                    {validRows.slice(0, 10).map((r) => (
                      <span key={r.id} className="preview-code-chip">
                        <span className="dec-num">{r.decimal}</span>
                        <span className="arrow">→</span>
                        <span className="bin-code mono">{r.outputBits.join('')}</span>
                      </span>
                    ))}
                    {validRows.length > 10 && <span className="preview-more">+{validRows.length - 10} từ mã nữa</span>}
                  </div>
                </div>

                {unusedRows.length > 0 && (
                  <div className="psc-status-summary">
                    <div className="psc-status-line">
                      <span className="badge-dc">Trạng thái cấm (d/X):</span>{' '}
                      <span>
                        Các tổ hợp không sử dụng <code className="mono">{`{${unusedRows.map((r) => r.decimal).join(', ')}}`}</code> được gán <strong className="text-amber-600 dark:text-amber-400">X</strong> trên bảng chân lý và <strong className="text-amber-600 dark:text-amber-400">d</strong> trên bìa Karnaugh để tối ưu hóa.
                      </span>
                    </div>
                  </div>
                )}

                <div className="psc-requirements-box">
                  <span className="req-header">Yêu cầu:</span>
                  <ol className="req-list-items">
                    <li>
                      <span className="req-index">a.</span> Tìm các hàm đầu ra tối ưu cho mạch tổ hợp chuyển mã ({combOutputVars.join(', ')})?
                    </li>
                    <li>
                      <span className="req-index">b.</span> Vẽ sơ đồ mạch tổ hợp chuyển mã?
                    </li>
                  </ol>
                </div>
              </>
            )}

            {combSubtype === 'seven_segment' && (
              <>
                <p className="psc-intro-text">
                  Thiết kế mạch giải mã hiển thị{' '}
                  <strong>{selectedSegOutputs.map((s) => `thanh ${s}`).join(', ')}</strong> của Led 7 thanh (
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {combPolarity === 'cathode_common' ? 'Cathode chung: 1 = Sáng, 0 = Tắt' : 'Anot chung: 0 = Sáng, 1 = Tắt'}
                  </span>
                  ) để hiển thị các ký tự sau:
                </p>

                <div className="psc-7seg-chars-display">
                  <div className="chars-sequence-banner">
                    {Array.from(sevenSegChars).map((ch, idx) => (
                      <div key={idx} className="char-badge-item">
                        <span className="char-index mono">{idx}</span>
                        <span className="char-symbol font-bold">{ch}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="psc-status-summary">
                  <div className="psc-status-line">
                    <span>
                      Đầu vào gồm 4 biến <code className="mono font-bold">{c2InVarsStr}</code> mã hóa các trạng thái từ 0 đến{' '}
                      {Math.max(0, Array.from(sevenSegChars).length - 1)}.
                      {unusedRows.length > 0 && (
                        <span>
                          {' '}Các tổ hợp còn lại <code className="mono">{`{${unusedRows.map((r) => r.decimal).join(', ')}}`}</code> là{' '}
                          <span className="badge-dc">Trạng thái cấm X</span> (điền d vào bìa Karnaugh).
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="psc-requirements-box">
                  <span className="req-header">Yêu cầu:</span>
                  <ol className="req-list-items">
                    <li>
                      <span className="req-index">a.</span> Tìm các hàm đầu ra tối ưu cho mạch giải mã ({selectedSegOutputs.map((s) => `thanh ${s}`).join(', ')})?
                    </li>
                    <li>
                      <span className="req-index">b.</span> Vẽ sơ đồ mạch giải mã hiển thị LED 7 thanh?
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
