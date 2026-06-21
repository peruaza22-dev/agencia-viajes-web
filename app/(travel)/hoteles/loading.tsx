export default function HotelesLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div className="flex gap-6">
        <div className="w-52 flex-shrink-0">
          <div className="bg-gray-100 rounded-xl h-64 animate-skeleton" />
        </div>
        <div className="flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 mb-4 flex gap-4 animate-skeleton">
              <div className="w-40 h-32 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-3 w-2/3" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
