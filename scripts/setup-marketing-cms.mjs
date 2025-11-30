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

async function createQuoteBlock() {
  console.log('Creating Quote block model...');

  const existingModels = await client.itemTypes.list();
  let quoteBlock = existingModels.find(m => m.api_key === 'quote');

  if (!quoteBlock) {
    quoteBlock = await client.itemTypes.create({
      name: 'Quote',
      api_key: 'quote',
      singleton: false,
      modular_block: true,
      sortable: false,
      tree: false,
      ordering_direction: null,
      ordering_meta: null,
      draft_mode_active: false,
      all_locales_required: false,
    });

    await client.fields.create(quoteBlock.id, {
      label: 'Text',
      field_type: 'text',
      api_key: 'text',
      validators: { required: {} },
      localized: false,
      position: 1,
    });

    await client.fields.create(quoteBlock.id, {
      label: 'Author',
      field_type: 'string',
      api_key: 'author',
      validators: {},
      localized: false,
      position: 2,
    });
    console.log('✓ Quote block created');
  } else {
    console.log('✓ Quote block already exists');
  }

  return quoteBlock;
}

async function updatePostModel(quoteBlock) {
  console.log('Updating Post model...');

  const existingModels = await client.itemTypes.list();
  const postModel = existingModels.find(m => m.api_key === 'post');

  if (!postModel) {
    throw new Error('Post model not found. Please run the initial setup first.');
  }

  const fields = await client.fields.list(postModel.id);
  const contentField = fields.find(f => f.api_key === 'content');

  if (contentField) {
    // Update existing content field to include Quote block
    await client.fields.update(contentField.id, {
      validators: {
        structured_text_blocks: {
          item_types: [quoteBlock.id],
        },
        structured_text_links: {
          item_types: [],
        },
      },
    });
    console.log('✓ Post model updated with Quote block');
  } else {
    // Create content field if it doesn't exist
    await client.fields.create(postModel.id, {
      label: 'Content',
      field_type: 'structured_text',
      api_key: 'content',
      validators: {
        structured_text_blocks: {
          item_types: [quoteBlock.id],
        },
        structured_text_links: {
          item_types: [],
        },
      },
      localized: false,
      position: 5,
    });
    console.log('✓ Content field created with Quote block');
  }

  return postModel;
}

async function createHeroArticle(postModel, quoteBlock) {
  console.log('Creating hero article...');

  const existingItems = await client.items.list({ filter: { type: 'post' } });
  const heroSlug = 'the-future-of-bio-synthetic-interfaces';
  let heroArticle = existingItems.find(item => item.slug === heroSlug);

  if (!heroArticle) {
    heroArticle = await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'The Future of Bio-Synthetic Interfaces',
      slug: heroSlug,
      date: '2024-03-01',
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
                  value: 'The convergence of biological systems and synthetic interfaces represents one of the most exciting frontiers in modern science. As we stand on the precipice of a new era, the potential applications span from medical diagnostics to environmental monitoring, opening doors we never imagined possible.',
                },
              ],
            },
            {
              type: 'heading',
              level: 2,
              children: [
                {
                  type: 'span',
                  value: 'Revolutionary Applications',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Bio-synthetic interfaces are transforming how we interact with biological systems. These advanced platforms enable real-time monitoring, precise control, and unprecedented insights into cellular processes.',
                },
              ],
            },
            {
              type: 'heading',
              level: 3,
              children: [
                {
                  type: 'span',
                  value: 'Key Benefits',
                },
              ],
            },
            {
              type: 'list',
              style: 'bulleted',
              children: [
                {
                  type: 'listItem',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'span',
                          value: 'Enhanced sensitivity and specificity in detection systems',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'span',
                          value: 'Real-time monitoring capabilities for continuous data collection',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'span',
                          value: 'Reduced environmental impact through sustainable material design',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'span',
                          value: 'Cost-effective solutions for large-scale deployment',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'quote',
                text: 'Science is magic that works.',
                author: 'Kurt Vonnegut',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The development of these interfaces requires interdisciplinary collaboration between biologists, engineers, and material scientists. This convergence of expertise is essential for creating systems that are both functionally robust and biologically compatible.',
                },
              ],
            },
            {
              type: 'heading',
              level: 2,
              children: [
                {
                  type: 'span',
                  value: 'The Path Forward',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'As we continue to push the boundaries of what\'s possible, ',
                },
                {
                  type: 'span',
                  marks: ['strong'],
                  value: 'the future of bio-synthetic interfaces looks incredibly promising',
                },
                {
                  type: 'span',
                  value: '. With ongoing research and development, we can expect to see even more groundbreaking applications emerge in the coming years.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The integration of artificial intelligence and machine learning with these interfaces will further accelerate innovation, enabling predictive modeling and autonomous system optimization. This represents not just an evolution, but a revolution in how we approach biological system integration.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('✓ Created: The Future of Bio-Synthetic Interfaces');
  } else {
    console.log('✓ Hero article already exists');
  }
}

async function main() {
  try {
    console.log('Starting Marketing CMS setup...\n');
    
    const quoteBlock = await createQuoteBlock();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const postModel = await updatePostModel(quoteBlock);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createHeroArticle(postModel, quoteBlock);
    
    console.log('\n✅ Marketing CMS setup complete!');
    console.log('\nNext steps:');
    console.log('1. Upload a cover image for the hero article in the DatoCMS dashboard');
    console.log('2. Run `npm run dev` to preview your marketing website');
  } catch (error) {
    console.error('Error during setup:', error);
    if (error.response?.body) {
      console.error('Error details:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

main();

