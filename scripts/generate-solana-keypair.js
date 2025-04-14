const { Keypair } = require('@solana/web3.js');

// Generate new Solana keypair
const generateSolanaKeypair = () => {
  const keypair = Keypair.generate();
  
  // Format for .env file
  const secretKeyString = Array.from(keypair.secretKey).toString();
  
  console.log('\n=== SOLANA KEYPAIR GENERATED ===');
  console.log(`🔑 Public Key: ${keypair.publicKey.toString()}`);
  console.log('\n📋 Add this to your .env file:');
  console.log(`SOLANA_PRIVATE_KEY=${secretKeyString}`);
  console.log('\n⚠️ KEEP YOUR PRIVATE KEY SECURE - Never share or commit it to version control ⚠️');
  
  return {
    publicKey: keypair.publicKey.toString(),
    secretKey: secretKeyString
  };
};

// Execute the function
generateSolanaKeypair(); 