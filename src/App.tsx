import { useState, type ReactNode } from 'react'
import { getQuarterRecord, getFinanceMetrics, getDatasetIssues, getQ4IllustrativeForecast } from './metrics'
import { reportingQuarters, type Quarter } from './demoData'
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

function BarComparison({ label, actual, budget, scale }: {
  label: string
  actual: number
  budget: number
  scale: number
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
        <span className="bar-name">Budget</span>
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

function PlannedDashboard({ title, number, details }: {
  title: string
  number: string
  details: string
}) {
  return (
    <section className="dashboard-content" aria-labelledby="planned-heading">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard {number} / Planned</p>
          <h2 id="planned-heading">{title}</h2>
          <p className="page-subtitle">{details}</p>
        </div>
      </div>
      <div className="planned-panel">
        <div className="planned-icon" aria-hidden="true">↗</div>
        <h3>Dashboard foundation established</h3>
        <p>This section will use the same synthetic 2026 dataset, reconciled calculations, and executive layout. Interactive KPIs, charts, and insights will be implemented in the next development phase.</p>
        <span className="planned-tag">Not yet a completed demonstration</span>
      </div>
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
          {dashboard === 'revenue' && (
            <PlannedDashboard
              number="02"
              title="Revenue Operations & Commercial Performance"
              details="Sales performance, pipeline health, quota attainment, and regional comparisons."
            />
          )}
          {dashboard === 'operations' && (
            <PlannedDashboard
              number="03"
              title="Business Operations & Strategy"
              details="Departmental cost efficiency, productivity, and strategic initiative execution."
            />
          )}
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
