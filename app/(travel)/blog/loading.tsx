export default function BlogLoading() {
  return (
    <div className="py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow animate-skeleton">
              <div className="w-full h-48 bg-gray-200" />
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
