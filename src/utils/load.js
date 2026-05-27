import { compareDateKey } from './date.js'
import { getEstimatedDifficultyLoad } from './difficulty.js'

export const REVIEW_LOAD_LEVELS = {
  light: { label: '轻松', load: 2.2, description: '复习压力更低，适合忙碌日。' },
  standard: { label: '标准', load: 3.0, description: '默认节奏，复习和休息比较均衡。' },
  strong: { label: '加强', load: 5.0, description: '更积极消化任务，适合状态好的阶段。' },
}

export const DAILY_TARGET_STUDY_LOAD = 3
export const DAILY_MAX_STUDY_LOAD = 4
export const DAILY_MAX_STUDY_TASKS = 4

export const DAILY_REVIEW_LIMIT = DAILY_TARGET_STUDY_LOAD
export const DAILY_TARGET_REVIEW_LOAD = DAILY_TARGET_STUDY_LOAD
export const DAILY_MAX_REVIEW_LOAD = DAILY_TARGET_STUDY_LOAD
export const DAILY_MAX_REVIEW_TASKS = 3

const STUDY_MODE_CAPACITY = {
  light: { maxReviewTasks: 2, maxReviewLoad: 2.2, maxStudyLoad: 3.5 },
  standard: { maxReviewTasks: 3, maxReviewLoad: 3.0, maxStudyLoad: 4.0 },
  strong: { maxReviewTasks: 4, maxReviewLoad: 5.0, maxStudyLoad: 5.0 },
}

const REVIEW_LOAD_BY_SCORE = {
  20: 1.4,
  50: 1,
  80: 0.7,
  100: 0.5,
}

function getTaskScheduledDate(task) {
  return task.manualScheduledDate || task.scheduledDate || task.date
}

function isReviewTask(task) {
  return task.type !== 'new'
}

function getLatestPriorRecallScore(task, tasks) {
  const priorResults = tasks
    .filter(
      (candidate) =>
        candidate.id !== task.id &&
        candidate.itemId === task.itemId &&
        candidate.status === 'done' &&
        isReviewTask(candidate) &&
        candidate.recallScore !== null &&
        candidate.recallScore !== undefined &&
        compareDateKey(getTaskScheduledDate(candidate), task.date) <= 0,
    )
    .sort((a, b) => {
      const dateCompare = compareDateKey(getTaskScheduledDate(b), getTaskScheduledDate(a))
      return dateCompare || b.id.localeCompare(a.id)
    })

  return priorResults[0]?.recallScore ?? null
}

export function getScheduleCapacity(rawSettings = {}) {
  const modeCapacity = STUDY_MODE_CAPACITY[rawSettings?.reviewLoadLevel] || STUDY_MODE_CAPACITY.standard
  const maxReviewTasks = modeCapacity.maxReviewTasks
  const maxReviewLoad = modeCapacity.maxReviewLoad

  return {
    maxReviewTasks,
    maxReviewLoad,
    maxStudyTasks: Math.max(DAILY_MAX_STUDY_TASKS, maxReviewTasks + 1),
    maxStudyLoad: modeCapacity.maxStudyLoad,
    maxBacklogPerDay: maxReviewTasks,
  }
}

export function getReviewTaskLoad(task, tasks = []) {
  const score = Number(getLatestPriorRecallScore(task, tasks))
  return REVIEW_LOAD_BY_SCORE[score] || 1
}

export function getNewTaskLoad(task) {
  return getEstimatedDifficultyLoad(task.estimatedDifficulty)
}
