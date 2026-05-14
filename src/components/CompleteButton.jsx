function CompleteButton({ done, disabled = false, onClick, label = '完成任务' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={disabled && !done ? '只能完成今天及以前的任务' : label}
      onClick={onClick}
      disabled={disabled && !done}
      className={[
        'h-7 w-7 shrink-0 rounded-full border-2 transition',
        done
          ? 'border-red-500 bg-red-500 hover:border-red-600 hover:bg-red-600'
          : disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'
            : 'border-slate-300 bg-transparent hover:border-red-400 hover:bg-red-50',
      ].join(' ')}
    />
  )
}

export default CompleteButton
