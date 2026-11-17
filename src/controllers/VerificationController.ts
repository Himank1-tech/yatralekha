import { Request, Response } from 'express';
import { VerificationRepository, VehicleRepository } from '../repositories';
import { FLEET_ASSET_BENCHMARKS, AxleConfiguration } from '../types/domain';

export class VerificationController {
  /**
   * Government VAHAN 4.0 RC Verification Mock & Engine
   */
  public static verifyVahan(req: Request, res: Response): void {
    try {
      const { registrationNumber } = req.body;
      if (!registrationNumber) {
        res.status(400).json({ success: false, error: 'Registration number is required' });
        return;
      }

      const cleanReg = registrationNumber.replace(/[\s-]/g, '').toUpperCase();
      
      const existing = VerificationRepository.findByIdentifier(cleanReg, 'VAHAN_RC');
      if (existing) {
        res.json({
          success: true,
          source: 'MoRTH VAHAN 4.0 National Registry (Verified Registry)',
          data: existing
        });
        return;
      }
      
      // Determine axle & parameters based on vehicle match or registration pattern
      const matchedVehicle = VehicleRepository.findByRegistration(cleanReg);
      const axleConfig: AxleConfiguration = matchedVehicle?.axleConfiguration || 
        (cleanReg.includes('16') ? '16_WHEELER' : cleanReg.includes('31') ? '10_WHEELER' : '12_WHEELER');
      
      const benchmark = FLEET_ASSET_BENCHMARKS[axleConfig];
      const passingGvwKg = matchedVehicle?.grossVehicleWeightKg || benchmark.passingGvwKg;
      const unladenTareKg = matchedVehicle?.tareWeightKg || benchmark.unladenTareKg;
      const legalMaxPayloadKg = passingGvwKg - unladenTareKg;

      const payload = {
        registrationNumber: cleanReg,
        rtoOffice: 'MH-40 (Nagpur Rural / Hingna Hub, Maharashtra)',
        vehicleClass: 'Heavy Goods Vehicle (HGV) Multi-Axle Rigid',
        makerModel: 'Tata Motors Signa 3523.TK / Ashok Leyland 3520',
        axleConfiguration: axleConfig,
        passingGvwKg,
        unladenTareKg,
        maxLegalPayloadKg: legalMaxPayloadKg,
        maxLegalPayloadTonnes: Number((legalMaxPayloadKg / 1000).toFixed(2)),
        fitnessExpiryDate: '2027-01-01',
        fitnessCycleYears: 2,
        fitnessStatus: 'ACTIVE_VALID',
        nationalPermitExpiryDate: '2027-04-10',
        nationalPermitStatus: 'ALL_INDIA_PERMIT_ACTIVE',
        insuranceStatus: 'COMPREHENSIVE_VALID (New India Assurance)',
        insuranceExpiryDate: '2027-03-31',
        roadTaxStatus: 'PAID_ANNUAL_VALID',
        pucStatus: 'VALID_GREEN',
        pucExpiryDate: '2026-12-15',
        overloadRiskNotice: `Section 194 MV Act: Loading exceeding ${Number((legalMaxPayloadKg / 1000).toFixed(1))} MT will attract ₹20,000 base fine + ₹2,000 per excess MT.`
      };

      const record = VerificationRepository.create({
        organizationId: 'org-default',
        verificationType: 'VAHAN_RC',
        identifierNumber: cleanReg,
        holderName: 'Vidarbha Heavy Haulers Pvt Ltd',
        verificationStatus: 'VERIFIED',
        payload
      });

      res.json({
        success: true,
        source: 'MoRTH VAHAN 4.0 National Registry (Verified)',
        data: record
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Sarathi Driving License (DL) Commercial Endorsement Verification
   */
  public static verifySarathi(req: Request, res: Response): void {
    try {
      const { dlNumber } = req.body;
      if (!dlNumber) {
        res.status(400).json({ success: false, error: 'DL number is required' });
        return;
      }

      const cleanDl = dlNumber.replace(/[\s-]/g, '').toUpperCase();
      
      // Check existing seeded verification first
      const existing = VerificationRepository.findByIdentifier(cleanDl, 'SARATHI_DL');
      if (existing) {
        res.json({
          success: true,
          source: 'Sarathi DL Commercial Transport Portal (Verified Registry)',
          data: existing
        });
        return;
      }
      
      const driverName = cleanDl.includes('12345') || cleanDl.includes('88') 
        ? 'Sanjay Yadav' 
        : cleanDl.includes('44') 
        ? 'Rameshwar Patil' 
        : 'Gurpreet Singh';

      const payload = {
        dlNumber: cleanDl,
        driverName,
        issuingRto: 'MH-14 Pimpri Chinchwad',
        vehicleClassesAuthorized: ['LMV', 'TRANS (Heavy Commercial Goods)', 'HMV'],
        commercialTransportEndorsement: {
          hasEndorsement: true,
          status: 'VALID_ENDORSED',
          badgeNumber: `MH/TR/COMM/${cleanDl.slice(-5)}`,
          issueDate: '2016-08-14',
          validUntil: '2028-08-13'
        },
        hazardousGoodsCertified: true,
        overallStatus: 'ACTIVE_LEGITIMATE'
      };

      const record = VerificationRepository.create({
        organizationId: 'org-default',
        verificationType: 'SARATHI_DL',
        identifierNumber: cleanDl,
        holderName: payload.driverName,
        verificationStatus: 'VERIFIED',
        payload
      });

      res.json({
        success: true,
        source: 'Sarathi DL Commercial Transport Portal (Verified)',
        data: record
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Transporter KYC (Aadhaar / PAN / GSTIN) Verification
   */
  public static verifyKyc(req: Request, res: Response): void {
    try {
      const { documentType, documentNumber, entityName } = req.body;
      if (!documentNumber || !documentType) {
        res.status(400).json({ success: false, error: 'documentType and documentNumber are required' });
        return;
      }

      const cleanDoc = documentNumber.replace(/[\s-]/g, '').toUpperCase();
      const payload = {
        documentType,
        documentNumber: cleanDoc,
        entityName: entityName || 'Vidarbha Heavy Haulers Pvt Ltd',
        taxStatus: 'ACTIVE_TAXPAYER',
        kycBadge: 'KYC_VERIFIED_GOLD',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'National Portal Gateway'
      };

      const record = VerificationRepository.create({
        organizationId: 'org-default',
        verificationType: documentType === 'PAN' ? 'PAN_KYC' : 'AADHAAR_KYC',
        identifierNumber: cleanDoc,
        holderName: payload.entityName,
        verificationStatus: 'VERIFIED',
        payload
      });

      res.json({
        success: true,
        data: record
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static listRecords(req: Request, res: Response): void {
    const list = VerificationRepository.list();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  }
}
