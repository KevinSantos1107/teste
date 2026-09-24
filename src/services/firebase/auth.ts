import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import app from './config';

export const auth = getAuth(app);

// Persiste a sessão no localStorage — não pede senha ao trocar de aba,
// minimizar ou fechar e reabrir o navegador na mesma sessão.
// Só pede login novamente quando o token expirar (1 hora sem uso)
// ou quando o usuário clicar em "Sair" explicitamente.
setPersistence(auth, browserLocalPersistence).catch(console.error);
