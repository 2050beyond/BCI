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
  console.error('⚠️  Error reading .env.local file.');
  console.error('Make sure it exists and contains DATOCMS_MANAGEMENT_API_TOKEN');
  process.exit(1);
}

const managementToken = process.env.DATOCMS_MANAGEMENT_API_TOKEN || envVars.DATOCMS_MANAGEMENT_API_TOKEN;

if (!managementToken) {
  console.error('❌ DATOCMS_MANAGEMENT_API_TOKEN is required.');
  console.error('Set it in .env.local or as an environment variable.');
  process.exit(1);
}

console.log('🔑 Using Management API Token (first 10 chars):', managementToken.substring(0, 10) + '...');
console.log('');

const client = new Client({ apiToken: managementToken });

async function step1_CreateQuoteModel() {
  console.log('📋 Step 1: Creating Quote Model...');
  
  try {
    const existingModels = await client.itemTypes.list();
    const quoteModel = existingModels.find(m => m.api_key === 'quote');

    if (quoteModel) {
      console.log('   ✓ Quote model already exists (ID: ' + quoteModel.id + ')');
      return quoteModel;
    }

    console.log('   → Quote model not found. Creating...');
    
    const newQuoteModel = await client.itemTypes.create({
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

    console.log('   → Creating text field...');
    await client.fields.create(newQuoteModel.id, {
      label: 'Text',
      field_type: 'text',
      api_key: 'text',
      validators: { required: {} },
      localized: false,
      position: 1,
    });

    console.log('   → Creating author field...');
    await client.fields.create(newQuoteModel.id, {
      label: 'Author',
      field_type: 'string',
      api_key: 'author',
      validators: {},
      localized: false,
      position: 2,
    });

    console.log('   ✅ Created Quote Model (ID: ' + newQuoteModel.id + ')');
    return newQuoteModel;
  } catch (error) {
    console.error('   ❌ Error creating Quote model:', error.message);
    if (error.response?.body) {
      console.error('   Details:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
}

async function step2_CreateImageBlockModel() {
  console.log('');
  console.log('📋 Step 2: Creating Image Block Model...');
  
  try {
    const existingModels = await client.itemTypes.list();
    const imageBlockModel = existingModels.find(m => m.api_key === 'image_block');

    if (imageBlockModel) {
      console.log('   ✓ Image Block model already exists (ID: ' + imageBlockModel.id + ')');
      return imageBlockModel;
    }

    console.log('   → Image Block model not found. Creating...');
    
    const newImageBlockModel = await client.itemTypes.create({
      name: 'Image Block',
      api_key: 'image_block',
      singleton: false,
      modular_block: true,
      sortable: false,
      tree: false,
      ordering_direction: null,
      ordering_meta: null,
      draft_mode_active: false,
      all_locales_required: false,
    });

    console.log('   → Creating image field...');
    await client.fields.create(newImageBlockModel.id, {
      label: 'Image',
      field_type: 'file',
      api_key: 'image',
      validators: { required: {} },
      localized: false,
      position: 1,
    });

    console.log('   → Creating caption field...');
    await client.fields.create(newImageBlockModel.id, {
      label: 'Caption',
      field_type: 'string',
      api_key: 'caption',
      validators: {},
      localized: false,
      position: 2,
    });

    console.log('   ✅ Created Image Block Model (ID: ' + newImageBlockModel.id + ')');
    return newImageBlockModel;
  } catch (error) {
    console.error('   ❌ Error creating Image Block model:', error.message);
    if (error.response?.body) {
      console.error('   Details:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
}

async function step3_LinkToPost(quoteModel, imageBlockModel) {
  console.log('');
  console.log('📋 Step 3: Linking blocks to Post model...');
  
  try {
    const existingModels = await client.itemTypes.list();
    const postModel = existingModels.find(m => m.api_key === 'post');

    if (!postModel) {
      throw new Error('Post model not found. Please ensure your Post model exists first.');
    }

    console.log('   → Found Post model (ID: ' + postModel.id + ')');

    const fields = await client.fields.list(postModel.id);
    const contentField = fields.find(f => f.api_key === 'content');

    if (!contentField) {
      throw new Error('Content field not found in Post model. Please ensure your Post model has a content field.');
    }

    console.log('   → Found content field (ID: ' + contentField.id + ')');

    // Get current validators
    const currentValidators = contentField.validators || {};
    const currentItemTypes = currentValidators.structured_text_blocks?.item_types || [];
    const currentLinks = currentValidators.structured_text_links?.item_types || [];

    console.log('   → Current allowed blocks: ' + currentItemTypes.length);

    // Add our models if they're not already included
    const itemTypesToInclude = [...new Set([...currentItemTypes, quoteModel.id, imageBlockModel.id])];

    console.log('   → Updating validators to include Quote and Image Block...');
    
    await client.fields.update(contentField.id, {
      validators: {
        structured_text_blocks: {
          item_types: itemTypesToInclude,
        },
        structured_text_links: {
          item_types: currentLinks,
        },
      },
    });

    console.log('   ✅ Linked blocks to Post');
    console.log('   → Post content field now allows: ' + itemTypesToInclude.length + ' block types');
  } catch (error) {
    console.error('   ❌ Error linking blocks to Post:', error.message);
    if (error.response?.body) {
      console.error('   Details:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Force Fix Schema Script');
    console.log('=====================================');
    console.log('');

    const quoteModel = await step1_CreateQuoteModel();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const imageBlockModel = await step2_CreateImageBlockModel();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await step3_LinkToPost(quoteModel, imageBlockModel);
    
    console.log('');
    console.log('=====================================');
    console.log('✅ Force Fix Complete!');
    console.log('');
    console.log('Your DatoCMS schema now includes:');
    console.log('  • Quote model (modular block)');
    console.log('  • Image Block model (modular block)');
    console.log('  • Post content field configured to accept both blocks');
    console.log('');
    console.log('You can now run `npm run dev` to test your site.');
    console.log('The GraphQL error "No such type QuoteRecord" should be resolved.');
  } catch (error) {
    console.error('');
    console.error('=====================================');
    console.error('❌ Force Fix Failed');
    console.error('');
    console.error('Error:', error.message);
    if (error.response?.body) {
      console.error('');
      console.error('Full error details:');
      console.error(JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

main();

