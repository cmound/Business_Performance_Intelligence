import { useState, type ReactNode } from 'react'
import { getQuarterRecord, getFinanceMetrics, getRevenueMetrics, getOperationsMetrics, getDatasetIssues, getQ4IllustrativeForecast } from './metrics'
import { reportingQuarters, type Department, type Quarter, type Region } from './demoData'
import './App.css'

type Dashboard = 'finance' | 'revenue' | 'operations'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
})

function money(value: number): string {
  return currency.format(value)
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function signedMoney(value: number): string {
  return `${value >= 0 ? '+' : '−'}${money(Math.abs(value))}`
}

function quarterLabel(quarter: Quarter): string {
  return quarter.replace('2026-', '') + ' 2026'
}

function isQuarter(value: string): value is Quarter {
  return reportingQuarters.some((quarter) => quarter === value)
}

function KpiCard({ title, value, detail, status }: {
  title: string
  value: string
  detail: string
  status?: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <article className="kpi-card">
      <p className="kpi-title">{title}</p>
      <strong className="kpi-value">{value}</strong>
      <p className={`kpi-detail ${status ? `kpi-${status}` : ''}`}>{detail}</p>
    </article>
  )
}

function ChartPanel({ title, description, children }: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </section>
  )
}

function BarComparison({ label, actual, budget, scale, targetLabel = 'Budget' }: {
  label: string
  actual: number
  budget: number
  scale: number
  targetLabel?: string
}) {
  return (
    <div className="bar-comparison">
      <p className="bar-row-label">{label}</p>
      <div className="bar-line">
        <span className="bar-name">Actual</span>
        <div className="bar-track" aria-hidden="true">
          <div className="bar-fill actual-fill" style={{ width: `${actual / scale * 100}%` }} />
        </div>
        <span className="bar-amount">{money(actual)}</span>
      </div>
      <div className="bar-line">
        <span className="bar-name">{targetLabel}</span>
        <div className="bar-track" aria-hidden="true">
          <div className="bar-fill budget-fill" style={{ width: `${budget / scale * 100}%` }} />
        </div>
        <span className="bar-amount">{money(budget)}</span>
      </div>
    </div>
  )
}

function FinanceDashboard() {
  const [quarter, setQuarter] = useState<Quarter>('2026-Q3')
  const metrics = getFinanceMetrics(quarter)
  const record = getQuarterRecord(quarter)
  const forecast = getQ4IllustrativeForecast()
  const revenueTrend = reportingQuarters.map((period) => getFinanceMetrics(period))
  const trendScale = Math.max(1, ...revenueTrend.flatMap((item) => [item.revenueActual, item.revenueBudget]))
  const expenseScale = Math.max(1, record.costOfRevenueActual, ...record.departments.map((item) => item.expenseActual))
  const varianceFavorable = metrics.revenueVariance >= 0
  const biggestOverrun = record.departments
    .map((department) => ({
      department: department.department,
      overrun: department.expenseActual - department.expenseBudget,
    }))
    .sort((first, second) => second.overrun - first.overrun)[0]

  return (
    <section className="dashboard-content" aria-labelledby="finance-heading">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard 01 / Financial performance</p>
          <h2 id="finance-heading">Strategic Finance &amp; FP&amp;A</h2>
          <p className="page-subtitle">Quarterly performance against plan, operating profitability, and forward outlook.</p>
        </div>
        <label className="filter-control">
          <span>Reporting quarter</span>
          <select value={quarter} onChange={(event) => {
            if (isQuarter(event.target.value)) setQuarter(event.target.value)
          }}>
            {reportingQuarters.map((period) => (
              <option key={period} value={period}>{quarterLabel(period)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="report-banner">
        <span className="report-dot" aria-hidden="true" />
        Showing completed-period actuals for <strong>{quarterLabel(quarter)}</strong>. Figures are synthetic USD demonstration data.
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Recognized revenue"
          value={money(metrics.revenueActual)}
          detail={`Budget: ${money(metrics.revenueBudget)}`}
        />
        <KpiCard
          title="Quarter-over-quarter growth"
          value={metrics.revenueGrowth === null ? 'N/A' : percent(metrics.revenueGrowth)}
          detail={metrics.revenueGrowth === null ? 'Q4 2025 baseline not included' : 'Compared with previous quarter'}
          status={metrics.revenueGrowth === null ? 'neutral' : metrics.revenueGrowth >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          title="Operating margin"
          value={percent(metrics.operatingMargin)}
          detail={`Operating profit: ${money(metrics.operatingProfit)}`}
        />
        <KpiCard
          title="Revenue vs. budget"
          value={signedMoney(metrics.revenueVariance)}
          detail={varianceFavorable ? 'Favorable / above plan' : 'Unfavorable / below plan'}
          status={varianceFavorable ? 'positive' : 'negative'}
        />
      </div>

      <div className="chart-grid">
        <ChartPanel
          title="Quarterly revenue | actual vs. budget"
          description="All completed quarters, with identical source totals used in the KPI cards."
        >
          <div className="bar-chart" role="group" aria-label="Actual and budget revenue by quarter, with numeric values">
            {revenueTrend.map((item) => (
              <div key={item.quarter} className={item.quarter === quarter ? 'selected-period' : ''}>
                <BarComparison
                  label={quarterLabel(item.quarter)}
                  actual={item.revenueActual}
                  budget={item.revenueBudget}
                  scale={trendScale}
                />
              </div>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel
          title="Cost structure | selected quarter"
          description="Actual cost of revenue and departmental operating expenses."
        >
          <div className="expense-chart" role="group" aria-label="Expense breakdown by category, with numeric values">
            {[
              { label: 'Cost of revenue', value: record.costOfRevenueActual },
              ...record.departments.map((department) => ({ label: department.department, value: department.expenseActual })),
            ].map((item) => (
              <div className="expense-row" key={item.label}>
                <div className="expense-label">
                  <span>{item.label}</span>
                  <strong>{money(item.value)}</strong>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div className="bar-fill expense-fill" style={{ width: `${item.value / expenseScale * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="chart-total">
            Total operating expenses: <strong>{money(metrics.operatingExpensesActual)}</strong>
            <span> · Budget: {money(metrics.operatingExpensesBudget)}</span>
          </p>
        </ChartPanel>
      </div>

      <section className="insights-panel" aria-labelledby="insights-heading">
        <div className="insights-header">
          <div>
            <p className="eyebrow">Management interpretation</p>
            <h3 id="insights-heading">Executive insights · {quarterLabel(quarter)}</h3>
          </div>
          <span className="insights-label">Calculated from displayed data</span>
        </div>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-number">01</span>
            <p>Revenue was <strong>{money(Math.abs(metrics.revenueVariance))} {varianceFavorable ? 'above' : 'below'} budget</strong>, a {percent(Math.abs(metrics.revenueVariance) / metrics.revenueBudget)} {varianceFavorable ? 'favorable' : 'unfavorable'} variance against plan.</p>
          </div>
          <div className="insight-item">
            <span className="insight-number">02</span>
            <p>Operating profit was <strong>{money(metrics.operatingProfit)}</strong> ({percent(metrics.operatingMargin)} margin). Total departmental costs were {money(Math.abs(metrics.expenseBudgetVariance))} {metrics.expenseBudgetVariance >= 0 ? 'under' : 'over'} budget.</p>
          </div>
          <div className="insight-item">
            <span className="insight-number">03</span>
            <p>{biggestOverrun && biggestOverrun.overrun > 0
              ? <><strong>{biggestOverrun.department}</strong> recorded the largest departmental cost overrun ({money(biggestOverrun.overrun)}), warranting an expense-driver review.</>
              : <>No department exceeded its operating expense budget for the selected quarter.</>}</p>
          </div>
        </div>
      </section>

      <section className="forecast-strip" aria-label="Illustrative forecast assumptions">
        <div>
          <p className="eyebrow">Illustrative Q4 2026 outlook</p>
          <strong>{money(forecast.revenue)} projected revenue</strong>
          <p>Based on Q3 actual revenue × 1.04; Q3 departmental expenses × 1.02; cost-of-revenue ratio held at Q3 level.</p>
        </div>
        <div className="forecast-profit">
          <span>Projected operating profit</span>
          <strong>{money(forecast.operatingProfit)}</strong>
        </div>
      </section>
    </section>
  )
}

type RegionSelection = Region | 'All Regions'

const regionOptions: readonly RegionSelection[] = ['All Regions', 'West', 'Central', 'East']
const departmentOptions: readonly Department[] = ['Sales Operations', 'Customer Support', 'Fulfillment']

function isRegionSelection(value: string): value is RegionSelection {
  return regionOptions.some((option) => option === value)
}

function isDepartment(value: string): value is Department {
  return departmentOptions.some((option) => option === value)
}

function RevenueDashboard() {
  const [region, setRegion] = useState<RegionSelection>('All Regions')
  const quarter = '2026-Q3'
  const metrics = getRevenueMetrics(quarter, region)
  const regionalResults = getQuarterRecord(quarter).regions.map((item) => ({
    region: item.region,
    ...getRevenueMetrics(quarter, item.region),
  }))
  const quarterTrend = reportingQuarters.map((period) => ({
    quarter: period,
    ...getRevenueMetrics(period, region),
  }))
  const regionalScale = Math.max(1, ...regionalResults.flatMap((item) => [item.revenue, item.target]))
  const trendScale = Math.max(1, ...quarterTrend.flatMap((item) => [item.revenue, item.target]))
  const quotaVariance = metrics.revenue - metrics.target
  const companyRevenue = getRevenueMetrics(quarter, 'All Regions').revenue
  const leader = [...regionalResults].sort(
    (first, second) => (second.attainment ?? 0) - (first.attainment ?? 0),
  )[0]
  const forecastGrowth = getQ4IllustrativeForecast().revenue / getFinanceMetrics(quarter).revenueActual - 1
  const projectedRevenue = metrics.revenue * (1 + forecastGrowth)

  return (
    <section className="dashboard-content" aria-labelledby="revenue-heading">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard 02 / Commercial performance</p>
          <h2 id="revenue-heading">Revenue Operations &amp; Commercial Performance</h2>
          <p className="page-subtitle">Revenue realization, quota attainment, closed-deal conversion, and regional comparisons.</p>
        </div>
        <label className="filter-control">
          <span>Sales region</span>
          <select value={region} onChange={(event) => {
            if (isRegionSelection(event.target.value)) setRegion(event.target.value)
          }}>
            {regionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="report-banner">
        <span className="report-dot" aria-hidden="true" />
        Showing completed-period actuals for <strong>Q3 2026 · {region}</strong>. Revenue targets equal regional budgets in this fictional dataset.
      </div>

      <div className="kpi-grid">
        <KpiCard title="Recognized sales revenue" value={money(metrics.revenue)} detail={`Quota: ${money(metrics.target)}`} />
        <KpiCard
          title="Revenue quota attainment"
          value={metrics.attainment === null ? 'N/A' : percent(metrics.attainment)}
          detail={`${money(Math.abs(quotaVariance))} ${quotaVariance >= 0 ? 'above' : 'below'} quota`}
          status={quotaVariance >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          title="Closed-deal win rate"
          value={metrics.winRate === null ? 'N/A' : percent(metrics.winRate)}
          detail={`${metrics.wonDeals} won / ${metrics.wonDeals + metrics.lostDeals} decided deals`}
        />
        <KpiCard
          title="Qualified pipeline value"
          value={money(metrics.qualifiedPipeline)}
          detail="Open opportunities, not earned revenue"
        />
      </div>

      <div className="chart-grid">
        <ChartPanel
          title="Regional revenue | actual vs. quota"
          description="All three Q3 regions remain visible for context; the selected region is highlighted."
        >
          <div className="bar-chart" role="group" aria-label="Regional actual and quota revenue, with numeric values">
            {regionalResults.map((item) => (
              <div key={item.region} className={region === item.region ? 'selected-period' : ''}>
                <BarComparison label={item.region} actual={item.revenue} budget={item.target} scale={regionalScale} targetLabel="Quota" />
              </div>
            ))}
          </div>
        </ChartPanel>
        <ChartPanel
          title="Revenue trend | actual vs. quota"
          description={`Completed quarterly results for ${region.toLowerCase()}. The Q3 reporting period is highlighted.`}
        >
          <div className="bar-chart" role="group" aria-label="Quarterly actual and quota revenue with numeric values">
            {quarterTrend.map((item) => (
              <div key={item.quarter} className={item.quarter === quarter ? 'selected-period' : ''}>
                <BarComparison label={quarterLabel(item.quarter)} actual={item.revenue} budget={item.target} scale={trendScale} targetLabel="Quota" />
              </div>
            ))}
          </div>
        </ChartPanel>
      </div>

      <section className="insights-panel" aria-labelledby="revenue-insights-heading">
        <div className="insights-header">
          <div>
            <p className="eyebrow">Management interpretation</p>
            <h3 id="revenue-insights-heading">Executive insights · {region}</h3>
          </div>
          <span className="insights-label">Calculated from selected Q3 data</span>
        </div>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-number">01</span>
            <p>Revenue was <strong>{money(Math.abs(quotaVariance))} {quotaVariance >= 0 ? 'above' : 'below'} target</strong>, representing {metrics.attainment === null ? 'N/A' : percent(metrics.attainment)} quota attainment.</p>
          </div>
          <div className="insight-item">
            <span className="insight-number">02</span>
            <p>The win rate was <strong>{metrics.winRate === null ? 'N/A' : percent(metrics.winRate)}</strong> across {metrics.wonDeals + metrics.lostDeals} decided deals. Qualified open pipeline totals <strong>{money(metrics.qualifiedPipeline)}</strong>.</p>
          </div>
          <div className="insight-item">
            <span className="insight-number">03</span>
            {region === 'All Regions'
              ? <p>{leader ? <><strong>{leader.region}</strong> led quota attainment at {leader.attainment === null ? 'N/A' : percent(leader.attainment)}.</> : 'Regional comparisons are unavailable.'} Assess the regional gaps before adjusting commercial priorities.</p>
              : <p><strong>{region}</strong> accounted for {companyRevenue > 0 ? percent(metrics.revenue / companyRevenue) : 'N/A'} of total company revenue. Compare its attainment with the other regions before reallocating support.</p>}
          </div>
        </div>
      </section>

      <section className="forecast-strip" aria-label="Illustrative revenue projection">
        <div>
          <p className="eyebrow">Illustrative Q4 2026 revenue projection · {region}</p>
          <strong>{money(projectedRevenue)} projected revenue</strong>
          <p>Q3 recognized revenue increased by {percent(forecastGrowth)}, using the same companywide assumption as Finance. No pipeline conversion or new deals are assumed.</p>
        </div>
        <div className="forecast-profit">
          <span>Projection basis</span>
          <strong>Q3 actuals</strong>
        </div>
      </section>
    </section>
  )
}

function OperationsDashboard() {
  const [department, setDepartment] = useState<Department>('Sales Operations')
  const quarter = '2026-Q3'
  const metrics = getOperationsMetrics(quarter, department)
  const previous = getOperationsMetrics('2026-Q2', department)
  const departmentData = getQuarterRecord(quarter).departments.find((item) => item.department === department)
  const departmentalResults = getQuarterRecord(quarter).departments.map((item) => ({
    department: item.department,
    ...getOperationsMetrics(quarter, item.department),
  }))
  const productivityTrend = reportingQuarters.map((period) => ({
    quarter: period,
    ...getOperationsMetrics(period, department),
  }))
  const expenseScale = Math.max(1, ...departmentalResults.flatMap((item) => [item.expenseActual, item.expenseBudget]))
  const productivityScale = Math.max(1, ...productivityTrend.map((item) => item.unitsPerHour ?? 0))
  const productivityChange = metrics.unitsPerHour !== null && previous.unitsPerHour !== null && previous.unitsPerHour > 0
    ? metrics.unitsPerHour / previous.unitsPerHour - 1
    : null
  const expenseFavorable = metrics.favorableExpenseVariance >= 0
  const outstandingMilestones = metrics.totalMilestones - metrics.completedMilestones

  return (
    <section className="dashboard-content" aria-labelledby="operations-heading">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard 03 / Operational performance</p>
          <h2 id="operations-heading">Business Operations &amp; Strategy</h2>
          <p className="page-subtitle">Departmental cost control, throughput per labor hour, and strategic milestone execution.</p>
        </div>
        <label className="filter-control">
          <span>Department</span>
          <select value={department} onChange={(event) => {
            if (isDepartment(event.target.value)) setDepartment(event.target.value)
          }}>
            {departmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="report-banner">
        <span className="report-dot" aria-hidden="true" />
        Showing completed-period actuals for <strong>Q3 2026 · {department}</strong>. Productivity measures are department-specific and not comparable across different work units.
      </div>

      <div className="kpi-grid">
        <KpiCard title="Operating costs" value={money(metrics.expenseActual)} detail={`Budget: ${money(metrics.expenseBudget)}`} />
        <KpiCard
          title="Operating cost variance"
          value={signedMoney(metrics.favorableExpenseVariance)}
          detail={expenseFavorable ? 'Favorable / under budget' : 'Unfavorable / over budget'}
          status={expenseFavorable ? 'positive' : 'negative'}
        />
        <KpiCard
          title="Productivity rate"
          value={metrics.unitsPerHour === null ? 'N/A' : `${metrics.unitsPerHour.toFixed(2)} /hr`}
          detail={departmentData ? departmentData.unitLabel : 'Completed units per labor hour'}
        />
        <KpiCard
          title="Initiative completion"
          value={metrics.initiativeCompletion === null ? 'N/A' : percent(metrics.initiativeCompletion)}
          detail={`${metrics.completedMilestones} of ${metrics.totalMilestones} milestones completed`}
        />
      </div>

      <div className="chart-grid">
        <ChartPanel
          title="Department costs | actual vs. budget"
          description="All Q3 departments shown for expense context; selected department highlighted."
        >
          <div className="bar-chart" role="group" aria-label="Department operating costs and budgets, with numeric values">
            {departmentalResults.map((item) => (
              <div key={item.department} className={item.department === department ? 'selected-period' : ''}>
                <BarComparison label={item.department} actual={item.expenseActual} budget={item.expenseBudget} scale={expenseScale} />
              </div>
            ))}
          </div>
        </ChartPanel>
        <ChartPanel
          title="Productivity | completed units per labor hour"
          description={`Quarterly throughput within ${department}; the work unit remains consistent across periods.`}
        >
          <div className="expense-chart bar-chart" role="group" aria-label="Quarterly productivity with numeric values">
            {productivityTrend.map((item) => (
              <div className={item.quarter === quarter ? 'expense-row selected-period' : 'expense-row'} key={item.quarter}>
                <div className="expense-label">
                  <span>{quarterLabel(item.quarter)}</span>
                  <strong>{item.unitsPerHour === null ? 'N/A' : `${item.unitsPerHour.toFixed(2)} units/hr`}</strong>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div className="bar-fill expense-fill" style={{ width: `${(item.unitsPerHour ?? 0) / productivityScale * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="chart-total">Throughput indicator: <strong>completed work units ÷ labor hours</strong>.</p>
        </ChartPanel>
      </div>

      <section className="insights-panel" aria-labelledby="operations-insights-heading">
        <div className="insights-header">
          <div>
            <p className="eyebrow">Management interpretation</p>
            <h3 id="operations-insights-heading">Executive insights · {department}</h3>
          </div>
          <span className="insights-label">Calculated from selected Q3 data</span>
        </div>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-number">01</span>
            <p>Operating costs were <strong>{money(Math.abs(metrics.favorableExpenseVariance))} {expenseFavorable ? 'under' : 'over'} budget</strong>, a {metrics.expenseBudget > 0 ? percent(Math.abs(metrics.favorableExpenseVariance) / metrics.expenseBudget) : 'N/A'} {expenseFavorable ? 'favorable' : 'unfavorable'} difference.</p>
          </div>
          <div className="insight-item">
            <span className="insight-number">02</span>
            <p>Throughput was <strong>{metrics.unitsPerHour === null ? 'N/A' : metrics.unitsPerHour.toFixed(2)} units per hour</strong>, {productivityChange === null ? 'with no valid prior-period comparison' : `${percent(Math.abs(productivityChange))} ${productivityChange >= 0 ? 'higher' : 'lower'} than Q2`}.</p>
          </div>
          <div className="insight-item">
            <span className="insight-number">03</span>
            <p><strong>{metrics.completedMilestones} of {metrics.totalMilestones}</strong> strategic milestones were completed, with {outstandingMilestones} remaining. Review remaining milestones alongside cost and productivity trends.</p>
          </div>
        </div>
      </section>
    </section>
  )
}

const tabs: readonly { id: Dashboard; label: string; shortLabel: string }[] = [
  { id: 'finance', label: 'Strategic Finance & FP&A', shortLabel: '01' },
  { id: 'revenue', label: 'Revenue & Commercial Performance', shortLabel: '02' },
  { id: 'operations', label: 'Business Operations & Strategy', shortLabel: '03' },
]

function App() {
  const [dashboard, setDashboard] = useState<Dashboard>('finance')
  const issues = getDatasetIssues()

  return (
    <div className="bpi-app">
      <header className="site-header">
        <div className="site-brand">
          <div className="brand-symbol" aria-hidden="true">↗</div>
          <div>
            <p className="brand-name">Business Performance Intelligence</p>
            <p className="brand-subtitle">Executive Decision-Support Portfolio</p>
          </div>
        </div>
        <span className="demo-pill">SYNTHETIC DATA · DEMONSTRATION</span>
      </header>

      <div className="workspace">
        <aside className="side-panel" aria-label="Dashboard navigation">
          <p className="nav-heading">ANALYTICS WORKSPACE</p>
          <nav className="dashboard-nav" aria-label="Choose a dashboard">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={dashboard === tab.id ? 'nav-button active' : 'nav-button'}
                aria-pressed={dashboard === tab.id}
                onClick={() => setDashboard(tab.id)}
              >
                <span className="nav-number">{tab.shortLabel}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className="side-note">
            <strong>Meridian Business Solutions</strong>
            <p>Fictional company · 2026 Q1–Q3 completed periods</p>
          </div>
        </aside>

        <main className="main-workspace">
          {issues.length > 0 && (
            <div className="data-warning" role="alert">
              <strong>Dataset validation requires attention.</strong>
              <ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
            </div>
          )}
          {dashboard === 'finance' && <FinanceDashboard />}
          {dashboard === 'revenue' && <RevenueDashboard />}
          {dashboard === 'operations' && <OperationsDashboard />}
          <footer className="site-footer">
            <span>Business Performance Intelligence · Portfolio Demonstration</span>
            <span>All company details and figures are fictional. Not investment or financial advice.</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
