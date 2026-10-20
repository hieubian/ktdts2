// Rút gọn hàm transformPosDetailed - chỉ chứa phần đơn giản hóa
// File tạm để copy code, sau đó sẽ paste vào algebraicTransformer.ts

import type { KMapGroup, TargetGateType, TransformationStep } from '../types'

function formatLiteral(v: string, inverted: boolean): string {
  return inverted ? `\\overline{${v}}` : v
}

function formatComplementLiteral(v: string, inverted: boolean): string {
  return inverted ? v : `\\overline{${v}}`
}

function termToPosLatex(group: KMapGroup): string {
  if (group.literals.length === 0) return '0'
  const inner = group.literals
    .map((l) => formatLiteral(l.variable, l.inverted))
    .join(' + ')
  return `(${inner})`
}

export function transformPosDetailed(
  groups: KMapGroup[],
  targetGate: TargetGateType,
  funcName: string
): TransformationStep[] {
  const steps: TransformationStep[] = []
  const initialPos = groups.map(termToPosLatex).join(' \\cdot ')
  const termSymbols = groups.map((_, i) => `M_{${i + 1}}`)

  steps.push({
    title: 'Biểu thức tối thiểu',
    description: `Từ bảng Karnaugh câu a: ${groups.map((g, i) => `$M_{${i + 1}}$ (${g.cells.join(', ')})`).join(', ')}.`,
    ruleName: 'Chuẩn tắc Hội (POS - Product of Sums)',
    ruleFormula: 'Y = M_1 \\cdot M_2 \\cdot \\cdots \\cdot M_k',
    latex: `${funcName} = ${initialPos}`
  })

  steps.push({
    title: 'Phủ định kép toàn phần',
    description: 'Áp dụng định luật hoàn nguyên.',
    ruleName: 'Định luật hoàn nguyên',
    ruleFormula: '\\overline{\\overline{X}} = X',
    latex: `${funcName} = \\overline{\\overline{${funcName}}} = \\overline{\\overline{ ${initialPos} }}`
  })

  if (targetGate === 'nor_n') {
    const norTerms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')
      return `\\overline{${inside}}`
    })

    steps.push({
      title: 'De Morgan',
      description: 'Nhân chuyển thành cộng.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ ${norTerms.join(' + ')} }`
    })

    steps.push({
      title: 'Cấu trúc mạch NOR nhiều đầu vào',
      description: `Tầng 1: ${groups.length} cổng NOR. Tầng 2: 1 cổng NOR ${groups.length} đầu vào.`,
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ ${norTerms.join(' + ')} }`
    })
    return steps
  }

  if (targetGate === 'nor_2') {
    const stage1Terms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')
      return `\\overline{${inside}}`
    })

    steps.push({
      title: 'De Morgan',
      description: 'Nhân chuyển thành cộng.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ ${stage1Terms.join(' + ')} }`
    })

    const decomposedNorTerms: { original: string; latex: string; vLabel: string; literalsCount: number }[] = []
    let hasMultiSum = false

    groups.forEach((g, idx) => {
      const vLabel = `V_{${idx + 1}}`
      const orig = `\\overline{${g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')}}`
      const litCount = g.literals.length

      if (litCount <= 2) {
        decomposedNorTerms.push({ original: orig, latex: orig, vLabel, literalsCount: litCount })
      } else if (litCount === 3) {
        hasMultiSum = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const pair = `\\overline{${l0} + ${l1}}`
        const decomp = `\\overline{ \\overline{${pair}} + ${l2} }`
        decomposedNorTerms.push({ original: orig, latex: decomp, vLabel, literalsCount: litCount })
      } else {
        hasMultiSum = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const l3 = formatLiteral(g.literals[3].variable, g.literals[3].inverted)
        const pair1 = `\\overline{${l0} + ${l1}}`
        const pair2 = `\\overline{${l2} + ${l3}}`
        const decomp = `\\overline{ \\overline{${pair1}} + \\overline{${pair2}} }`
        decomposedNorTerms.push({ original: orig, latex: decomp, vLabel, literalsCount: litCount })
      }
    })

    if (hasMultiSum) {
      const multiItems = decomposedNorTerms.filter((d) => d.literalsCount > 2)
      steps.push({
        title: 'Tách thừa số nhiều biến về NOR 2 đầu vào',
        description: 'Phân tích ≥3 biến.',
        ruleName: '',
        ruleFormula: '',
        latex: multiItems.map((m) => `${m.original} = ${m.latex}`).join(' \\quad ; \\quad ')
      })
    }

    steps.push({
      title: 'Tín hiệu tầng 1',
      description: `${decomposedNorTerms.map((d) => `$${d.vLabel} = ${d.latex}$`).join(' ; ')}.`,
      ruleName: '',
      ruleFormula: '',
      latex: decomposedNorTerms.map((d) => `${d.vLabel} = ${d.latex}`).join(' \\quad ; \\quad ')
    })

    if (decomposedNorTerms.length === 1) {
      steps.push({
        title: 'Ngõ ra',
        description: '1 thừa số: qua cổng đảo.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{${decomposedNorTerms[0].latex}}`
      })
    } else if (decomposedNorTerms.length === 2) {
      steps.push({
        title: 'Tầng 2',
        description: '2 thừa số: 1 cổng NOR 2 đầu vào.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} }`
      })
    } else if (decomposedNorTerms.length === 3) {
      steps.push({
        title: 'Phân tầng cascade',
        description: '3 thừa số: ghép tuần tự.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{P_{12}} + V_3 } \\quad ; \\quad P_{12} = \\overline{ V_1 + V_2 }`
      })
      steps.push({
        title: 'Biểu thức đầy đủ',
        description: 'Thay thế.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} }} + ${decomposedNorTerms[2].latex} }`
      })
    } else {
      steps.push({
        title: 'Phân tầng cân bằng',
        description: '4 thừa số: chia 2 nhánh.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{P_{12}} + \\overline{P_{34}} } \\quad ; \\quad P_{12} = \\overline{ V_1 + V_2 } \\quad ; \\quad P_{34} = \\overline{ V_3 + V_4 }`
      })
      steps.push({
        title: 'Biểu thức đầy đủ',
        description: 'Thay thế.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} }} + \\overline{\\overline{ ${decomposedNorTerms[2].latex} + ${decomposedNorTerms[3].latex} }} }`
      })
    }
    return steps
  }

  const nandTerms = groups.map((g) => {
    const inside = g.literals.map((l) => formatComplementLiteral(l.variable, l.inverted)).join(' \\cdot ')
    return `\\overline{${inside}}`
  })

  steps.push({
    title: 'Biến đổi tổng sang NAND',
    description: 'De Morgan: tổng = phủ định tích.',
    ruleName: '',
    ruleFormula: 'A + B = \\overline{\\overline{A} \\cdot \\overline{B}}',
    latex: groups.map((g, i) => `${termSymbols[i]} = ${termToPosLatex(g)} = ${nandTerms[i]}`).join(' \\quad ; \\quad ')
  })

  steps.push({
    title: 'Thay thế vào hàm',
    description: '',
    ruleName: '',
    ruleFormula: '',
    latex: `${funcName} = ${nandTerms.join(' \\cdot ')}`
  })

  if (targetGate === 'nand_n') {
    steps.push({
      title: 'Tầng 2 NAND',
      description: 'Phủ định 2 lần: NAND thu gom.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ ${nandTerms.join(' \\cdot ')} } }`
    })
    return steps
  }

  const decomposedNandTerms: { original: string; latex: string; litCount: number }[] = []
  let hasMultiNandTerm = false

  groups.forEach((g, idx) => {
    const orig = nandTerms[idx]
    const litCount = g.literals.length

    if (litCount <= 2) {
      decomposedNandTerms.push({ original: orig, latex: orig, litCount })
    } else if (litCount === 3) {
      hasMultiNandTerm = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const pair = `\\overline{${l0} \\cdot ${l1}}`
      const decomp = `\\overline{ \\overline{${pair}} \\cdot ${l2} }`
      decomposedNandTerms.push({ original: orig, latex: decomp, litCount })
    } else {
      hasMultiNandTerm = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const l3 = formatComplementLiteral(g.literals[3].variable, g.literals[3].inverted)
      const pair1 = `\\overline{${l0} \\cdot ${l1}}`
      const pair2 = `\\overline{${l2} \\cdot ${l3}}`
      const decomp = `\\overline{ \\overline{${pair1}} \\cdot \\overline{${pair2}} }`
      decomposedNandTerms.push({ original: orig, latex: decomp, litCount })
    }
  })

  if (hasMultiNandTerm) {
    steps.push({
      title: 'Tách thừa số nhiều biến về NAND 2 đầu vào',
      description: 'Phân tích ≥3 biến.',
      ruleName: '',
      ruleFormula: '',
      latex: decomposedNandTerms.map((d) => d.latex).join(' \\quad ; \\quad ')
    })
  }

  if (decomposedNandTerms.length === 1) {
    steps.push({
      title: 'Ngõ ra',
      description: '1 thừa số.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${decomposedNandTerms[0].latex}`
    })
  } else if (decomposedNandTerms.length === 2) {
    steps.push({
      title: 'Tầng 2',
      description: '2 thừa số: NAND + đảo.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ ${decomposedNandTerms[0].latex} \\cdot ${decomposedNandTerms[1].latex} } }`
    })
  } else if (decomposedNandTerms.length === 3) {
    steps.push({
      title: 'Phân tầng cascade',
      description: '3 thừa số: ghép tuần tự.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ P_{12} \\cdot M_3 } } \\quad ; \\quad P_{12} = \\overline{ \\overline{ M_1 \\cdot M_2 } }`
    })
    steps.push({
      title: 'Biểu thức đầy đủ',
      description: 'Thay thế.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNandTerms[0].latex} \\cdot ${decomposedNandTerms[1].latex} } } \\cdot ${decomposedNandTerms[2].latex} } }`
    })
  } else {
    steps.push({
      title: 'Phân tầng cân bằng',
      description: '4 thừa số: chia 2 nhánh.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ P_{12} \\cdot P_{34} } }`
    })
    steps.push({
      title: 'Biểu thức đầy đủ',
      description: 'Thay thế.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNandTerms[0].latex} \\cdot ${decomposedNandTerms[1].latex} } } \\cdot \\overline{ \\overline{ ${decomposedNandTerms[2].latex} \\cdot ${decomposedNandTerms[3].latex} } } } }`
    })
  }
  return steps
}
