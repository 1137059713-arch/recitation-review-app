function TaskChip({ task }) {
  return (
    <div className="flex max-w-full min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
      <span className={`h-2 w-2 shrink-0 rounded-full ${task.tone.dotClass}`} />
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${task.tone.chipClass}`}>
        {task.tone.label}
      </span>
      <span className="max-w-56 truncate text-sm font-semibold text-slate-900">
        {task.item?.title || '已删除内容'}
      </span>
      {task.group && (
        <span className="hidden max-w-24 shrink-0 truncate text-xs font-medium text-slate-400 xl:inline">
          {task.group.name}
        </span>
      )}
    </div>
  )
}

export default TaskChip
