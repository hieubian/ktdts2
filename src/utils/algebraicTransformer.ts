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
        latex: `${funcName} = ${constVal}`,
        handwrittenLine: `${funcName} = ${constVal}`,
        note: `Hàm nhận giá trị hằng số ${constVal}`
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
        ruleName: form === 'SOP' ? 'Chuẩn tắc Tuyển (SOP)' : 'Chuẩn tắc Hội (POS)',
        ruleFormula: '',
        latex: `${funcName} = ${expr}`,
        handwrittenLine: `${funcName} = ${expr}`,
        note: 'Biểu thức tối thiểu từ bảng Karnaugh câu a'
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

  // Dòng 1: Biểu thức tối thiểu câu a
  steps.push({
    title: 'Biểu thức tối thiểu từ bìa Karnaugh',
    description: 'Biểu thức thu được từ kết quả khoanh các nhóm ô trên bìa Karnaugh ở Câu a.',
    ruleName: 'SOP tối thiểu',
    ruleFormula: 'Y = T_1 + T_2 + \\dots + T_k',
    latex: `${funcName} = ${initialSop}`,
    handwrittenLine: `${funcName} = ${initialSop}`,
    note: 'Biểu thức tối thiểu từ bảng Karnaugh câu a'
  })

  // Dòng 2: Lấy 2 lần phủ định toàn phần
  steps.push({
    title: 'Lấy phủ định 2 lần toàn phần',
    description: 'Áp dụng định luật hoàn nguyên để chuẩn bị chuyển sang họ cổng đảo.',
    ruleName: 'Định luật hoàn nguyên',
    ruleFormula: '\\overline{\\overline{X}} = X',
    latex: `${funcName} = \\overline{\\overline{ ${initialSop} }}`,
    handwrittenLine: `= \\overline{\\overline{ ${initialSop} }}`,
    note: 'Lấy 2 lần phủ định toàn phần (luật bù hoàn nguyên)'
  })

  if (targetGate === 'nand_n') {
    const nandTerms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' \\cdot ')
      return `\\overline{${inside}}`
    })

    steps.push({
      title: 'Áp dụng định luật De Morgan',
      description: 'Phép cộng các số hạng chuyển thành tích các số hạng đảo dưới dấu gạch phủ định chung.',
      ruleName: 'Định luật De Morgan',
      ruleFormula: '\\overline{A + B} = \\overline{A} \\cdot \\overline{B}',
      latex: `${funcName} = \\overline{ ${nandTerms.join(' \\cdot ')} }`,
      handwrittenLine: `= \\overline{ ${nandTerms.join(' \\cdot ')} }`,
      note: 'Áp dụng luật De Morgan cho dấu phủ định dưới'
    })
    return steps
  }

  if (targetGate === 'nand_2') {
    const stage1Terms = groups.map((g) => {
      const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' \\cdot ')
      return `\\overline{${inside}}`
    })

    // Dòng 3: De Morgan chuyển tổng sang tích đảo
    steps.push({
      title: 'Áp dụng định luật De Morgan cho dấu phủ định dưới',
      description: 'Chuyển phép cộng (OR) thành phép nhân (AND) giữa các số hạng đảo.',
      ruleName: 'Định luật De Morgan',
      ruleFormula: '\\overline{T_1 + T_2 + \\dots} = \\overline{T_1} \\cdot \\overline{T_2} \\cdots',
      latex: `${funcName} = \\overline{ ${stage1Terms.join(' \\cdot ')} }`,
      handwrittenLine: `= \\overline{ ${stage1Terms.join(' \\cdot ')} }`,
      note: 'Áp dụng định lý De Morgan cho dấu phủ định dưới'
    })

    // Phân rã từng số hạng nếu có >= 3 biến về cổng NAND 2 đầu vào
    const decomposedTerms: string[] = []
    let hasMultiVar = false

    groups.forEach((g) => {
      const orig = `\\overline{${g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' \\cdot ')}}`
      const litCount = g.literals.length

      if (litCount <= 2) {
        decomposedTerms.push(orig)
      } else if (litCount === 3) {
        hasMultiVar = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const pair = `\\overline{${l0} \\cdot ${l1}}`
        decomposedTerms.push(`\\overline{ \\overline{${pair}} \\cdot ${l2} }`)
      } else {
        hasMultiVar = true
        const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
        const l3 = formatLiteral(g.literals[3].variable, g.literals[3].inverted)
        const pair1 = `\\overline{${l0} \\cdot ${l1}}`
        const pair2 = `\\overline{${l2} \\cdot ${l3}}`
        decomposedTerms.push(`\\overline{ \\overline{${pair1}} \\cdot \\overline{${pair2}} }`)
      }
    })

    if (hasMultiVar) {
      steps.push({
        title: 'Phân rã các số hạng có từ 3 biến về cổng NAND 2 đầu vào',
        description: 'Tách các tích nhiều biến về tích lồng 2 ngõ vào: $\\overline{A \\cdot B \\cdot C} = \\overline{\\overline{\\overline{A \\cdot B}} \\cdot C}$.',
        ruleName: 'Tách cổng 2 đầu vào',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ ${decomposedTerms.join(' \\cdot ')} }`,
        handwrittenLine: `= \\overline{ ${decomposedTerms.join(' \\cdot ')} }`,
        note: 'Tách các tích nhiều biến về dạng cổng NAND 2 đầu vào'
      })
    }

    // Ghép tầng thu gom ngõ ra về cổng 2 đầu vào
    if (decomposedTerms.length === 1) {
      steps.push({
        title: 'Biểu thức ngõ ra hoàn chỉnh',
        description: 'Hàm chỉ có 1 số hạng.',
        ruleName: 'Cổng NAND 2 đầu vào',
        ruleFormula: '',
        latex: `${funcName} = ${decomposedTerms[0]}`,
        handwrittenLine: `= ${decomposedTerms[0]}`,
        note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào'
      })
    } else if (decomposedTerms.length === 2) {
      steps.push({
        title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào',
        description: 'Hai số hạng đảo đưa thẳng vào 1 cổng NAND 2 đầu vào ngõ ra.',
        ruleName: 'Gom 2 số hạng',
        ruleFormula: '',
        latex: `${funcName} = \\overline{ ${decomposedTerms[0]} \\cdot ${decomposedTerms[1]} }`,
        handwrittenLine: `= \\overline{ ${decomposedTerms[0]} \\cdot ${decomposedTerms[1]} }`,
        note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào'
      })
    } else if (decomposedTerms.length === 3) {
      const finalExp = `\\overline{ \\overline{\\overline{ ${decomposedTerms[0]} \\cdot ${decomposedTerms[1]} }} \\cdot ${decomposedTerms[2]} }`
      steps.push({
        title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào',
        description: 'Gom tuần tự: 2 số hạng đầu qua cổng NAND thứ nhất kèm cổng đảo, rồi đưa cùng số hạng thứ 3 vào cổng NAND ngõ ra.',
        ruleName: 'Ghép tầng 3 số hạng',
        ruleFormula: '',
        latex: `${funcName} = ${finalExp}`,
        handwrittenLine: `= ${finalExp}`,
        note: 'Phân tầng ghép nối, biểu thức hoàn chỉnh toàn cổng NAND 2 đầu vào'
      })
    } else {
      const finalExp = `\\overline{ \\overline{\\overline{ ${decomposedTerms[0]} \\cdot ${decomposedTerms[1]} }} \\cdot \\overline{\\overline{ ${decomposedTerms[2]} \\cdot ${decomposedTerms[3]} }} }`
      steps.push({
        title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào',
        description: 'Chia 2 nhánh ghép cây cân bằng, gom qua cổng NAND ngõ ra.',
        ruleName: 'Ghép tầng 4 số hạng',
        ruleFormula: '',
        latex: `${funcName} = ${finalExp}`,
        handwrittenLine: `= ${finalExp}`,
        note: 'Phân tầng ghép nhánh, biểu thức hoàn chỉnh toàn cổng NAND 2 đầu vào'
      })
    }
    return steps
  }

  // Target gate NOR
  const norTerms = groups.map((g) => {
    const inside = g.literals.map((l) => formatComplementLiteral(l.variable, l.inverted)).join(' + ')
    return `\\overline{${inside}}`
  })

  // Dòng 2: Biến đổi từng tích sang dạng NOR
  steps.push({
    title: 'Biến đổi từng tích sang cổng NOR bằng định lý De Morgan',
    description: 'Mỗi tích $A \\cdot B$ bằng phủ định của tổng các biến đảo: $A \\cdot B = \\overline{\\overline{A} + \\overline{B}}$.',
    ruleName: 'Định luật De Morgan cho tích',
    ruleFormula: 'A \\cdot B = \\overline{\\overline{A} + \\overline{B}}',
    latex: `${funcName} = ${norTerms.join(' + ')}`,
    handwrittenLine: `= ${norTerms.join(' + ')}`,
    note: 'Biến đổi từng tích sang NOR theo luật De Morgan: X.Y = (X̄ + Ȳ)̄'
  })

  // Dòng 3: Lấy phủ định 2 lần toàn phần
  steps.push({
    title: 'Lấy phủ định 2 lần toàn phần',
    description: 'Áp dụng định luật hoàn nguyên để xuất hiện cổng NOR thu gom ngõ ra.',
    ruleName: 'Định luật hoàn nguyên',
    ruleFormula: '',
    latex: `${funcName} = \\overline{\\overline{ ${norTerms.join(' + ')} }}`,
    handwrittenLine: `= \\overline{\\overline{ ${norTerms.join(' + ')} }}`,
    note: 'Lấy 2 lần phủ định toàn phần để tạo tầng cổng NOR thu gom'
  })

  if (targetGate === 'nor_n') {
    return steps
  }

  // Target NOR 2 đầu vào
  if (norTerms.length === 1) {
    steps.push({
      title: 'Biểu thức ngõ ra hoàn chỉnh',
      description: 'Hàm chỉ có 1 số hạng.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${norTerms[0]}`,
      handwrittenLine: `= ${norTerms[0]}`,
      note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào'
    })
  } else if (norTerms.length === 2) {
    const finalExp = `\\overline{\\overline{ ${norTerms[0]} + ${norTerms[1]} }}`
    steps.push({
      title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào',
      description: 'Gom 2 số hạng qua 1 cổng NOR 2 đầu vào và 1 cổng đảo chập chân.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${finalExp}`,
      handwrittenLine: `= ${finalExp}`,
      note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào'
    })
  } else if (norTerms.length === 3) {
    const finalExp = `\\overline{ \\overline{\\overline{ ${norTerms[0]} + ${norTerms[1]} }} + ${norTerms[2]} }`
    steps.push({
      title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào',
      description: 'Gom tuần tự 3 số hạng qua các cổng NOR 2 đầu vào.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${finalExp}`,
      handwrittenLine: `= ${finalExp}`,
      note: 'Phân tầng ghép nối, biểu thức hoàn chỉnh toàn cổng NOR 2 đầu vào'
    })
  } else {
    const finalExp = `\\overline{ \\overline{\\overline{ ${norTerms[0]} + ${norTerms[1]} }} + \\overline{\\overline{ ${norTerms[2]} + ${norTerms[3]} }} }`
    steps.push({
      title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào',
      description: 'Chia 2 nhánh ghép cây cân bằng qua các cổng NOR 2 đầu vào.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${finalExp}`,
      handwrittenLine: `= ${finalExp}`,
      note: 'Phân tầng ghép nhánh, biểu thức hoàn chỉnh toàn cổng NOR 2 đầu vào'
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

  // Dòng 1: Biểu thức tối thiểu từ bảng Karnaugh câu a
  steps.push({
    title: 'Biểu thức tối thiểu từ bìa Karnaugh (Chuẩn tắc Hội)',
    description: 'Biểu thức tích các tổng thu được từ việc khoanh các ô 0 và X trên bìa Karnaugh ở Câu a.',
    ruleName: 'POS tối thiểu',
    ruleFormula: 'Y = M_1 \\cdot M_2 \\cdots M_k',
    latex: `${funcName} = ${initialPos}`,
    handwrittenLine: `${funcName} = ${initialPos}`,
    note: 'Biểu thức tối thiểu từ bảng Karnaugh câu a'
  })

  // Nếu mục tiêu là NAND 2 đầu vào (ĐỀ BÀI CÂU 1 TRONG PDF!)
  if (targetGate === 'nand_2' || targetGate === 'nand_n') {
    // Biến đổi từng thừa số tổng sang NAND (De Morgan: A + B = \overline{\bar{A} \cdot \bar{B}})
    const nandTerms = groups.map((g) => {
      const inside = g.literals.map((l) => formatComplementLiteral(l.variable, l.inverted)).join(' \\cdot ')
      return `\\overline{${inside}}`
    })

    // Dòng 2: Áp dụng De Morgan cho từng thừa số tổng
    steps.push({
      title: 'Biến đổi từng thừa số tổng sang cổng NAND bằng định lý De Morgan',
      description: 'Áp dụng công thức De Morgan: $X + Y = \\overline{\\overline{X} \\cdot \\overline{Y}}$, chuyển từng tổng thành dạng phủ định tích (cổng NAND).',
      ruleName: 'Định luật De Morgan cho tổng',
      ruleFormula: 'A + B = \\overline{\\overline{A} \\cdot \\overline{B}}',
      latex: `${funcName} = ${nandTerms.join(' \\cdot ')}`,
      handwrittenLine: `= ${nandTerms.join(' \\cdot ')}`,
      note: 'Biến đổi từng thừa số tổng sang NAND theo De Morgan: X+Y = (X̄.Ȳ)̄'
    })

    // Phân rã thừa số có >= 3 biến về cổng NAND 2 đầu vào
    const decomposedNandTerms: string[] = []
    let hasMultiVar = false

    groups.forEach((g) => {
      const litCount = g.literals.length
      if (litCount <= 2) {
        const inside = g.literals.map((l) => formatComplementLiteral(l.variable, l.inverted)).join(' \\cdot ')
        decomposedNandTerms.push(`\\overline{${inside}}`)
      } else if (litCount === 3) {
        hasMultiVar = true
        const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
        const pair = `\\overline{${l0} \\cdot ${l1}}`
        decomposedNandTerms.push(`\\overline{ \\overline{${pair}} \\cdot ${l2} }`)
      } else {
        hasMultiVar = true
        const l0 = formatComplementLiteral(g.literals[0].variable, g.literals[0].inverted)
        const l1 = formatComplementLiteral(g.literals[1].variable, g.literals[1].inverted)
        const l2 = formatComplementLiteral(g.literals[2].variable, g.literals[2].inverted)
        const l3 = formatComplementLiteral(g.literals[3].variable, g.literals[3].inverted)
        const pair1 = `\\overline{${l0} \\cdot ${l1}}`
        const pair2 = `\\overline{${l2} \\cdot ${l3}}`
        decomposedNandTerms.push(`\\overline{ \\overline{${pair1}} \\cdot \\overline{${pair2}} }`)
      }
    })

    if (hasMultiVar) {
      steps.push({
        title: 'Tách các thừa số có từ 3 biến về cổng NAND 2 đầu vào',
        description: 'Phân tích các thừa số nhiều biến về tích lồng 2 ngõ vào: $\\overline{A \\cdot B \\cdot C} = \\overline{\\overline{\\overline{A \\cdot B}} \\cdot C}$.',
        ruleName: 'Tách cổng NAND 2 đầu vào',
        ruleFormula: '',
        latex: `${funcName} = ${decomposedNandTerms.join(' \\cdot ')}`,
        handwrittenLine: `= ${decomposedNandTerms.join(' \\cdot ')}`,
        note: 'Tách các thừa số ≥ 3 biến về dạng cổng NAND 2 đầu vào'
      })
    }

    // Dòng 3: Lấy phủ định 2 lần toàn phần
    const currentTerms = hasMultiVar ? decomposedNandTerms : nandTerms
    steps.push({
      title: 'Lấy phủ định 2 lần toàn phần',
      description: 'Áp dụng định luật hoàn nguyên để tạo cổng NAND thu gom ngõ ra.',
      ruleName: 'Định luật hoàn nguyên',
      ruleFormula: '\\overline{\\overline{X}} = X',
      latex: `${funcName} = \\overline{\\overline{ ${currentTerms.join(' \\cdot ')} }}`,
      handwrittenLine: `= \\overline{\\overline{ ${currentTerms.join(' \\cdot ')} }}`,
      note: 'Lấy 2 lần phủ định toàn phần để tạo tầng cổng NAND thu gom'
    })

    if (targetGate === 'nand_n') {
      return steps
    }

    // Target NAND 2 đầu vào
    if (decomposedNandTerms.length === 1) {
      steps.push({
        title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào',
        description: 'Hàm chỉ có 1 thừa số.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = ${decomposedNandTerms[0]}`,
        handwrittenLine: `= ${decomposedNandTerms[0]}`,
        note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào'
      })
    } else if (decomposedNandTerms.length === 2) {
      const finalExp = `\\overline{\\overline{ ${decomposedNandTerms[0]} \\cdot ${decomposedNandTerms[1]} }}`
      steps.push({
        title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào',
        description: 'Hai thừa số đưa vào 1 cổng NAND 2 đầu vào rồi qua 1 cổng đảo chập chân.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = ${finalExp}`,
        handwrittenLine: `= ${finalExp}`,
        note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào'
      })
    } else if (decomposedNandTerms.length === 3) {
      const finalExp = `\\overline{ \\overline{ \\overline{\\overline{ ${decomposedNandTerms[0]} \\cdot ${decomposedNandTerms[1]} }} \\cdot ${decomposedNandTerms[2]} } }`
      steps.push({
        title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào',
        description: 'Phân tầng tuần tự: 2 thừa số đầu qua cổng NAND thứ nhất tạo tích đảo, qua cổng đảo chập chân, rồi đưa cùng thừa số thứ 3 vào cổng NAND ngõ ra kèm cổng đảo.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = ${finalExp}`,
        handwrittenLine: `= ${finalExp}`,
        note: 'Phân tầng ghép nối, biểu thức hoàn chỉnh toàn cổng NAND 2 đầu vào'
      })
    } else {
      const finalExp = `\\overline{ \\overline{ \\overline{\\overline{ ${decomposedNandTerms[0]} \\cdot ${decomposedNandTerms[1]} }} \\cdot \\overline{\\overline{ ${decomposedNandTerms[2]} \\cdot ${decomposedNandTerms[3]} }} } }`
      steps.push({
        title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NAND 2 đầu vào',
        description: 'Chia 2 nhánh ghép cây cân bằng qua các cổng NAND 2 đầu vào.',
        ruleName: '',
        ruleFormula: '',
        latex: `${funcName} = ${finalExp}`,
        handwrittenLine: `= ${finalExp}`,
        note: 'Phân tầng ghép nhánh, biểu thức hoàn chỉnh toàn cổng NAND 2 đầu vào'
      })
    }
    return steps
  }

  // Nếu mục tiêu là NOR (ĐỀ BÀI CÂU 2 TRONG PDF!)
  // Dòng 2: Lấy phủ định 2 lần toàn phần
  steps.push({
    title: 'Lấy phủ định 2 lần toàn phần',
    description: 'Áp dụng định luật hoàn nguyên để chuẩn bị chuyển sang họ cổng NOR.',
    ruleName: 'Định luật hoàn nguyên',
    ruleFormula: '\\overline{\\overline{X}} = X',
    latex: `${funcName} = \\overline{\\overline{ ${initialPos} }}`,
    handwrittenLine: `= \\overline{\\overline{ ${initialPos} }}`,
    note: 'Lấy 2 lần phủ định toàn phần (luật bù hoàn nguyên)'
  })

  const stage1NorTerms = groups.map((g) => {
    const inside = g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')
    return `\\overline{${inside}}`
  })

  // Dòng 3: De Morgan cho dấu gạch dưới
  steps.push({
    title: 'Áp dụng định luật De Morgan cho dấu phủ định dưới',
    description: 'Chuyển phép nhân (AND) giữa các thừa số thành phép cộng (OR) giữa các thừa số có dấu gạch đảo.',
    ruleName: 'Định luật De Morgan cho tích',
    ruleFormula: '\\overline{M_1 \\cdot M_2 \\cdots} = \\overline{M_1} + \\overline{M_2} + \\dots',
    latex: `${funcName} = \\overline{ ${stage1NorTerms.join(' + ')} }`,
    handwrittenLine: `= \\overline{ ${stage1NorTerms.join(' + ')} }`,
    note: 'Áp dụng định lý De Morgan cho dấu phủ định dưới: tích đổi thành tổng'
  })

  if (targetGate === 'nor_n') {
    return steps
  }

  // Tách các thừa số có >= 3 biến về cổng NOR 2 đầu vào
  const decomposedNorTerms: string[] = []
  let hasMultiSum = false

  groups.forEach((g) => {
    const orig = `\\overline{${g.literals.map((l) => formatLiteral(l.variable, l.inverted)).join(' + ')}}`
    const litCount = g.literals.length

    if (litCount <= 2) {
      decomposedNorTerms.push(orig)
    } else if (litCount === 3) {
      hasMultiSum = true
      const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
      const pair = `\\overline{${l0} + ${l1}}`
      decomposedNorTerms.push(`\\overline{ \\overline{${pair}} + ${l2} }`)
    } else {
      hasMultiSum = true
      const l0 = formatLiteral(g.literals[0].variable, g.literals[0].inverted)
      const l1 = formatLiteral(g.literals[1].variable, g.literals[1].inverted)
      const l2 = formatLiteral(g.literals[2].variable, g.literals[2].inverted)
      const l3 = formatLiteral(g.literals[3].variable, g.literals[3].inverted)
      const pair1 = `\\overline{${l0} + ${l1}}`
      const pair2 = `\\overline{${l2} + ${l3}}`
      decomposedNorTerms.push(`\\overline{ \\overline{${pair1}} + \\overline{${pair2}} }`)
    }
  })

  if (hasMultiSum) {
    steps.push({
      title: 'Phân rã các thừa số có từ 3 biến về cổng NOR 2 đầu vào',
      description: 'Tách các tổng nhiều biến về tổng lồng 2 ngõ vào: $\\overline{A + B + C} = \\overline{\\overline{\\overline{A + B}} + C}$.',
      ruleName: 'Tách cổng NOR 2 đầu vào',
      ruleFormula: '',
      latex: `${funcName} = \\overline{ ${decomposedNorTerms.join(' + ')} }`,
      handwrittenLine: `= \\overline{ ${decomposedNorTerms.join(' + ')} }`,
      note: 'Tách các thừa số tổng nhiều biến về dạng cổng NOR 2 đầu vào'
    })
  }

  // Ghép tầng thu gom ngõ ra về cổng NOR 2 đầu vào
  if (decomposedNorTerms.length === 1) {
    steps.push({
      title: 'Biểu thức ngõ ra hoàn chỉnh',
      description: 'Hàm chỉ có 1 thừa số.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = \\overline{${decomposedNorTerms[0]}}`,
      handwrittenLine: `= \\overline{${decomposedNorTerms[0]}}`,
      note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào'
    })
  } else if (decomposedNorTerms.length === 2) {
    const finalExp = `\\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} }`
    steps.push({
      title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào',
      description: 'Hai thừa số đảo đưa thẳng vào 1 cổng NOR 2 đầu vào ngõ ra.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${finalExp}`,
      handwrittenLine: `= ${finalExp}`,
      note: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào'
    })
  } else if (decomposedNorTerms.length === 3) {
    const finalExp = `\\overline{ \\overline{\\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} }} + ${decomposedNorTerms[2]} }`
    steps.push({
      title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào',
      description: 'Gom tuần tự: 2 thừa số đầu qua cổng NOR thứ nhất kèm cổng đảo, rồi đưa cùng thừa số thứ 3 vào cổng NOR ngõ ra.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${finalExp}`,
      handwrittenLine: `= ${finalExp}`,
      note: 'Phân tầng ghép nối, biểu thức hoàn chỉnh toàn cổng NOR 2 đầu vào'
    })
  } else {
    const finalExp = `\\overline{ \\overline{\\overline{ ${decomposedNorTerms[0]} + ${decomposedNorTerms[1]} }} + \\overline{\\overline{ ${decomposedNorTerms[2]} + ${decomposedNorTerms[3]} }} }`
    steps.push({
      title: 'Biểu thức hoàn chỉnh chỉ sử dụng cổng NOR 2 đầu vào',
      description: 'Chia 2 nhánh ghép cây cân bằng qua các cổng NOR 2 đầu vào.',
      ruleName: '',
      ruleFormula: '',
      latex: `${funcName} = ${finalExp}`,
      handwrittenLine: `= ${finalExp}`,
      note: 'Phân tầng ghép nhánh, biểu thức hoàn chỉnh toàn cổng NOR 2 đầu vào'
    })
  }

  return steps
}
