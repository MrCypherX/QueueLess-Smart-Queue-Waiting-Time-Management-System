import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { RegisterSchema, LoginSchema, User } from '../../../shared/schemas';
import { validateBody } from '../middleware/validate';
import { generateToken, requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validateBody(RegisterSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, full_name, phone, role } = req.body;

      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const insertRes = await query<User>(
        `INSERT INTO users (email, password_hash, full_name, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, full_name, phone, role, created_at, updated_at`,
        [email.toLowerCase(), passwordHash, full_name, phone || null, role || 'citizen']
      );

      const newUser = insertRes.rows[0];
      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        data: {
          user: newUser,
          token,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  validateBody(LoginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const userRes = await query<User & { password_hash: string }>(
        `SELECT id, email, password_hash, full_name, phone, role, created_at, updated_at
         FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (userRes.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        });
        return;
      }

      const user = userRes.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        });
        return;
      }

      const { password_hash, ...safeUser } = user;
      const token = generateToken(safeUser);

      res.json({
        success: true,
        data: {
          user: safeUser,
          token,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
    }
  }
);

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRes = await query<User>(
      `SELECT id, email, full_name, phone, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user!.id]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: userRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch current user' });
  }
});

export default router;
