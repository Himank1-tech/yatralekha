import { Router } from 'express';
import multer from 'multer';
import { OrganizationController } from '../controllers/OrganizationController';
import { VehicleController } from '../controllers/VehicleController';
import { TripController } from '../controllers/TripController';
import { FuelAuditController } from '../controllers/FuelAuditController';
import { ComplianceController } from '../controllers/ComplianceController';
import { TelematicsController } from '../controllers/TelematicsController';
import { LedgerController } from '../controllers/LedgerController';
import { OcrController } from '../controllers/OcrController';
import { CorridorController } from '../controllers/CorridorController';
import { MarketplaceController } from '../controllers/MarketplaceController';
import { CallLogController } from '../controllers/CallLogController';
import { VerificationController } from '../controllers/VerificationController';
import { PodBalanceController } from '../controllers/PodBalanceController';
import { AuthController } from '../controllers/AuthController';
import { VaultController } from '../controllers/VaultController';
import { AiController } from '../controllers/AiController';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';

const router: Router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// 0. Multi-Tenant Authentication & Session Management
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/demo-sandbox', AuthController.demoSandbox);
router.get('/auth/me', requireAuth, AuthController.getMe);

// 1. Organization Management
router.post('/organizations', OrganizationController.create);
router.get('/organizations', OrganizationController.list);
router.get('/organizations/:id', OrganizationController.getById);

// 2. Vehicle Asset Management (Scoped)
router.post('/vehicles', optionalAuth, VehicleController.create);
router.get('/vehicles', optionalAuth, VehicleController.listAll);
router.get('/vehicles/:id', VehicleController.getById);
router.get('/organizations/:organizationId/vehicles', VehicleController.listByOrganization);

// 3. Trips & Khata Economics (Scoped)
router.post('/trips', optionalAuth, TripController.create);
router.get('/trips', optionalAuth, TripController.listAll);
router.post('/trips/:id/expenses', TripController.addExpense);
router.get('/trips/:id/finance', TripController.getFinanceSummary);
router.post('/trips/:id/pod-settle', TripController.settlePod);
router.post('/trips/backhaul-breakeven', TripController.calculateBackhaul);

// 4. Fuel Theft & Variance Audit
router.post('/fuel-audit/trip-audit', FuelAuditController.auditTrip);
router.post('/fuel-audit/multi-pump-reconcile', FuelAuditController.reconcileMultiPump);
router.post('/fuel-audit/siphon-check', FuelAuditController.checkSiphoning);

// 5. Statutory Compliance Watchdogs & Vault
router.post('/compliance/documents', optionalAuth, ComplianceController.createDocument);
router.get('/compliance/documents', optionalAuth, ComplianceController.listAll);
router.post('/compliance/documents/:id/verify-pin', ComplianceController.verifyPinAndRetrieve);
router.get('/compliance/vehicles/:vehicleId/watchdog', ComplianceController.runWatchdogForVehicle);

// Encrypted Document Vault
router.post('/vault/upload', optionalAuth, upload.single('file'), VaultController.uploadDocument);
router.post('/vault/unlock', optionalAuth, VaultController.unlockVault);
router.get('/vault/file/:fileName', VaultController.getFile);

// 6. AIS-140 Telematics & Live Fleet Tracking
router.post('/telematics/ping', TelematicsController.ingestPing);
router.post('/telematics/ais140', TelematicsController.postAis140);
router.post('/telematics/driver-ping', TelematicsController.postDriverPing);
router.get('/telematics/driver-trip/:tripToken', TelematicsController.getDriverTrip);
router.get('/telematics/live-fleet', TelematicsController.getLiveFleet);
router.get('/telematics/truck/:imei', TelematicsController.getTruckByImei);
router.post('/telematics/simulate-step', TelematicsController.simulateStep);
router.post('/telematics/simulate-siphoning', TelematicsController.simulateSiphoning);

// 7. Double-Entry Ledger
router.get('/ledger/journal-entries', optionalAuth, LedgerController.listAll);
router.get('/ledger/trips/:tripId/journal-entries', LedgerController.getTripJournals);
router.get('/ledger/trial-balance', optionalAuth, LedgerController.getTrialBalance);

// 8. OCR Extraction
router.post('/ocr/extract', OcrController.extract);

// 9. Corridor Routing Economics
router.get('/corridors', CorridorController.list);
router.get('/corridors/:key', CorridorController.getDetails);

// 10. Freight Marketplace & Load Board (Shared across all verified orgs)
router.get('/loads', MarketplaceController.listLoads);
router.post('/loads', optionalAuth, MarketplaceController.createLoad);
router.post('/loads/:id/book', optionalAuth, MarketplaceController.bookLoad);
router.get('/preferred-lanes', optionalAuth, MarketplaceController.getPreferredLanes);
router.post('/preferred-lanes', optionalAuth, MarketplaceController.savePreferredLanes);

// 11. In-App Call Logs & Dialer Ledger
router.get('/call-logs', optionalAuth, CallLogController.list);
router.post('/call-logs', optionalAuth, CallLogController.create);
router.delete('/call-logs/:id', CallLogController.delete);

// 12. Government RTO & KYC Verifications (VAHAN, Sarathi, KYC)
router.post('/verify/vahan', VerificationController.verifyVahan);
router.post('/verify/sarathi', VerificationController.verifySarathi);
router.post('/verify/kyc', VerificationController.verifyKyc);
router.get('/verify/records', optionalAuth, VerificationController.listRecords);

// 13. Balance Bhaada Sentinel (POD Escrow & Debt Recovery)
router.get('/pod-claims', optionalAuth, PodBalanceController.list);
router.post('/pod-claims', optionalAuth, PodBalanceController.create);
router.post('/pod-claims/:id/legal-notice', PodBalanceController.generateLegalNotice);
router.post('/pod-claims/:id/settle', PodBalanceController.settle);

// 14. Yatra-Mitra Multimodal AI Voice Copilot
router.post('/ai/chat', optionalAuth, AiController.chat);

export default router;
