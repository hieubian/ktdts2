import type { KMapGroup, OptimizationForm, TargetGateType, TransformationStep } from '../types'

function formatLiteral(v: string, inverted: boolean): string {
  return inverted ? `\\overline{${v}}` : v
}

function formatComplementLiteral(v: string, inverted: boolean): string {
  return inverted ? v : `\\overline{${v}}`
}

function termToSopLatex(group: KMapGroup): string {
  if (group.literals.length === 0) return '1'
  return group.literals
    .map((l) => formatLiteral(l.variable, l.inverted))
    .join(' \\cdot ')
}

function termToPosLatex(group: KMapGroup): string {
  if (group.literals.length === 0) return '0'
  const inner = group.literals
    .map((l) => formatLiteral(l.variable, l.inverted))
    .join(' + ')
  return `(${inner})`
}

export function generateTransformations(
  groups: KMapGroup[],
  form: OptimizationForm,
  targetGate: TargetGateType,
  funcName: string = 'Y'
): TransformationStep[] {
  if (groups.length === 0) {
    const constVal = form === 'SOP' ? '0' : '1'
    return [
      {
        title: 'Hàm logic hằng số',
        description: `Do không có ô nào được chọn trên bìa Karnaugh, hàm luôn nhận giá trị hằng số $${constVal}$.`,
        ruleName: 'Hằng số logic',
        ruleFormula: `${funcName} = ${constVal}`,
        latex: `${funcName} = ${constVal}`
      }
    ]
  }

  if (targetGate === 'basic') {
    const expr = form === 'SOP'
      ? groups.map(termToSopLatex).join(' + ')
      : groups.map(termToPosLatex).join(' \\cdot ')

    return [
      {
        title: 'Biểu thức tối thiểu',
        description: `Từ bảng Karnaugh câu a: ${groups.map((g, i) => `$T_{${i + 1}}$ (${g.cells.join(', ')})`).join(', ')}.`,
        ruleName: form === 'SOP' ? 'Chuẩn tắc Tuyển (SOP - Sum of Products)' : 'Chuẩn tắc Hội (POS - Product of Sums)',
        ruleFormula: form === 'SOP' ? 'Y = T_1 + T_2 + \\cdots + T_k' : 'Y = M_1 \\cdot M_2 \\cdot \\cdots \\cdot M_k',
        latex: `${funcName} = ${expr}`
      },
      {
        title: 'Mạch logic cơ bản',
        description: form === 'SOP'
          ? 'Tầng 1: AND. Tầng 2: OR. Biến đảo: NOT.'
          : 'Tầng 1: OR. Tầng 2: AND. Biến đảo: NOT.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = ${expr}`
      }
    ]
  }

  if (form === 'SOP') {
    return transformSopDetailed(groups, targetGate, funcName)
  }
  return transformPosDetailed(groups, targetGate, funcName)
}

function transformSopDetailed(
  groups: KMapGroup[],
  targetGate: TargetGateType,
  funcName: string
): TransformationStep[] {
  const steps: TransformationStep[] = []
  const initialSop = groups.map(termToSopLatex).join(' + ')
  const termSymbols = groups.map((_, i) => `T_{${i + 1}}`)

  steps.push({
    title: 'Biểu thức tối thiểu',
    description: `Từ bảng Karnaugh câu a: ${groups.map((g, i) => `$T_{${i + 1}}$ (${g.cells.join(', ')})`).join(', ')}.`,
    ruleName: 'Chuẩn tắc Tuyển (SOP - Sum of Products)',
    ruleFormula: 'Y = T_1 + T_2 + \\cdots + T_k',
    latex: `${funcName} = ${initialSop}`
  })

  steps.push({
    title: 'Phủ định kép toàn phần',
    description: 'Áp dụng định luật hoàn nguyên.',
    ruleName: 'Định luật hoàn nguyên',
    ruleFormula: '\\overline{\\overline{X}} = X',
    latex: `${funcName} = \\overline{\\overline{${funcName}}} = \\overline{\\overline{ ${initialSop} }}`
  })

  if (targetGate === 'nand_n') {
    const nandTerms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' \\cdot ')
      return `\\overline{${inside}}`
    })

    steps.push({
      title: 'Phân phối dấu gạch ngang bằng định luật De Morgan',
      description: 'Phép cộng chuyển thành phép nhân.',
      ruleName: 'Định luật De Morgan',
      ruleFormula: '\\overline{X_1 + X_2 + \\cdots + X_k} = \\overline{X_1} \\cdot \\overline{X_2} \\cdots \\overline{X_k}',
      latex: `${funcName} = \\overline{ ${nandTerms.join(' \\cdot ')} }`
    })

    steps.push({
      title: 'Cấu trúc mạch NAND nhiều đầu vào',
      description: `Tầng 1: ${groups.length} cổng NAND nhiều đầu vào. Tầng 2: 1 cổng NAND ${groups.length} đầu vào.`,
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ ${nandTerms.join(' \\cdot ')} }`
    })
    return steps
  }

  if (targetGate === 'nand_2') {
    const stage1Terms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' \\cdot ')
      return `\\overline{${inside}}`
    })

    steps.push({
      title: 'De Morgan',
      description: 'Chuyển cộng thành nhân.',
      ruleName: 'Định luật De Morgan',
      ruleFormula: '\\overline{T_1 + T_2 + \\cdots} = \\overline{T_1} \\cdot \\overline{T_2} \\cdots',
      latex: `${funcName} = \\overline{ ${stage1Terms.join(' \\cdot ')} }`
    })

    const decomposedTerms: { original: string; latex: string; uLabel: string; literalsCount: number }[] = []
    let hasMultiLiteral = false

    groups.forEach((g, idx) => {
      const uLabel = `U_{${idx + 1}}`
      const orig = `\\overline{${g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' \\cdot ')}}`
      const litCount = g.literals.length

      if (litCount <= 2) {
        decomposedTerms.push({
          original: orig,
          latex: orig,
          uLabel,
          literalsCount: litCount
        })
      } else if (litCount === 3) {
        hasMultiLiteral = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const pair = `\\overline{${l0} \\cdot ${l1}}`
        const decomp = `\\overline{ \\overline{${pair}} \\cdot ${l2} }`
        decomposedTerms.push({
          original: orig,
          latex: decomp,
          uLabel,
          literalsCount: litCount
        })
      } else {
        hasMultiLiteral = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const l3 = formatLiteral(g.literals[3].variable, g.literals[3].inverted)
        const pair1 = `\\overline{${l0} \\cdot ${l1}}`
        const pair2 = `\\overline{${l2} \\cdot ${l3}}`
        const decomp = `\\overline{ \\overline{${pair1}} \\cdot \\overline{${pair2}} }`
        decomposedTerms.push({
          original: orig,
          latex: decomp,
          uLabel,
          literalsCount: litCount
        })
      }
    })

    if (hasMultiLiteral) {
      const multiItems = decomposedTerms.filter((d) => d.literalsCount > 2)
      steps.push({
        title: 'Tách số hạng nhiều biến',
        description: 'Phân tích số hạng ≥3 biến về NAND 2 đầu vào.',
        ruleName: '',
        ruleFormula: '\\overline{A \\cdot B \\cdot C} = \\overline{ \\overline{\\overline{A \\cdot B}} \\cdot C }',
        latex: multiItems.map((m) => `${m.original} = ${m.latex}`).join(' \\quad ; \\quad ')
      })
    }

    steps.push({
      title: 'Tín hiệu tầng 1',
      description: `${decomposedTerms.map((d) => `$${d.uLabel} = ${d.latex}$`).join(' ; ')}.`,
      ruleName: '',
      ruleFormula: '',
      latex: decomposedTerms.map((d) => `${d.uLabel} = ${d.latex}`).join(' \\quad ; \\quad ')
    })

    if (decomposedTerms.length === 1) {
      steps.push({
        title: 'Ngõ ra',
        description: '1 số hạng: qua cổng đảo.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{${decomposedTerms[0].latex}}`
      })
    } else if (decomposedTerms.length === 2) {
      steps.push({
        title: 'Tầng 2',
        description: '2 số hạng: 1 cổng NAND 2 đầu vào.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ ${decomposedTerms[0].latex} \\cdot ${decomposedTerms[1].latex} }`
      })
    } else if (decomposedTerms.length === 3) {
      steps.push({
        title: 'Phân tầng cascade',
        description: '3 số hạng: ghép tuần tự.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{S_{12}} \\cdot U_3 } \\quad ; \\quad S_{12} = \\overline{ U_1 \\cdot U_2 }`
      })

      steps.push({
        title: 'Biểu thức đầy đủ',
        description: 'Thay thế tín hiệu.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedTerms[0].latex} \\cdot ${decomposedTerms[1].latex} }} \\cdot ${decomposedTerms[2].latex} }`
      })
    } else {
      steps.push({
        title: 'Phân tầng cân bằng',
        description: '4 số hạng: chia 2 nhánh.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{S_{12}} \\cdot \\overline{S_{34}} } \\quad ; \\quad S_{12} = \\overline{ U_1 \\cdot U_2 } \\quad ; \\quad S_{34} = \\overline{ U_3 \\cdot U_4 }`
      })

      steps.push({
        title: 'Biểu thức đầy đủ',
        description: 'Thay thế các nhánh.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedTerms[0].latex} \\cdot ${decomposedTerms[1].latex} }} \\cdot \\overline{\\overline{ ${decomposedTerms[2].latex} \\cdot ${decomposedTerms[3].latex} }} }`
      })
    }
    return steps
  }

  const norTerms = groups.map((g) => {
    const inside = g.literals.map((l) => formatComplementLiteral(l.variable, l.inverted)).join(' + ')
    return `\\overline{${inside}}`
  })

  steps.push({
    title: 'Biến đổi tích sang NOR',
    description: 'De Morgan: tích = phủ định tổng.',
    ruleName: '',
    ruleFormula: 'A \\cdot B = \\overline{\\overline{A} + \\overline{B}}',
    latex: groups.map((g, i) => `${termSymbols[i]} = ${termToSopLatex(g)} = ${norTerms[i]}`).join(' \\quad ; \\quad ')
  })

  steps.push({
    title: 'Thay thế vào hàm',
    description: '',
    ruleName: '',
    ruleFormula: '',
    latex: `${funcName} = ${norTerms.join(' + ')}`
  })

  if (targetGate === 'nor_n') {
    steps.push({
      title: 'Tầng 2 NOR',
      description: 'Phủ định 2 lần: NOR thu gom.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ ${norTerms.join(' + ')} } }`
    })
    return steps
  }

  const decomposedNorTerms: { original: string; latex: string; litCount: number }[] = []
  let hasMultiTerm = false

  groups.forEach((g, idx) => {
    const orig = norTerms[idx]
    const litCount = g.literals.length

    if (litCount <= 2) {
      decomposedNorTerms.push({
        original: orig,
        latex: orig,
        litCount
      })
    } else if (litCount === 3) {
      hasMultiTerm = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const pair = `\\overline{${l0} + ${l1}}`
      const decomp = `\\overline{ \\overline{${pair}} + ${l2} }`
      decomposedNorTerms.push({
        original: orig,
        latex: decomp,
        litCount
      })
    } else {
      hasMultiTerm = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const l3 = formatComplementLiteral(g.literals[3].variable, g.literals[3].inverted)
      const pair1 = `\\overline{${l0} + ${l1}}`
      const pair2 = `\\overline{${l2} + ${l3}}`
      const decomp = `\\overline{ \\overline{${pair1}} + \\overline{${pair2}} }`
      decomposedNorTerms.push({
        original: orig,
        latex: decomp,
        litCount
      })
    }
  })

  if (hasMultiTerm) {
    steps.push({
      title: 'Tách số hạng nhiều biến về NOR 2 đầu vào',
      description: 'Phân tích ≥3 biến.',
      ruleName: '',
      ruleFormula: '\\overline{A + B + C} = \\overline{ \\overline{\\overline{A + B}} + C }',
      latex: decomposedNorTerms.map((d) => d.latex).join(' \\quad ; \\quad ')
    })
  }

  if (decomposedNorTerms.length === 1) {
    steps.push({
      title: 'Ngõ ra',
      description: '1 số hạng.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${decomposedNorTerms[0].latex}`
    })
  } else if (decomposedNorTerms.length === 2) {
    steps.push({
      title: 'Tầng 2',
      description: '2 số hạng: NOR + đảo.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} } }`
    })
  } else if (decomposedNorTerms.length === 3) {
    steps.push({
      title: 'Phân tầng cascade',
      description: '3 số hạng: ghép tuần tự.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ S_{12} + T_3 } } \\quad ; \\quad S_{12} = \\overline{ \\overline{ T_1 + T_2 } }`
    })

    steps.push({
      title: 'Biểu thức đầy đủ',
      description: 'Thay thế.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} } } + ${decomposedNorTerms[2].latex} } }`
    })
  } else {
    steps.push({
      title: 'Phân tầng cân bằng',
      description: '4 số hạng: chia 2 nhánh.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ S_{12} + S_{34} } }`
    })

    steps.push({
      title: 'Biểu thức đầy đủ',
      description: 'Thay thế.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} } } + \\overline{ \\overline{ ${decomposedNorTerms[2].latex} + ${decomposedNorTerms[3].latex} } } } }`
    })
  }
  return steps
}

function transformPosDetailed(
  groups: KMapGroup[],
  targetGate: TargetGateType,
  funcName: string
): TransformationStep[] {
  const steps: TransformationStep[] = []
  const initialPos = groups.map(termToPosLatex).join(' \\cdot ')
  const termSymbols = groups.map((_, i) => `M_{${i + 1}}`)

  steps.push({
    title: 'Xác định biểu thức tối thiểu ban đầu từ bìa Karnaugh (Chuẩn tắc Hội)',
    description: `Từ kết quả khoanh các nhóm ô 0 và X trên bìa Karnaugh ở Câu a, ta thu được hàm logic ở dạng Chuẩn tắc Hội tối thiểu (POS) gồm ${groups.length} thừa số tổng tương ứng với các nhóm ô: ${groups.map((g, i) => `$M_{${i + 1}}$ (${g.cells.join(', ')})`).join(', ')}.`,
    ruleName: 'Chuẩn tắc hội (POS)',
    ruleFormula: 'Y = M_1 \\cdot M_2 \\cdots M_k',
    latex: `${funcName} = ${initialPos}`
  })

  steps.push({
    title: 'Phủ định kép toàn phần (Áp dụng định luật hoàn nguyên)',
    description: 'Để chuẩn bị biến đổi sang họ cổng đảo, ta lấy phủ định 2 lần toàn bộ biểu thức hàm. Theo định luật hoàn nguyên, giá trị chân lý của hàm không đổi.',
    ruleName: 'Định luật hoàn nguyên (Involution)',
    ruleFormula: '\\overline{\\overline{X}} = X',
    latex: `${funcName} = \\overline{\\overline{${funcName}}} = \\overline{\\overline{ ${initialPos} }}`
  })

  if (targetGate === 'nor_n') {
    const norTerms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')
      return `\\overline{${inside}}`
    })

    steps.push({
      title: 'Phân phối dấu gạch dưới bằng định luật De Morgan',
      description: 'Giữ nguyên dấu gạch phủ định ở tầng trên cùng. Áp dụng định luật De Morgan cho dấu gạch phủ định bên dưới: phép nhân (AND) giữa các thừa số được chuyển thành phép cộng (OR) giữa các thừa số có dấu gạch đảo.',
      ruleName: 'Định luật De Morgan cho phép nhân',
      ruleFormula: '\\overline{X_1 \\cdot X_2 \\cdots X_k} = \\overline{X_1} + \\overline{X_2} + \\dots + \\overline{X_k}',
      latex: `${funcName} = \\overline{ ${norTerms.join(' + ')} }`
    })

    steps.push({
      title: 'Kết luận cấu trúc sơ đồ toàn cổng NOR N đầu vào',
      description: `Mỗi thành phần thừa số đảo được thực hiện bởi 1 cổng NOR N đầu vào ở tầng 1. Tầng 2 gồm đúng 1 cổng NOR có ${groups.length} đầu vào để thu gom toàn bộ kết quả $Y$.`,
      ruleName: 'Mạch logic 2 tầng toàn NOR',
      ruleFormula: 'Y = \\text{NOR}(\\overline{M_1}, \\overline{M_2}, \\dots)',
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
      title: 'Phân phối dấu gạch dưới bằng định luật De Morgan',
      description: 'Giữ nguyên dấu gạch phủ định trên cùng. Dấu gạch phủ định phía dưới được phân phối vào từng thừa số tổng, biến phép nhân thành tổng các phần tử đảo.',
      ruleName: 'Định luật De Morgan',
      ruleFormula: '\\overline{M_1 \\cdot M_2 \\cdots} = \\overline{M_1} + \\overline{M_2} + \\dots',
      latex: `${funcName} = \\overline{ ${stage1Terms.join(' + ')} }`
    })

    const decomposedNorTerms: { original: string; latex: string; vLabel: string; literalsCount: number; explanation: string }[] = []
    let hasMultiSum = false

    groups.forEach((g, idx) => {
      const vLabel = `V_{${idx + 1}}`
      const orig = `\\overline{${g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')}}`
      const litCount = g.literals.length

      if (litCount <= 2) {
        decomposedNorTerms.push({
          original: orig,
          latex: orig,
          vLabel,
          literalsCount: litCount,
          explanation: `Thừa số $V_{${idx + 1}}$ có ${litCount} biến, được nối trực tiếp vào 1 cổng NOR 2 đầu vào.`
        })
      } else if (litCount === 3) {
        hasMultiSum = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const pair = `\\overline{${l0} + ${l1}}`
        const decomp = `\\overline{ \\overline{${pair}} + ${l2} }`
        decomposedNorTerms.push({
          original: orig,
          latex: decomp,
          vLabel,
          literalsCount: litCount,
          explanation: `Thừa số $V_{${idx + 1}}$ có 3 biến: đưa 2 biến đầu ($${l0}$, $${l1}$) vào cổng NOR-2 thứ nhất thu được tín hiệu đảo; qua cổng NOR chập 2 chân vào làm cổng đảo để lấy lại tổng thường; rồi đưa cùng biến thứ ba $${l2}$ vào cổng NOR-2 thứ hai.`
        })
      } else {
        hasMultiSum = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const l3 = formatLiteral(g.literals[3].variable, g.literals[3].inverted)
        const pair1 = `\\overline{${l0} + ${l1}}`
        const pair2 = `\\overline{${l2} + ${l3}}`
        const decomp = `\\overline{ \\overline{${pair1}} + \\overline{${pair2}} }`
        decomposedNorTerms.push({
          original: orig,
          latex: decomp,
          vLabel,
          literalsCount: litCount,
          explanation: `Thừa số $V_{${idx + 1}}$ có 4 biến: chia thành 2 cặp qua 2 cổng NOR-2 và 2 cổng đảo chập chân, sau đó đưa 2 ngõ ra vào cổng NOR-2 kết hợp.`
        })
      }
    })

    if (hasMultiSum) {
      const multiItems = decomposedNorTerms.filter((d) => d.literalsCount > 2)
      steps.push({
        title: 'Tách các thừa số có từ 3 biến trở lên về cổng NOR 2 đầu vào',
        description: multiItems.map((m) => m.explanation).join(' '),
        ruleName: 'Phân tích tổng nhiều biến bằng cổng NOR 2 đầu vào',
        ruleFormula: '\\overline{A + B + C} = \\overline{ \\overline{\\overline{A + B}} + C }',
        latex: multiItems.map((m) => `${m.original} = ${m.latex}`).join(' \\quad , \\quad ')
      })
    }

    steps.push({
      title: 'Xác định các tín hiệu ngõ ra tầng 1 (Tín hiệu thừa số đảo)',
      description: `Sau tầng 1, toàn bộ các thừa số đã được tạo thành công dưới dạng tín hiệu đảo $V_i$ bằng các cổng NOR 2 đầu vào và cổng đảo: ${decomposedNorTerms.map((d) => `$${d.vLabel} = ${d.latex}$`).join(' ; ')}.`,
      ruleName: 'Tín hiệu tầng 1',
      ruleFormula: 'V_i = \\overline{M_i}',
      latex: decomposedNorTerms.map((d) => `${d.vLabel} = ${d.latex}`).join(' \\quad , \\quad ')
    })

    if (decomposedNorTerms.length === 1) {
      steps.push({
        title: 'Biểu thức ngõ ra cuối cùng',
        description: 'Vì hàm chỉ có 1 thừa số $M_1$, ta lấy $V_1$ qua 1 cổng NOR chập chân (cổng đảo) để thu được $Y = M_1$.',
        ruleName: 'Cổng đảo ngõ ra đơn',
        ruleFormula: `${funcName} = \\overline{V_1} = M_1`,
        latex: `${funcName} = \\overline{${decomposedNorTerms[0].latex}}`
      })
    } else if (decomposedNorTerms.length === 2) {
      steps.push({
        title: 'Ghép tầng thu gom ngõ ra chỉ sử dụng cổng NOR 2 đầu vào',
        description: 'Hai tín hiệu ngõ ra tầng 1 là $V_1$ và $V_2$ được đưa trực tiếp vào 1 cổng NOR 2 đầu vào. Theo định lý De Morgan: cổng này thực hiện phép nhân (AND) giữa 2 thừa số, cho ra $Y = M_1 \\cdot M_2$.',
        ruleName: 'Gom 2 thừa số bằng 1 cổng NOR 2 đầu vào',
        ruleFormula: 'Y = \\overline{ V_1 + V_2 } = M_1 \\cdot M_2',
        latex: `${funcName} = \\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} }`
      })
    } else if (decomposedNorTerms.length === 3) {
      steps.push({
        title: 'Ghép tầng thu gom ngõ ra theo hệ tín hiệu trung gian',
        description: 'Vì ngõ ra cần gom 3 thừa số mà mỗi cổng chỉ có 2 ngõ vào, ta thực hiện phân tầng tuần tự: gom 2 thừa số đầu $V_1$ và $V_2$ qua cổng NOR thứ nhất tạo tích $P_{12} = M_1 \\cdot M_2$; đảo $P_{12}$ qua cổng NOR chập chân thành $\\overline{P_{12}}$; rồi đưa $\\overline{P_{12}}$ cùng $V_3$ vào cổng NOR ngõ ra để thu được $Y = M_1 \\cdot M_2 \\cdot M_3$.',
        ruleName: 'Ghép tầng tuần tự 3 thừa số (Cascade)',
        ruleFormula: 'Y = \\overline{ \\overline{P_{12}} + V_3 } \\quad , \\quad P_{12} = \\overline{ V_1 + V_2 }',
        latex: `${funcName} = \\overline{ \\overline{P_{12}} + V_3 } \\quad , \\quad P_{12} = \\overline{ V_1 + V_2 }`
      })

      steps.push({
        title: 'Biểu thức hàm logic hoàn chỉnh (Thay thế đầy đủ các biến logic)',
        description: 'Thay thế các tín hiệu $V_1, V_2, V_3$ vào phương trình phân tầng, ta thu được biểu thức hàm $Y$ hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào (không ẩn sau biến trung gian, không chứa dấu ngoặc đơn thừa dưới dấu gạch ngang):',
        ruleName: 'Biểu thức logic toàn phần NOR 2 đầu vào',
        ruleFormula: 'Y = \\overline{ \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }} + \\overline{M_3} }',
        latex: `${funcName} = \\overline{ \\overline{\\overline{ ${decomposedNorTerms[0].latex} + ${decomposedNorTerms[1].latex} }} + ${decomposedNorTerms[2].latex} }`
      })
    } else {
      steps.push({
        title: 'Ghép tầng thu gom ngõ ra theo hệ tín hiệu trung gian',
        description: 'Với 4 thừa số, ta chia thành 2 nhánh cân bằng: nhánh 1 tạo $P_{12}$ rồi đảo thành $\\overline{P_{12}}$; nhánh 2 tạo $P_{34}$ rồi đảo thành $\\overline{P_{34}}$; cổng NOR cuối cùng gom 2 nhánh lại tạo $Y$.',
        ruleName: 'Cây ghép tầng 4 thừa số',
        ruleFormula: 'Y = \\overline{ \\overline{P_{12}} + \\overline{P_{34}} }',
        latex: `${funcName} = \\overline{ \\overline{P_{12}} + \\overline{P_{34}} } \\quad , \\quad P_{12} = \\overline{ V_1 + V_2 } \\quad , \\quad P_{34} = \\overline{ V_3 + V_4 }`
      })

      steps.push({
        title: 'Biểu thức hàm logic hoàn chỉnh (Thay thế đầy đủ các biến logic)',
        description: 'Thay thế toàn bộ tín hiệu các nhánh vào phương trình ngõ ra, ta thu được biểu thức hàm $Y$ hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào:',
        ruleName: 'Biểu thức logic toàn phần NOR 2 đầu vào',
        ruleFormula: 'Y = \\overline{ \\overline{\\overline{ \\overline{M_1} + \\overline{M_2} }} + \\overline{\\overline{ \\overline{M_3} + \\overline{M_4} }} }',
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
    title: 'Biến đổi từng thừa số tổng sang dạng phủ định tích (Cổng NAND)',
    description: 'Áp dụng định luật De Morgan cho từng thừa số tổng: một tổng bằng phủ định của tích các biến đảo. Do đó, mỗi thừa số tổng được tạo trực tiếp bằng 1 cổng NAND nhận các ngõ vào đảo.',
    ruleName: 'Biến đổi tổng sang NAND',
    ruleFormula: 'A + B = \\overline{\\overline{A} \\cdot \\overline{B}}',
    latex: groups.map((g, i) => `${termSymbols[i]} = ${termToPosLatex(g)} = ${nandTerms[i]}`).join(' \\quad , \\quad ')
  })

  steps.push({
    title: 'Thay thế các thừa số NAND vào biểu thức hàm số',
    description: 'Thay các biểu thức NAND vừa tìm được vào phương trình hàm số ban đầu.',
    ruleName: 'Thay thế đại số',
    ruleFormula: 'Y = M_1 \\cdot M_2 \\cdots M_k',
    latex: `${funcName} = ${nandTerms.join(' \\cdot ')}`
  })

  if (targetGate === 'nand_n') {
    steps.push({
      title: 'Phủ định 2 lần để tạo cổng NAND thu gom ngõ ra',
      description: 'Lấy phủ định 2 lần toàn bộ biểu thức: cổng NAND ở tầng 2 thực hiện phép NAND giữa các thừa số, sau đó qua cổng NAND chập 2 chân vào (cổng đảo) để cho ra kết quả hàm $Y$.',
      ruleName: 'Tầng thu gom NAND N đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{ \\prod M_i } } = \\text{NOT}(\\text{NAND}(M_1, M_2, \\dots))',
      latex: `${funcName} = \\overline{ \\overline{ ${nandTerms.join(' \\cdot ')} } }`
    })
    return steps
  }

  const decomposedNandTerms: { original: string; latex: string; litCount: number; explanation: string }[] = []
  let hasMultiNandTerm = false

  groups.forEach((g, idx) => {
    const orig = nandTerms[idx]
    const litCount = g.literals.length

    if (litCount <= 2) {
      decomposedNandTerms.push({
        original: orig,
        latex: orig,
        litCount,
        explanation: `Thừa số $M_{${idx + 1}}$ có ${litCount} biến, dùng trực tiếp 1 cổng NAND 2 đầu vào.`
      })
    } else if (litCount === 3) {
      hasMultiNandTerm = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const pair = `\\overline{${l0} \\cdot ${l1}}`
      const decomp = `\\overline{ \\overline{${pair}} \\cdot ${l2} }`
      decomposedNandTerms.push({
        original: orig,
        latex: decomp,
        litCount,
        explanation: `Thừa số $M_{${idx + 1}}$ có 3 biến: đưa 2 biến đảo đầu ($${l0}$, $${l1}$) vào cổng NAND-2 thứ nhất, qua cổng đảo chập chân, rồi đưa cùng biến đảo thứ ba $${l2}$ vào cổng NAND-2 kế tiếp.`
      })
    } else {
      hasMultiNandTerm = true
      const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
      const l3 = formatComplementLiteral(g.literals[3].variable, g.literals[3].inverted)
      const pair1 = `\\overline{${l0} \\cdot ${l1}}`
      const pair2 = `\\overline{${l2} \\cdot ${l3}}`
      const decomp = `\\overline{ \\overline{${pair1}} \\cdot \\overline{${pair2}} }`
      decomposedNandTerms.push({
        original: orig,
        latex: decomp,
        litCount,
        explanation: `Thừa số $M_{${idx + 1}}$ có 4 biến: chia thành 2 cặp qua 2 cổng NAND-2 và 2 cổng đảo chập chân, rồi gom lại qua 1 cổng NAND-2.`
      })
    }
  })

  if (hasMultiNandTerm) {
    steps.push({
      title: 'Tách các thừa số có từ 3 biến về cổng NAND 2 đầu vào',
      description: decomposedNandTerms.filter((d) => d.litCount > 2).map((d) => d.explanation).join(' '),
      ruleName: 'Phân tích tích nhiều biến bằng cổng NAND 2 đầu vào',
      ruleFormula: '\\overline{A \\cdot B \\cdot C} = \\overline{ \\overline{\\overline{A \\cdot B}} \\cdot C }',
      latex: decomposedNandTerms.map((d) => d.latex).join(' \\quad , \\quad ')
    })
  }

  if (decomposedNandTerms.length === 1) {
    steps.push({
      title: 'Biểu thức ngõ ra cuối cùng',
      description: 'Hàm chỉ có 1 thừa số nên không cần phân tầng thu gom.',
      ruleName: 'Cổng NAND đơn',
      ruleFormula: 'Y = M_1',
      latex: `${funcName} = ${decomposedNandTerms[0].latex}`
    })
  } else if (decomposedNandTerms.length === 2) {
    steps.push({
      title: 'Ghép tầng thu gom ngõ ra chỉ sử dụng cổng NAND 2 đầu vào',
      description: 'Hai thừa số $M_1, M_2$ được đưa vào 1 cổng NAND 2 đầu vào thu được tích đảo. Sau đó cho qua 1 cổng NAND chập chân (cổng đảo) để thu được kết quả hàm $Y$.',
      ruleName: 'Cổng NAND gom 2 thừa số kèm cổng đảo',
      ruleFormula: 'Y = \\overline{ \\overline{ M_1 \\cdot M_2 } }',
      latex: `${funcName} = \\overline{ \\overline{ ${decomposedNandTerms[0].latex} \\cdot ${decomposedNandTerms[1].latex} } }`
    })
  } else if (decomposedNandTerms.length === 3) {
    steps.push({
      title: 'Ghép tầng thu gom ngõ ra theo hệ tín hiệu trung gian',
      description: 'Gom $M_1, M_2$ qua cổng NAND thứ nhất tạo $\\overline{P_{12}}$; qua cổng đảo thành $P_{12}$; đưa $P_{12}$ cùng $M_3$ vào cổng NAND tạo $\\overline{Y}$; qua cổng đảo cuối cùng để thu được $Y$.',
      ruleName: 'Ghép tầng tuần tự các cổng NAND 2 đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{ P_{12} \\cdot M_3 } } \\quad , \\quad P_{12} = \\overline{ \\overline{ M_1 \\cdot M_2 } }',
      latex: `${funcName} = \\overline{ \\overline{ P_{12} \\cdot M_3 } } \\quad , \\quad P_{12} = \\overline{ \\overline{ M_1 \\cdot M_2 } }`
    })

    steps.push({
      title: 'Biểu thức hàm logic hoàn chỉnh (Thay thế đầy đủ các biến logic)',
      description: 'Thay thế các thừa số vào phương trình phân tầng, ta thu được biểu thức hàm $Y$ hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào:',
      ruleName: 'Biểu thức logic toàn phần NAND 2 đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{ \\overline{ \\overline{ M_1 \\cdot M_2 } } \\cdot M_3 } }',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNandTerms[0].latex} \\cdot ${decomposedNandTerms[1].latex} } } \\cdot ${decomposedNandTerms[2].latex} } }`
    })
  } else {
    steps.push({
      title: 'Ghép tầng thu gom ngõ ra theo hệ tín hiệu trung gian',
      description: 'Với 4 thừa số, ta chia thành 2 nhánh: nhánh 1 tạo $P_{12}$, nhánh 2 tạo $P_{34}$, sau đó gom lại qua tầng NAND kết hợp.',
      ruleName: 'Cây ghép tầng NAND 4 thừa số',
      ruleFormula: 'Y = \\overline{ \\overline{ P_{12} \\cdot P_{34} } }',
      latex: `${funcName} = \\overline{ \\overline{ P_{12} \\cdot P_{34} } }`
    })

    steps.push({
      title: 'Biểu thức hàm logic hoàn chỉnh (Thay thế đầy đủ các biến logic)',
      description: 'Thay thế toàn bộ tín hiệu vào phương trình ngõ ra, ta thu được biểu thức hàm $Y$ hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào:',
      ruleName: 'Biểu thức logic toàn phần NAND 2 đầu vào',
      ruleFormula: 'Y = \\overline{ \\overline{ \\overline{ \\overline{ M_1 \\cdot M_2 } } \\cdot \\overline{ \\overline{ M_3 \\cdot M_4 } } } }',
      latex: `${funcName} = \\overline{ \\overline{ \\overline{ \\overline{ ${decomposedNandTerms[0].latex} \\cdot ${decomposedNandTerms[1].latex} } } \\cdot \\overline{ \\overline{ ${decomposedNandTerms[2].latex} \\cdot ${decomposedNandTerms[3].latex} } } } }`
    })
  }
  return steps
}
