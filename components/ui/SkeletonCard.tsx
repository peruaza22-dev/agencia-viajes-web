'use client';

/** SkeletonCard — placeholder animado mientras cargan datos de API */
export function SkeletonCard({ lines=3, hasImage=true }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
      {hasImage && <div className="h-48 bg-gray-200"/>}
      <div className="p-4 space-y-3">
        {Array.from({length:lines}).map((_,i)=>(
          <div key={i} className={`h-3 bg-gray-200 rounded ${i===0?'w-3/4':i===lines-1?'w-1/2':'w-full'}`}/>
        ))}
      </div>
    </div>
  )
}

export function SkeletonRow({ lines=3 }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4 animate-pulse">
      <div className="w-40 h-28 bg-gray-200 rounded-lg flex-shrink-0"/>
      <div className="flex-1 space-y-3">
        {Array.from({length:lines}).map((_,i)=>(
          <div key={i} className={`h-3 bg-gray-200 rounded ${i===0?'w-2/3':i===lines-1?'w-1/3':'w-full'}`}/>
        ))}
      </div>
      <div className="w-24 space-y-2 flex-shrink-0">
        <div className="h-8 bg-gray-200 rounded"/>
        <div className="h-8 bg-gray-200 rounded"/>
      </div>
    </div>
  )
}
