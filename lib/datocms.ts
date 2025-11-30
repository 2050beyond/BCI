import { GraphQLClient } from 'graphql-request';

const API_URL = 'https://graphql.datocms.com/';
const API_TOKEN = process.env.NEXT_PUBLIC_DATOCMS_API_TOKEN;

if (!API_TOKEN) {
  throw new Error('NEXT_PUBLIC_DATOCMS_API_TOKEN is not set');
}

const client = new GraphQLClient(API_URL, {
  headers: {
    authorization: `Bearer ${API_TOKEN}`,
  },
});

export interface CoverImage {
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

export interface QuoteRecord {
  __typename: 'QuoteRecord';
  id: string;
  text: string;
  author: string | null;
}

export interface ImageBlockRecord {
  __typename: 'ImageBlockRecord';
  id: string;
  image: {
    responsiveImage: {
      srcSet: string;
      webpSrcSet: string;
      sizes: string;
      src: string;
      width: number;
      height: number;
      aspectRatio: number;
      alt: string | null;
      title: string | null;
      base64: string | null;
    };
  };
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  date: string;
  coverImage: CoverImage | null;
  content: {
    value: any;
    blocks?: (QuoteRecord | ImageBlockRecord)[];
  };
}

export interface PostPreview {
  id: string;
  title: string;
  slug: string;
  date: string;
  coverImage: CoverImage | null;
}

async function performRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
    const data = await client.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

export async function getAllPosts(): Promise<PostPreview[]> {
  const query = `
    query AllPosts {
      allPosts(orderBy: date_DESC, first: 10) {
        id
        title
        slug
        date
        coverImage {
          url
          alt
        }
      }
    }
  `;

  const data = await performRequest<{ allPosts: PostPreview[] }>(query);
  return data.allPosts;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const query = `
    query PostBySlug($slug: String!) {
      post(filter: { slug: { eq: $slug } }) {
        id
        title
        slug
        date
        coverImage {
          url
          alt
          width
          height
        }
        content {
          value
          blocks {
            ... on QuoteRecord {
              __typename
              id
              text
              author
            }
          }
        }
      }
    }
  `;

  const data = await performRequest<{ post: Post | null }>(query, { slug });
  return data.post;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const query = `
    query AllPostSlugs {
      allPosts {
        slug
      }
    }
  `;

  const data = await performRequest<{ allPosts: { slug: string }[] }>(query);
  return data.allPosts.map((post) => post.slug);
}

