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
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
} catch (error) {
  console.error('Error reading .env.local file.');
  process.exit(1);
}

const managementToken = process.env.DATOCMS_MANAGEMENT_API_TOKEN || envVars.DATOCMS_MANAGEMENT_API_TOKEN;

if (!managementToken) {
  console.error('DATOCMS_MANAGEMENT_API_TOKEN is required.');
  process.exit(1);
}

const client = new Client({ apiToken: managementToken });

async function ensureQuoteModel() {
  console.log('📋 Ensuring Quote model exists...');
  
  const existingModels = await client.itemTypes.list();
  let quoteModel = existingModels.find(m => m.api_key === 'quote');

  if (quoteModel) {
    console.log('   ✓ Quote model exists');
    return quoteModel;
  }

  quoteModel = await client.itemTypes.create({
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

  await client.fields.create(quoteModel.id, {
    label: 'Text',
    field_type: 'text',
    api_key: 'text',
    validators: { required: {} },
    localized: false,
    position: 1,
  });

  await client.fields.create(quoteModel.id, {
    label: 'Author',
    field_type: 'string',
    api_key: 'author',
    validators: {},
    localized: false,
    position: 2,
  });

  console.log('   ✓ Quote model created');
  return quoteModel;
}

async function ensurePostModel(quoteModel) {
  console.log('📋 Ensuring Post model exists...');
  
  const existingModels = await client.itemTypes.list();
  let postModel = existingModels.find(m => m.api_key === 'post');

  if (!postModel) {
    postModel = await client.itemTypes.create({
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
      collection_appearance: 'table',
    });

    await client.fields.create(postModel.id, {
      label: 'Title',
      field_type: 'string',
      api_key: 'title',
      validators: { required: {} },
      localized: false,
      position: 1,
    });

    await client.fields.create(postModel.id, {
      label: 'Slug',
      field_type: 'slug',
      api_key: 'slug',
      validators: { required: {} },
      localized: false,
      position: 2,
    });

    await client.fields.create(postModel.id, {
      label: 'Date',
      field_type: 'date',
      api_key: 'date',
      validators: { required: {} },
      localized: false,
      position: 3,
    });

    await client.fields.create(postModel.id, {
      label: 'Cover Image',
      field_type: 'file',
      api_key: 'cover_image',
      validators: {},
      localized: false,
      position: 4,
    });

    await client.fields.create(postModel.id, {
      label: 'Content',
      field_type: 'structured_text',
      api_key: 'content',
      validators: {
        structured_text_blocks: {
          item_types: [quoteModel.id],
        },
        structured_text_links: {
          item_types: [],
        },
      },
      localized: false,
      position: 5,
    });

    console.log('   ✓ Post model created');
  } else {
    // Update existing content field if it exists
    const fields = await client.fields.list(postModel.id);
    const contentField = fields.find(f => f.api_key === 'content');
    
    if (contentField) {
      const currentItemTypes = contentField.validators?.structured_text_blocks?.item_types || [];
      const itemTypesToInclude = [...new Set([...currentItemTypes, quoteModel.id])];
      
      await client.fields.update(contentField.id, {
        validators: {
          structured_text_blocks: {
            item_types: itemTypesToInclude,
          },
          structured_text_links: {
            item_types: contentField.validators?.structured_text_links?.item_types || [],
          },
        },
      });
      console.log('   ✓ Post model updated');
    } else {
      // Create content field if missing
      await client.fields.create(postModel.id, {
        label: 'Content',
        field_type: 'structured_text',
        api_key: 'content',
        validators: {
          structured_text_blocks: {
            item_types: [quoteModel.id],
          },
          structured_text_links: {
            item_types: [],
          },
        },
        localized: false,
        position: 5,
      });
      console.log('   ✓ Post content field created');
    }
  }

  return postModel;
}

async function createSeedArticles(postModel, quoteModel) {
  console.log('📋 Creating seed articles...');
  
  const existingItems = await client.items.list({ filter: { type: 'post' } });

  // Article 1: Text Heavy
  const article1Slug = 'the-future-of-computing';
  if (!existingItems.find(item => item.slug === article1Slug)) {
    await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'The Future of Computing',
      slug: article1Slug,
      date: '2024-03-15',
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
                  value: 'Computing has evolved at an unprecedented pace over the past few decades. From room-sized mainframes to pocket-sized supercomputers, the journey has been nothing short of revolutionary.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The next frontier lies in quantum computing, artificial intelligence, and edge computing. These technologies promise to reshape how we interact with digital systems, making them more intuitive, powerful, and accessible.',
                },
              ],
            },
            {
              type: 'heading',
              level: 2,
              children: [
                {
                  type: 'span',
                  value: 'Quantum Computing',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Quantum computing represents a paradigm shift from classical computing. By leveraging quantum mechanical phenomena like superposition and entanglement, quantum computers can solve certain problems exponentially faster than classical computers.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'While still in its early stages, quantum computing shows promise in cryptography, drug discovery, and optimization problems. Major tech companies and research institutions are investing billions in this technology.',
                },
              ],
            },
            {
              type: 'heading',
              level: 2,
              children: [
                {
                  type: 'span',
                  value: 'Artificial Intelligence',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'AI has moved from science fiction to everyday reality. Machine learning algorithms power recommendation systems, autonomous vehicles, and medical diagnostics. The integration of AI into computing systems is becoming seamless.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('   ✓ Created: The Future of Computing');
  }

  // Article 2: Image Heavy (using inline images - note: images need to be uploaded manually)
  const article2Slug = 'visual-storytelling-in-the-digital-age';
  if (!existingItems.find(item => item.slug === article2Slug)) {
    await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'Visual Storytelling in the Digital Age',
      slug: article2Slug,
      date: '2024-03-10',
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
                  value: 'Images have become the primary language of digital communication. In an era of information overload, visual content cuts through the noise and captures attention instantly.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Photography, illustration, and graphic design work together to create compelling narratives. Each image tells a story, conveys emotion, and communicates complex ideas in a fraction of a second.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The power of visual storytelling lies in its universality. Regardless of language or culture, a well-crafted image can resonate with audiences worldwide. This makes visual content essential for global communication.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Note: Images can be added to this article through the DatoCMS interface. The structured text field supports inline images that will be displayed between paragraphs.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('   ✓ Created: Visual Storytelling in the Digital Age');
  }

  // Article 3: The Interview (Multiple Quotes)
  const article3Slug = 'the-interview-with-tech-visionary';
  if (!existingItems.find(item => item.slug === article3Slug)) {
    await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'The Interview: A Conversation with a Tech Visionary',
      slug: article3Slug,
      date: '2024-03-05',
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
                  value: 'We sat down with a leading technology visionary to discuss the future of innovation, the challenges ahead, and the opportunities that lie before us.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'quote',
                text: 'Innovation is not about having the best idea. It\'s about executing on good ideas consistently.',
                author: 'Tech Visionary',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The conversation began with a discussion about the current state of technology and where we\'re heading. Our guest emphasized the importance of execution over ideation.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'quote',
                text: 'The most successful companies are those that can adapt quickly to change. Agility is the new competitive advantage.',
                author: 'Tech Visionary',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'When asked about the key to success in the tech industry, the response was clear: adaptability and speed. Companies that can pivot quickly have a significant advantage.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'quote',
                text: 'Technology should serve humanity, not the other way around. We need to build tools that enhance human capabilities rather than replace them.',
                author: 'Tech Visionary',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The interview concluded with thoughts on the ethical implications of technology. The emphasis was on creating technology that empowers people rather than controlling them.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('   ✓ Created: The Interview');
  }

  // Article 4: Mixed Media
  const article4Slug = 'the-art-of-balance';
  if (!existingItems.find(item => item.slug === article4Slug)) {
    await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'The Art of Balance: Combining Text, Images, and Quotes',
      slug: article4Slug,
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
                  value: 'Great content creation is about finding the right balance between different media types. Text provides context, images capture attention, and quotes add authority.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'quote',
                text: 'Content is king, but context is the kingdom.',
                author: 'Content Strategist',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Each element serves a purpose. Text allows for detailed explanation and nuance. Images break up long passages and provide visual interest. Quotes highlight key insights and add credibility.',
                },
              ],
            },
            {
              type: 'heading',
              level: 2,
              children: [
                {
                  type: 'span',
                  value: 'The Perfect Mix',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The best content creators know when to use each tool. They understand that variety keeps readers engaged and that different people consume content in different ways.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Some readers prefer detailed text, others are drawn to visuals, and many appreciate the wisdom found in well-chosen quotes. By combining all three, you create content that appeals to everyone.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('   ✓ Created: The Art of Balance');
  }

  console.log('   ✓ All seed articles created');
}

async function main() {
  try {
    console.log('🚀 Initializing Laser Blog...\n');
    
    const quoteModel = await ensureQuoteModel();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const postModel = await ensurePostModel(quoteModel);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createSeedArticles(postModel, quoteModel);
    
    console.log('\n✅ Laser Blog initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Upload cover images for articles in DatoCMS dashboard');
    console.log('2. Add inline images to articles through the structured text editor');
    console.log('3. Run `npm run dev` to preview your blog');
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    if (error.response?.body) {
      console.error(JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

main();

