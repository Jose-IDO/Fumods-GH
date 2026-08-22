import '../config/env';
import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository';
import { RegisterPayload, LoginPayload, AuthResponse, JWTPayload, User } from '../types/user.types';
import { emailService } from './emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;
const ENABLE_FALLBACK_AUTH = process.env.ENABLE_FALLBACK_AUTH === 'true';

class AuthService {
  // Fallback users for offline/dev mode (when DB is unavailable)
  private fallbackUsers: Array<{ email: string; password: string; user: User }>; 

  constructor() {
    const now = new Date();
    this.fallbackUsers = [
      {
        email: 'admin@deltahotel.com',
        password: 'admin123',
        user: {
          id: 'fallback-admin',
          email: 'admin@deltahotel.com',
          firstName: 'Admin',
          lastName: 'User',
          phone: undefined,
          profileImageUrl: undefined,
          emailVerified: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          roles: [
            { id: 'role-super-admin', name: 'super_admin', displayName: 'Administrator', description: 'Full admin', isSystemRole: true }
          ]
        }
      },
      {
        email: 'customer@deltahotel.com',
        password: 'customer123',
        user: {
          id: 'fallback-customer',
          email: 'customer@deltahotel.com',
          firstName: 'Customer',
          lastName: 'User',
          phone: undefined,
          profileImageUrl: undefined,
          emailVerified: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          roles: [
            { id: 'role-customer', name: 'customer', displayName: 'Customer', description: 'Standard customer', isSystemRole: true }
          ]
        }
      },
      {
        email: 'testuser@deltahotel.com',
        password: 'test123',
        user: {
          id: 'fallback-test',
          email: 'testuser@deltahotel.com',
          firstName: 'Test',
          lastName: 'User',
          phone: undefined,
          profileImageUrl: undefined,
          emailVerified: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          roles: [
            { id: 'role-customer', name: 'customer', displayName: 'Customer', description: 'Standard customer', isSystemRole: true }
          ]
        }
      }
    ];
  }

  private sanitizeUser(u: User | (User & { passwordHash?: string })): User {
    const { passwordHash, ...rest } = (u as any) || {};
    return rest as User;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    if (payload.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      email: payload.email,
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone
    });

    try {
      await emailService.sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
      expiresIn: this.getExpiresInSeconds()
    };
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    // Try DB-first, but don't treat logical auth failures as DB errors
    let dbError = false;
    let user: (User & { passwordHash?: string }) | null = null;

    try {
      user = await userRepository.findByEmail(payload.email);
    } catch (_) {
      dbError = true;
    }

    if (!dbError && user) {
      if (!user.isActive) {
        throw new Error('Account has been deactivated');
      }

      const passwordHash = (user as any).passwordHash as string | undefined;
      if (!passwordHash) {
        throw new Error('Invalid email or password');
      }

      const isValidPassword = await bcrypt.compare(payload.password, passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      await userRepository.updateLastLogin(user.id);

      const token = this.generateToken(user);
      return {
        user: this.sanitizeUser(user),
        token,
        expiresIn: this.getExpiresInSeconds()
      };
    }

    // Fallback path ONLY when DB is unavailable and explicitly enabled
    if (dbError) {
      if (!ENABLE_FALLBACK_AUTH) {
        throw new Error('Authentication service unavailable');
      }

      const fallback = this.fallbackUsers.find(f => f.email.toLowerCase() === payload.email.toLowerCase());
      if (!fallback) {
        throw new Error('Invalid email or password');
      }
      const ok = payload.password === fallback.password;
      if (!ok) {
        throw new Error('Invalid email or password');
      }
      const token = this.generateToken(fallback.user);
      return {
        user: this.sanitizeUser(fallback.user),
        token,
        expiresIn: this.getExpiresInSeconds()
      };
    }

    // If DB is reachable but user not found, standard failure
    throw new Error('Invalid email or password');
  }

  generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles?.map(r => r.name) || []
    };

    return jwt.sign(payload, JWT_SECRET as Secret, {
      expiresIn: JWT_EXPIRES_IN as string
    } as SignOptions);
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const decoded = this.verifyToken(token);
      // Try DB first
      const dbUser = await userRepository.findById(decoded.userId);
      if (dbUser) return dbUser;

      if (!ENABLE_FALLBACK_AUTH) return null;

      // Fallback by email only when fallback auth is enabled
      const fb = this.fallbackUsers.find(f => f.user.email.toLowerCase() === decoded.email.toLowerCase());
      return fb ? fb.user : null;
    } catch (error) {
      if (!ENABLE_FALLBACK_AUTH) return null;

      // Try fallback solely from token email
      try {
        const decoded = this.verifyToken(token);
        const fb = this.fallbackUsers.find(f => f.user.email.toLowerCase() === decoded.email.toLowerCase());
        return fb ? fb.user : null;
      } catch (_) {
        // ignore
      }
      return null;
    }
  }

  private getExpiresInSeconds(): number {
    const match = JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // Default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    return value * multipliers[unit];
  }
}

export const authService = new AuthService();
