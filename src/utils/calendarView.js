import { addDays, toDateKey } from './date.js'
import { getNewTaskLoad, getReviewTaskLoad, getScheduleCapacity } from './load.js'
import { getTaskScheduledDate } from './schedule.js'

export const DAY_COUNT = 7
export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function getWeekday(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}

export function getDateRange(startDate, count = DAY_COUNT) {
  return Array.from({ length: count }, (_, index) => addDays(startDate, index))
}

export function getLoadMeta(load, taskCount, isRestDay, settings) {
  const capacity = getScheduleCapacity(settings)
  const normalThreshold = capacity.maxStudyLoad * 0.7

  if (isRestDay) {
    return {
      label: '休息日',
      badgeClass: 'border-sky-100 bg-sky-50 text-sky-700',
      barClass: 'from-sky-300 to-cyan-300',
      width: taskCount === 0 ? '0%' : '16%',
    }
  }

  if (taskCount === 0 || load < normalThreshold) {
    return {
      label: '轻松',
      badgeClass: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      barClass: 'from-emerald-300 to-cyan-300',
      width: taskCount === 0 ? '0%' : '38%',
    }
  }

  if (load <= capacity.maxStudyLoad) {
    return {
      label: '正常',
      badgeClass: 'border-slate-200 bg-slate-100 text-slate-600',
      barClass: 'from-cyan-300 to-violet-300',
      width: '68%',
    }
  }

  return {
    label: '偏多',
    badgeClass: 'border-amber-100 bg-amber-50 text-amber-700',
    barClass: 'from-amber-300 to-red-300',
    width: '100%',
  }
}

export function getTaskTone(task) {
  if (task.type === 'new') {
    return {
      label: '新背',
      dotClass: 'bg-emerald-400',
      chipClass: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const isBacklog = getTaskScheduledDate(task) > task.date

  return {
    label: isBacklog ? '积压补排' : '复习',
    dotClass: isBacklog ? 'bg-amber-400' : 'bg-violet-400',
    chipClass: isBacklog
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : 'border-violet-100 bg-violet-50 text-violet-700',
  }
}

export function buildDaySchedules({ tasks, itemsById, groupsById, settings }) {
  const today = toDateKey()
  const dates = getDateRange(today)
  const restDays = settings?.restDays || [0]

  return dates.map((date) => {
    const dayTasks = tasks
      .filter((task) => getTaskScheduledDate(task) === date)
      .sort((a, b) => {
        if (a.type === 'new' && b.type !== 'new') return -1
        if (a.type !== 'new' && b.type === 'new') return 1
        return a.id.localeCompare(b.id)
      })
    const newTasks = dayTasks.filter((task) => task.type === 'new')
    const reviewTasks = dayTasks.filter((task) => task.type !== 'new')
    const backlogTasks = reviewTasks.filter((task) => getTaskScheduledDate(task) > task.date)
    const reviewLoad = reviewTasks.reduce((sum, task) => sum + getReviewTaskLoad(task, tasks), 0)
    const newLoad = newTasks.reduce((sum, task) => sum + getNewTaskLoad(task), 0)
    const displayLoad = reviewLoad + newLoad
    const isRestDay = restDays.includes(getWeekday(date))
    const loadMeta = getLoadMeta(displayLoad, dayTasks.length, isRestDay, settings)

    return {
      date,
      isToday: date === today,
      weekday: WEEKDAY_NAMES[getWeekday(date)],
      isRestDay,
      tasks: dayTasks.map((task) => {
        const item = itemsById.get(task.itemId)
        const group = item?.groupId ? groupsById.get(item.groupId) : null

        return {
          ...task,
          item,
          group,
          tone: getTaskTone(task),
        }
      }),
      newCount: newTasks.length,
      reviewCount: reviewTasks.length,
      backlogCount: backlogTasks.length,
      load: displayLoad,
      loadMeta,
    }
  })
}
