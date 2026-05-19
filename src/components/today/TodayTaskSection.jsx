import TodayTaskRow from './TodayTaskRow.jsx'

function TodayTaskSection({
  title,
  count,
  tone = 'emerald',
  tasks,
  itemsById,
  groupsById,
  onComplete,
  load,
  loadLimit,
  action,
  emptyText,
}) {
  const toneClass = tone === 'violet' ? 'text-violet-600' : 'text-emerald-600'
  const iconClass = tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClass}`}>
            {tone === 'violet' ? '复' : '新'}
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
        <div className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        tasks.map((task, index) => {
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
            />
          )
        })
      )}
      {action && <div className="border-t border-slate-100 px-4 py-3">{action}</div>}
    </section>
  )
}

export default TodayTaskSection
