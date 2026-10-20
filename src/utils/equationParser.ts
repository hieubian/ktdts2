import type { OptimizationForm, TargetGateType, VariableCount } from '../types'

export interface ParsedEquationResult {
  hasEquation: boolean
  variableCount?: VariableCount
  variables?: string[]
  form?: OptimizationForm
  terms: number[]
  dontCares: number[]
  targetGateType?: TargetGateType
  rawEquation?: string
  displayLatex?: string
}

/**
 * Extracts numbers from a string segment like "(0, 3, 5, 7, 8, 13, 15)"
 */
function extractNumbers(str: string): number[] {
  if (!str) return []
  const matches = str.match(/\d+/g)
  if (!matches) return []
  return Array.from(new Set(matches.map(Number))).sort((a, b) => a - b)
}

/**
 * Parses user input string which may be an equation like:
 * - Y(A,B,C,D) = ∏(0,3,5,7,8,13,15) .D(9,11,12)
 * - Y(A,B,C,D) = \prod(0, 1, 2, 7) \cdot D(3, 5)
 * - Y(A,B,C,D) = ∑(0,1,4,5,7,9) + d(3,6,14)
 * - Y(A,B,C) = \sum(1,3,5) + d(4)
 * - 0, 1, 4, 5, 7, 9
 */
export function parseProblemEquation(input: string): ParsedEquationResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      hasEquation: false,
      terms: [],
      dontCares: []
    }
  }

  let variableCount: VariableCount | undefined
  let variables: string[] | undefined
  let form: OptimizationForm | undefined
  let terms: number[] = []
  let dontCares: number[] = []
  let targetGateType: TargetGateType | undefined

  // 1. Detect target gate if mentioned in prompt / instruction
  const lower = trimmed.toLowerCase()
  if (lower.includes('nand 2') || lower.includes('nand 2 đầu') || lower.includes('nand2')) {
    targetGateType = 'nand_2'
  } else if (lower.includes('nor 2') || lower.includes('nor 2 đầu') || lower.includes('nor2')) {
    targetGateType = 'nor_2'
  } else if (lower.includes('nand nhiều') || lower.includes('nand n')) {
    targetGateType = 'nand_n'
  } else if (lower.includes('nor nhiều') || lower.includes('nor n')) {
    targetGateType = 'nor_n'
  } else if (lower.includes('cơ bản') || lower.includes('basic') || lower.includes('and, or, not')) {
    targetGateType = 'basic'
  }

  // 2. Detect variables: Y(A,B,C,D) or F(A, B, C) or Y(x1, x2, x3, x4)
  const varMatch = trimmed.match(/(?:Y|F|f|y|Z|z)\s*\(([^)]+)\)/i)
  if (varMatch && varMatch[1]) {
    const rawVars = varMatch[1].split(/[,;\s]+/).filter(Boolean)
    if (rawVars.length === 2) {
      variableCount = 2
      variables = rawVars
    } else if (rawVars.length === 3) {
      variableCount = 3
      variables = rawVars
    } else if (rawVars.length >= 4) {
      variableCount = 4
      variables = rawVars.slice(0, 4)
    }
  }

  // 3. Detect Form: POS (∏, \prod, Pi, P) vs SOP (∑, \sum, Sigma, S)
  const hasPOS = /[∏Π]|\\prod|\\Pi|\bP\s*\(|\bPOS\b/i.test(trimmed)
  const hasSOP = /[∑Σ]|\\sum|\\Sigma|\bS\s*\(|\bSOP\b/i.test(trimmed)

  if (hasPOS && !hasSOP) {
    form = 'POS'
  } else if (hasSOP) {
    form = 'SOP'
  }

  // 4. Extract terms & don't cares
  // Look for primary term group: e.g. ∏(...) or ∑(...) or \prod(...) or \sum(...)
  const primaryMatch = trimmed.match(/(?:[∏Π∑Σ]|\\prod|\\sum|\\Pi|\\Sigma|[PS])\s*(?:\([^)]*\)|\[[^\]]*\])/i)
  
  // Look for don't care group: e.g. .D(...) or +d(...) or d(...) or D(...)
  const dcMatch = trimmed.match(/(?:[+.\s]|^)[dD]\s*(?:\([^)]*\)|\[[^\]]*\])/)

  if (primaryMatch) {
    terms = extractNumbers(primaryMatch[0])
  }

  if (dcMatch) {
    dontCares = extractNumbers(dcMatch[0])
  }

  // Fallback: if no symbols like ∑ or ∏ were found, check if user wrote something like:
  // "0, 1, 4, 5, 7; d: 3, 6, 14" or "m: 0,1,4; d: 3,6"
  if (terms.length === 0) {
    const parts = trimmed.split(/[;+&|]/)
    if (parts.length > 1) {
      terms = extractNumbers(parts[0])
      dontCares = extractNumbers(parts.slice(1).join(' '))
    } else {
      // Just a comma-separated list of numbers
      terms = extractNumbers(trimmed)
    }
  }

  // If variableCount not yet determined, infer from maximum term index
  if (!variableCount) {
    const maxVal = Math.max(0, ...terms, ...dontCares)
    if (maxVal >= 8) variableCount = 4
    else if (maxVal >= 4) variableCount = 3
    else variableCount = 4 // Default standard for digital electronics exams
  }

  const vars = variables || (variableCount === 2 ? ['A', 'B'] : variableCount === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'])

  // Build display LaTeX representation
  let displayLatex = ''
  if (form === 'POS') {
    displayLatex = `Y(${vars.join(', ')}) = \\prod(${terms.join(', ') || '0'})`
    if (dontCares.length > 0) {
      displayLatex += ` \\cdot D(${dontCares.join(', ')})`
    }
  } else {
    displayLatex = `Y(${vars.join(', ')}) = \\sum(${terms.join(', ') || '0'})`
    if (dontCares.length > 0) {
      displayLatex += ` + d(${dontCares.join(', ')})`
    }
  }

  return {
    hasEquation: terms.length > 0 || dontCares.length > 0,
    variableCount,
    variables: vars,
    form: form || 'SOP',
    terms,
    dontCares,
    targetGateType,
    rawEquation: trimmed,
    displayLatex
  }
}
