export const DEFAULT_ESTIMATED_DIFFICULTY = 2

export const ESTIMATED_DIFFICULTY_OPTIONS = [
  { value: 1, label: '简单', load: 0.8 },
  { value: 2, label: '正常', load: 1 },
  { value: 3, label: '较难', load: 1.25 },
  { value: 4, label: '很难', load: 1.5 },
]

export function normalizeEstimatedDifficulty(value) {
  const difficulty = Number(value)
  return ESTIMATED_DIFFICULTY_OPTIONS.some((option) => option.value === difficulty)
    ? difficulty
    : DEFAULT_ESTIMATED_DIFFICULTY
}

export function getEstimatedDifficultyOption(value) {
  const difficulty = normalizeEstimatedDifficulty(value)
  return ESTIMATED_DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)
}

export function getEstimatedDifficultyLoad(value) {
  return getEstimatedDifficultyOption(value).load
}
