import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/datocms';

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4 font-sans">Laser Knife Blog</h1>
        <p className="text-gray-600 font-sans">Minimal. Forgiving. Rich.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {post.coverImage && (
              <div className="relative w-full h-64 border-b border-gray-200">
                <Image
                  src={post.coverImage.url}
                  alt={post.coverImage.alt || post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
            <div className="p-6">
              <time className="text-xs text-gray-500 uppercase tracking-wide font-sans">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <h2 className="text-2xl font-bold mt-2 mb-4 group-hover:text-blue-600 transition-colors font-sans">
                {post.title}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
