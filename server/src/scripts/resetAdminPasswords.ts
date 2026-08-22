import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository';

const password = 'Test1234!';

async function resetAdminPasswords() {
  const admins = await userRepository.findAdmins();
  const passwordHash = await bcrypt.hash(password, 10);

  await Promise.all(admins.map((admin) => userRepository.updatePasswordHash(admin.id, passwordHash)));
  console.log(`Updated ${admins.length} administrator password hash(es).`);
}

resetAdminPasswords().catch((error) => {
  console.error('Could not reset administrator passwords:', error);
  process.exitCode = 1;
});
