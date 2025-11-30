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

export async function getAllPosts() {
  const query = `
    query AllPosts {
      allPosts(orderBy: date_DESC, first: 4) {
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

  const data = await client.request(query);
  return data.allPosts;
}

export async function getPostBySlug(slug) {
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
              id
              text
              author
            }
          }
        }
      }
    }
  `;

  const data = await client.request(query, { slug });
  return data.post;
}

export async function getAllPostSlugs() {
  const query = `
    query AllPostSlugs {
      allPosts {
        slug
      }
    }
  `;

  const data = await client.request(query);
  return data.allPosts.map((post) => post.slug);
}

