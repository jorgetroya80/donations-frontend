import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { TabList } from '@/components/ui/tabs'
import { DonationSummaryTab } from './donation-summary-tab'
import { DonorStatementTab } from './donor-statement-tab'
import { ExpenseSummaryTab } from './expense-summary-tab'

type Tab = 'donations' | 'expenses' | 'donor-statement'

const tabs: { key: Tab; labelKey: string }[] = [
  { key: 'donations', labelKey: 'reports.donationSummary' },
  { key: 'expenses', labelKey: 'reports.expenseSummary' },
  { key: 'donor-statement', labelKey: 'reports.donorStatement' },
]

export function ReportsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const activeTab: Tab = tabs.some((tab) => tab.key === tabParam)
    ? (tabParam as Tab)
    : 'donations'

  function selectTab(tab: Tab) {
    // Re-clicking the active tab must not stack duplicate history entries.
    if (tab === activeTab) return
    // Tabs feel like places: push (default) so Back steps between them.
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (tab === 'donations') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      // Leaving the donor-statement tab drops the selection, as before.
      params.delete('donorId')
      return params
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('reports.title')} />

      <TabList
        tabs={tabs.map((tab) => ({ key: tab.key, label: t(tab.labelKey) }))}
        value={activeTab}
        onChange={selectTab}
      />

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'donations' && <DonationSummaryTab />}
        {activeTab === 'expenses' && <ExpenseSummaryTab />}
        {activeTab === 'donor-statement' && <DonorStatementTab />}
      </div>
    </div>
  )
}
