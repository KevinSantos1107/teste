import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const email = 'teixeira110705@gmail.com';
const newPassword = 'iara2025';

async function updatePassword() {
  try {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().updateUser(user.uid, {
      password: newPassword,
    });
    console.log(`Senha atualizada com sucesso para: ${email}`);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
  }
}

updatePassword();
