export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse motion-safe:animate-pulse">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-card h-24" />
        ))}
      </div>

      {/* Chart */}
      <div className="bg-gray-100 rounded-card h-48" />

      {/* Two column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-card h-40" />
        <div className="bg-gray-100 rounded-card h-40" />
      </div>
    </div>
  )
}
