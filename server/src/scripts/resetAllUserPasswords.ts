import bcrypt from 'bcrypt';
import { firestore, admin } from '../config/firebaseAdmin';

const password = 'Test1234!';

async function resetAllUserPasswords() {
  const users = await firestore.collection('users').get();
  const passwordHash = await bcrypt.hash(password, 10);
  const batch = firestore.batch();
  const emails: string[] = [];

  users.docs.forEach((doc) => {
    const data = doc.data();
    batch.update(doc.ref, { passwordHash, updatedAt: admin.firestore.Timestamp.now() });
    if (data.email) emails.push(data.email);
  });

  await batch.commit();
  console.log(JSON.stringify({ updatedUsers: users.size, emails }, null, 2));
}

resetAllUserPasswords().catch((error) => {
  console.error('Could not reset user passwords:', error);
  process.exitCode = 1;
});
