import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/AuthService';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Strict authentication middleware.
 * Verifies JWT and injects `req.user`, strictly scoping requests to `req.user.organizationId`.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Bearer token. Please log in.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired session token. Please log in again.'
    });
  }
}

/**
 * Optional authentication middleware.
 * Populates `req.user` if a valid token is present; otherwise falls back to demo organization.
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = AuthService.verifyToken(token);
    } catch {
      // Ignore invalid optional tokens
    }
  }

  next();
}

/**
 * Strict Creator Admin authentication middleware.
 * Verifies JWT and asserts req.user.email strictly matches process.env.CREATOR_EMAIL (default: 'himankbatra2005@gmail.com').
 * Returns 403 Forbidden for any other user.
 */
export function requireCreatorAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const creatorEmail = (process.env.CREATOR_EMAIL || 'himankbatra2005@gmail.com').trim().toLowerCase();
    const userEmail = req.user?.email?.trim().toLowerCase();

    if (!userEmail || userEmail !== creatorEmail) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Access denied. Only the platform creator can view the Creator Control Room.'
      });
      return;
    }

    next();
  });
}
