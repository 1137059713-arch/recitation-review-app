import assert from 'node:assert/strict'
import {
  createTask,
  getReviewTaskLoad,
  getTaskScheduledDate,
  normalizeScheduleSettings,
  rebalanceReviewSchedule,
} from '../src/utils/schedule.js'

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

testNormalizeScheduleSettings()
testRestDayIsSkipped()
testBacklogFillsTodayWhenCapacityExists()
testMasteryScoreAffectsReviewLoad()

console.log('schedule tests passed')
