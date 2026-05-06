export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
          <div className="h-5 w-24 rounded bg-gray-700" />
          <div className="h-9 w-2/3 rounded bg-gray-700" />
          <div className="h-4 w-full max-w-xl rounded bg-gray-700" />
          <div className="h-4 w-3/4 max-w-lg rounded bg-gray-700" />
          <div className="mt-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-700" />
            <div className="h-4 w-32 rounded bg-gray-700" />
          </div>
          <div className="mt-6 flex gap-3">
            <div className="h-10 w-36 rounded-lg bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-6 w-40 rounded bg-gray-200" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-48 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
                <div className="space-y-2 pl-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-gray-200" />
                      <div className="h-3 w-48 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="card p-6 space-y-4">
              <div className="h-6 w-24 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-200" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-gray-200" />
                  <div className="h-3 w-40 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
