export default function VacacionesLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-skeleton">
            <div className="w-full h-48 bg-gray-200" />
            <div className="p-5">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-3 bg-gray-200 rounded mb-2 w-1/2" />
              <div className="h-8 bg-gray-200 rounded mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
