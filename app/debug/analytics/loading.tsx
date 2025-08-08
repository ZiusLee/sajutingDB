export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mx-auto"></div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
            <div className="space-y-2 bg-gray-100 p-4 rounded-lg">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
