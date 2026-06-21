import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import { getBlogPosts } from '@/lib/api';
import PageBanner from '@/components/layout/PageBanner';

export const metadata: Metadata = buildMetadata({
  title: 'Blog de Viajes',
  description: 'Descubre consejos, guías y noticias del mundo de los viajes. Inspiración para tus próximas aventuras.',
  path: '/blog',
});

// SSG
export const dynamic = 'force-static';

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <PageBanner
        title="Blog de Viajes"
        subtitle="Consejos, guías e inspiración para tus viajes"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Blog' }]}
      />

      <section className="py-14">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa fa-wordpress" style={{ fontSize: 48, color: '#e5e5e5', display: 'block', marginBottom: 16 }} />
              <h2 className="text-xl font-bold text-gray-400">No hay artículos publicados todavía</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300">
                  <Link href={`/blog/${post.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.cover_image || '/img/blog-banner.png'}
                      alt={post.title}
                      className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/img/blog-banner.png'; }}
                    />
                  </Link>
                  <div className="p-5">
                    <Link href={`/blog/${post.id}`}>
                      <h2 className="font-bold text-gray-800 text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                    <Link href={`/blog/${post.id}`} className="text-primary text-sm font-semibold hover:underline">
                      Leer más →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
