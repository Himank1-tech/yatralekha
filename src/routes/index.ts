import { Router } from 'express';
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

const router = Router();

// 1. Organization Management
router.post('/organizations', OrganizationController.create);
router.get('/organizations', OrganizationController.list);
router.get('/organizations/:id', OrganizationController.getById);

// 2. Vehicle Asset Management
router.post('/vehicles', VehicleController.create);
router.get('/vehicles', VehicleController.listAll);
router.get('/vehicles/:id', VehicleController.getById);
router.get('/organizations/:organizationId/vehicles', VehicleController.listByOrganization);

// 3. Trips & Khata Economics
router.post('/trips', TripController.create);
router.get('/trips', TripController.listAll);
router.post('/trips/:id/expenses', TripController.addExpense);
router.get('/trips/:id/finance', TripController.getFinanceSummary);
router.post('/trips/:id/pod-settle', TripController.settlePod);
router.post('/trips/backhaul-breakeven', TripController.calculateBackhaul);

// 4. Fuel Theft & Variance Audit
router.post('/fuel-audit/trip-audit', FuelAuditController.auditTrip);
router.post('/fuel-audit/multi-pump-reconcile', FuelAuditController.reconcileMultiPump);
router.post('/fuel-audit/siphon-check', FuelAuditController.checkSiphoning);

// 5. Statutory Compliance Watchdogs
router.post('/compliance/documents', ComplianceController.createDocument);
router.get('/compliance/documents', ComplianceController.listAll);
router.post('/compliance/documents/:id/verify-pin', ComplianceController.verifyPinAndRetrieve);
router.get('/compliance/vehicles/:vehicleId/watchdog', ComplianceController.runWatchdogForVehicle);

// 6. AIS-140 Telematics & Live Fleet Tracking
router.post('/telematics/ping', TelematicsController.ingestPing);
router.get('/telematics/live-fleet', TelematicsController.getLiveFleet);
router.get('/telematics/truck/:imei', TelematicsController.getTruckByImei);
router.post('/telematics/simulate-step', TelematicsController.simulateStep);
router.post('/telematics/simulate-siphoning', TelematicsController.simulateSiphoning);

// 7. Double-Entry Ledger
router.get('/ledger/journal-entries', LedgerController.listAll);
router.get('/ledger/trips/:tripId/journal-entries', LedgerController.getTripJournals);
router.get('/ledger/trial-balance', LedgerController.getTrialBalance);

// 8. OCR Extraction
router.post('/ocr/extract', OcrController.extract);

// 9. Corridor Routing Economics
router.get('/corridors', CorridorController.list);
router.get('/corridors/:key', CorridorController.getDetails);

// 10. Freight Marketplace & Load Board
router.get('/loads', MarketplaceController.listLoads);
router.post('/loads', MarketplaceController.createLoad);
router.post('/loads/:id/book', MarketplaceController.bookLoad);
router.get('/preferred-lanes', MarketplaceController.getPreferredLanes);
router.post('/preferred-lanes', MarketplaceController.savePreferredLanes);

// 11. In-App Call Logs & Dialer Ledger
router.get('/call-logs', CallLogController.list);
router.post('/call-logs', CallLogController.create);
router.delete('/call-logs/:id', CallLogController.delete);

// 12. Government RTO & KYC Verifications (VAHAN, Sarathi, KYC)
router.post('/verify/vahan', VerificationController.verifyVahan);
router.post('/verify/sarathi', VerificationController.verifySarathi);
router.post('/verify/kyc', VerificationController.verifyKyc);
router.get('/verify/records', VerificationController.listRecords);

// 13. Balance Bhaada Sentinel (POD Escrow & Debt Recovery)
router.get('/pod-claims', PodBalanceController.list);
router.post('/pod-claims', PodBalanceController.create);
router.post('/pod-claims/:id/legal-notice', PodBalanceController.generateLegalNotice);
router.post('/pod-claims/:id/settle', PodBalanceController.settle);

export default router;
