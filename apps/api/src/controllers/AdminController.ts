import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Database } from '../database';
import { MemoryStore } from '../repositories';

export class AdminController {
  /**
   * GET /api/v1/admin/overview
   * Strict Creator-Only analytics & platform monitoring overview
   */
  public static async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (process.env.DATABASE_URL) {
        const pool = Database.getPool();

        // 1. Total platform count aggregation
        const countRes = await pool.query(`
          SELECT
            (SELECT COUNT(*)::int FROM organizations) AS total_organizations,
            (SELECT COUNT(*)::int FROM users) AS total_users,
            (SELECT COUNT(*)::int FROM vehicles) AS total_vehicles,
            (SELECT COUNT(*)::int FROM trips) AS total_trips,
            (SELECT COUNT(*)::int FROM freight_loads) AS total_loads
        `);

        // 2. Detailed list of all registered organizations joined with primary users & counts
        const orgsRes = await pool.query(`
          SELECT 
            o.id,
            COALESCE(o.company_name, o.name) AS company_name,
            COALESCE(o.hub_city, o.hub_location) AS hub_city,
            o.pan_or_gst,
            o.gstin,
            o.kyc_status,
            o.created_at AS signup_date,
            u.id AS owner_user_id,
            u.full_name AS owner_name,
            u.email AS owner_email,
            u.phone AS owner_phone,
            u.role AS owner_role,
            (SELECT COUNT(*)::int FROM vehicles v WHERE v.organization_id = o.id) AS vehicle_count,
            (SELECT COUNT(*)::int FROM trips t WHERE t.organization_id = o.id) AS trip_count
          FROM organizations o
          LEFT JOIN LATERAL (
            SELECT id, full_name, email, phone, role
            FROM users u
            WHERE u.organization_id = o.id
            ORDER BY (CASE WHEN u.role = 'OWNER' THEN 0 ELSE 1 END), u.created_at ASC
            LIMIT 1
          ) u ON true
          ORDER BY o.created_at DESC
        `);

        res.json({
          success: true,
          data: {
            stats: {
              totalOrganizations: countRes.rows[0]?.total_organizations || 0,
              totalUsers: countRes.rows[0]?.total_users || 0,
              totalVehicles: countRes.rows[0]?.total_vehicles || 0,
              totalTrips: countRes.rows[0]?.total_trips || 0,
              totalLoads: countRes.rows[0]?.total_loads || 0,
            },
            organizations: orgsRes.rows.map((row: any) => ({
              id: row.id,
              companyName: row.company_name,
              hubCity: row.hub_city,
              panOrGst: row.pan_or_gst,
              gstin: row.gstin,
              kycStatus: row.kyc_status,
              signupDate: row.signup_date,
              ownerName: row.owner_name || 'N/A',
              ownerEmail: row.owner_email || 'N/A',
              ownerPhone: row.owner_phone || 'N/A',
              ownerRole: row.owner_role || 'OWNER',
              vehicleCount: Number(row.vehicle_count || 0),
              tripCount: Number(row.trip_count || 0)
            }))
          }
        });
        return;
      }

      // Memory Store fallback if DB not attached
      const orgList = Array.from(MemoryStore.organizations.values()).map((org) => {
        const users = Array.from(MemoryStore.users.values()).filter((u) => u.organizationId === org.id);
        const owner = users.find((u) => u.role === 'OWNER') || users[0];
        const vehicleCount = Array.from(MemoryStore.vehicles.values()).filter((v) => v.organizationId === org.id).length;
        const tripCount = Array.from(MemoryStore.trips.values()).filter((t) => t.organizationId === org.id).length;

        return {
          id: org.id,
          companyName: org.companyName || org.name,
          hubCity: org.hubCity || org.hubLocation,
          panOrGst: org.panOrGst,
          gstin: org.gstin,
          kycStatus: org.kycStatus || 'VERIFIED',
          signupDate: org.createdAt,
          ownerName: owner?.fullName || 'N/A',
          ownerEmail: owner?.email || 'N/A',
          ownerPhone: owner?.phone || 'N/A',
          ownerRole: owner?.role || 'OWNER',
          vehicleCount,
          tripCount
        };
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalOrganizations: MemoryStore.organizations.size,
            totalUsers: MemoryStore.users.size,
            totalVehicles: MemoryStore.vehicles.size,
            totalTrips: MemoryStore.trips.size,
            totalLoads: MemoryStore.loads.size,
          },
          organizations: orgList
        }
      });
    } catch (err: any) {
      console.error('[AdminController.getOverview] Error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to load creator overview' });
    }
  }
}
