import { DEFAULT_REVIEW_END_DAY, normalizeReviewEndDay } from './schedule.js'

export const GROUP_COLORS = [
  { name: '蓝色', value: '#2563eb' },
  { name: '绿色', value: '#16a34a' },
  { name: '紫色', value: '#7c3aed' },
  { name: '红色', value: '#dc2626' },
  { name: '橙色', value: '#ea580c' },
  { name: '青色', value: '#0891b2' },
]

export const DEFAULT_GROUP_COLOR = GROUP_COLORS[0].value

export function normalizeGroup(group) {
  return {
    ...group,
    color: group?.color || DEFAULT_GROUP_COLOR,
    isPinned: Boolean(group?.isPinned),
    progressEnabled: Boolean(group?.progressEnabled),
    totalChapters: Number(group?.totalChapters) > 0 ? Number(group.totalChapters) : 0,
    reviewEndDay: normalizeReviewEndDay(group?.reviewEndDay ?? DEFAULT_REVIEW_END_DAY),
  }
}

function toChineseNumber(number) {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  const value = Number(number)

  if (value <= 10) {
    return value === 10 ? '十' : digits[value]
  }

  if (value < 20) {
    return `十${digits[value % 10]}`
  }

  if (value < 100) {
    const tens = Math.floor(value / 10)
    const ones = value % 10
    return `${digits[tens]}十${ones === 0 ? '' : digits[ones]}`
  }

  return String(value)
}

export function createChapterTitle(chapterNumber) {
  return `第${toChineseNumber(chapterNumber)}章`
}

export function getChapterOptions(totalChapters) {
  return Array.from({ length: Number(totalChapters) || 0 }, (_item, index) => ({
    value: createChapterTitle(index + 1),
    label: createChapterTitle(index + 1),
  }))
}

export function sortGroups(groups) {
  return [...groups].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1
    }

    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

export function getGroupColor(group) {
  return group?.color || DEFAULT_GROUP_COLOR
}
