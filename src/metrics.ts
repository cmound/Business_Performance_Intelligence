import {
  quarterlyData,
  reportingQuarters,
  type Department,
  type Quarter,
  type QuarterRecord,
  type Region,
} from './demoData'

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function getQuarterRecord(quarter: Quarter): QuarterRecord {
  const record = quarterlyData.find((item) => item.quarter === quarter)
  if (!record) throw new Error(`Missing synthetic dataset for ${quarter}`)
  return record
}

export function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator
}

export interface FinanceMetrics {
  quarter: Quarter
  revenueActual: number
  revenueBudget: number
  revenueVariance: number
  revenueGrowth: number | null
  costOfRevenueActual: number
  costOfRevenueBudget: number
  operatingExpensesActual: number
  operatingExpensesBudget: number
  operatingProfit: number
  operatingMargin: number
  expenseBudgetVariance: number
}

export function getFinanceMetrics(quarter: Quarter): FinanceMetrics {
  const record = getQuarterRecord(quarter)
  const revenueActual = sum(record.regions.map((region) => region.recognizedRevenue))
  const revenueBudget = sum(record.regions.map((region) => region.revenueTarget))
  const operatingExpensesActual = sum(record.departments.map((department) => department.expenseActual))
  const operatingExpensesBudget = sum(record.departments.map((department) => department.expenseBudget))
  const operatingProfit = revenueActual - record.costOfRevenueActual - operatingExpensesActual
  const index = reportingQuarters.indexOf(quarter)
  const previousQuarter = index > 0 ? reportingQuarters[index - 1] : undefined
  const priorRevenue = previousQuarter
    ? sum(getQuarterRecord(previousQuarter).regions.map((region) => region.recognizedRevenue))
    : null

  return {
    quarter,
    revenueActual,
    revenueBudget,
    revenueVariance: revenueActual - revenueBudget,
    revenueGrowth: priorRevenue === null ? null : ratio(revenueActual - priorRevenue, priorRevenue),
    costOfRevenueActual: record.costOfRevenueActual,
    costOfRevenueBudget: record.costOfRevenueBudget,
    operatingExpensesActual,
    operatingExpensesBudget,
    operatingProfit,
    operatingMargin: ratio(operatingProfit, revenueActual) ?? 0,
    expenseBudgetVariance: operatingExpensesBudget - operatingExpensesActual,
  }
}

export interface RevenueMetrics {
  revenue: number
  target: number
  attainment: number | null
  wonDeals: number
  lostDeals: number
  winRate: number | null
  qualifiedPipeline: number
}

export function getRevenueMetrics(quarter: Quarter, region: Region | 'All Regions'): RevenueMetrics {
  const regions = getQuarterRecord(quarter).regions.filter(
    (item) => region === 'All Regions' || item.region === region,
  )
  const revenue = sum(regions.map((item) => item.recognizedRevenue))
  const target = sum(regions.map((item) => item.revenueTarget))
  const wonDeals = sum(regions.map((item) => item.wonDeals))
  const lostDeals = sum(regions.map((item) => item.lostDeals))
  return {
    revenue,
    target,
    attainment: ratio(revenue, target),
    wonDeals,
    lostDeals,
    winRate: ratio(wonDeals, wonDeals + lostDeals),
    qualifiedPipeline: sum(regions.map((item) => item.qualifiedPipeline)),
  }
}

export interface OperationsMetrics {
  expenseActual: number
  expenseBudget: number
  favorableExpenseVariance: number
  completedUnits: number
  laborHours: number
  unitsPerHour: number | null
  completedMilestones: number
  totalMilestones: number
  initiativeCompletion: number | null
}

export function getOperationsMetrics(quarter: Quarter, department: Department): OperationsMetrics {
  const record = getQuarterRecord(quarter).departments.find(
    (item) => item.department === department,
  )
  if (!record) throw new Error(`Missing department data for ${department}`)
  return {
    expenseActual: record.expenseActual,
    expenseBudget: record.expenseBudget,
    favorableExpenseVariance: record.expenseBudget - record.expenseActual,
    completedUnits: record.completedUnits,
    laborHours: record.laborHours,
    unitsPerHour: ratio(record.completedUnits, record.laborHours),
    completedMilestones: record.completedMilestones,
    totalMilestones: record.totalMilestones,
    initiativeCompletion: ratio(record.completedMilestones, record.totalMilestones),
  }
}

/** Explicit illustration, not a statistically estimated forecast. */
export function getQ4IllustrativeForecast() {
  const thirdQuarter = getFinanceMetrics('2026-Q3')
  const revenue = thirdQuarter.revenueActual * 1.04
  const expense = thirdQuarter.operatingExpensesActual * 1.02
  const costOfRevenue = revenue * (thirdQuarter.costOfRevenueActual / thirdQuarter.revenueActual)
  return {
    revenue,
    operatingExpenses: expense,
    costOfRevenue,
    operatingProfit: revenue - expense - costOfRevenue,
  }
}

/** Checks used in the browser and independently during development. */
export function getDatasetIssues(): readonly string[] {
  const issues: string[] = []
  for (const quarter of reportingQuarters) {
    const record = getQuarterRecord(quarter)
    const finance = getFinanceMetrics(quarter)
    const sales = getRevenueMetrics(quarter, 'All Regions')
    if (record.regions.length !== 3 || record.departments.length !== 3) {
      issues.push(`${quarter}: expected three regions and three departments`)
    }
    if (sales.revenue !== finance.revenueActual || sales.target !== finance.revenueBudget) {
      issues.push(`${quarter}: revenue or target totals do not reconcile`)
    }
    if (sum(record.departments.map((item) => item.expenseActual)) !== finance.operatingExpensesActual) {
      issues.push(`${quarter}: departmental costs do not reconcile`)
    }
    if (Math.abs(finance.operatingProfit - (finance.revenueActual - finance.costOfRevenueActual - finance.operatingExpensesActual)) > 0.01) {
      issues.push(`${quarter}: operating profit does not reconcile`)
    }
    for (const region of record.regions) {
      if (region.recognizedRevenue < 0 || region.revenueTarget <= 0 || region.wonDeals < 0 || region.lostDeals < 0 || region.qualifiedPipeline < 0) {
        issues.push(`${quarter}: invalid region data for ${region.region}`)
      }
    }
    for (const department of record.departments) {
      if (department.expenseBudget < 0 || department.expenseActual < 0 || department.completedUnits < 0 || department.laborHours <= 0 || department.completedMilestones > department.totalMilestones || department.totalMilestones <= 0) {
        issues.push(`${quarter}: invalid department data for ${department.department}`)
      }
    }
  }
  return issues
}
