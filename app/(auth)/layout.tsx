export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-gray-900">⭐ Review Manager</p>
          <p className="text-sm text-gray-500 mt-1">Google · TripAdvisor · TrustPilot</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
