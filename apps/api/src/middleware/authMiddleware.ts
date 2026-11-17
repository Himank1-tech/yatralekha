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
