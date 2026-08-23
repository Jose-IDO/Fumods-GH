import '../config/env';
import { firestore, admin } from '../config/firebaseAdmin';

async function run() {
  const email = 'joeyidowu1996@gmail.com';
  const users = await firestore.collection('users').where('email', '==', email).limit(1).get();
  if (users.empty) throw new Error(`User not found: ${email}`);

  await users.docs[0].ref.update({
    roles: [{ name: 'customer', displayName: 'Customer', isSystemRole: true }],
    roleNames: ['customer'],
    updatedAt: admin.firestore.Timestamp.now(),
  });
  console.log(`Demoted ${email} to customer.`);
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
