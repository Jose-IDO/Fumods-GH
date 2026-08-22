import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { userRepository } from '../repositories/userRepository';

const DEFAULT_SALT_ROUNDS = 10;

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || undefined;
      const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
      const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
      const offset = (page - 1) * limit;

      const users = await userRepository.findAll(search, limit, offset);

      res.json({ ok: true, data: { users, page, limit } });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch users' });
    }
  }

  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body as {
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        role?: string;
      };

      if (!email || !password || !firstName || !lastName || !role) {
        res.status(400).json({ ok: false, error: 'Email, password, first name, last name, and role are required' });
        return;
      }

      const normalizedEmail = email.toLowerCase();
      const roleName = role === 'hotel_manager' ? 'hotel_manager' : 'super_admin';
      const roleDisplayName = roleName === 'super_admin' ? 'Administrator' : 'Hotel Manager';

      const roleObject = {
        id: roleName,
        name: roleName,
        displayName: roleDisplayName,
        isSystemRole: true,
      };

      const existingUser = await userRepository.findByEmail(normalizedEmail);
      let user;

      if (existingUser) {
        const updatedRoles = Array.isArray(existingUser.roles)
          ? [
              ...existingUser.roles.filter(r => r.name !== roleName),
              roleObject,
            ]
          : [roleObject];
        const roleNames = Array.from(new Set([...(existingUser as any).roleNames || [], roleName]));

        await userRepository.updateRoles(existingUser.id, updatedRoles, roleNames);
        await userRepository.updateEmailVerified(existingUser.id, true);
        const passwordHash = await bcrypt.hash(password, DEFAULT_SALT_ROUNDS);
        await userRepository.updatePasswordHash(existingUser.id, passwordHash);
        user = await userRepository.findById(existingUser.id);
      } else {
        const passwordHash = await bcrypt.hash(password, DEFAULT_SALT_ROUNDS);
        user = await userRepository.create({
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          phone: phone || null,
          roles: [roleObject],
          roleNames: [roleName],
          emailVerified: true,
        });
      }

      if (!user) {
        throw new Error('Failed to create or update admin user');
      }

      res.status(existingUser ? 200 : 201).json({ ok: true, data: { user } });
    } catch (error: any) {
      console.error('Create admin error:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ ok: false, error: error.message });
      } else {
        res.status(500).json({ ok: false, error: 'Failed to create admin user' });
      }
    }
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ ok: false, error: 'User ID is required' });
        return;
      }

      await userRepository.updateIsActive(id, false);
      const user = await userRepository.findById(id);

      res.json({ ok: true, data: { user } });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ ok: false, error: 'Failed to deactivate user' });
    }
  }

  async activate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ ok: false, error: 'User ID is required' });
        return;
      }

      await userRepository.updateIsActive(id, true);
      const user = await userRepository.findById(id);

      res.json({ ok: true, data: { user } });
    } catch (error) {
      console.error('Activate user error:', error);
      res.status(500).json({ ok: false, error: 'Failed to activate user' });
    }
  }

  async listAdmins(req: Request, res: Response): Promise<void> {
    try {
      const admins = await userRepository.findAdmins();
      res.json({ ok: true, data: { admins } });
    } catch (error) {
      console.error('List admins error:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch administrators' });
    }
  }
}

export const userController = new UserController();
