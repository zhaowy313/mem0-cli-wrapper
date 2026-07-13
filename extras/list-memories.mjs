import { Mem0VPSClient } from './mem0-vps-client.js';

const client = new Mem0VPSClient({
  apiKey: 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k',
  host: 'https://mem0-api.arisecore.org'
});

async function run() {
  const userId = process.argv[2] || 'zhaowy313';
  console.log(`Fetching memories from VPS for user_id: "${userId}"...`);
  
  try {
    const response = await client.getAll({ userId });
    const memories = response.results || [];
    
    if (memories.length === 0) {
      console.log('\nNo memories found for this user.');
      return;
    }

    console.log(`\n=== Found ${memories.length} Memories ===`);
    memories.forEach((m, idx) => {
      console.log(`${idx + 1}. [ID: ${m.id}]`);
      console.log(`   Memory: ${m.memory}`);
      if (m.agent_id) console.log(`   Agent:  ${m.agent_id}`);
      if (m.run_id)   console.log(`   Run:    ${m.run_id}`);
      console.log('------------------------------------------------');
    });

  } catch (error) {
    console.error('\n✗ Failed to list memories:', error.message);
  }
}

run();
