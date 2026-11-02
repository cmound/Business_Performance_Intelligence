/** All company names, figures, and activity are fictional demonstration data. */
export type Quarter = '2026-Q1' | '2026-Q2' | '2026-Q3'
export type Region = 'West' | 'Central' | 'East'
export type Department = 'Sales Operations' | 'Customer Support' | 'Fulfillment'

export interface RegionRecord {
  region: Region
  recognizedRevenue: number
  revenueTarget: number
  wonDeals: number
  lostDeals: number
  qualifiedPipeline: number
}

export interface DepartmentRecord {
  department: Department
  expenseActual: number
  expenseBudget: number
  completedUnits: number
  laborHours: number
  completedMilestones: number
  totalMilestones: number
  unitLabel: string
}

export interface QuarterRecord {
  quarter: Quarter
  costOfRevenueActual: number
  costOfRevenueBudget: number
  regions: readonly RegionRecord[]
  departments: readonly DepartmentRecord[]
}

export const reportingQuarters: readonly Quarter[] = [
  '2026-Q1',
  '2026-Q2',
  '2026-Q3',
]

export const quarterlyData: readonly QuarterRecord[] = [
  {
    quarter: '2026-Q1',
    costOfRevenueActual: 1_080_000,
    costOfRevenueBudget: 1_050_000,
    regions: [
      { region: 'West', recognizedRevenue: 1_200_000, revenueTarget: 1_250_000, wonDeals: 62, lostDeals: 40, qualifiedPipeline: 2_150_000 },
      { region: 'Central', recognizedRevenue: 980_000, revenueTarget: 1_000_000, wonDeals: 49, lostDeals: 38, qualifiedPipeline: 1_740_000 },
      { region: 'East', recognizedRevenue: 820_000, revenueTarget: 850_000, wonDeals: 42, lostDeals: 35, qualifiedPipeline: 1_480_000 },
    ],
    departments: [
      { department: 'Sales Operations', expenseActual: 360_000, expenseBudget: 350_000, completedUnits: 1_180, laborHours: 2_050, completedMilestones: 8, totalMilestones: 11, unitLabel: 'qualified opportunities processed' },
      { department: 'Customer Support', expenseActual: 340_000, expenseBudget: 350_000, completedUnits: 5_950, laborHours: 4_800, completedMilestones: 9, totalMilestones: 12, unitLabel: 'customer cases resolved' },
      { department: 'Fulfillment', expenseActual: 450_000, expenseBudget: 440_000, completedUnits: 8_200, laborHours: 5_600, completedMilestones: 7, totalMilestones: 10, unitLabel: 'orders processed' },
    ],
  },
  {
    quarter: '2026-Q2',
    costOfRevenueActual: 1_140_000,
    costOfRevenueBudget: 1_120_000,
    regions: [
      { region: 'West', recognizedRevenue: 1_310_000, revenueTarget: 1_330_000, wonDeals: 69, lostDeals: 39, qualifiedPipeline: 2_320_000 },
      { region: 'Central', recognizedRevenue: 1_030_000, revenueTarget: 1_080_000, wonDeals: 54, lostDeals: 37, qualifiedPipeline: 1_900_000 },
      { region: 'East', recognizedRevenue: 910_000, revenueTarget: 940_000, wonDeals: 47, lostDeals: 33, qualifiedPipeline: 1_650_000 },
    ],
    departments: [
      { department: 'Sales Operations', expenseActual: 390_000, expenseBudget: 380_000, completedUnits: 1_320, laborHours: 2_120, completedMilestones: 9, totalMilestones: 12, unitLabel: 'qualified opportunities processed' },
      { department: 'Customer Support', expenseActual: 350_000, expenseBudget: 355_000, completedUnits: 6_380, laborHours: 4_950, completedMilestones: 10, totalMilestones: 13, unitLabel: 'customer cases resolved' },
      { department: 'Fulfillment', expenseActual: 470_000, expenseBudget: 465_000, completedUnits: 8_900, laborHours: 5_800, completedMilestones: 8, totalMilestones: 11, unitLabel: 'orders processed' },
    ],
  },
  {
    quarter: '2026-Q3',
    costOfRevenueActual: 1_250_000,
    costOfRevenueBudget: 1_240_000,
    regions: [
      { region: 'West', recognizedRevenue: 1_430_000, revenueTarget: 1_410_000, wonDeals: 75, lostDeals: 37, qualifiedPipeline: 2_550_000 },
      { region: 'Central', recognizedRevenue: 1_120_000, revenueTarget: 1_160_000, wonDeals: 59, lostDeals: 36, qualifiedPipeline: 2_080_000 },
      { region: 'East', recognizedRevenue: 980_000, revenueTarget: 1_030_000, wonDeals: 51, lostDeals: 32, qualifiedPipeline: 1_870_000 },
    ],
    departments: [
      { department: 'Sales Operations', expenseActual: 430_000, expenseBudget: 415_000, completedUnits: 1_480, laborHours: 2_240, completedMilestones: 10, totalMilestones: 13, unitLabel: 'qualified opportunities processed' },
      { department: 'Customer Support', expenseActual: 380_000, expenseBudget: 390_000, completedUnits: 6_850, laborHours: 5_050, completedMilestones: 10, totalMilestones: 14, unitLabel: 'customer cases resolved' },
      { department: 'Fulfillment', expenseActual: 520_000, expenseBudget: 515_000, completedUnits: 9_650, laborHours: 6_000, completedMilestones: 9, totalMilestones: 12, unitLabel: 'orders processed' },
    ],
  },
]
