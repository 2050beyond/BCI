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

async function createQuoteModel() {
  console.log('Checking/Creating Quote model...');

  const existingModels = await client.itemTypes.list();
  let quoteModel = existingModels.find(m => m.api_key === 'quote');

  if (!quoteModel) {
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
    console.log('✓ Quote model created');
  } else {
    console.log('✓ Quote model already exists');
  }

  return quoteModel;
}

async function createImageBlockModel() {
  console.log('Checking/Creating Image Block model...');

  const existingModels = await client.itemTypes.list();
  let imageBlockModel = existingModels.find(m => m.api_key === 'image_block');

  if (!imageBlockModel) {
    imageBlockModel = await client.itemTypes.create({
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

    await client.fields.create(imageBlockModel.id, {
      label: 'Image',
      field_type: 'file',
      api_key: 'image',
      validators: { required: {} },
      localized: false,
      position: 1,
    });

    await client.fields.create(imageBlockModel.id, {
      label: 'Caption',
      field_type: 'string',
      api_key: 'caption',
      validators: {},
      localized: false,
      position: 2,
    });
    console.log('✓ Image Block model created');
  } else {
    console.log('✓ Image Block model already exists');
  }

  return imageBlockModel;
}

async function updatePostContentField(quoteModel, imageBlockModel) {
  console.log('Updating Post model content field...');

  const existingModels = await client.itemTypes.list();
  const postModel = existingModels.find(m => m.api_key === 'post');

  if (!postModel) {
    throw new Error('Post model not found. Please run the initial setup first.');
  }

  const fields = await client.fields.list(postModel.id);
  const contentField = fields.find(f => f.api_key === 'content');

  if (!contentField) {
    throw new Error('Content field not found in Post model. Please run the initial setup first.');
  }

  // Get current validators
  const currentValidators = contentField.validators || {};
  const currentItemTypes = currentValidators.structured_text_blocks?.item_types || [];

  // Add our models if they're not already included
  const itemTypesToInclude = [...new Set([...currentItemTypes, quoteModel.id, imageBlockModel.id])];

  await client.fields.update(contentField.id, {
    validators: {
      structured_text_blocks: {
        item_types: itemTypesToInclude,
      },
      structured_text_links: {
        item_types: currentValidators.structured_text_links?.item_types || [],
      },
    },
  });
  console.log('✓ Post content field updated with Quote and Image Block models');
}

async function main() {
  try {
    console.log('Starting schema repair...\n');
    
    const quoteModel = await createQuoteModel();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const imageBlockModel = await createImageBlockModel();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await updatePostContentField(quoteModel, imageBlockModel);
    
    console.log('\n✅ Schema repair complete!');
    console.log('\nYour DatoCMS schema now includes:');
    console.log('- Quote model (modular block)');
    console.log('- Image Block model (modular block)');
    console.log('- Post content field configured to accept both blocks');
    console.log('\nYou can now run `npm run dev` to test your site.');
  } catch (error) {
    console.error('Error during schema repair:', error);
    if (error.response?.body) {
      console.error('Error details:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

main();

