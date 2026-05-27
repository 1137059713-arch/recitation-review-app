export const MASTERY_OPTIONS = [
  { score: 20, label: '20%', status: '薄弱', tone: 'red' },
  { score: 50, label: '50%', status: '需关注', tone: 'amber' },
  { score: 80, label: '80%', status: '基本掌握', tone: 'blue' },
  { score: 100, label: '100%', status: '熟练', tone: 'green' },
]

const MASTERY_WEIGHTS = [0.5, 0.3, 0.2]

export function getMasteryOption(score) {
  return MASTERY_OPTIONS.find((option) => option.score === Number(score)) || null
}

export function getReviewResults(tasks = []) {
  return [...tasks]
    .filter((task) => task.type !== 'new' && task.recallScore !== null && task.recallScore !== undefined)
    .sort((a, b) => {
      const dateCompare = (b.scheduledDate || b.date).localeCompare(a.scheduledDate || a.date)
      return dateCompare || b.id.localeCompare(a.id)
    })
}

export function getReviewCount(tasks = []) {
  return getReviewResults(tasks).length
}

export function getLatestReviewResult(tasks = []) {
  return getReviewResults(tasks)[0] || null
}

function getMasteryStatusByScore(score) {
  if (score < 40) return { status: '薄弱', tone: 'red' }
  if (score < 70) return { status: '需关注', tone: 'amber' }
  if (score < 90) return { status: '基本掌握', tone: 'blue' }
  return { status: '熟练', tone: 'green' }
}

export function getItemMastery(tasks = []) {
  const reviewResults = getReviewResults(tasks)
  const recentResults = reviewResults.slice(0, 3)
  const latestReview = recentResults[0] || null

  if (!latestReview) {
    return {
      latestReview: null,
      recentResults: [],
      option: null,
      status: '未复习',
      score: null,
      tone: 'slate',
    }
  }

  const totalWeight = recentResults.reduce(
    (sum, _task, index) => sum + MASTERY_WEIGHTS[index],
    0,
  )
  const weightedScore = Math.round(
    recentResults.reduce(
      (sum, task, index) => sum + Number(task.recallScore) * MASTERY_WEIGHTS[index],
      0,
    ) / totalWeight,
  )
  const cappedScore = Number(latestReview.recallScore) === 20
    ? Math.min(weightedScore, 69)
    : weightedScore
  const statusResult = getMasteryStatusByScore(cappedScore)

  return {
    latestReview,
    recentResults,
    option: getMasteryOption(latestReview.recallScore),
    status: statusResult.status,
    score: cappedScore,
    tone: statusResult.tone,
  }
}

export function isWeakMastery(mastery) {
  return mastery?.score === 20 || mastery?.score === 50
}
