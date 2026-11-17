import { Request, Response } from 'express';
import { TripRepository, VehicleRepository, LedgerRepository, MemoryStore } from '../repositories';
import { TripFinanceEngine } from '../services/TripFinanceEngine';
import { LedgerEngine } from '../services/LedgerEngine';
import { RateType, TripExpenseInput } from '../types/domain';

export class TripController {
  public static listAll(req: Request, res: Response): void {
    const list = Array.from(MemoryStore.trips.values()).reverse();
    res.json({ success: true, count: list.length, data: list });
  }

  public static create(req: Request, res: Response): void {
    try {
      const {
        organizationId,
        vehicleId,
        tripSerialNumber,
        origin,
        destination,
        corridorDistanceKm,
        billedWeightTonnes,
        rateType,
        freightRate,
        advancePercentage
      } = req.body;

      if (
        !organizationId ||
        !vehicleId ||
        !tripSerialNumber ||
        !origin ||
        !destination ||
        !corridorDistanceKm ||
        !billedWeightTonnes ||
        !rateType ||
        !freightRate
      ) {
        res.status(400).json({
          error:
            'Missing required trip fields: organizationId, vehicleId, tripSerialNumber, origin, destination, corridorDistanceKm, billedWeightTonnes, rateType, freightRate'
        });
        return;
      }

      const vehicle = VehicleRepository.findById(vehicleId);
      if (!vehicle) {
        res.status(404).json({ error: `Vehicle ${vehicleId} not found` });
        return;
      }

      // 1. Legal Weight & Dharam Kanta Weighbridge Enforcement
      const weightValidation = TripFinanceEngine.validateLegalWeight({
        axleConfiguration: vehicle.axleConfiguration,
        billedWeightTonnes: Number(billedWeightTonnes),
        actualTareWeightKg: vehicle.tareWeightKg,
        customGvwLimitKg: vehicle.grossVehicleWeightKg
      });

      // 2. Billing & Advance/POD Khata Split Calculation
      const billing = TripFinanceEngine.calculateTripBilling({
        billedWeightTonnes: Number(billedWeightTonnes),
        rateType: rateType as RateType,
        freightRate: Number(freightRate),
        advancePercentage: advancePercentage ? Number(advancePercentage) : 0.75
      });

      // 3. Persist Trip
      const trip = TripRepository.create({
        organizationId,
        vehicleId,
        tripSerialNumber,
        origin,
        destination,
        corridorDistanceKm: Number(corridorDistanceKm),
        billedWeightTonnes: Number(billedWeightTonnes),
        rateType: rateType as RateType,
        freightRate: Number(freightRate),
        grossFreightAmount: billing.grossFreight,
        advanceAmount: billing.advanceAmount,
        balancePodDue: billing.balancePodDue,
        podClearanceStatus: 'PENDING',
        overloadRiskFlag: weightValidation.isOverloaded,
        overloadExcessKg: weightValidation.excessPayloadKg
      });

      // 4. Automatically generate initial Freight Invoicing Journal in Double-Entry Ledger
      const invoiceJournal = LedgerEngine.generateFreightInvoiceJournal(trip.tripSerialNumber, billing);
      LedgerRepository.saveJournalEntry(trip.id, invoiceJournal);

      res.status(201).json({
        success: true,
        data: {
          trip,
          weightValidation,
          billing,
          ledgerJournal: invoiceJournal
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static addExpense(req: Request, res: Response): void {
    try {
      const tripId = req.params.id as string;
      const {
        category,
        paymentSource,
        amount,
        fuelLitres,
        fuelRatePerLitre,
        pumpStationName,
        pumpSlipNumber,
        receiptHash,
        memo
      } = req.body;

      if (!category || !paymentSource || amount === undefined) {
        res.status(400).json({
          error: 'Missing required expense fields: category, paymentSource, amount'
        });
        return;
      }

      const expense: TripExpenseInput = {
        category,
        paymentSource,
        amount: Number(amount),
        fuelLitres: fuelLitres ? Number(fuelLitres) : undefined,
        fuelRatePerLitre: fuelRatePerLitre ? Number(fuelRatePerLitre) : undefined,
        pumpStationName,
        pumpSlipNumber,
        receiptHash,
        memo
      };

      const updatedTrip = TripRepository.addExpense(tripId, expense);
      res.status(201).json({ success: true, data: updatedTrip });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static getFinanceSummary(req: Request, res: Response): void {
    try {
      const tripId = req.params.id as string;
      const trip = TripRepository.findById(tripId);
      if (!trip) {
        res.status(404).json({ error: `Trip ${tripId} not found` });
        return;
      }

      const contribution = TripFinanceEngine.calculateTripContribution({
        grossFreightAmount: trip.grossFreightAmount,
        expenses: trip.expenses
      });

      res.json({
        success: true,
        data: {
          tripId: trip.id,
          tripSerialNumber: trip.tripSerialNumber,
          grossFreightAmount: trip.grossFreightAmount,
          advanceAmount: trip.advanceAmount,
          balancePodDue: trip.balancePodDue,
          podClearanceStatus: trip.podClearanceStatus,
          contribution
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static settlePod(req: Request, res: Response): void {
    try {
      const tripId = req.params.id as string;
      const trip = TripRepository.findById(tripId);
      if (!trip) {
        res.status(404).json({ error: `Trip ${tripId} not found` });
        return;
      }

      const updatedTrip = TripRepository.updatePodStatus(tripId, 'VERIFIED');

      // Generate POD settlement journal entry
      const billing = {
        billedWeightTonnes: updatedTrip.billedWeightTonnes,
        rateType: updatedTrip.rateType,
        freightRate: updatedTrip.freightRate,
        grossFreight: updatedTrip.grossFreightAmount,
        advanceAmount: updatedTrip.advanceAmount,
        balancePodDue: updatedTrip.balancePodDue,
        advancePercentage: 0.75,
        podBalancePercentage: 0.25
      };

      const podJournal = LedgerEngine.generatePodSettlementJournal(updatedTrip.tripSerialNumber, billing);
      LedgerRepository.saveJournalEntry(tripId, podJournal);

      res.json({
        success: true,
        message: 'POD verified and balance realized into Ledger',
        data: {
          trip: updatedTrip,
          ledgerJournal: podJournal
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static calculateBackhaul(req: Request, res: Response): void {
    try {
      const {
        projectedReturnDieselCost,
        projectedTollsCost,
        driverBhattaCost,
        dailyAllocatedEmi,
        ratedReturnPayloadTonnes
      } = req.body;

      if (
        projectedReturnDieselCost === undefined ||
        projectedTollsCost === undefined ||
        driverBhattaCost === undefined ||
        dailyAllocatedEmi === undefined ||
        !ratedReturnPayloadTonnes
      ) {
        res.status(400).json({
          error:
            'Missing required backhaul fields: projectedReturnDieselCost, projectedTollsCost, driverBhattaCost, dailyAllocatedEmi, ratedReturnPayloadTonnes'
        });
        return;
      }

      const breakEven = TripFinanceEngine.calculateBackhaulBreakEven({
        projectedReturnDieselCost: Number(projectedReturnDieselCost),
        projectedTollsCost: Number(projectedTollsCost),
        driverBhattaCost: Number(driverBhattaCost),
        dailyAllocatedEmi: Number(dailyAllocatedEmi),
        ratedReturnPayloadTonnes: Number(ratedReturnPayloadTonnes)
      });

      res.json({ success: true, data: breakEven });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
