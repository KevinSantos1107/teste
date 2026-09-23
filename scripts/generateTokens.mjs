import crypto from 'crypto';

function generateToken() {
  // 32 bytes = 256 bits of security. 
  // base64url makes it URL-safe without requiring URL encoding (no +, /, or =).
  return crypto.randomBytes(32).toString('base64url');
}

const kevinToken = generateToken();
const iaraToken = generateToken();

console.log('--- TOKENS MÁGICOS GERADOS ---');
console.log('\nTOKEN DO KEVIN:');
console.log(kevinToken);
console.log('\nTOKEN DA IARA:');
console.log(iaraToken);
console.log('\n------------------------------');
console.log('COMO CADASTRAR NO FIREBASE CONSOLE:');
console.log('1. Acesse https://console.firebase.google.com/ e abra o seu projeto.');
console.log('2. Vá em Firestore Database.');
console.log('3. Crie uma nova coleção chamada "player_tokens" (se não existir).');
console.log('4. Adicione um novo documento para o KEVIN:');
console.log(`   - ID do documento: cole o token gerado acima (${kevinToken}).`);
console.log('   - Campo: "player", Tipo: "string", Valor: "kevin"');
console.log('5. Adicione um novo documento para a IARA:');
console.log(`   - ID do documento: cole o token gerado acima (${iaraToken}).`);
console.log('   - Campo: "player", Tipo: "string", Valor: "iara"');
console.log('\nPRONTO! Agora os tokens estão cadastrados de forma segura no Firebase.');
