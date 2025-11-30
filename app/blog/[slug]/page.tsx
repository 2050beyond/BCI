import { notFound } from 'next/navigation';
import Image from 'next/image';
import { StructuredText, Image as DatoImage } from 'react-datocms';
import { getPostBySlug, getAllPostSlugs, QuoteRecord, ImageBlockRecord } from '@/lib/datocms';

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12">
        <time className="text-sm text-gray-600 mb-4 block font-sans">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <h1 className="text-5xl font-bold tracking-tight mb-8 text-gray-900 font-sans">
          {post.title}
        </h1>
        {post.coverImage && (
          <div className="relative w-full h-96 mb-12 rounded-lg overflow-hidden">
            <Image
              src={post.coverImage.url}
              alt={post.coverImage.alt || post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
          </div>
        )}
      </header>

      <div className="prose prose-lg prose-slate max-w-none mx-auto font-serif">
        <StructuredText
          data={post.content}
          renderBlock={({ record }) => {
            // Safety check - never crash
            if (!record || !record.__typename) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Unknown block type encountered:', record);
              }
              return null;
            }

            // Switch statement for block types
            switch (record.__typename) {
              case 'QuoteRecord': {
                const quote = record as QuoteRecord;
                return (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-4 my-8 italic text-gray-700 not-prose">
                    <p className="text-xl mb-2">"{quote.text || ''}"</p>
                    {quote.author && (
                      <cite className="text-sm not-italic text-gray-600 font-medium">
                        — {quote.author}
                      </cite>
                    )}
                  </blockquote>
                );
              }

              case 'ImageBlockRecord': {
                const imageBlock = record as ImageBlockRecord;
                if (imageBlock.image?.responsiveImage) {
                  return (
                    <figure className="my-8 not-prose">
                      <DatoImage
                        data={imageBlock.image.responsiveImage}
                        className="rounded-lg"
                      />
                    </figure>
                  );
                }
                // Fallback if responsiveImage is missing
                if (process.env.NODE_ENV === 'development') {
                  console.warn('ImageBlockRecord missing responsiveImage:', imageBlock);
                }
                return null;
              }

              default: {
                // Forgiving: log warning but don't crash
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Unhandled block type:', record.__typename, record);
                }
                return null;
              }
            }
          }}
        />
      </div>
    </article>
  );
}
