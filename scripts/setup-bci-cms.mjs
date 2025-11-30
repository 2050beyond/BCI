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

async function createBlockModels() {
  console.log('Creating custom block models...');

  const existingModels = await client.itemTypes.list();
  
  // Code Snippet Block
  let codeSnippetBlock = existingModels.find(m => m.api_key === 'code_snippet');
  if (!codeSnippetBlock) {
    codeSnippetBlock = await client.itemTypes.create({
      name: 'Code Snippet',
      api_key: 'code_snippet',
      singleton: false,
      modular_block: true,
      sortable: false,
      tree: false,
      ordering_direction: null,
      ordering_meta: null,
      draft_mode_active: false,
      all_locales_required: false,
    });

    await client.fields.create(codeSnippetBlock.id, {
      label: 'Language',
      field_type: 'string',
      api_key: 'language',
      validators: {},
      localized: false,
      position: 1,
    });

    await client.fields.create(codeSnippetBlock.id, {
      label: 'Code',
      field_type: 'text',
      api_key: 'code',
      validators: {},
      localized: false,
      position: 2,
    });
    console.log('✓ Code Snippet block created');
  } else {
    console.log('✓ Code Snippet block already exists');
  }

  // Scientific Figure Block
  let scientificFigureBlock = existingModels.find(m => m.api_key === 'scientific_figure');
  if (!scientificFigureBlock) {
    scientificFigureBlock = await client.itemTypes.create({
      name: 'Scientific Figure',
      api_key: 'scientific_figure',
      singleton: false,
      modular_block: true,
      sortable: false,
      tree: false,
      ordering_direction: null,
      ordering_meta: null,
      draft_mode_active: false,
      all_locales_required: false,
    });

    await client.fields.create(scientificFigureBlock.id, {
      label: 'Image',
      field_type: 'file',
      api_key: 'image',
      validators: {},
      localized: false,
      position: 1,
    });

    await client.fields.create(scientificFigureBlock.id, {
      label: 'Caption',
      field_type: 'string',
      api_key: 'caption',
      validators: {},
      localized: false,
      position: 2,
    });

    await client.fields.create(scientificFigureBlock.id, {
      label: 'Figure Number',
      field_type: 'string',
      api_key: 'figure_number',
      validators: {},
      localized: false,
      position: 3,
    });
    console.log('✓ Scientific Figure block created');
  } else {
    console.log('✓ Scientific Figure block already exists');
  }

  // Callout Block
  let calloutBlock = existingModels.find(m => m.api_key === 'callout');
  if (!calloutBlock) {
    calloutBlock = await client.itemTypes.create({
      name: 'Callout',
      api_key: 'callout',
      singleton: false,
      modular_block: true,
      sortable: false,
      tree: false,
      ordering_direction: null,
      ordering_meta: null,
      draft_mode_active: false,
      all_locales_required: false,
    });

    await client.fields.create(calloutBlock.id, {
      label: 'Type',
      field_type: 'string',
      api_key: 'callout_type',
      validators: {
        enum: {
          values: ['Warning', 'Hypothesis', 'Result'],
        },
      },
      localized: false,
      position: 1,
    });

    await client.fields.create(calloutBlock.id, {
      label: 'Text',
      field_type: 'text',
      api_key: 'text',
      validators: {},
      localized: false,
      position: 2,
    });
    console.log('✓ Callout block created');
  } else {
    console.log('✓ Callout block already exists');
  }

  // Equation Block
  let equationBlock = existingModels.find(m => m.api_key === 'equation');
  if (!equationBlock) {
    equationBlock = await client.itemTypes.create({
      name: 'Equation',
      api_key: 'equation',
      singleton: false,
      modular_block: true,
      sortable: false,
      tree: false,
      ordering_direction: null,
      ordering_meta: null,
      draft_mode_active: false,
      all_locales_required: false,
    });

    await client.fields.create(equationBlock.id, {
      label: 'LaTeX Formula',
      field_type: 'string',
      api_key: 'latex_formula',
      validators: {},
      localized: false,
      position: 1,
    });
    console.log('✓ Equation block created');
  } else {
    console.log('✓ Equation block already exists');
  }

  return {
    codeSnippetBlock,
    scientificFigureBlock,
    calloutBlock,
    equationBlock,
  };
}

async function updatePostModel(blocks) {
  console.log('Updating Post model...');

  const existingModels = await client.itemTypes.list();
  const postModel = existingModels.find(m => m.api_key === 'post');

  if (!postModel) {
    throw new Error('Post model not found. Please run the initial setup first.');
  }

  const fields = await client.fields.list(postModel.id);
  const contentField = fields.find(f => f.api_key === 'content');

  if (contentField) {
    // Update existing content field to include new blocks
    const blockIds = [
      blocks.codeSnippetBlock.id,
      blocks.scientificFigureBlock.id,
      blocks.calloutBlock.id,
      blocks.equationBlock.id,
    ];

    // Check if pull_quote exists
    const pullQuoteBlock = existingModels.find(m => m.api_key === 'pull_quote');
    if (pullQuoteBlock) {
      blockIds.push(pullQuoteBlock.id);
    }

    await client.fields.update(contentField.id, {
      validators: {
        structured_text_blocks: {
          item_types: blockIds,
        },
        structured_text_links: {
          item_types: [],
        },
      },
    });
    console.log('✓ Post model updated with new blocks');
  } else {
    // Create content field if it doesn't exist
    const blockIds = [
      blocks.codeSnippetBlock.id,
      blocks.scientificFigureBlock.id,
      blocks.calloutBlock.id,
      blocks.equationBlock.id,
    ];

    const pullQuoteBlock = existingModels.find(m => m.api_key === 'pull_quote');
    if (pullQuoteBlock) {
      blockIds.push(pullQuoteBlock.id);
    }

    await client.fields.create(postModel.id, {
      label: 'Content',
      field_type: 'structured_text',
      api_key: 'content',
      validators: {
        structured_text_blocks: {
          item_types: blockIds,
        },
        structured_text_links: {
          item_types: [],
        },
      },
      localized: false,
      position: 5,
    });
    console.log('✓ Content field created with new blocks');
  }

  return postModel;
}

async function createBCIArticles(postModel, blocks) {
  console.log('Creating BCI research articles...');

  const existingItems = await client.items.list({ filter: { type: 'post' } });
  
  // Article 1: High-Bandwidth Neural Lace Architecture
  const article1Slug = 'high-bandwidth-neural-lace-architecture';
  let article1 = existingItems.find(item => item.slug === article1Slug);
  
  if (!article1) {
    article1 = await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'High-Bandwidth Neural Lace Architecture',
      slug: article1Slug,
      date: '2024-02-15',
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
                  value: 'The development of high-bandwidth neural interfaces requires unprecedented signal fidelity across multiple spatial and temporal scales. Our neural lace architecture employs a 1024-channel electrode array with sub-10μm pitch spacing, enabling simultaneous recording from dense populations of neurons in the motor cortex.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Signal-to-noise ratio (SNR) measurements across the array demonstrate consistent performance with mean SNR of 12.3 ± 2.1 dB at 1 kHz, degrading to 8.7 ± 1.8 dB at 5 kHz. The motor cortex latency for intention decoding was measured at 145 ± 23 ms post-stimulus, with 94.2% classification accuracy for 8-directional reach tasks.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'scientific_figure',
                figure_number: 'Fig 1.1',
                caption: 'Neural lace electrode array showing 1024-channel configuration with sub-10μm pitch spacing. Signal attenuation measured at -3dB across 2kHz bandwidth.',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Invasive electrode arrays must balance biocompatibility with electrical performance. Our polymer-based probes exhibit impedance of 234 ± 45 kΩ at 1 kHz, with chronic implantation showing stable recordings over 180 days in non-human primates.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'code_snippet',
                language: 'python',
                code: `import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq

def process_neural_lace_data(raw_signal, sampling_rate=20000):
    """
    Process high-bandwidth neural lace data with adaptive filtering.
    
    Parameters:
    -----------
    raw_signal : ndarray
        Raw voltage traces from 1024-channel array
    sampling_rate : int
        Sampling frequency in Hz (default: 20kHz)
    
    Returns:
    --------
    filtered_signal : ndarray
        Bandpass filtered signal (300-5000 Hz)
    spike_times : ndarray
        Detected spike timestamps
    """
    # Bandpass filter: 300-5000 Hz
    sos = signal.butter(4, [300, 5000], btype='band', 
                       fs=sampling_rate, output='sos')
    filtered_signal = signal.sosfilt(sos, raw_signal)
    
    # Spike detection using threshold crossing
    threshold = np.std(filtered_signal) * 4.5
    spike_indices = np.where(np.abs(filtered_signal) > threshold)[0]
    
    return filtered_signal, spike_indices / sampling_rate`,
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The adaptive filtering pipeline processes 20 kHz sampled data in real-time, with computational latency under 5 ms per 100 ms window. This enables closed-loop control applications requiring sub-100 ms response times.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('✓ Created: High-Bandwidth Neural Lace Architecture');
  }

  // Article 2: Decoding Intention with Kalman Filters
  const article2Slug = 'decoding-intention-kalman-filters-motor-control';
  let article2 = existingItems.find(item => item.slug === article2Slug);
  
  if (!article2) {
    article2 = await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'Decoding Intention: Kalman Filters in Motor Control',
      slug: article2Slug,
      date: '2024-02-10',
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
                  value: 'Motor intention decoding from cortical signals requires robust state estimation algorithms capable of handling non-stationary neural dynamics. We implement a linear Kalman filter to decode intended hand velocity from multi-unit activity recorded via 96-channel Utah arrays implanted in primary motor cortex (M1).',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'callout',
                callout_type: 'Hypothesis',
                text: 'We hypothesize that a linear Kalman filter can decode motor intention from multi-unit activity (MUA) with sufficient accuracy for real-time prosthetic control, given that the neural population code exhibits linear dynamics over short time windows (< 200 ms).',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'The state-space model represents hand velocity as a hidden state x_k, with observations y_k corresponding to binned spike counts across N channels. The state transition and observation models are:',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'equation',
                latex_formula: 'x_{k+1} = F_k x_k + B_k u_k + w_k',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'where F_k is the state transition matrix, B_k maps control inputs, and w_k ~ N(0, Q_k) is process noise. The prediction covariance is updated as:',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'equation',
                latex_formula: 'P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Cross-validation on 45 minutes of reaching data (8 directions, 5 trials each) yielded mean correlation coefficients of r = 0.78 ± 0.12 for x-velocity and r = 0.71 ± 0.15 for y-velocity. The filter achieves 50 ms prediction latency with online adaptation of Q_k based on residual analysis.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('✓ Created: Decoding Intention: Kalman Filters in Motor Control');
  }

  // Article 3: Biocompatibility of Polymer-Based Probes
  const article3Slug = 'biocompatibility-polymer-based-probes';
  let article3 = existingItems.find(item => item.slug === article3Slug);
  
  if (!article3) {
    article3 = await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'Biocompatibility of Polymer-Based Probes',
      slug: article3Slug,
      date: '2024-02-05',
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
                  value: 'Long-term stability of neural interfaces depends critically on the biocompatibility of implant materials. We evaluate three polymer substrates—polyimide, parylene-C, and SU-8—for chronic implantation in rat motor cortex over 180 days.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'callout',
                callout_type: 'Warning',
                text: 'Chronic implantation studies show 23% device rejection rate at 6 months post-implant, with foreign body response characterized by glial scar formation and electrode encapsulation. This leads to progressive impedance increase (mean: +187% over 180 days) and signal degradation.',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Histological analysis reveals distinct tissue responses: polyimide probes show minimal glial activation (GFAP+ area: 12.3 ± 3.1% of probe cross-section) but mechanical failure at flex points. Parylene-C demonstrates superior chemical stability with impedance drift of only +45% over 180 days, but increased inflammatory response (GFAP+ area: 18.7 ± 4.2%).',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'SU-8 probes exhibit intermediate performance: stable impedance (+78% over 180 days) with moderate glial response (GFAP+ area: 15.1 ± 2.8%). However, SU-8 shows susceptibility to delamination at high-frequency stimulation (> 200 Hz, 100 μA pulses).',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'callout',
                callout_type: 'Warning',
                text: 'Polyimide-based probes exhibit superior flexibility but show delamination at the electrode-metal interface after 90 days in vivo. Parylene-C coating reduces but does not eliminate this failure mode.',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Electrochemical impedance spectroscopy (EIS) measurements at 1 kHz show initial values of 156 ± 32 kΩ for polyimide, 189 ± 41 kΩ for parylene-C, and 201 ± 38 kΩ for SU-8. After 180 days, these values increase to 456 ± 89 kΩ, 274 ± 52 kΩ, and 358 ± 71 kΩ respectively, indicating progressive electrode encapsulation.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Neuronal density within 50 μm of probe tracks decreases by 18.3% for polyimide, 24.1% for parylene-C, and 19.7% for SU-8 compared to control tissue. These findings suggest that material choice involves trade-offs between mechanical durability, chemical stability, and biological compatibility.',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('✓ Created: Biocompatibility of Polymer-Based Probes');
  }

  // Article 4: Subject 001 Post-Implant Calibration Logs
  const article4Slug = 'subject-001-post-implant-calibration-logs';
  let article4 = existingItems.find(item => item.slug === article4Slug);
  
  if (!article4) {
    article4 = await client.items.create({
      item_type: { type: 'item_type', id: postModel.id },
      title: 'Subject 001: Post-Implant Calibration Logs',
      slug: article4Slug,
      date: '2024-02-01',
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
                  value: 'Subject 001 underwent implantation of a 96-channel Utah array in left primary motor cortex (M1) on 2024-01-15. This log documents the post-implant calibration protocol and decoder performance over 14 days.',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Day 1-3: Initial signal assessment. Mean firing rates across channels: 12.3 ± 8.7 Hz. Signal quality index (SQI) calculated as ratio of spike-band power (300-3000 Hz) to noise-band power (1-100 Hz): 4.2 ± 1.8. Channels with SQI < 2.0 were excluded from decoding (n=8 channels).',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'scientific_figure',
                figure_number: 'Fig 4.1',
                caption: 'Post-implant calibration session showing decoder performance over 14 days. R² values for x-velocity (blue) and y-velocity (red) demonstrate rapid improvement during initial calibration, plateauing after day 7.',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Day 4-7: Calibration sessions (2 hours/day) using 8-direction center-out reaching task. Velocity decoder trained using ridge regression with L2 regularization (α = 1.0). The decoder model:',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'equation',
                latex_formula: '\\hat{v}_t = \\sum_{i=1}^{N} w_i \\cdot r_{i,t} + b',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'where ŷ_t is predicted velocity, w_i are decoder weights, r_{i,t} are binned spike rates for channel i, and b is bias term. Initial performance (Day 4): R² = 0.61 ± 0.08. By Day 7: R² = 0.79 ± 0.05.',
                },
              ],
            },
            {
              type: 'block',
              item: {
                type: 'code_snippet',
                language: 'python',
                code: `# Post-implant calibration protocol
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import r2_score

def calibrate_decoder(neural_data, hand_velocity, alpha=1.0):
    """
    Calibrate velocity decoder using ridge regression.
    
    Parameters:
    -----------
    neural_data : ndarray, shape (n_samples, n_channels)
        Binned spike counts
    hand_velocity : ndarray, shape (n_samples, 2)
        Ground truth hand velocity [vx, vy]
    alpha : float
        Ridge regularization parameter
    
    Returns:
    --------
    decoder : Ridge
        Trained decoder model
    r2 : float
        Coefficient of determination
    """
    decoder = Ridge(alpha=alpha)
    decoder.fit(neural_data, hand_velocity)
    
    predictions = decoder.predict(neural_data)
    r2 = r2_score(hand_velocity, predictions)
    
    return decoder, r2

# Example: Day 1 calibration
day1_data = load_calibration_session('subject_001_day1.mat')
decoder, r2 = calibrate_decoder(
    day1_data['spikes'], 
    day1_data['velocity']
)
print(f"Day 1 R²: {r2:.3f}")`,
              },
            },
            {
              type: 'block',
              item: {
                type: 'callout',
                callout_type: 'Result',
                text: 'Subject 001 achieved stable decoder performance (R² = 0.82 ± 0.06) after 7 days of calibration. Online control was enabled on day 8, with successful completion of 8-direction center-out reaching task (94% success rate, mean reaction time: 187 ± 34 ms).',
              },
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'span',
                  value: 'Day 8-14: Online control enabled. Subject performed self-paced reaching to 8 targets arranged in a circle (radius: 10 cm). Decoder weights were updated daily using recursive least squares (RLS) with forgetting factor λ = 0.95. Performance remained stable with no significant drift (p > 0.05, paired t-test).',
                },
              ],
            },
          ],
        },
      },
    });
    console.log('✓ Created: Subject 001: Post-Implant Calibration Logs');
  }

  console.log('\n✅ All BCI articles created successfully!');
}

async function main() {
  try {
    console.log('Starting BCI CMS setup...\n');
    
    const blocks = await createBlockModels();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const postModel = await updatePostModel(blocks);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createBCIArticles(postModel, blocks);
    
    console.log('\n✅ BCI CMS setup complete!');
    console.log('\nNext steps:');
    console.log('1. Upload images for scientific figures in the DatoCMS dashboard');
    console.log('2. Run `npm run dev` to preview your scientific articles');
  } catch (error) {
    console.error('Error during setup:', error);
    if (error.response?.body) {
      console.error('Error details:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

main();

