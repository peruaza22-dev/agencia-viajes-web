import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import { getBlogPosts, getBlogPost } from '@/lib/api';
import PageBanner from '@/components/layout/PageBanner';

// SSG con lista de artículos conocidos en build time
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getBlogPost(params.id);
  if (!post) return buildMetadata({ title: 'Artículo no encontrado', description: '', path: '/blog' });

  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    image: post.cover_image,
    path: `/blog/${params.id}`,
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getBlogPost(params.id);
  if (!post) notFound();

  return (
    <>
      <PageBanner
        title={post.title}
        bgImage={post.cover_image}
        breadcrumbs={[
          { to: '/', icon: 'fa-home', label: 'Inicio' },
          { to: '/blog', label: 'Blog' },
          { label: post.title },
        ]}
      />

      <section className="py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="bg-white rounded-xl shadow p-8">
            <h1 className="text-3xl font-bold font-poppins text-gray-800 mb-6">
              {post.title}
            </h1>
            {post.cover_image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full rounded-lg mb-8 object-cover max-h-80"
              />
            )}
            {/* Contenido indexable por Google — en el HTML del servidor */}
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </div>
      </section>
    </>
  );
}
