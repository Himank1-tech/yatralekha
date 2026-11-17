import {
  DocumentType,
  ComplianceAlertTier,
  ComplianceEvaluationResult,
  DocumentVerificationInput
} from '../types/domain';

export class ComplianceWatchdog {
  private static readonly MS_PER_DAY = 1000 * 60 * 60 * 24;

  /**
   * Evaluates statutory document validity and generates watchdog alert tiers:
   * 30 days, 15 days, 3 days, and EXPIRED.
   */
  public static evaluateDocument(input: DocumentVerificationInput): ComplianceEvaluationResult {
    const now = input.currentDate ?? new Date();
    const expiry = new Date(input.expiryDate);
    const issue = new Date(input.issueDate);
    const regDate = new Date(input.vehicleRegistrationDate);

    // Calculate vehicle age in fractional years at document issue date
    const vehicleAgeMs = issue.getTime() - regDate.getTime();
    const vehicleAgeYears = Math.max(0, vehicleAgeMs / (this.MS_PER_DAY * 365.25));

    // Calculate days remaining to expiry
    const timeRemainingMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemainingMs / this.MS_PER_DAY);

    // Evaluate statutory cycle expectations
    const { isValidityCycleValid, expectedCycleDescription } = this.checkStatutoryCycle(
      input.documentType,
      vehicleAgeYears,
      issue,
      expiry
    );

    // Determine alert tier
    let alertTier: ComplianceAlertTier;
    let isExpiringSoon = false;

    if (daysRemaining <= 0) {
      alertTier = 'EXPIRED';
      isExpiringSoon = true;
    } else if (daysRemaining <= 3) {
      alertTier = '3_DAYS';
      isExpiringSoon = true;
    } else if (daysRemaining <= 15) {
      alertTier = '15_DAYS';
      isExpiringSoon = true;
    } else if (daysRemaining <= 30) {
      alertTier = '30_DAYS';
      isExpiringSoon = true;
    } else {
      alertTier = 'COMPLIANT';
    }

    let message = '';
    if (alertTier === 'EXPIRED') {
      message = `CRITICAL COMPLIANCE FAILURE: ${input.documentType} expired ${Math.abs(daysRemaining)} day(s) ago. Vehicle grounded immediately under MV Act.`;
    } else if (isExpiringSoon) {
      message = `WARNING: ${input.documentType} expires in ${daysRemaining} day(s) (Alert Tier: ${alertTier}). Initiate RTO/Insurance renewal.`;
    } else {
      message = `COMPLIANT: ${input.documentType} is valid for ${daysRemaining} day(s).`;
    }

    return {
      documentType: input.documentType,
      vehicleAgeYears: Math.round(vehicleAgeYears * 10) / 10,
      isValidityCycleValid,
      expectedCycleYearsOrMonths: expectedCycleDescription,
      daysRemaining,
      alertTier,
      isExpiringSoon,
      message
    };
  }

  /**
   * Verifies RTO statutory validity rules:
   * - All India Permit (AIP): 5-year cycle (approx 1826 days)
   * - Fitness: 2-year cycle for vehicles < 8 years old; annual (1-year) thereafter
   * - PUC: 6-month cycle (approx 180-183 days)
   * - Road Tax: Annual or Quarterly
   * - Insurance: Annual (approx 365 days)
   */
  public static checkStatutoryCycle(
    documentType: DocumentType,
    vehicleAgeYears: number,
    issueDate: Date,
    expiryDate: Date
  ): { isValidityCycleValid: boolean; expectedCycleDescription: string } {
    const durationDays = Math.round((expiryDate.getTime() - issueDate.getTime()) / this.MS_PER_DAY);

    switch (documentType) {
      case 'PERMIT': {
        // AIP: 5-year cycle (approx 1820 - 1830 days)
        const expected = '5 Years (AIP)';
        const isValid = durationDays >= 1820 && durationDays <= 1835;
        return { isValidityCycleValid: isValid, expectedCycleDescription: expected };
      }

      case 'FITNESS': {
        // Fitness: 2-year cycle if vehicle < 8 years old, 1-year if vehicle >= 8 years old
        if (vehicleAgeYears < 8.0) {
          const expected = '2 Years (Vehicle age < 8 years)';
          const isValid = durationDays >= 720 && durationDays <= 735;
          return { isValidityCycleValid: isValid, expectedCycleDescription: expected };
        } else {
          const expected = '1 Year (Vehicle age >= 8 years)';
          const isValid = durationDays >= 360 && durationDays <= 370;
          return { isValidityCycleValid: isValid, expectedCycleDescription: expected };
        }
      }

      case 'PUC': {
        // PUC: 6-month cycle (approx 180 - 185 days)
        const expected = '6 Months';
        const isValid = durationDays >= 175 && durationDays <= 185;
        return { isValidityCycleValid: isValid, expectedCycleDescription: expected };
      }

      case 'ROAD_TAX': {
        // Road Tax: Quarterly (approx 90-93 days) or Annual (approx 365 days)
        const isQuarterly = durationDays >= 85 && durationDays <= 95;
        const isAnnual = durationDays >= 360 && durationDays <= 370;
        return {
          isValidityCycleValid: isQuarterly || isAnnual,
          expectedCycleDescription: 'Quarterly (3 Months) or Annual (12 Months)'
        };
      }

      case 'INSURANCE': {
        const expected = '1 Year';
        const isValid = durationDays >= 360 && durationDays <= 370;
        return { isValidityCycleValid: isValid, expectedCycleDescription: expected };
      }
    }
  }
}
