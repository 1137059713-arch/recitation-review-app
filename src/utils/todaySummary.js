import { toDateKey } from './date.js'
import {
  getNewTaskLoad,
  getReviewTaskLoad,
  getScheduleCapacity,
} from './load.js'
import {
  getTaskScheduledDate,
} from './schedule.js'

export function getTodaySummary(tasks, scheduleSettings) {
  const today = toDateKey()
  const todayTasks = tasks.filter((task) => getTaskScheduledDate(task) === today)
  const newTasks = todayTasks.filter((task) => task.type === 'new')
  const reviewTasks = todayTasks.filter((task) => task.type !== 'new')
  const capacity = getScheduleCapacity(scheduleSettings)
  const reviewLoad = reviewTasks.reduce((sum, task) => sum + getReviewTaskLoad(task, tasks), 0)
  const newLoad = newTasks.reduce((sum, task) => sum + getNewTaskLoad(task), 0)
  const totalLoad = reviewLoad + newLoad
  const pendingCount = todayTasks.filter((task) => task.status !== 'done').length
  const overdueCount = tasks.filter(
    (task) => getTaskScheduledDate(task) < today && task.status !== 'done',
  ).length
  const rhythm = totalLoad > capacity.maxStudyLoad
    ? '偏满'
    : totalLoad >= capacity.maxStudyLoad * 0.75
      ? '正常'
      : '轻松'

  return {
    today,
    todayTasks,
    newTasks,
    reviewTasks,
    capacity,
    reviewLoad,
    newLoad,
    totalLoad,
    pendingCount,
    overdueCount,
    rhythm,
  }
}
