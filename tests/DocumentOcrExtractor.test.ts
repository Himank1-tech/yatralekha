import { DocumentOcrExtractor } from '../src/parsers/DocumentOcrExtractor';

describe('DocumentOcrExtractor', () => {
  test('extracts vehicle registration, e-way bill, bilty number, and weighbridge weights', () => {
    const sampleOcrText = `
      MAHARASHTRA STATE MOTOR VEHICLES DEPARTMENT
      VEHICLE REGISTRATION: MH 40 AK 1234
      CHASSIS NO: MAT892400J01923
      E-WAY BILL NO: 281920194821
      CONSIGNMENT / BILTY NO: LR-2026-9812
      DHARAM KANTA WEIGHBRIDGE RECEIPT
      GROSS WT: 28.00 MT
      TARE WT: 9.00 MT
      NET WT: 19.00 MT
      FITNESS VALID UPTO: 15/03/2027
    `;

    const extracted = DocumentOcrExtractor.extractMetadata(sampleOcrText);

    expect(extracted.vehicleRegistrationNumber).toBe('MH40AK1234');
    expect(extracted.ewayBillNumber).toBe('281920194821');
    expect(extracted.biltyNumber).toBe('LR-2026-9812');
    expect(extracted.grossWeightKg).toBe(28000);
    expect(extracted.tareWeightKg).toBe(9000);
    expect(extracted.netWeightKg).toBe(19000);
    expect(extracted.extractedDates.length).toBeGreaterThan(0);
  });
});
