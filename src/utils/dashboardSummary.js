import { addDays, toDateKey } from './date.js'
import { getNewTaskLoad, getReviewTaskLoad } from './load.js'
import { getTaskScheduledDate } from './schedule.js'

export function getWeekSummary(tasks) {
  const today = toDateKey()
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index))
  const dateSet = new Set(dates)
  const weekTasks = tasks.filter((task) => dateSet.has(getTaskScheduledDate(task)))
  const newCount = weekTasks.filter((task) => task.type === 'new').length
  const reviewTasks = weekTasks.filter((task) => task.type !== 'new')
  const backlogCount = reviewTasks.filter((task) => getTaskScheduledDate(task) > task.date).length
  const load = weekTasks.reduce(
    (sum, task) => sum + (task.type === 'new' ? getNewTaskLoad(task) : getReviewTaskLoad(task, tasks)),
    0,
  )

  return {
    dateText: `${dates[0].slice(5).replace('-', '.')} - ${dates[6].slice(5).replace('-', '.')}`,
    newCount,
    reviewCount: reviewTasks.length,
    backlogCount,
    load,
  }
}
