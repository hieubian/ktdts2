import type { OptimizationForm, TargetGateType, VariableCount } from '../types'

export interface ExamPreset {
  id: string
  problemType: 'cau_1' | 'cau_2'
  label: string
  badge: string
  equation: string
  form?: OptimizationForm
  variableCount?: VariableCount
  terms?: number[]
  dontCares?: number[]
  targetGateType?: TargetGateType
  combSubtype?: 'single_rule' | 'code_converter' | 'seven_segment'
  combRuleMode?: 'mod2or5' | 'moreOnes'
  combConverterType?: '5211' | 'excess3_cyclic'
  combSegPolarity?: 'anode_common' | 'cathode_common'
  combSegChars?: string
  combSegOutputs?: string[]
  description: string
}

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'cau_1_pdf',
    problemType: 'cau_1',
    label: 'Câu 1 (PDF)',
    badge: 'POS → NAND 2',
    equation: 'Y(A,B,C,D) = ∏(0,3,5,7,8,13,15) .D(9,11,12)',
    form: 'POS',
    variableCount: 4,
    terms: [0, 3, 5, 7, 8, 13, 15],
    dontCares: [9, 11, 12],
    targetGateType: 'nand_2',
    description: 'Đề Câu 1 PDF: Rút gọn hàm POS 4 biến bằng K-Map, vẽ mạch cơ bản và biến đổi sang cổng NAND 2 đầu vào.'
  },
  {
    id: 'cau_2_pdf',
    problemType: 'cau_1',
    label: 'Câu 2 (PDF)',
    badge: 'POS → NOR 2',
    equation: 'Y(A,B,C,D) = ∏(0,1,2,7,10,13,15) .D(3,5,9)',
    form: 'POS',
    variableCount: 4,
    terms: [0, 1, 2, 7, 10, 13, 15],
    dontCares: [3, 5, 9],
    targetGateType: 'nor_2',
    description: 'Đề Câu 2 PDF: Rút gọn hàm POS 4 biến bằng K-Map, vẽ mạch cơ bản và biến đổi sang cổng NOR 2 đầu vào.'
  },
  {
    id: 'cau_1_17_pdf',
    problemType: 'cau_1',
    label: 'Câu 1_17 (PDF)',
    badge: 'SOP → NAND 2',
    equation: 'Y(A,B,C,D) = ∑(0,1,4,5,7,9) + d(3,6,14)',
    form: 'SOP',
    variableCount: 4,
    terms: [0, 1, 4, 5, 7, 9],
    dontCares: [3, 6, 14],
    targetGateType: 'nand_2',
    description: 'Đề Câu 1_17 PDF: Rút gọn hàm SOP 4 biến bằng K-Map, vẽ mạch cơ bản và biến đổi sang cổng NAND 2 đầu vào.'
  },
  {
    id: 'cau_3_pdf',
    problemType: 'cau_1',
    label: 'Câu 3 (PDF)',
    badge: 'SOP → NOR 2',
    equation: 'Y(A,B,C,D) = ∑(1,3,6,9,12,14) + d(4,5,7)',
    form: 'SOP',
    variableCount: 4,
    terms: [1, 3, 6, 9, 12, 14],
    dontCares: [4, 5, 7],
    targetGateType: 'nor_2',
    description: 'Đề Câu 3 PDF: Rút gọn hàm SOP 4 biến bằng K-Map, vẽ mạch cơ bản và biến đổi sang cổng NOR 2 đầu vào.'
  },
  {
    id: 'cau_4_pdf',
    problemType: 'cau_2',
    label: 'Câu 4 (PDF)',
    badge: 'Chuyển mã 5211',
    equation: 'Chuyển đổi Nhị phân 4-bit sang Mã 5211',
    combSubtype: 'code_converter',
    combConverterType: '5211',
    description: 'Đề Câu 4 PDF: Thiết kế mạch chuyển mã 4-bit nhị phân sang mã 5211.'
  },
  {
    id: 'cau_5_pdf',
    problemType: 'cau_2',
    label: 'Câu 5 (PDF)',
    badge: 'Mã vòng dư 3',
    equation: 'Chuyển đổi Nhị phân 4-bit sang Mã vòng dư 3',
    combSubtype: 'code_converter',
    combConverterType: 'excess3_cyclic',
    description: 'Đề Câu 5 PDF: Thiết kế mạch chuyển đổi nhị phân 4-bit sang mã vòng dư 3.'
  },
  {
    id: 'cau_6_pdf',
    problemType: 'cau_2',
    label: 'Câu 6 (PDF)',
    badge: 'Bit 1 ≥ Bit 0',
    equation: 'Mạch 4 biến A,B,C,D: F = 1 nếu số bit 1 ≥ số bit 0',
    combSubtype: 'single_rule',
    combRuleMode: 'moreOnes',
    description: 'Đề Câu 6 PDF: Thiết kế mạch có 4 biến A,B,C,D, đầu ra F = 1 nếu số lượng bit 1 ≥ số lượng bit 0.'
  },
  {
    id: 'cau_7_pdf',
    problemType: 'cau_2',
    label: 'Câu 7 (PDF)',
    badge: 'Chia hết 2 hoặc 5',
    equation: 'Mạch 4 biến A,B,C,D: F = 1 nếu chia hết cho 2 hoặc 5',
    combSubtype: 'single_rule',
    combRuleMode: 'mod2or5',
    description: 'Đề Câu 7 PDF: Thiết kế mạch 4 biến A,B,C,D, đầu ra F = 1 nếu số nhị phân chia hết cho 2 hoặc 5.'
  },
  {
    id: 'cau_8_pdf',
    problemType: 'cau_2',
    label: 'Câu 8 (PDF)',
    badge: 'LED 7 Anot: e,f,g',
    equation: 'LED 7 thanh Anot chung (4,5,6,7,8,9,A,b,C) cho thanh e, f, g',
    combSubtype: 'seven_segment',
    combSegPolarity: 'anode_common',
    combSegChars: '456789AbC',
    combSegOutputs: ['e', 'f', 'g'],
    description: 'Đề Câu 8 PDF: Mạch giải mã hiển thị thanh e, f, g của LED 7 thanh (Anot chung) cho các ký tự 4, 5, 6, 7, 8, 9, A, b, C.'
  },
  {
    id: 'cau_9_pdf',
    problemType: 'cau_2',
    label: 'Câu 9 (PDF)',
    badge: 'LED 7 Cathode: a,b,c',
    equation: 'LED 7 thanh Cathode chung (1,2,3,4,5,6,7,8,9,A) cho thanh a, b, c',
    combSubtype: 'seven_segment',
    combSegPolarity: 'cathode_common',
    combSegChars: '123456789A',
    combSegOutputs: ['a', 'b', 'c'],
    description: 'Đề Câu 9 PDF: Mạch giải mã hiển thị thanh a, b, c của LED 7 thanh (Cathode chung) cho các ký tự 1, 2, 3, 4, 5, 6, 7, 8, 9, A.'
  }
]
