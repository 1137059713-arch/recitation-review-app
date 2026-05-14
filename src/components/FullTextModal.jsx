function FullTextModal({ title, body, onClose }) {
  if (!body) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-500">正文全文</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">{body}</p>
        </div>
      </div>
    </div>
  )
}

export default FullTextModal
