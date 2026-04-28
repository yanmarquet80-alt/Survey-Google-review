interface TutorialStep {
  icon: string
  label: string
}

interface PageHeaderProps {
  title: string
  description: string
  badge?: React.ReactNode
  tutorial?: TutorialStep[]
}

export function PageHeader({ title, description, badge, tutorial }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {badge}
      </div>
      <p className="text-gray-500 mt-1 text-sm">{description}</p>
      {tutorial && tutorial.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-1">Que faire ?</span>
          {tutorial.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300 text-xs">→</span>}
              <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-600 shadow-sm">
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
