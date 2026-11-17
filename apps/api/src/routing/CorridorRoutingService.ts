export interface CorridorDetails {
  corridorKey: string;
  name: string;
  origin: string;
  destination: string;
  oneWayDistanceKm: number;
  estimatedTransitHours: number;
  primaryHighway: string;
  hasExpresswaySection: boolean;
  estimatedTollCost: {
    '10_WHEELER': number;
    '12_WHEELER': number;
    '16_WHEELER': number;
  };
  recommendedRateRangePerMT: {
    min: number;
    max: number;
  };
}

export class CorridorRoutingService {
  public static readonly CORRIDORS: Record<string, CorridorDetails> = {
    'NAGPUR_PUNE': {
      corridorKey: 'NAGPUR_PUNE',
      name: 'Nagpur ↔ Pune Long Haul Corridor',
      origin: 'Nagpur, Maharashtra',
      destination: 'Pune, Maharashtra',
      oneWayDistanceKm: 720,
      estimatedTransitHours: 15,
      primaryHighway: 'Samruddhi Mahamarg (ME-2) & NH 60',
      hasExpresswaySection: true,
      estimatedTollCost: {
        '10_WHEELER': 3450,
        '12_WHEELER': 3950,
        '16_WHEELER': 4600
      },
      recommendedRateRangePerMT: {
        min: 1000,
        max: 1200
      }
    },
    'NAGPUR_BHANDARA': {
      corridorKey: 'NAGPUR_BHANDARA',
      name: 'Nagpur ↔ Bhandara Short Haul Industrial Corridor',
      origin: 'Nagpur, Maharashtra',
      destination: 'Bhandara, Maharashtra',
      oneWayDistanceKm: 65,
      estimatedTransitHours: 1.75,
      primaryHighway: 'NH 53 (Asian Highway 46)',
      hasExpresswaySection: false,
      estimatedTollCost: {
        '10_WHEELER': 220,
        '12_WHEELER': 260,
        '16_WHEELER': 320
      },
      recommendedRateRangePerMT: {
        min: 200,
        max: 250
      }
    }
  };

  /**
   * Retrieves corridor operational profile by key
   */
  public static getCorridor(key: 'NAGPUR_PUNE' | 'NAGPUR_BHANDARA'): CorridorDetails {
    const corridor = this.CORRIDORS[key];
    if (!corridor) {
      throw new Error(`Corridor ${key} is not registered in system.`);
    }
    return corridor;
  }

  /**
   * Calculates estimated trip diesel litres based on standard 3.0 km/L loaded benchmark
   */
  public static estimateBaselineDieselConsumption(corridorKey: 'NAGPUR_PUNE' | 'NAGPUR_BHANDARA'): {
    corridorDistanceKm: number;
    estimatedDieselLitres: number;
  } {
    const corridor = this.getCorridor(corridorKey);
    const estimatedDieselLitres = Math.round((corridor.oneWayDistanceKm / 3.0) * 100) / 100;
    return {
      corridorDistanceKm: corridor.oneWayDistanceKm,
      estimatedDieselLitres
    };
  }
}
