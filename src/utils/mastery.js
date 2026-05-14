export const MASTERY_OPTIONS = [
  { score: 20, label: '20%', status: '薄弱', tone: 'red' },
  { score: 50, label: '50%', status: '需关注', tone: 'amber' },
  { score: 80, label: '80%', status: '基本掌握', tone: 'blue' },
  { score: 100, label: '100%', status: '熟练', tone: 'green' },
]

export function getMasteryOption(score) {
  return MASTERY_OPTIONS.find((option) => option.score === Number(score)) || null
}

export function getLatestReviewResult(tasks = []) {
  return [...tasks]
    .filter((task) => task.type !== 'new' && task.recallScore !== null && task.recallScore !== undefined)
    .sort((a, b) => {
      const dateCompare = (b.scheduledDate || b.date).localeCompare(a.scheduledDate || a.date)
      return dateCompare || b.id.localeCompare(a.id)
    })[0] || null
}

export function getItemMastery(tasks = []) {
  const latestReview = getLatestReviewResult(tasks)
  const option = latestReview ? getMasteryOption(latestReview.recallScore) : null

  return {
    latestReview,
    option,
    status: option?.status || '未复习',
    score: option?.score || null,
    tone: option?.tone || 'slate',
  }
}

export function isWeakMastery(mastery) {
  return mastery?.score === 20 || mastery?.score === 50
}
