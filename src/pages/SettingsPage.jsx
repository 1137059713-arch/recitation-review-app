import { useState } from 'react'
import {
  OutlineButton,
  OpacitySlider,
  RestDayPanel,
  StudyModePicker,
  Toggle,
} from '../components/settings/SettingsControls.jsx'
import {
  Card,
  CardTitle,
  ModeSummaryRow,
  RhythmTip,
  SettingPanel,
  StaticRow,
} from '../components/settings/SettingsPrimitives.jsx'
import { STUDY_MODE_OPTIONS } from '../components/settings/settingsOptions.js'
import { normalizeScheduleSettings } from '../utils/schedule.js'
import { normalizeAppSettings } from '../utils/storage.js'

function SettingsPage({ store }) {
  const [dataMessage, setDataMessage] = useState('')
  const settings = normalizeScheduleSettings(store.scheduleSettings)
  const appSettings = normalizeAppSettings(store.appSettings)
  const restDay = settings.restDays[0] ?? 0
  const currentMode = STUDY_MODE_OPTIONS.find((option) => option.value === settings.reviewLoadLevel) || STUDY_MODE_OPTIONS[1]

  function updateSetting(updates) {
    store.updateScheduleSettings({
      ...settings,
      ...updates,
    })
  }

  function updateAppSetting(updates) {
    store.updateAppSettings(updates)
  }

  async function handleExportData() {
    const result = await store.exportData()
    if (result?.canceled) return
    setDataMessage(result?.ok ? `已导出到 ${result.filePath}` : '导出失败，请稍后重试')
  }

  async function handleImportData() {
    const result = await store.importData()
    if (result?.canceled) return

    if (result?.ok) {
      setDataMessage('导入完成，导入前的数据已自动备份')
      return
    }

    setDataMessage(result?.reason === 'empty-import' ? '导入文件没有有效背诵数据，已取消' : '导入失败，请检查文件格式')
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-950">设置中心</h1>
        <p className="mt-2 text-sm text-slate-500">把复杂规则收进轻量的学习节奏里。</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <SettingPanel
              icon="wave"
              tone="violet"
              title="学习模式"
              description="选择今天更偏向新背、均衡推进，还是优先复习。"
            >
              <StudyModePicker
                value={settings.reviewLoadLevel}
                onChange={(value) => updateSetting({ reviewLoadLevel: value })}
              />
            </SettingPanel>

            <RestDayPanel value={restDay} onChange={updateSetting} />
          </div>

          <RhythmTip />
        </Card>

        <Card>
          <CardTitle
            icon="eye"
            tone="violet"
            title="模式说明"
            description="用更直观的方式理解当前学习节奏。"
          />

          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <ModeSummaryRow
              icon="wave"
              tone="emerald"
              title={`今日倾向：${currentMode.tendency}`}
              description={currentMode.description}
            />
            <ModeSummaryRow
              icon="calendar"
              tone="amber"
              title="大概任务量"
              description={currentMode.workload}
            />
            <ModeSummaryRow
              icon="grid"
              tone="violet"
              title="积压处理"
              description={currentMode.backlog}
            />
            <ModeSummaryRow
              icon="eye"
              tone="blue"
              title="节奏建议"
              description={currentMode.note}
            />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            当前模式约束由系统统一换算，日程页会按对应总负载参考线判断当天是否偏多。
          </p>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardTitle
            icon="shield"
            tone="blue"
            title="数据安全"
            description="保护你的学习数据，防止意外丢失。"
          />

          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <StaticRow
              icon="shield"
              title="自动备份"
              description="每天自动备份到本地"
              trailing={(
                <Toggle
                  checked={appSettings.autoBackupEnabled}
                  onChange={(value) => updateAppSetting({ autoBackupEnabled: value })}
                />
              )}
            />
            <StaticRow
              icon="shield"
              title="空数据保护"
              description="检测到空数据时自动备份当前数据"
              trailing={(
                <Toggle
                  checked={appSettings.emptyDataProtectionEnabled}
                  onChange={(value) => updateAppSetting({ emptyDataProtectionEnabled: value })}
                />
              )}
            />
            <StaticRow
              icon="shield"
              title="导入导出"
              description="手动导出或从备份文件导入数据"
              trailing={(
                <div className="flex gap-2">
                  <OutlineButton onClick={handleExportData}>导出数据</OutlineButton>
                  <OutlineButton onClick={handleImportData}>导入数据</OutlineButton>
                </div>
              )}
            />
          </div>
          {dataMessage && (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {dataMessage}
            </p>
          )}
        </Card>

        <Card>
          <CardTitle
            icon="desktop"
            tone="blue"
            title="桌面体验"
            description="个性化你的使用体验。"
          />

          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <StaticRow
              icon="desktop"
              title="在侧边栏显示今日任务"
              description="启动应用时默认选中今日任务"
              trailing={(
                <Toggle
                  checked={appSettings.showSidebarTodayTasks}
                  onChange={(value) => updateAppSetting({ showSidebarTodayTasks: value })}
                />
              )}
            />
            <StaticRow
              icon="clock"
              title="开机自动启动"
              description="登录 Windows 后自动启动应用"
              trailing={(
                <Toggle
                  checked={appSettings.launchAtLogin}
                  onChange={(value) => updateAppSetting({ launchAtLogin: value })}
                />
              )}
            />
            <StaticRow
              icon="desktop"
              title="窗口透明度"
              description="调整主窗口的透明效果"
              trailing={(
                <OpacitySlider
                  value={appSettings.windowOpacity}
                  onChange={(value) => updateAppSetting({ windowOpacity: value })}
                />
              )}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage
