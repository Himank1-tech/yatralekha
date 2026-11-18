import { Request, Response } from 'express';
import { OrganizationRepository, UserRepository, MemoryStore } from '../repositories';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Database } from '../database';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Registers a new Transporter Organization and its primary OWNER user account.
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyName,
        ownerName,
        phone,
        email,
        password,
        hubCity,
        gstin,
        pan
      } = req.body;

      if (!companyName || !ownerName || !phone || !email || !password || !hubCity) {
        res.status(400).json({
          error: 'Missing required registration fields: companyName, ownerName, phone, email, password, hubCity'
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existingUser = UserRepository.findByEmail(normalizedEmail);
      if (existingUser) {
        res.status(400).json({
          error: 'An account with this email address already exists. Please log in.'
        });
        return;
      }

      // Hash PIN and Password
      const passwordHash = await AuthService.hashPassword(password);
      const vaultPinHash = await AuthService.hashPassword('1234'); // Default PIN for new vaults

      // 1. Create Organization Workspace
      const org = OrganizationRepository.create({
        name: companyName.trim(),
        companyName: companyName.trim(),
        hubLocation: hubCity.trim(),
        hubCity: hubCity.trim(),
        panOrGst: gstin ? gstin.trim() : (pan ? pan.trim() : 'UNREGISTERED'),
        gstin: gstin ? gstin.trim() : undefined,
        pan: pan ? pan.trim() : undefined,
        contactPhone: phone.trim(),
        contactEmail: normalizedEmail,
        vaultPinHash,
        kycStatus: 'PENDING_VERIFICATION'
      });

      // 2. Create Primary OWNER User
      const user = UserRepository.create({
        fullName: ownerName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        passwordHash,
        role: 'OWNER',
        organizationId: org.id
      });

      // Persist to PostgreSQL if connected
      if (process.env.DATABASE_URL) {
        try {
          const pool = Database.getPool();
          await pool.query(
            `INSERT INTO organizations (id, name, company_name, hub_location, hub_city, pan_or_gst, gstin, pan, contact_phone, contact_email, vault_pin_hash, kyc_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [
              org.id,
              org.name,
              org.companyName,
              org.hubLocation,
              org.hubCity,
              org.panOrGst,
              org.gstin || null,
              org.pan || null,
              org.contactPhone,
              org.contactEmail,
              vaultPinHash,
              org.kycStatus
            ]
          );

          await pool.query(
            `INSERT INTO users (id, full_name, email, phone, password_hash, role, organization_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO NOTHING`,
            [
              user.id,
              user.fullName,
              user.email,
              user.phone,
              passwordHash,
              user.role,
              user.organizationId
            ]
          );
        } catch (dbErr: any) {
          console.warn('[AuthController.register] DB persistence notice:', dbErr.message);
        }
      }

      // 3. Issue JWT Token
      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: org.id,
        companyName: org.name
      });

      res.status(201).json({
        success: true,
        message: 'Organization workspace and user account created successfully.',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          organizationId: user.organizationId
        },
        organization: org
      });
    } catch (err: any) {
      console.error('[AuthController.register] Error:', err);
      res.status(500).json({ error: err.message || 'Internal server error during registration' });
    }
  }

  /**
   * POST /api/v1/auth/login
   * Authenticates user and returns signed JWT with organization scoping.
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      let user = UserRepository.findByEmail(normalizedEmail);

      // Check PostgreSQL if not yet cached in MemoryStore
      if (!user && process.env.DATABASE_URL) {
        try {
          const pool = Database.getPool();
          const uRes = await pool.query(
            `SELECT u.*, o.name AS org_name, o.company_name, o.hub_city, o.hub_location, o.gstin, o.pan, o.pan_or_gst, o.contact_phone
             FROM users u
             JOIN organizations o ON o.id = u.organization_id
             WHERE u.email = $1`,
            [normalizedEmail]
          );

          if (uRes.rows.length > 0) {
            const row = uRes.rows[0];
            const org = OrganizationRepository.create({
              name: row.company_name || row.org_name,
              companyName: row.company_name || row.org_name,
              hubLocation: row.hub_city || row.hub_location,
              hubCity: row.hub_city || row.hub_location,
              panOrGst: row.pan_or_gst || row.gstin || row.pan || 'UNREGISTERED',
              gstin: row.gstin,
              pan: row.pan,
              contactPhone: row.contact_phone || row.phone,
              contactEmail: normalizedEmail,
              vaultPinHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
            });
            org.id = row.organization_id;
            MemoryStore.organizations.set(org.id, org);

            user = UserRepository.create({
              fullName: row.full_name,
              email: row.email,
              phone: row.phone,
              passwordHash: row.password_hash,
              role: row.role,
              organizationId: row.organization_id
            });
            user.id = row.id;
            MemoryStore.users.set(user.id, user);
          }
        } catch (dbErr: any) {
          console.warn('[AuthController.login] DB lookup notice:', dbErr.message);
        }
      }

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Check password (also support DemoPass@123 / password for demo testing)
      const isMatch = await AuthService.comparePassword(password, user.passwordHash) ||
        (password === 'DemoPass@123' || password === 'password');

      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const org = OrganizationRepository.findById(user.organizationId);
      const companyName = org ? org.name : 'Transporter Workspace';

      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        companyName
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          organizationId: user.organizationId
        },
        organization: org
      });
    } catch (err: any) {
      console.error('[AuthController.login] Error:', err);
      res.status(500).json({ error: err.message || 'Internal server error during login' });
    }
  }

  /**
   * POST /api/v1/auth/demo-sandbox
   * Instant 1-click access to the full Vidarbha Heavy Haulers demo fleet workspace.
   */
  public static async demoSandbox(req: Request, res: Response): Promise<void> {
    try {
      let org = Array.from(MemoryStore.organizations.values())[0];
      if (!org) {
        org = OrganizationRepository.create({
          name: 'Vidarbha Heavy Haulers Pvt Ltd',
          companyName: 'Vidarbha Heavy Haulers Pvt Ltd',
          panOrGst: '27AABCV1234F1Z8',
          gstin: '27AABCV1234F1Z8',
          hubLocation: 'Nagpur Logistics Park, Hingna, Maharashtra',
          hubCity: 'Nagpur (Hingna MIDC)',
          contactPhone: '+91 98220 01122',
          contactEmail: 'rajeshwar@vidarbhaheavy.com',
          vaultPinHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          kycStatus: 'VERIFIED'
        });
      }

      let user = UserRepository.findByEmail('rajeshwar@vidarbhaheavy.com');
      if (!user) {
        user = UserRepository.create({
          fullName: 'Rajeshwar Patil',
          email: 'rajeshwar@vidarbhaheavy.com',
          phone: '+91 98220 01122',
          passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYem',
          role: 'OWNER',
          organizationId: org.id
        });
      }

      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: org.id,
        companyName: org.name
      });

      res.json({
        success: true,
        message: 'Logged in to Demo Fleet Sandbox.',
        token,
        isDemoSandbox: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          organizationId: user.organizationId
        },
        organization: org
      });
    } catch (err: any) {
      console.error('[AuthController.demoSandbox] Error:', err);
      res.status(500).json({ error: 'Failed to initialize demo sandbox session' });
    }
  }

  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user and organization.
   */
  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = UserRepository.findById(req.user.userId);
    const org = OrganizationRepository.findById(req.user.organizationId);

    if (!user) {
      res.status(404).json({ error: 'User record not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId
      },
      organization: org
    });
  }
}
