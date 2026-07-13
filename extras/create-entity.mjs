import { Mem0VPSClient } from './mem0-vps-client.js';

const client = new Mem0VPSClient({
  apiKey: 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k',
  host: 'https://mem0-api.arisecore.org'
});

async function run() {
  console.log('Adding memory to register entity zhaowy313...');
  try {
    const response = await client.add({
      messages: [
        { role: 'user', content: 'Platform tracks developer identity using user ID zhaowy313.' }
      ],
      userId: 'zhaowy313'
    });
    console.log('\n✓ Successfully added memory:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('\n✗ Failed to create entity/memory:', error.message);
  }
}

run();
