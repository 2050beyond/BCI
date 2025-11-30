import { Client } from '@datocms/cma-client-node';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (error) {
  console.error('Error reading .env.local file. Make sure it exists and contains DATOCMS_MANAGEMENT_API_TOKEN');
  process.exit(1);
}

const managementToken = process.env.DATOCMS_MANAGEMENT_API_TOKEN || envVars.DATOCMS_MANAGEMENT_API_TOKEN;
const environment = process.env.DATOCMS_ENVIRONMENT || envVars.DATOCMS_ENVIRONMENT || 'main';

if (!managementToken) {
  console.error('DATOCMS_MANAGEMENT_API_TOKEN is required. Set it in .env.local or as an environment variable.');
  process.exit(1);
}

const client = new Client({ apiToken: managementToken });

async function createPostModel() {
  console.log('Creating Post model...');

  // Check if model already exists
  const existingModels = await client.itemTypes.list();
  let postModel = existingModels.find(m => m.api_key === 'post');

  if (postModel) {
    console.log('Post model already exists. Checking fields...');
    // Check if content field exists
    const fields = await client.fields.list(postModel.id);
    const hasContentField = fields.some(f => f.api_key === 'content');
    
    if (!hasContentField) {
      console.log('Content field missing. Creating it now...');
      // Create Pull Quote block model first if it doesn't exist
      let pullQuoteBlock = existingModels.find(m => m.api_key === 'pull_quote');
      if (!pullQuoteBlock) {
        pullQuoteBlock = await client.itemTypes.create({
          name: 'Pull Quote',
          api_key: 'pull_quote',
          singleton: false,
          modular_block: true,
          sortable: false,
          tree: false,
          ordering_direction: null,
          ordering_meta: null,
          draft_mode_active: false,
          all_locales_required: false,
        });

        await client.fields.create(pullQuoteBlock.id, {
          label: 'Quote',
          field_type: 'text',
          api_key: 'quote',
          validators: { required: {} },
          localized: false,
          position: 1,
        });

        await client.fields.create(pullQuoteBlock.id, {
          label: 'Author',
          field_type: 'string',
          api_key: 'author',
          validators: {},
          localized: false,
          position: 2,
        });
      }
      
      // Create content field
      await client.fields.create(postModel.id, {
        label: 'Content',
        field_type: 'structured_text',
        api_key: 'content',
        validators: {
          structured_text_blocks: {
            item_types: [pullQuoteBlock.id],
          },
          structured_text_links: {
            item_types: [],
          },
        },
        localized: false,
        position: 5,
      });
      console.log('Content field created!');
    }
    return postModel;
  }

  // Create the Post model
  const model = await client.itemTypes.create({
    name: 'Post',
    api_key: 'post',
    singleton: false,
    modular_block: false,
    sortable: false,
    tree: false,
    ordering_direction: null,
    ordering_meta: null,
    draft_mode_active: false,
    all_locales_required: false,
    collection_appeareance: 'table',
    collection_appearance: 'table',
  });

  // Create fields
  const titleField = await client.fields.create(model.id, {
    label: 'Title',
    field_type: 'string',
    api_key: 'title',
    validators: { required: {} },
    localized: false,
    position: 1,
  });

  const slugField = await client.fields.create(model.id, {
    label: 'Slug',
    field_type: 'slug',
    api_key: 'slug',
    validators: { required: {}, slug_title_field: { title_field_id: titleField.id } },
    localized: false,
    position: 2,
  });

  const coverImageField = await client.fields.create(model.id, {
    label: 'Cover Image',
    field_type: 'file',
    api_key: 'cover_image',
    validators: {},
    localized: false,
    position: 3,
  });

  const dateField = await client.fields.create(model.id, {
    label: 'Date',
    field_type: 'date',
    api_key: 'date',
    validators: { required: {} },
    localized: false,
    position: 4,
  });

  // Create Pull Quote block model first
  const pullQuoteBlock = await client.itemTypes.create({
    name: 'Pull Quote',
    api_key: 'pull_quote',
    singleton: false,
    modular_block: true,
    sortable: false,
    tree: false,
    ordering_direction: null,
    ordering_meta: null,
    draft_mode_active: false,
    all_locales_required: false,
  });

  await client.fields.create(pullQuoteBlock.id, {
    label: 'Quote',
    field_type: 'text',
    api_key: 'quote',
    validators: { required: {} },
    localized: false,
    position: 1,
  });

  await client.fields.create(pullQuoteBlock.id, {
    label: 'Author',
    field_type: 'string',
    api_key: 'author',
    validators: {},
    localized: false,
    position: 2,
  });

  // Create Structured Text field with blocks
  // Note: Image and video blocks are available by default, we only need to specify custom blocks
  const structuredTextField = await client.fields.create(model.id, {
    label: 'Content',
    field_type: 'structured_text',
    api_key: 'content',
    validators: {
      structured_text_blocks: {
        item_types: [pullQuoteBlock.id],
      },
      structured_text_links: {
        item_types: [],
      },
    },
    localized: false,
    position: 5,
  });

  console.log('Post model created successfully!');
  return model;
}

async function createDummyPosts() {
  console.log('Creating dummy blog posts...');

  const dummyPosts = [
    {
      title: 'The Future of Minimalist Design',
      slug: 'future-of-minimalist-design',
      date: '2024-01-15',
      content: {
        schema: 'dast',
        document: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Minimalist design has evolved beyond simple aesthetics. It represents a philosophy of intentional reduction, where every element serves a purpose. In the digital age, this approach has become more relevant than ever.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The key principles remain constant: clarity, functionality, and purpose. However, the tools and techniques have advanced significantly, allowing designers to create experiences that are both minimal and rich.',
                },
              ],
            },
          ],
        },
      },
    },
    {
      title: 'Building High-Performance Web Applications',
      slug: 'building-high-performance-web-applications',
      date: '2024-01-10',
      content: {
        schema: 'dast',
        document: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Performance is not an afterthought—it\'s a fundamental requirement. Modern web applications must load quickly, respond instantly, and provide smooth interactions regardless of device or connection speed.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'This requires a holistic approach: optimizing assets, leveraging caching strategies, and writing efficient code. The result is an application that feels native, even when running in a browser.',
                },
              ],
            },
          ],
        },
      },
    },
    {
      title: 'The Art of Brutalist Typography',
      slug: 'art-of-brutalist-typography',
      date: '2024-01-05',
      content: {
        schema: 'dast',
        document: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Brutalist typography rejects decoration in favor of raw, honest communication. It\'s about making text that demands attention through weight, scale, and contrast—not through ornamentation.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'This approach has found new life in digital design, where clarity and impact are paramount. By stripping away the unnecessary, we reveal the essential message.',
                },
              ],
            },
          ],
        },
      },
    },
    {
      title: 'Headless CMS: Architecture and Benefits',
      slug: 'headless-cms-architecture-benefits',
      date: '2024-01-01',
      content: {
        schema: 'dast',
        document: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Headless CMS architecture separates content management from presentation, providing unprecedented flexibility. Content creators work in familiar interfaces while developers build experiences using their preferred technologies.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'This decoupling enables true omnichannel publishing, where the same content powers websites, mobile apps, and emerging platforms without duplication or compromise.',
                },
              ],
            },
          ],
        },
      },
    },
    {
      title: 'Next.js 14: App Router Deep Dive',
      slug: 'nextjs-14-app-router-deep-dive',
      date: '2023-12-28',
      content: {
        schema: 'dast',
        document: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The App Router in Next.js 14 represents a fundamental shift in how we think about React applications. Server Components, streaming, and built-in data fetching create a new paradigm for web development.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Understanding these concepts is crucial for building modern, performant applications. The learning curve is worth it—the results speak for themselves.',
                },
              ],
            },
          ],
        },
      },
    },
  ];

  // Get the post model
  const models = await client.itemTypes.list();
  const postModel = models.find(m => m.api_key === 'post');

  if (!postModel) {
    throw new Error('Post model not found. Please run the model creation first.');
  }

  // Get fields to check what exists
  const fields = await client.fields.list(postModel.id);
  console.log('Available fields:', fields.map(f => f.api_key).join(', '));

  for (const post of dummyPosts) {
    try {
      // Create post with only basic fields first, skip content if field doesn't exist
      const postData = {
        item_type: { type: 'item_type', id: postModel.id },
        title: post.title,
        slug: post.slug,
        date: post.date,
      };
      
      // Only add content if the field exists
      const contentField = fields.find(f => f.api_key === 'content');
      if (contentField) {
        postData.content = post.content;
      }
      
      await client.items.create(postData);
      console.log(`Created post: ${post.title}`);
    } catch (error) {
      console.error(`Error creating post ${post.title}:`, error.message);
      if (error.response?.body) {
        console.error('Error details:', JSON.stringify(error.response.body, null, 2));
      }
    }
  }

  console.log('Dummy posts created!');
}

async function main() {
  try {
    console.log('Starting DatoCMS setup...\n');
    
    const model = await createPostModel();
    
    // Wait a bit for the model to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createDummyPosts();
    
    console.log('\n✅ Setup complete! Your DatoCMS project is ready.');
    console.log('\nNext steps:');
    console.log('1. Upload cover images for your posts in the DatoCMS dashboard');
    console.log('2. Make sure NEXT_PUBLIC_DATOCMS_API_TOKEN is set in .env.local');
    console.log('3. Run `npm run dev` to start your Next.js app');
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

main();

