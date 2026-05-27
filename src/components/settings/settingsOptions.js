export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const STUDY_MODE_OPTIONS = [
  {
    value: 'light',
    label: '新背',
    title: '新背模式',
    description: '少排旧内容，给新背留空间。',
    tendency: '新背',
    workload: '约 2 条复习，适合再加 1 条新背',
    backlog: '有明显余量时再补积压',
    note: '适合刚开始推进新章节，或者今天想轻一点。',
  },
  {
    value: 'standard',
    label: '均衡',
    title: '均衡模式',
    description: '新背和复习都兼顾。',
    tendency: '均衡',
    workload: '约 3 条复习，搭配 1 条新背比较稳',
    backlog: '有剩余容量时自动补回',
    note: '适合作为长期默认节奏，压力和推进速度都比较稳。',
  },
  {
    value: 'strong',
    label: '复习',
    title: '复习模式',
    description: '优先清复习和逾期，不特意给新背留空间。',
    tendency: '复习',
    workload: '约 4 条复习，优先处理旧内容',
    backlog: '优先消化积压任务',
    note: '适合复习堆起来的时候，用几天把节奏拉回来。',
  },
]
