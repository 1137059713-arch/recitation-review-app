import TaskCard from './TaskCard.jsx'

function TaskSection({
  title,
  tasks,
  itemsById,
  groupsById,
  onComplete,
  onUpdateItem,
  onDeleteItem,
  emptyText,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {tasks.length} 项
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const item = itemsById.get(task.itemId)
            return (
              <TaskCard
                key={task.id}
                task={task}
                item={item}
                groupName={item?.groupId ? groupsById?.get(item.groupId)?.name : ''}
                onComplete={onComplete}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export default TaskSection
