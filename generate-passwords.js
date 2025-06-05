import bcrypt from 'bcrypt';

async function generateHashes() {
  const adminHash = await bcrypt.hash('admin', 10);
  const userHash = await bcrypt.hash('user', 10);
  
  console.log('Hash para senha "admin":', adminHash);
  console.log('Hash para senha "user":', userHash);
}

generateHashes();