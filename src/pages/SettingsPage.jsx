import ScheduleSettingsPanel from '../components/ScheduleSettingsPanel.jsx'
import {
  BACKLOG_STRATEGIES,
  REVIEW_LOAD_LEVELS,
  getScheduleCapacity,
  normalizeScheduleSettings,
} from '../utils/schedule.js'

function RuleCard({ title, description, rows }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-red-500">{title}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">{description}</h3>
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <span className="text-sm font-medium text-slate-500">{row.label}</span>
            <span className="text-sm font-semibold text-slate-950">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SettingsPage({ store }) {
  const settings = normalizeScheduleSettings(store.scheduleSettings)
  const capacity = getScheduleCapacity(settings)
  const loadLevel = REVIEW_LOAD_LEVELS[settings.reviewLoadLevel]
  const backlogStrategy = BACKLOG_STRATEGIES[settings.backlogStrategy]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-red-500">设置中心</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">排程规则</h2>
        <p className="mt-1 text-sm text-slate-500">
          这里集中管理休息日、复习上限和逾期补排逻辑。
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <ScheduleSettingsPanel
          settings={store.scheduleSettings}
          onUpdate={store.updateScheduleSettings}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <RuleCard
          title="温和复习节奏"
          description="系统默认只自动安排复习，不强迫每天新背。"
          rows={[
            { label: '每日自动复习上限', value: `${capacity.maxReviewTasks} 条` },
            { label: '每日复习负载上限', value: `${loadLevel.label} · ${capacity.maxReviewLoad.toFixed(1)}` },
            { label: '新背任务', value: '手动添加，不挤掉当天复习' },
          ]}
        />

        <RuleCard
          title="总学习负载"
          description="日程展示会把新背和复习合并估算。"
          rows={[
            { label: '总学习负载参考线', value: capacity.maxStudyLoad.toFixed(1) },
            { label: '总任务数量参考线', value: `${capacity.maxStudyTasks} 条` },
            { label: '负载用途', value: '只用于展示压力，不强制新背' },
          ]}
        />
      </div>

      <RuleCard
        title="逾期补排优先级"
        description="智能补排会先挑最值得今天处理的任务。"
        rows={[
          { label: '第一优先级', value: '逾期时间越久越靠前' },
          { label: '第二优先级', value: '早期复习阶段优先' },
          { label: '第三优先级', value: '历史掌握越差越靠前' },
          { label: '当前补排策略', value: backlogStrategy.label },
          { label: '手动安排今日', value: '会固定在今天，不被自动重排挪走' },
        ]}
      />
    </div>
  )
}

export default SettingsPage
