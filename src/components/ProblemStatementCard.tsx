import React, { useState } from 'react'
import type { CellValue, CombinationalRow, CombinationalSubtype, LedPolarity, OptimizationForm, TargetGateType, VariableCount } from '../types'
import { KaTeXView } from './KaTeXView'
import { BookOpen, Check, ChevronDown, ChevronUp, Copy, FileText, Sparkles } from 'lucide-react'

export interface Cau1PdfPreset {
  id: string
  codeName: string
  label: string
  sourceText: string
  variableCount: VariableCount
  form: OptimizationForm
  terms: number[]
  dontCares: number[]
  targetGateType: TargetGateType
  description: string
}

export const CAU_1_PDF_PRESETS: Cau1PdfPreset[] = [
  {
    id: 'pdf_c1',
    codeName: 'Câu 1 (PDF)',
    label: 'Câu 1: POS ∏(0,3,5,7,8,13,15) · D(9,11,12) [NAND 2-in]',
    sourceText: 'Bài tập Chương 1, 2 - Câu 1 (Trang 1 PDF)',
    variableCount: 4,
    form: 'POS',
    terms: [0, 3, 5, 7, 8, 13, 15],
    dontCares: [9, 11, 12],
    targetGateType: 'nand_2',
    description: 'Rút gọn hàm Boole dạng Hội (POS) có trạng thái cấm D, vẽ mạch logic cơ bản và biến đổi mạch sang cổng NAND 2 đầu vào.'
  },
  {
    id: 'pdf_c2',
    codeName: 'Câu 2 (PDF)',
    label: 'Câu 2: POS ∏(0,1,2,7,10,13,15) · D(3,5,9) [NOR 2-in]',
    sourceText: 'Bài tập Chương 1, 2 - Câu 2 (Trang 1 PDF)',
    variableCount: 4,
    form: 'POS',
    terms: [0, 1, 2, 7, 10, 13, 15],
    dontCares: [3, 5, 9],
    targetGateType: 'nor_2',
    description: 'Rút gọn hàm Boole dạng Hội (POS) có trạng thái cấm D, vẽ mạch logic cơ bản và biến đổi mạch sang cổng NOR 2 đầu vào.'
  },
  {
    id: 'pdf_c1_17',
    codeName: 'Câu 1_17 (PDF)',
    label: 'Câu 1_17: SOP ∑(0,1,4,5,7,9) + d(3,6,14) [NAND 2-in]',
    sourceText: 'Bài tập Chương 1, 2 - Câu 1_17 (Trang 1 PDF)',
    variableCount: 4,
    form: 'SOP',
    terms: [0, 1, 4, 5, 7, 9],
    dontCares: [3, 6, 14],
    targetGateType: 'nand_2',
    description: 'Rút gọn hàm Boole dạng Tuyển (SOP) có trạng thái cấm d, vẽ mạch logic cơ bản và biến đổi mạch sang cổng NAND 2 đầu vào.'
  },
  {
    id: 'pdf_c3',
    codeName: 'Câu 3 (PDF)',
    label: 'Câu 3: SOP ∑(1,3,6,9,12,14) + d(4,5,7) [NOR 2-in]',
    sourceText: 'Bài tập Chương 1, 2 - Câu 3 (Trang 1 PDF)',
    variableCount: 4,
    form: 'SOP',
    terms: [1, 3, 6, 9, 12, 14],
    dontCares: [4, 5, 7],
    targetGateType: 'nor_2',
    description: 'Rút gọn hàm Boole dạng Tuyển (SOP) có trạng thái cấm d, vẽ mạch logic cơ bản và biến đổi mạch sang cổng NOR 2 đầu vào.'
  }
]

export interface Cau2PdfPreset {
  id: string
  codeName: string
  label: string
  sourceText: string
  subtype: CombinationalSubtype
  outputPrefix?: 'F' | 'G' | 'Y'
  polarity?: LedPolarity
  chars?: string
  segments?: string[]
  description: string
}

export const CAU_2_PDF_PRESETS: Cau2PdfPreset[] = [
  {
    id: 'pdf_c4',
    codeName: 'Câu 4',
    label: 'Câu 4: Nhị phân → 5211 (Trang 1)',
    sourceText: 'Bài tập Chương 1, 2 - Câu 4 (Trang 1 PDF)',
    subtype: 'code_converter',
    outputPrefix: 'F',
    description: 'Thiết kế mạch tổ hợp chuyển đổi đầu vào là mã nhị phân 4 bít đầu ra là mã 5211 4 bít (10 tổ hợp 0–9 hợp lệ, 10–15 cấm X).'
  },
  {
    id: 'pdf_c5',
    codeName: 'Câu 5',
    label: 'Câu 5: Nhị phân → Mã vòng dư 3 (Trang 2)',
    sourceText: 'Bài tập Chương 1, 2 - Câu 5 (Trang 2 PDF)',
    subtype: 'code_converter',
    outputPrefix: 'F',
    description: 'Thiết kế mạch tổ hợp chuyển đổi đầu vào là mã nhị phân 4 bít đầu ra là mã vòng dư 3 có 4 bít (10 tổ hợp 0–9 hợp lệ, 10–15 cấm X).'
  },
  {
    id: 'pdf_c6',
    codeName: 'Câu 6',
    label: 'Câu 6: Bit 1 ≥ Bit 0 (Trang 2)',
    sourceText: 'Bài tập Chương 1, 2 - Câu 6 (Trang 2 PDF)',
    subtype: 'single_rule',
    outputPrefix: 'F',
    description: 'Thiết kế mạch tổ hợp có 4 biến đầu vào A, B, C, D có 1 hàm đầu ra F. Hàm ra = 1 nếu số lượng biến vào bằng 1 ≥ số lượng biến có giá trị bằng 0 (16 tổ hợp).'
  },
  {
    id: 'pdf_c7',
    codeName: 'Câu 7',
    label: 'Câu 7: Chia hết cho 2 hoặc 5 (Trang 2)',
    sourceText: 'Bài tập Chương 1, 2 - Câu 7 (Trang 2 PDF)',
    subtype: 'single_rule',
    outputPrefix: 'F',
    description: 'Thiết kế mạch tổ hợp có 4 biến đầu vào A, B, C, D có 1 hàm đầu ra F. Hàm ra = 1 nếu tổ hợp nhị phân tương ứng số thập phân chia hết cho 2 hoặc 5 (Mã BCD 0–9, 10–15 cấm X).'
  },
  {
    id: 'pdf_c8',
    codeName: 'Câu 8',
    label: 'Câu 8: LED 7 thanh e, f, g (Anot) (Trang 2-3)',
    sourceText: 'Bài tập Chương 1, 2 - Câu 8 (Trang 2, 3 PDF)',
    subtype: 'seven_segment',
    polarity: 'anode_common',
    chars: '456789AbC',
    segments: ['e', 'f', 'g'],
    description: 'Thiết kế mạch giải mã hiển thị thanh e, f, g của LED 7 thanh (Anot chung: 0=Sáng, 1=Tắt) hiển thị các ký tự: 4, 5, 6, 7, 8, 9, A, b, C.'
  },
  {
    id: 'pdf_c9',
    codeName: 'Câu 9',
    label: 'Câu 9: LED 7 thanh a, b, c (Cathode) (Trang 3)',
    sourceText: 'Bài tập Chương 1, 2 - Câu 9 (Trang 3 PDF)',
    subtype: 'seven_segment',
    polarity: 'cathode_common',
    chars: '123456789A',
    segments: ['a', 'b', 'c'],
    description: 'Thiết kế mạch giải mã hiển thị thanh a, b, c của LED 7 thanh (Cathode chung: 1=Sáng, 0=Tắt) hiển thị các ký tự: 1, 2, 3, 4, 5, 6, 7, 8, 9, A.'
  }
]

interface ProblemStatementCardProps {
  currentProblem: 'cau_1' | 'cau_2'
  // Props cho Câu 1:
  variableCount?: VariableCount
  variables?: string[]
  form?: OptimizationForm
  targetGateType?: TargetGateType
  gridValues?: Record<number, CellValue>
  onSelectCau1Preset?: (preset: Cau1PdfPreset) => void
  activeCau1PresetId?: string | null

  // Props cho Câu 2:
  combSubtype?: CombinationalSubtype
  combPolarity?: LedPolarity
  combOutputPrefix?: 'F' | 'G' | 'Y'
  combInputVars?: string[]
  combOutputVars?: string[]
  combAllRows?: CombinationalRow[]
  sevenSegChars?: string
  selectedSegOutputs?: string[]
  onSelectCau2Preset?: (preset: Cau2PdfPreset) => void
  activeCau2PresetId?: string | null
}

export const ProblemStatementCard: React.FC<ProblemStatementCardProps> = ({
  currentProblem,
  variableCount = 4,
  variables = ['A', 'B', 'C', 'D'],
  form = 'POS',
  targetGateType = 'nand_2',
  gridValues = {},
  onSelectCau1Preset,
  activeCau1PresetId,
  combSubtype = 'single_rule',
  combPolarity = 'cathode_common',
  combOutputPrefix = 'F',
  combInputVars = ['A', 'B', 'C', 'D'],
  combOutputVars = ['F'],
  combAllRows = [],
  sevenSegChars = '',
  selectedSegOutputs = [],
  onSelectCau2Preset,
  activeCau2PresetId
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [isCopied, setIsCopied] = useState<boolean>(false)

  const gateLabelMap: Record<TargetGateType, string> = {
    basic: 'cổng LOGIC cơ bản (AND, OR, NOT)',
    nand_2: 'cổng NAND 2 đầu vào',
    nand_n: 'cổng NAND nhiều đầu vào',
    nor_2: 'cổng NOR 2 đầu vào',
    nor_n: 'cổng NOR nhiều đầu vào'
  }

  // --- TÍNH TOÁN DỮ LIỆU ĐỀ BÀI CÂU 1 ---
  const cau1Data = React.useMemo(() => {
    const total = 1 << variableCount
    const terms: number[] = []
    const dontCares: number[] = []
    const targetVal = form === 'SOP' ? 1 : 0

    for (let i = 0; i < total; i++) {
      const v = gridValues[i]
      if (v === targetVal) {
        terms.push(i)
      } else if (v === 'd') {
        dontCares.push(i)
      }
    }

    const varListStr = variables.join(', ')
    let formulaLatex = ''
    let formulaText = ''

    if (form === 'SOP') {
      const mintermsPart = terms.length > 0 ? terms.join(', ') : '\\emptyset'
      const dcPart = dontCares.length > 0 ? ` + d(${dontCares.join(', ')})` : ''
      formulaLatex = `Y(${varListStr}) = \\sum(${mintermsPart})${dcPart}`
      formulaText = `Y(${varListStr}) = ∑(${terms.join(', ')})${dontCares.length > 0 ? ` + d(${dontCares.join(', ')})` : ''}`
    } else {
      const maxtermsPart = terms.length > 0 ? terms.join(', ') : '\\emptyset'
      const dcPart = dontCares.length > 0 ? ` \\cdot D(${dontCares.join(', ')})` : ''
      formulaLatex = `Y(${varListStr}) = \\prod(${maxtermsPart})${dcPart}`
      formulaText = `Y(${varListStr}) = ∏(${terms.join(', ')})${dontCares.length > 0 ? ` · D(${dontCares.join(', ')})` : ''}`
    }

    const matchedPreset = CAU_1_PDF_PRESETS.find((p) => p.id === activeCau1PresetId)
    const title = matchedPreset ? matchedPreset.label : `Hàm Boolean Y(${varListStr}) dạng ${form === 'SOP' ? 'Tuyển (SOP)' : 'Hội (POS)'}`
    const source = matchedPreset ? matchedPreset.sourceText : 'Tự tùy biến thông số'

    return {
      title,
      source,
      formulaLatex,
      formulaText,
      terms,
      dontCares,
      gateText: gateLabelMap[targetGateType]
    }
  }, [variableCount, variables, form, targetGateType, gridValues, activeCau1PresetId])

  // --- TÍNH TOÁN DỮ LIỆU ĐỀ BÀI CÂU 2 ---
  const cau2Data = React.useMemo(() => {
    const matchedPreset = CAU_2_PDF_PRESETS.find((p) => p.id === activeCau2PresetId)
    const inVarsStr = combInputVars.join(', ')
    const outVarsStr = combOutputVars.join(', ')
    const unusedRows = combAllRows.filter((r) => r.isUnused)
    const validRows = combAllRows.filter((r) => !r.isUnused)

    let title = ''
    let source = matchedPreset ? matchedPreset.sourceText : 'Thiết kế mạch tổ hợp chuẩn KTDTS'
    let statementText = ''
    let mathSummary = ''
    let requirements: string[] = []

    if (combSubtype === 'single_rule') {
      const highRows = validRows.filter((r) => r.outputBits[0] === 1)
      const highDecs = highRows.map((r) => r.decimal).sort((a, b) => a - b)
      const unusedDecs = unusedRows.map((r) => r.decimal).sort((a, b) => a - b)

      title = matchedPreset
        ? matchedPreset.label
        : `Mạch logic 1 hàm đầu ra ${combOutputPrefix}(${inVarsStr}) theo điều kiện`

      statementText = `Cho mạch logic tổ hợp gồm ${combInputVars.length} biến đầu vào là ${inVarsStr} và 1 hàm đầu ra là ${combOutputPrefix}. Hàm ra nhận giá trị 1 tại các tổ hợp thập phân {${highDecs.join(', ')}}. ${
        unusedDecs.length > 0
          ? `Các tổ hợp {${unusedDecs.join(', ')}} là trạng thái cấm (không xảy ra trong thực tế, ký hiệu X trên bảng trạng thái và d trên bìa Karnaugh).`
          : 'Xét đầy đủ 16 tổ hợp đầu vào (không có trạng thái cấm).'
      }`

      mathSummary = `${combOutputPrefix}(${inVarsStr}) = \\sum(${highDecs.join(', ')})${
        unusedDecs.length > 0 ? ` + d(${unusedDecs.join(', ')})` : ''
      }`

      requirements = [
        `a. Lập bảng trạng thái (bảng chân lý) và tìm hàm đầu ra tối ưu ${combOutputPrefix} bằng bảng Karnaugh.`,
        `b. Vẽ sơ đồ mạch logic tổ hợp sử dụng các cổng logic cơ bản.`
      ]
    } else if (combSubtype === 'code_converter') {
      const activeDecs = validRows.map((r) => r.decimal).sort((a, b) => a - b)
      const unusedDecs = unusedRows.map((r) => r.decimal).sort((a, b) => a - b)

      let codeTypeName = 'mã tùy biến'
      if (activeCau2PresetId === 'pdf_c4') codeTypeName = 'mã 5211 4 bít'
      else if (activeCau2PresetId === 'pdf_c5') codeTypeName = 'mã vòng dư 3 có 4 bít'
      else if (combOutputPrefix === 'G') codeTypeName = 'mã Gray 4-bit'
      else if (activeDecs.length === 10) codeTypeName = 'mã nhị phân / BCD sang mã 4-bit'

      title = matchedPreset
        ? matchedPreset.label
        : `Chuyển đổi mã nhị phân 4-bit sang ${codeTypeName}`

      statementText = `Thiết kế mạch tổ hợp thực hiện quá trình chuyển đổi đầu vào là mã nhị phân 4 bít (${inVarsStr}) đầu ra là ${codeTypeName} (${outVarsStr}). Mạch nhận ${validRows.length} từ mã đầu vào hợp lệ tương ứng các số thập phân từ ${activeDecs[0] ?? 0} đến ${activeDecs[activeDecs.length - 1] ?? 9}.${
        unusedDecs.length > 0
          ? ` Các tổ hợp còn lại {${unusedDecs.join(', ')}} là trạng thái cấm (điền X trên bảng trạng thái và d trên bìa Karnaugh).`
          : ''
      }`

      requirements = [
        `a. Lập bảng trạng thái chuyển mã và tìm các hàm đầu ra tối ưu (${outVarsStr}) bằng bảng Karnaugh.`,
        `b. Vẽ sơ đồ mạch tổ hợp chuyển mã theo hệ thống bus đầu vào.`
      ]
    } else {
      // seven_segment
      const charsList = Array.from(sevenSegChars).join(', ')
      const polarityText =
        combPolarity === 'anode_common'
          ? 'Anot chung (0 = Sáng, 1 = Tắt)'
          : 'Cathode chung (1 = Sáng, 0 = Tắt)'

      title = matchedPreset
        ? matchedPreset.label
        : `Mạch giải mã LED 7 thanh (${selectedSegOutputs.join(', ')}) - ${combPolarity === 'anode_common' ? 'Anot chung' : 'Cathode chung'}`

      statementText = `Thiết kế mạch giải mã hiển thị thanh ${selectedSegOutputs.join(', ')} của LED 7 thanh (${polarityText}) để hiển thị chuỗi ký tự sau: [ ${charsList} ] tương ứng với các tổ hợp đầu vào nhị phân 4 bít từ 0000 đến số thứ tự ký tự. Các tổ hợp nhị phân còn lại là trạng thái cấm (điền X).`

      requirements = [
        `a. Lập bảng trạng thái giải mã và tìm các hàm đầu ra tối ưu (${selectedSegOutputs.join(', ')}) bằng bảng Karnaugh.`,
        `b. Vẽ sơ đồ mạch giải mã LED 7 thanh.`
      ]
    }

    return {
      title,
      source,
      statementText,
      mathSummary,
      requirements,
      unusedCount: unusedRows.length
    }
  }, [
    activeCau2PresetId,
    combSubtype,
    combPolarity,
    combOutputPrefix,
    combInputVars,
    combOutputVars,
    combAllRows,
    sevenSegChars,
    selectedSegOutputs
  ])

  // --- HÀM SAO CHÉP ĐỀ BÀI VÀO CLIPBOARD ---
  const handleCopyProblem = () => {
    let textToCopy = ''
    if (currentProblem === 'cau_1') {
      textToCopy = `ĐỀ BÀI: ${cau1Data.title}\nNguồn: ${cau1Data.source}\n`
      textToCopy += `Biểu thức: ${cau1Data.formulaText}\n`
      textToCopy += `Yêu cầu:\n`
      textToCopy += `a. Rút gọn hàm Y bằng bảng Karnaugh?\n`
      textToCopy += `b. Vẽ mạch sử dụng cổng LOGIC cơ bản (AND, OR, NOT)?\n`
      textToCopy += `c. Vẽ mạch chỉ sử dụng ${cau1Data.gateText}?`
    } else {
      textToCopy = `ĐỀ BÀI: ${cau2Data.title}\nNguồn: ${cau2Data.source}\n`
      textToCopy += `Mô tả: ${cau2Data.statementText}\n`
      textToCopy += `Yêu cầu:\n`
      cau2Data.requirements.forEach((req) => {
        textToCopy += `${req}\n`
      })
    }

    navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="problem-statement-card">
      {/* THANH CHỌN NHANH ĐỀ BÀI CHUẨN TỪ FILE PDF */}
      <div className="pdf-presets-bar no-print">
        <div className="pdf-presets-header">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-blue-700 dark:text-blue-400">
            <BookOpen className="w-4 h-4" />
            <span>Chọn nhanh bài tập chuẩn trong Giáo trình & Đề thi (PDF):</span>
          </div>
          <span className="text-xs text-slate-500">Nhấp chọn để tự động nạp toàn bộ thông số đề bài chuẩn</span>
        </div>

        <div className="pdf-preset-pills-row">
          {currentProblem === 'cau_1'
            ? CAU_1_PDF_PRESETS.map((p) => {
                const isActive = activeCau1PresetId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`pdf-preset-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectCau1Preset && onSelectCau1Preset(p)}
                    title={p.description}
                  >
                    <span className="preset-btn-tag">{p.codeName}</span>
                    <span className="preset-btn-text">{p.form === 'POS' ? 'POS ∏' : 'SOP ∑'} · {p.targetGateType === 'nand_2' ? 'NAND-2' : 'NOR-2'}</span>
                  </button>
                )
              })
            : CAU_2_PDF_PRESETS.map((p) => {
                const isActive = activeCau2PresetId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`pdf-preset-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectCau2Preset && onSelectCau2Preset(p)}
                    title={p.description}
                  >
                    <span className="preset-btn-tag">{p.codeName}</span>
                    <span className="preset-btn-text">
                      {p.id === 'pdf_c4' && 'Nhị phân → 5211'}
                      {p.id === 'pdf_c5' && 'Nhị phân → Vòng dư 3'}
                      {p.id === 'pdf_c6' && 'Bit 1 ≥ Bit 0'}
                      {p.id === 'pdf_c7' && 'Chia hết 2 hoặc 5'}
                      {p.id === 'pdf_c8' && 'LED 7-seg e,f,g (Anot)'}
                      {p.id === 'pdf_c9' && 'LED 7-seg a,b,c (Cathode)'}
                    </span>
                  </button>
                )
              })}
        </div>
      </div>

      {/* KHUNG TỔNG HỢP NỘI DUNG ĐỀ BÀI HIỆN TẠI */}
      <div className="statement-inner-card">
        <div className="statement-header-row">
          <div className="statement-title-group">
            <span className="statement-badge">
              <Sparkles className="w-3.5 h-3.5" />
              ĐỀ BÀI HIỆN TẠI (Chuẩn Kỹ thuật điện tử số)
            </span>
            <span className="statement-source-chip">
              {currentProblem === 'cau_1' ? cau1Data.source : cau2Data.source}
            </span>
          </div>

          <div className="statement-actions-group no-print">
            <button
              type="button"
              className={`statement-action-btn ${isCopied ? 'copied' : ''}`}
              onClick={handleCopyProblem}
              title="Sao chép đề bài chuẩn để nộp bài hoặc ghi chép"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép đề bài</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="statement-action-btn icon-only"
              onClick={() => setIsCollapsed((prev) => !prev)}
              title={isCollapsed ? 'Mở rộng chi tiết đề bài' : 'Thu gọn đề bài'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* TIÊU ĐỀ BÀI TẬP */}
        <h2 className="statement-heading">
          {currentProblem === 'cau_1' ? cau1Data.title : cau2Data.title}
        </h2>

        {/* NỘI DUNG CHI TIẾT KHI KHÔNG BỊ THU GỌN */}
        {!isCollapsed && (
          <div className="statement-body">
            {currentProblem === 'cau_1' ? (
              <div className="cau1-statement-content">
                <div className="statement-math-box">
                  <div className="math-label">Cho hàm Boolean sau:</div>
                  <div className="math-formula">
                    <KaTeXView math={cau1Data.formulaLatex} block={true} />
                  </div>
                </div>

                <div className="statement-specs-chips">
                  <span className="spec-chip">
                    <strong>Số biến:</strong> {variableCount} biến ({variables.join(', ')})
                  </span>
                  <span className="spec-chip">
                    <strong>Dạng chuẩn tắc:</strong>{' '}
                    {form === 'SOP' ? 'Chuẩn tắc Tuyển (SOP - Minterm)' : 'Chuẩn tắc Hội (POS - Maxterm)'}
                  </span>
                  <span className="spec-chip">
                    <strong>Cổng yêu cầu:</strong> {cau1Data.gateText}
                  </span>
                  {cau1Data.dontCares.length > 0 && (
                    <span className="spec-chip warning">
                      <strong>Trạng thái cấm:</strong> {cau1Data.dontCares.length} ô tùy định d({cau1Data.dontCares.join(', ')})
                    </span>
                  )}
                </div>

                <div className="statement-requirements-box">
                  <div className="req-title">Yêu cầu bài thi:</div>
                  <ul className="req-list">
                    <li>
                      <strong>a.</strong> Rút gọn hàm <em>Y</em> bằng bảng Karnaugh?
                    </li>
                    <li>
                      <strong>b.</strong> Vẽ sơ đồ mạch sử dụng cổng LOGIC cơ bản (AND, OR, NOT)?
                    </li>
                    <li>
                      <strong>c.</strong> Vẽ sơ đồ mạch chỉ sử dụng <strong>{cau1Data.gateText}</strong>?
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="cau2-statement-content">
                <div className="statement-description-text">
                  <FileText className="w-4 h-4 text-blue-500 inline-block mr-1.5 flex-shrink-0" />
                  <span>{cau2Data.statementText}</span>
                </div>

                {cau2Data.mathSummary && (
                  <div className="statement-math-box mt-2">
                    <div className="math-label">Biểu thức đại số Boole đề bài:</div>
                    <div className="math-formula">
                      <KaTeXView math={cau2Data.mathSummary} block={true} />
                    </div>
                  </div>
                )}

                <div className="statement-specs-chips">
                  <span className="spec-chip">
                    <strong>Đầu vào:</strong> {combInputVars.length} biến ({combInputVars.join(', ')})
                  </span>
                  <span className="spec-chip">
                    <strong>Đầu ra:</strong> {combOutputVars.length} hàm ({combOutputVars.join(', ')})
                  </span>
                  <span className="spec-chip">
                    <strong>Phân loại:</strong>{' '}
                    {combSubtype === 'single_rule'
                      ? 'Mạch 1 hàm ra theo điều kiện'
                      : combSubtype === 'code_converter'
                      ? 'Mạch chuyển đổi mã 4-bit'
                      : `Mạch giải mã LED 7 thanh (${combPolarity === 'anode_common' ? 'Anot chung' : 'Cathode chung'})`}
                  </span>
                  {cau2Data.unusedCount > 0 && (
                    <span className="spec-chip warning">
                      <strong>Trạng thái cấm:</strong> Gồm {cau2Data.unusedCount} tổ hợp (gán X trên bảng, d trên K-Map)
                    </span>
                  )}
                </div>

                <div className="statement-requirements-box">
                  <div className="req-title">Yêu cầu bài thi:</div>
                  <ul className="req-list">
                    {cau2Data.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
