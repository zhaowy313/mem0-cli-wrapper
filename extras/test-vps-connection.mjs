import { Mem0VPSClient } from './mem0-vps-client.js';

const client = new Mem0VPSClient({
  apiKey: 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k',
  host: 'https://mem0-api.arisecore.org'
});

async function run() {
  console.log('Testing connection to Mem0 VPS (https://mem0-api.arisecore.org)...');
  
  try {
    // 1. Search for memories under a test user
    const searchResults = await client.search({
      query: 'Tai Chi video pricing',
      userId: 'livestream-project',
    });

    console.log('\n✓ Successfully connected to self-hosted VPS server!');
    console.log('=== Search Results ===');
    console.log(JSON.stringify(searchResults, null, 2));

  } catch (error) {
    console.error('\n✗ Connection failed:', error.message);
  }
}

run();
