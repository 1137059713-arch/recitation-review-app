import TodayTaskRow from './TodayTaskRow.jsx'

function TodayTaskSection({
  className = '',
  title,
  count,
  tone = 'emerald',
  tasks,
  itemsById,
  groupsById,
  onComplete,
  onDeleteItem,
  load,
  loadLimit,
  action,
  emptyText,
}) {
  const toneClass = tone === 'violet' ? 'text-violet-600' : 'text-emerald-600'
  const iconClass = tone === 'violet'
    ? 'border-violet-100 bg-violet-50 text-violet-600'
    : 'border-emerald-100 bg-emerald-50 text-emerald-600'
  const icon = tone === 'violet' ? '▤' : '▥'

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="shrink-0 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-md border text-sm ${iconClass}`}>
            {icon}
          </span>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <span className={`text-base font-semibold ${toneClass}`}>{count}</span>
        </div>
        <div className="flex items-center gap-3">
          {typeof load === 'number' && (
            <span className="text-sm font-semibold text-slate-500">
              预计负载 <span className={toneClass}>{load.toFixed(1)}</span>
              {loadLimit ? ` / ${loadLimit.toFixed(1)}` : ''}
            </span>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="no-scrollbar mx-3 mb-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-200">
          {tasks.map((task, index) => {
            const item = itemsById.get(task.itemId)
            const groupName = item?.groupId ? groupsById?.get(item.groupId)?.name : ''

            return (
              <TodayTaskRow
                key={task.id}
                index={index + 1}
                task={task}
                item={item}
                groupName={groupName}
                onComplete={onComplete}
                onDeleteItem={onDeleteItem}
              />
            )
          })}
        </div>
      )}
      {action && <div className="shrink-0 border-t border-slate-100 px-4 py-3">{action}</div>}
    </section>
  )
}

export default TodayTaskSection
