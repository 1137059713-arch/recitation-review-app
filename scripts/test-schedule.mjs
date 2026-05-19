import assert from 'node:assert/strict'
import { buildDaySchedules } from '../src/utils/calendarView.js'
import { toDateKey } from '../src/utils/date.js'
import {
  createTask,
  getNewTaskLoad,
  getBacklogReviewTasksByPriority,
  getReviewTaskLoad,
  getTaskScheduledDate,
  normalizeScheduleSettings,
  rebalanceReviewSchedule,
} from '../src/utils/schedule.js'

function createDoneReviewOnDate(itemId, date) {
  return {
    ...createTask({
      itemId,
      type: 'review-7',
      date,
    }),
    status: 'done',
    recallScore: 50,
  }
}

function testNormalizeScheduleSettings() {
  assert.deepEqual(normalizeScheduleSettings().restDays, [0])
  assert.deepEqual(normalizeScheduleSettings({ restDays: [2, 2, 8, -1] }).restDays, [2])
  assert.deepEqual(normalizeScheduleSettings({ restDays: [] }).restDays, [0])
}

function testRestDayIsSkipped() {
  const task = createTask({
    itemId: 'item-1',
    type: 'review-1',
    date: '2026-05-17',
  })
  const [scheduledTask] = rebalanceReviewSchedule([task], '2026-05-17', { restDays: [0] })

  assert.equal(getTaskScheduledDate(scheduledTask), '2026-05-18')
}

function testBacklogFillsTodayWhenCapacityExists() {
  const task = createTask({
    itemId: 'item-2',
    type: 'review-7',
    date: '2026-05-10',
  })
  const [scheduledTask] = rebalanceReviewSchedule([task], '2026-05-18', { restDays: [0] })

  assert.equal(getTaskScheduledDate(scheduledTask), '2026-05-18')
}

function testMasteryScoreAffectsReviewLoad() {
  const doneTask = {
    ...createTask({
      itemId: 'item-3',
      type: 'review-1',
      date: '2026-05-11',
    }),
    status: 'done',
    recallScore: 100,
  }
  const nextTask = createTask({
    itemId: 'item-3',
    type: 'review-7',
    date: '2026-05-17',
  })

  assert.equal(getReviewTaskLoad(nextTask, [doneTask, nextTask]), 0.5)
}

function testEstimatedDifficultyAffectsNewTaskLoad() {
  const newTask = createTask({
    itemId: 'item-4',
    type: 'new',
    date: '2026-05-18',
    estimatedDifficulty: 4,
  })

  assert.equal(getNewTaskLoad(newTask), 1.5)
}

function testAutomaticReviewStopsAtThreeTasks() {
  const today = '2026-05-18'
  const backlogTasks = Array.from({ length: 4 }, (_value, index) =>
    createTask({
      itemId: `backlog-fill-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule(backlogTasks, today, { restDays: [0] })
  const todayBacklogCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) === today
  }).length
  const delayedBacklogCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) > today
  }).length

  assert.equal(todayBacklogCount, 3)
  assert.equal(delayedBacklogCount, 1)
}

function testReviewLimitSettingChangesDailyCapacity() {
  const today = '2026-05-18'
  const backlogTasks = Array.from({ length: 4 }, (_value, index) =>
    createTask({
      itemId: `limit-setting-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule(backlogTasks, today, {
    restDays: [0],
    dailyReviewLimit: 2,
    reviewLoadLevel: 'strong',
    backlogStrategy: 'aggressive',
  })
  const todayCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) === today
  }).length

  assert.equal(todayCount, 2)
}

function testReviewLoadLevelChangesDailyCapacity() {
  const today = '2026-05-18'
  const weakDoneTask = {
    ...createTask({
      itemId: 'load-setting',
      type: 'review-1',
      date: '2026-05-09',
    }),
    status: 'done',
    recallScore: 20,
  }
  const backlogTasks = Array.from({ length: 2 }, (_value, index) =>
    createTask({
      itemId: 'load-setting',
      type: index === 0 ? 'review-7' : 'review-14',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule([weakDoneTask, ...backlogTasks], today, {
    restDays: [0],
    dailyReviewLimit: 4,
    reviewLoadLevel: 'light',
    backlogStrategy: 'aggressive',
  })
  const todayCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) === today
  }).length

  assert.equal(todayCount, 1)
}

function testBacklogStrategyChangesDailyCapacity() {
  const today = '2026-05-18'
  const backlogTasks = Array.from({ length: 3 }, (_value, index) =>
    createTask({
      itemId: `strategy-setting-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule(backlogTasks, today, {
    restDays: [0],
    dailyReviewLimit: 4,
    reviewLoadLevel: 'strong',
    backlogStrategy: 'conservative',
  })
  const todayCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) === today
  }).length

  assert.equal(todayCount, 1)
}

function testBalancedBacklogLeavesNormalReviewDayGentle() {
  const today = '2026-05-18'
  const normalTask = createTask({
    itemId: 'balanced-normal',
    type: 'review-1',
    date: today,
  })
  const backlogTasks = Array.from({ length: 3 }, (_value, index) =>
    createTask({
      itemId: `balanced-backlog-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule([normalTask, ...backlogTasks], today, {
    restDays: [0],
    dailyReviewLimit: 4,
    reviewLoadLevel: 'strong',
    backlogStrategy: 'balanced',
  })
  const todayBacklogCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) === today
  }).length

  assert.equal(todayBacklogCount, 1)
}

function testAggressiveBacklogFillsNormalReviewDayCapacity() {
  const today = '2026-05-18'
  const normalTask = createTask({
    itemId: 'aggressive-normal',
    type: 'review-1',
    date: today,
  })
  const backlogTasks = Array.from({ length: 3 }, (_value, index) =>
    createTask({
      itemId: `aggressive-backlog-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule([normalTask, ...backlogTasks], today, {
    restDays: [0],
    dailyReviewLimit: 4,
    reviewLoadLevel: 'strong',
    backlogStrategy: 'aggressive',
  })
  const todayBacklogCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) === today
  }).length

  assert.equal(todayBacklogCount, 3)
}

function testNewTasksDoNotConsumeReviewCapacity() {
  const today = '2026-05-18'
  const newTasks = Array.from({ length: 4 }, (_value, index) =>
    createTask({
      itemId: `new-count-${index}`,
      type: 'new',
      date: today,
      estimatedDifficulty: 4,
    }),
  )
  const backlogTasks = Array.from({ length: 3 }, (_value, index) =>
    createTask({
      itemId: `backlog-count-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule([...newTasks, ...backlogTasks], today, { restDays: [0] })
  const todayBacklogCount = backlogTasks.filter((task) => {
    const scheduledTask = scheduledTasks.find((candidate) => candidate.id === task.id)
    return getTaskScheduledDate(scheduledTask) === today
  }).length

  assert.equal(todayBacklogCount, 3)
}

function testNewTaskDoesNotMoveScheduledReviewTasks() {
  const today = '2026-05-18'
  const backlogTasks = Array.from({ length: 3 }, (_value, index) =>
    createTask({
      itemId: `stable-backlog-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const firstSchedule = rebalanceReviewSchedule(backlogTasks, today, { restDays: [0] })
  const newTask = createTask({
    itemId: 'stable-new',
    type: 'new',
    date: today,
    estimatedDifficulty: 4,
  })
  const secondSchedule = rebalanceReviewSchedule([...firstSchedule, newTask], today, { restDays: [0] })

  backlogTasks.forEach((task) => {
    assert.equal(getTaskScheduledDate(firstSchedule.find((candidate) => candidate.id === task.id)), today)
    assert.equal(getTaskScheduledDate(secondSchedule.find((candidate) => candidate.id === task.id)), today)
  })
}

function testBacklogSortsByOverdueDaysFirst() {
  const today = '2026-05-18'
  const fixedReviews = [
    createDoneReviewOnDate('fixed-overdue-1', today),
    createDoneReviewOnDate('fixed-overdue-2', today),
  ]
  const olderTask = createTask({
    itemId: 'older-backlog',
    type: 'review-28',
    date: '2026-05-01',
  })
  const newerTask = createTask({
    itemId: 'newer-backlog',
    type: 'review-1',
    date: '2026-05-10',
  })
  const scheduledTasks = rebalanceReviewSchedule([...fixedReviews, newerTask, olderTask], today, { restDays: [0] })

  assert.equal(getTaskScheduledDate(scheduledTasks.find((task) => task.id === olderTask.id)), today)
  assert.equal(getTaskScheduledDate(scheduledTasks.find((task) => task.id === newerTask.id)), '2026-05-19')
}

function testBacklogSortsByStageWhenOverdueDaysTie() {
  const today = '2026-05-18'
  const fixedReviews = [
    createDoneReviewOnDate('fixed-stage-1', today),
    createDoneReviewOnDate('fixed-stage-2', today),
  ]
  const earlyStageTask = createTask({
    itemId: 'early-stage-backlog',
    type: 'review-1',
    date: '2026-05-10',
  })
  const lateStageTask = createTask({
    itemId: 'late-stage-backlog',
    type: 'review-28',
    date: '2026-05-10',
  })
  const scheduledTasks = rebalanceReviewSchedule([...fixedReviews, lateStageTask, earlyStageTask], today, { restDays: [0] })

  assert.equal(getTaskScheduledDate(scheduledTasks.find((task) => task.id === earlyStageTask.id)), today)
  assert.equal(getTaskScheduledDate(scheduledTasks.find((task) => task.id === lateStageTask.id)), '2026-05-19')
}

function testBacklogSortsByWeaknessWhenStageTies() {
  const today = '2026-05-18'
  const fixedReviews = [
    createDoneReviewOnDate('fixed-weak-1', today),
    createDoneReviewOnDate('fixed-weak-2', today),
  ]
  const weakPriorTask = {
    ...createTask({
      itemId: 'weak-backlog',
      type: 'review-1',
      date: '2026-05-01',
    }),
    status: 'done',
    recallScore: 50,
  }
  const familiarPriorTask = {
    ...createTask({
      itemId: 'familiar-backlog',
      type: 'review-1',
      date: '2026-05-01',
    }),
    status: 'done',
    recallScore: 100,
  }
  const weakTask = createTask({
    itemId: 'weak-backlog',
    type: 'review-7',
    date: '2026-05-10',
  })
  const familiarTask = createTask({
    itemId: 'familiar-backlog',
    type: 'review-7',
    date: '2026-05-10',
  })
  const scheduledTasks = rebalanceReviewSchedule(
    [...fixedReviews, familiarPriorTask, weakPriorTask, familiarTask, weakTask],
    today,
    { restDays: [0] },
  )

  assert.equal(getTaskScheduledDate(scheduledTasks.find((task) => task.id === weakTask.id)), today)
  assert.equal(getTaskScheduledDate(scheduledTasks.find((task) => task.id === familiarTask.id)), '2026-05-19')
}

function testBacklogPrioritySelectorSkipsTodayTasks() {
  const today = '2026-05-18'
  const todayBacklog = {
    ...createTask({
      itemId: 'already-today',
      type: 'review-7',
      date: '2026-05-10',
    }),
    scheduledDate: today,
    manualScheduledDate: today,
  }
  const olderTask = createTask({
    itemId: 'older-priority',
    type: 'review-28',
    date: '2026-05-01',
  })
  const newerTask = createTask({
    itemId: 'newer-priority',
    type: 'review-1',
    date: '2026-05-10',
  })
  const candidates = getBacklogReviewTasksByPriority([todayBacklog, newerTask, olderTask], today)

  assert.equal(candidates[0].id, olderTask.id)
  assert.equal(candidates.some((task) => task.id === todayBacklog.id), false)
}

function testManualTodayReviewIsNotMovedByRebalance() {
  const today = '2026-05-18'
  const manualTask = {
    ...createTask({
      itemId: 'manual-today',
      type: 'review-7',
      date: '2026-05-10',
    }),
    scheduledDate: today,
    manualScheduledDate: today,
  }
  const backlogTasks = Array.from({ length: 4 }, (_value, index) =>
    createTask({
      itemId: `manual-overflow-${index}`,
      type: 'review-7',
      date: '2026-05-10',
    }),
  )
  const scheduledTasks = rebalanceReviewSchedule([manualTask, ...backlogTasks], today, { restDays: [0] })

  assert.equal(getTaskScheduledDate(scheduledTasks.find((task) => task.id === manualTask.id)), today)
}

function testCalendarLoadIncludesNewTaskDifficulty() {
  const today = toDateKey()
  const newTask = createTask({
    itemId: 'calendar-new',
    type: 'new',
    date: today,
    estimatedDifficulty: 4,
  })
  const reviewTask = createTask({
    itemId: 'calendar-review',
    type: 'review-7',
    date: today,
  })
  const days = buildDaySchedules({
    tasks: [newTask, reviewTask],
    itemsById: new Map(),
    groupsById: new Map(),
    settings: { restDays: [0] },
  })
  const day = days.find((candidate) => candidate.date === today)

  assert.equal(day.load, 2.5)
}

testNormalizeScheduleSettings()
testRestDayIsSkipped()
testBacklogFillsTodayWhenCapacityExists()
testMasteryScoreAffectsReviewLoad()
testEstimatedDifficultyAffectsNewTaskLoad()
testAutomaticReviewStopsAtThreeTasks()
testReviewLimitSettingChangesDailyCapacity()
testReviewLoadLevelChangesDailyCapacity()
testBacklogStrategyChangesDailyCapacity()
testBalancedBacklogLeavesNormalReviewDayGentle()
testAggressiveBacklogFillsNormalReviewDayCapacity()
testNewTasksDoNotConsumeReviewCapacity()
testNewTaskDoesNotMoveScheduledReviewTasks()
testBacklogSortsByOverdueDaysFirst()
testBacklogSortsByStageWhenOverdueDaysTie()
testBacklogSortsByWeaknessWhenStageTies()
testBacklogPrioritySelectorSkipsTodayTasks()
testManualTodayReviewIsNotMovedByRebalance()
testCalendarLoadIncludesNewTaskDifficulty()

console.log('schedule tests passed')
