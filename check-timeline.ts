import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/services/firebase/config';

async function run() {
  console.log('Fetching timeline...');
  const snap = await getDocs(collection(db, 'timeline'));
  snap.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
  process.exit(0);
}

run().catch(console.error);
