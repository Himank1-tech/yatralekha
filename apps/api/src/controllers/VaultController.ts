import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { StorageService } from '../services/StorageService';
import { ComplianceRepository, OrganizationRepository, MemoryStore } from '../repositories';
import { AuthService } from '../services/AuthService';
import { DocumentType } from '../types/domain';
import { Database } from '../database';
import path from 'path';

export class VaultController {
  /**
   * POST /api/v1/vault/upload
   * Uploads an encrypted statutory document (RC, Permit, Fitness, Insurance, PUC)
   */
  public static async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { vehicleId, documentType, documentNumber, issueDate, expiryDate, pin } = req.body;
      const orgId = req.user?.organizationId || req.body.organizationId;

      if (!orgId) {
        res.status(401).json({ error: 'Unauthorized: missing organization context' });
        return;
      }

      if (!file) {
        res.status(400).json({ error: 'No file uploaded. Please upload a PDF, PNG, or JPG document.' });
        return;
      }

      if (!vehicleId || !documentType) {
        res.status(400).json({ error: 'Missing required document fields: vehicleId, documentType' });
        return;
      }

      // Hash PIN or use default
      const pinToUse = pin || '1234';
      const pinHash = await AuthService.hashPassword(pinToUse);

      // Upload file via StorageService (S3 or Local fallback)
      const uploadResult = await StorageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        orgId
      );

      // Create document record in repository
      const doc = ComplianceRepository.createDocument({
        organizationId: orgId,
        vehicleId,
        documentType: documentType as DocumentType,
        documentNumber: documentNumber || `DOC-${Date.now()}`,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 3600 * 1000),
        encryptedFileStoragePath: uploadResult.url,
        pinHash,
        pinSalt: 'salt_v2',
        isVerified: true
      });

      // Save into PostgreSQL database if connected
      try {
        if (process.env.DATABASE_URL) {
          const pool = Database.getPool();
          await pool.query(
            `INSERT INTO statutory_documents 
              (organization_id, vehicle_id, document_type, document_number, issue_date, expiry_date, encrypted_file_storage_path, pin_hash, pin_salt, mime_type, file_size_bytes, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
             ON CONFLICT DO NOTHING`,
            [
              orgId,
              vehicleId,
              documentType,
              doc.documentNumber,
              doc.issueDate,
              doc.expiryDate,
              uploadResult.url,
              pinHash,
              'salt_v2',
              file.mimetype,
              file.size
            ]
          );
        }
      } catch (dbErr: any) {
        console.warn('[VaultController.uploadDocument] DB insert notice:', dbErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Document uploaded and encrypted in vault.',
        data: {
          id: doc.id,
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          expiryDate: doc.expiryDate,
          fileUrl: uploadResult.url
        }
      });
    } catch (err: any) {
      console.error('[VaultController.uploadDocument] Error:', err);
      res.status(500).json({ error: err.message || 'Failed to upload and store document' });
    }
  }

  /**
   * POST /api/v1/vault/unlock
   * Validates PIN and unlocks the statutory documents with preview/download URLs
   */
  public static async unlockVault(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { pin } = req.body;
      const orgId = req.user?.organizationId || req.body.organizationId;

      if (!orgId) {
        res.status(401).json({ error: 'Unauthorized: missing organization context' });
        return;
      }

      if (!pin) {
        res.status(400).json({ error: 'PIN is required to unlock the compliance vault.' });
        return;
      }

      // Check organization PIN or default demo PIN
      const org = OrganizationRepository.findById(orgId);
      let isValidPin = false;

      if (org?.vaultPinHash) {
        isValidPin = await AuthService.comparePassword(pin, org.vaultPinHash) || pin === '1234';
      } else {
        isValidPin = pin === '1234' || pin === '0000';
      }

      if (!isValidPin) {
        res.status(401).json({
          success: false,
          error: 'Galat PIN! Please enter the correct 4-digit Transporter Vault PIN (Default Demo PIN: 1234).'
        });
        return;
      }

      // Retrieve documents for this organization
      const allDocs = Array.from(MemoryStore.documents.values()).filter(
        (d) => d.organizationId === orgId
      );

      res.json({
        success: true,
        unlocked: true,
        message: 'Vault successfully unlocked.',
        documents: allDocs.map((d) => ({
          id: d.id,
          vehicleId: d.vehicleId,
          documentType: d.documentType,
          documentNumber: d.documentNumber,
          issueDate: d.issueDate,
          expiryDate: d.expiryDate,
          isVerified: d.isVerified,
          downloadUrl: d.encryptedFileStoragePath
        }))
      });
    } catch (err: any) {
      console.error('[VaultController.unlockVault] Error:', err);
      res.status(500).json({ error: err.message || 'Failed to unlock compliance vault' });
    }
  }

  /**
   * GET /api/v1/vault/file/:fileName
   * Serves local fallback files securely
   */
  public static async getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileName } = req.params;
      const { filePath, exists } = StorageService.getLocalFile(fileName);

      if (!exists) {
        res.status(404).json({ error: 'Document file not found' });
        return;
      }

      res.sendFile(filePath);
    } catch (err: any) {
      res.status(500).json({ error: 'Could not stream file' });
    }
  }
}
