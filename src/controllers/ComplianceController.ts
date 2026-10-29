import { Request, Response } from 'express';
import { ComplianceRepository, VehicleRepository, MemoryStore } from '../repositories';
import { ComplianceWatchdog } from '../services/ComplianceWatchdog';
import { DocumentSecurityService } from '../services/DocumentSecurityService';
import { DocumentType } from '../types/domain';

export class ComplianceController {
  public static listAll(req: Request, res: Response): void {
    const list = Array.from(MemoryStore.documents.values()).map((doc) => {
      const vehicle = VehicleRepository.findById(doc.vehicleId);
      const vehicleRegDate = vehicle?.createdAt || new Date('2022-01-01');
      const evalResult = ComplianceWatchdog.evaluateDocument({
        documentType: doc.documentType,
        vehicleRegistrationDate: vehicleRegDate,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate
      });
      return {
        ...doc,
        vehicleRegNo: vehicle?.registrationNumber || 'MH 40 AK 9988',
        evaluation: evalResult
      };
    });
    res.json({ success: true, count: list.length, data: list });
  }

  public static createDocument(req: Request, res: Response): void {
    try {
      const {
        organizationId,
        vehicleId,
        documentType,
        documentNumber,
        issueDate,
        expiryDate,
        encryptedFileStoragePath,
        accessPin
      } = req.body;

      if (
        !organizationId ||
        !vehicleId ||
        !documentType ||
        !issueDate ||
        !expiryDate ||
        !encryptedFileStoragePath ||
        !accessPin
      ) {
        res.status(400).json({
          error:
            'Missing required compliance document fields: organizationId, vehicleId, documentType, issueDate, expiryDate, encryptedFileStoragePath, accessPin'
        });
        return;
      }

      // Hash PIN using PBKDF2/SHA-512 with cryptographically random salt
      const pinCreds = DocumentSecurityService.hashDocumentPin(String(accessPin));

      const doc = ComplianceRepository.createDocument({
        organizationId,
        vehicleId,
        documentType: documentType as DocumentType,
        documentNumber,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        encryptedFileStoragePath,
        pinHash: pinCreds.pinHash,
        pinSalt: pinCreds.salt,
        isVerified: true
      });

      res.status(201).json({
        success: true,
        data: {
          id: doc.id,
          vehicleId: doc.vehicleId,
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          issueDate: doc.issueDate,
          expiryDate: doc.expiryDate,
          isVerified: doc.isVerified
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static verifyPinAndRetrieve(req: Request, res: Response): void {
    try {
      const docId = req.params.id as string;
      const { pin } = req.body;

      if (!pin) {
        res.status(400).json({ error: 'PIN is required to access secured document' });
        return;
      }

      const doc = ComplianceRepository.findById(docId);
      if (!doc) {
        res.status(404).json({ error: `Statutory document ${docId} not found` });
        return;
      }

      const isValid = DocumentSecurityService.verifyDocumentPin(String(pin), doc.pinHash, doc.pinSalt);
      if (!isValid) {
        res.status(401).json({ error: 'ACCESS DENIED: Invalid document PIN' });
        return;
      }

      res.json({
        success: true,
        message: 'PIN verified successfully',
        data: {
          documentId: doc.id,
          documentType: doc.documentType,
          filePath: doc.encryptedFileStoragePath
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static runWatchdogForVehicle(req: Request, res: Response): void {
    try {
      const vehicleId = req.params.vehicleId as string;
      const vehicle = VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        res.status(404).json({ error: `Vehicle ${vehicleId} not found` });
        return;
      }

      const docs = ComplianceRepository.listByVehicle(vehicleId);
      const vehicleRegDate = vehicle.createdAt; // Benchmark registration date

      const evaluations = docs.map((doc) => {
        return ComplianceWatchdog.evaluateDocument({
          documentType: doc.documentType,
          vehicleRegistrationDate: vehicleRegDate,
          issueDate: doc.issueDate,
          expiryDate: doc.expiryDate
        });
      });

      const hasCriticalExpired = evaluations.some((e) => e.alertTier === 'EXPIRED');
      const hasExpiringSoon = evaluations.some((e) => e.isExpiringSoon);

      res.json({
        success: true,
        vehicleId,
        registrationNumber: vehicle.registrationNumber,
        complianceStatus: hasCriticalExpired ? 'NON_COMPLIANT_GROUNDED' : hasExpiringSoon ? 'WARNING_EXPIRING_SOON' : 'FULLY_COMPLIANT',
        documentsAudited: evaluations.length,
        evaluations
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
