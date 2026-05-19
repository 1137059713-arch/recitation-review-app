function AppIcon({ name, className = '' }) {
  const baseClass = ['h-4 w-4', className].join(' ')

  if (name === 'today') {
    return (
      <span className={baseClass}>
        <span className="block h-full w-full rounded-[4px] border-2 border-current">
          <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-sm bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'clock') {
    return (
      <span className={baseClass}>
        <span className="relative block h-full w-full rounded-full border-2 border-current">
          <span className="absolute left-1/2 top-1/2 h-1.5 w-px -translate-x-1/2 -translate-y-full bg-current" />
          <span className="absolute left-1/2 top-1/2 h-px w-1.5 -translate-y-1/2 bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'grid') {
    return (
      <span className={`${baseClass} grid grid-cols-2 gap-0.5`}>
        <span className="rounded-[3px] border border-current" />
        <span className="rounded-[3px] border border-current" />
        <span className="rounded-[3px] border border-current" />
        <span className="rounded-[3px] border border-current" />
      </span>
    )
  }

  if (name === 'weak') {
    return (
      <span className={baseClass}>
        <span className="block h-full w-full rounded-[4px] border-2 border-current">
          <span className="mx-1 mt-1.5 block h-px rotate-[-18deg] bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'book') {
    return (
      <span className={baseClass}>
        <span className="block h-full w-full rounded-[3px] border-2 border-current">
          <span className="ml-1 mt-1 block h-2 w-px bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'list') {
    return (
      <span className={baseClass}>
        <span className="block h-full w-full rounded-[4px] border-2 border-current p-0.5">
          <span className="mt-0.5 block h-px bg-current" />
          <span className="mt-1 block h-px bg-current" />
          <span className="mt-1 block h-px bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'settings') {
    return (
      <span className={baseClass}>
        <span className="relative block h-full w-full rounded-full border-2 border-current">
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
        </span>
      </span>
    )
  }

  return (
    <span className={baseClass}>
      <span className="block h-full w-full rounded-[4px] border-2 border-current">
        <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-sm bg-current" />
      </span>
    </span>
  )
}

export default AppIcon
