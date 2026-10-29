import { Request, Response } from 'express';
import { VehicleRepository } from '../repositories';
import { FLEET_ASSET_BENCHMARKS, AxleConfiguration } from '../types/domain';
import { TripFinanceEngine } from '../services/TripFinanceEngine';

export class VehicleController {
  public static create(req: Request, res: Response): void {
    try {
      const {
        organizationId,
        registrationNumber,
        chassisNumber,
        engineNumber,
        axleConfiguration,
        customTareWeightKg,
        customGrossVehicleWeightKg,
        monthlyEmi,
        crewMonthlyPayroll,
        annualInsuranceTax,
        ais140Imei,
        currentDriverName,
        currentDriverPhone
      } = req.body;

      if (!organizationId || !registrationNumber || !chassisNumber || !engineNumber || !axleConfiguration) {
        res.status(400).json({
          error: 'Missing required vehicle fields: organizationId, registrationNumber, chassisNumber, engineNumber, axleConfiguration'
        });
        return;
      }

      const benchmark = FLEET_ASSET_BENCHMARKS[axleConfiguration as AxleConfiguration];
      if (!benchmark) {
        res.status(400).json({
          error: `Invalid axle configuration: ${axleConfiguration}. Allowed: 10_WHEELER, 12_WHEELER, 16_WHEELER`
        });
        return;
      }

      const tareWeightKg = customTareWeightKg ? Number(customTareWeightKg) : benchmark.unladenTareKg;
      const grossVehicleWeightKg = customGrossVehicleWeightKg ? Number(customGrossVehicleWeightKg) : benchmark.passingGvwKg;

      const vehicle = VehicleRepository.create({
        organizationId,
        registrationNumber,
        chassisNumber,
        engineNumber,
        axleConfiguration,
        tareWeightKg,
        grossVehicleWeightKg,
        monthlyEmi: Number(monthlyEmi ?? 0),
        crewMonthlyPayroll: Number(crewMonthlyPayroll ?? 17000), // Driver ₹12k + Cleaner ₹5k
        annualInsuranceTax: Number(annualInsuranceTax ?? 60000),
        ais140Imei,
        currentDriverName,
        currentDriverPhone
      });

      // Calculate initial daily fixed burn
      const dailyBurn = TripFinanceEngine.calculateDailyFixedBurn({
        monthlyEmi: vehicle.monthlyEmi,
        driverMonthlySalary: 12000,
        cleanerMonthlySalary: 5000,
        annualInsuranceAndTaxes: vehicle.annualInsuranceTax,
        daysInMonth: 30
      });

      res.status(201).json({
        success: true,
        data: {
          ...vehicle,
          dailyFixedBurnMetrics: dailyBurn
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static getById(req: Request, res: Response): void {
    const vehicleId = req.params.id as string;
    const vehicle = VehicleRepository.findById(vehicleId);
    if (!vehicle) {
      res.status(404).json({ error: `Vehicle ${vehicleId} not found` });
      return;
    }

    const dailyBurn = TripFinanceEngine.calculateDailyFixedBurn({
      monthlyEmi: vehicle.monthlyEmi,
      annualInsuranceAndTaxes: vehicle.annualInsuranceTax,
      daysInMonth: 30
    });

    res.json({
      success: true,
      data: {
        ...vehicle,
        dailyFixedBurnMetrics: dailyBurn
      }
    });
  }

  public static listByOrganization(req: Request, res: Response): void {
    const orgId = req.params.organizationId as string;
    const list = VehicleRepository.listByOrganization(orgId);
    res.json({ success: true, count: list.length, data: list });
  }
}
