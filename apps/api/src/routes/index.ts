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
import { documentUpload } from '../services/storage';

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

// 2. Vehicle Asset Management (Strictly Scoped)
router.post('/vehicles', requireAuth, VehicleController.create);
router.get('/vehicles', requireAuth, VehicleController.listAll);
router.get('/vehicles/:id', requireAuth, VehicleController.getById);
router.get('/organizations/:organizationId/vehicles', requireAuth, VehicleController.listByOrganization);

// 3. Trips & Khata Economics (Strictly Scoped)
router.post('/trips', requireAuth, TripController.create);
router.get('/trips', requireAuth, TripController.listAll);
router.post('/trips/:id/expenses', requireAuth, TripController.addExpense);
router.get('/trips/:id/finance', requireAuth, TripController.getFinanceSummary);
router.post('/trips/:id/pod-settle', requireAuth, TripController.settlePod);
router.post('/trips/:tripToken/pod', documentUpload.single('file'), TripController.uploadPod);
router.post('/trips/backhaul-breakeven', requireAuth, TripController.calculateBackhaul);

// 4. Fuel Theft & Variance Audit
router.post('/fuel-audit/trip-audit', requireAuth, FuelAuditController.auditTrip);
router.post('/fuel-audit/multi-pump-reconcile', requireAuth, FuelAuditController.reconcileMultiPump);
router.post('/fuel-audit/siphon-check', requireAuth, FuelAuditController.checkSiphoning);

// 5. Statutory Compliance Watchdogs & Vault
router.post('/compliance/documents', requireAuth, ComplianceController.createDocument);
router.get('/compliance/documents', requireAuth, ComplianceController.listAll);
router.post('/compliance/documents/:id/verify-pin', requireAuth, ComplianceController.verifyPinAndRetrieve);
router.get('/compliance/vehicles/:vehicleId/watchdog', requireAuth, ComplianceController.runWatchdogForVehicle);

// Encrypted Document Vault (Neon Object Storage / S3)
router.post('/vault/upload', requireAuth, documentUpload.single('file'), VaultController.uploadDocument);
router.post('/vault/unlock', requireAuth, VaultController.unlockVault);
router.get('/vault/file/:fileName', requireAuth, VaultController.getFile);

// 6. AIS-140 Telematics & Live Fleet Tracking
router.post('/telematics/ping', TelematicsController.ingestPing);
router.post('/telematics/ais140', TelematicsController.postAis140);
router.post('/telematics/driver-ping', TelematicsController.postDriverPing);
router.get('/telematics/driver-trip/:tripToken', TelematicsController.getDriverTrip);
router.get('/telematics/live-fleet', requireAuth, TelematicsController.getLiveFleet);
router.get('/telematics/truck/:imei', requireAuth, TelematicsController.getTruckByImei);
router.post('/telematics/simulate-step', requireAuth, TelematicsController.simulateStep);
router.post('/telematics/simulate-siphoning', requireAuth, TelematicsController.simulateSiphoning);

// 7. Double-Entry Ledger
router.get('/ledger/journal-entries', requireAuth, LedgerController.listAll);
router.get('/ledger/trips/:tripId/journal-entries', requireAuth, LedgerController.getTripJournals);
router.get('/ledger/trial-balance', requireAuth, LedgerController.getTrialBalance);

// 8. OCR Extraction
router.post('/ocr/extract', requireAuth, OcrController.extract);

// 9. Corridor Routing Economics (Public highway directory)
router.get('/corridors', CorridorController.list);
router.get('/corridors/:key', CorridorController.getDetails);

// 10. Freight Marketplace & Load Board (Realtime SSE Stream + REST)
router.get('/loads/stream', MarketplaceController.streamLoads);
router.get('/loads', requireAuth, MarketplaceController.listLoads);
router.post('/loads', requireAuth, MarketplaceController.createLoad);
router.post('/loads/:id/book', requireAuth, MarketplaceController.bookLoad);
router.get('/preferred-lanes', requireAuth, MarketplaceController.getPreferredLanes);
router.post('/preferred-lanes', requireAuth, MarketplaceController.savePreferredLanes);

// 11. In-App Call Logs & Dialer Ledger
router.get('/call-logs', requireAuth, CallLogController.list);
router.post('/call-logs', requireAuth, CallLogController.create);
router.delete('/call-logs/:id', requireAuth, CallLogController.delete);

// 12. Government RTO & KYC Verifications (VAHAN, Sarathi, KYC)
router.post('/verify/vahan', requireAuth, VerificationController.verifyVahan);
router.post('/verify/sarathi', requireAuth, VerificationController.verifySarathi);
router.post('/verify/kyc', requireAuth, VerificationController.verifyKyc);
router.get('/verify/records', requireAuth, VerificationController.listRecords);

// 13. Balance Bhaada Sentinel (POD Escrow & Debt Recovery)
router.get('/pod-claims', requireAuth, PodBalanceController.list);
router.post('/pod-claims', requireAuth, PodBalanceController.create);
router.post('/pod-claims/:id/legal-notice', requireAuth, PodBalanceController.generateLegalNotice);
router.post('/pod-claims/:id/settle', requireAuth, PodBalanceController.settle);

// 14. Yatra-Mitra Multimodal AI Voice Copilot
router.post('/ai/chat', requireAuth, AiController.chat);

export default router;
