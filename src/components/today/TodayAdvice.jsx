function TodayAdvice({ pendingCount, newCount, reviewCount, totalLoad, loadLimit }) {
  const loadState = totalLoad > loadLimit ? '偏满' : totalLoad >= loadLimit * 0.75 ? '适中' : '轻松'
  const suggestions = [
    newCount > 0 ? '先完成新背任务，再进行复习巩固。' : '今天没有新背任务，可以专心复习旧内容。',
    reviewCount > 0 ? '复习时按掌握程度打分，后续节奏会更准。' : '复习压力很轻，可以保持一点余量。',
    loadState === '偏满' ? '今天负载偏高，完成核心任务就很好。' : '今日负载适中，稳步推进效果更佳。',
  ]

  if (pendingCount === 0) {
    suggestions[0] = '今天任务已经完成，可以轻松收尾。'
  }

  return (
    <section className="shrink-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">◇</span>
        <h2 className="text-base font-semibold text-slate-950">今日建议</h2>
      </div>
      <div className="mt-4 space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion} className="flex gap-3 text-sm leading-5 text-slate-600">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-[11px] font-semibold text-red-500">
              {index + 1}
            </span>
            <p>{suggestion}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TodayAdvice
