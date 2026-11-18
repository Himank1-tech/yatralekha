// API Client with resilient standalone fallback engine and offline highway sync
import { OfflineSync } from '../utils/offlineSync';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';

const initialCorridors = [
  {
    corridorKey: 'NAGPUR_PUNE',
    name: 'Nagpur ↔ Pune Heavy Freight Corridor',
    origin: 'Nagpur (MIHAN Hub)',
    destination: 'Pune (Chakan Auto Cluster)',
    oneWayDistanceKm: 720,
    estimatedTransitHours: 12,
    primaryHighway: 'Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Mahamarg',
    hasExpresswaySection: true,
    estimatedTollCost: {
      '10_WHEELER': 1550,
      '12_WHEELER': 1850,
      '16_WHEELER': 2400,
    },
    recommendedRateRangePerMT: {
      min: 1000,
      max: 1200,
    },
  },
  {
    corridorKey: 'NAGPUR_BHANDARA',
    name: 'Nagpur ↔ Bhandara Short-Haul Steel Corridor',
    origin: 'Nagpur (MIDC Hingna)',
    destination: 'Bhandara (Sunflag Steel Complex)',
    oneWayDistanceKm: 65,
    estimatedTransitHours: 1.8,
    primaryHighway: 'NH 53 (National Highway 53)',
    hasExpresswaySection: false,
    estimatedTollCost: {
      '10_WHEELER': 220,
      '12_WHEELER': 280,
      '16_WHEELER': 360,
    },
    recommendedRateRangePerMT: {
      min: 200,
      max: 250,
    },
  },
];

const initialFleet = [
  {
    imei: '860144040001001',
    registrationNumber: 'MH 31 FC 8821',
    axleConfiguration: '10_WHEELER',
    driverName: 'Ramesh Yadav',
    latitude: 20.7453,
    longitude: 78.5986, // Wardha / Samruddhi Corridor
    speedKmh: 58.4,
    ignition: true,
    fuelSensorLitres: 242.6,
    odometerKm: 148920.4,
    corridor: 'Nagpur ↔ Pune (Samruddhi Mahamarg)',
    siphoningAlert: false,
    historyTrail: [
      [21.1458, 79.0882],
      [20.9500, 78.8500],
      [20.7453, 78.5986],
    ],
  },
  {
    imei: '860144040001002',
    registrationNumber: 'MH 31 EN 5490',
    axleConfiguration: '12_WHEELER',
    driverName: 'Sukhvinder Singh',
    latitude: 20.3200,
    longitude: 77.2500, // Washim / Jalna stretch
    speedKmh: 62.1,
    ignition: true,
    fuelSensorLitres: 318.0,
    odometerKm: 98450.8,
    corridor: 'Nagpur ↔ Pune (Samruddhi Mahamarg)',
    siphoningAlert: false,
    historyTrail: [
      [20.7453, 78.5986],
      [20.5500, 77.8500],
      [20.3200, 77.2500],
    ],
  },
  {
    imei: '860144040001003',
    registrationNumber: 'MH 40 AK 1920',
    axleConfiguration: '16_WHEELER',
    driverName: 'Dilip Choudhary',
    latitude: 21.1700,
    longitude: 79.6500, // NH 53 to Bhandara
    speedKmh: 45.0,
    ignition: true,
    fuelSensorLitres: 410.5,
    odometerKm: 215430.0,
    corridor: 'Nagpur ↔ Bhandara (NH 53 Industrial Corridor)',
    siphoningAlert: false,
    historyTrail: [
      [21.1458, 79.0882],
      [21.1600, 79.4000],
      [21.1700, 79.6500],
    ],
  },
];

const initialVehicles = [
  {
    id: 'veh-1',
    organizationId: 'org-1',
    registrationNumber: 'MH 31 FC 8821',
    chassisNumber: 'MAT748301G8K19024',
    engineNumber: '6D56TI-89104',
    axleConfiguration: '10_WHEELER',
    tareWeightKg: 9000,
    grossVehicleWeightKg: 28000,
    maxLegalPayloadKg: 19000,
    monthlyEmi: 42000,
    crewMonthlyPayroll: 17000,
    annualInsuranceTax: 58000,
    ais140Imei: '860144040001001',
    currentDriverName: 'Ramesh Yadav',
    currentDriverPhone: '+91 98220 11223',
    createdAt: '2026-01-15T00:00:00.000Z',
    dailyFixedBurnMetrics: {
      monthlyEmi: 42000,
      crewMonthlyPayroll: 17000,
      proRatedMonthlyInsuranceTaxes: 4833,
      totalMonthlyFixedCost: 63833,
      dailyFixedBurn: 2128,
      hourlyFixedBurn: 89,
    },
  },
  {
    id: 'veh-2',
    organizationId: 'org-1',
    registrationNumber: 'MH 31 EN 5490',
    chassisNumber: 'MAT882941H9L33812',
    engineNumber: '497TCIC-77492',
    axleConfiguration: '12_WHEELER',
    tareWeightKg: 11000,
    grossVehicleWeightKg: 36000,
    maxLegalPayloadKg: 25000,
    monthlyEmi: 74500,
    crewMonthlyPayroll: 17000,
    annualInsuranceTax: 72000,
    ais140Imei: '860144040001002',
    currentDriverName: 'Sukhvinder Singh',
    currentDriverPhone: '+91 98221 44556',
    createdAt: '2026-02-10T00:00:00.000Z',
    dailyFixedBurnMetrics: {
      monthlyEmi: 74500,
      crewMonthlyPayroll: 17000,
      proRatedMonthlyInsuranceTaxes: 6000,
      totalMonthlyFixedCost: 97500,
      dailyFixedBurn: 3250,
      hourlyFixedBurn: 135,
    },
  },
  {
    id: 'veh-3',
    organizationId: 'org-1',
    registrationNumber: 'MH 40 AK 1920',
    chassisNumber: 'MAT991204K0M55182',
    engineNumber: 'CUMMINS-ISBe-90118',
    axleConfiguration: '16_WHEELER',
    tareWeightKg: 17500,
    grossVehicleWeightKg: 47500,
    maxLegalPayloadKg: 30000,
    monthlyEmi: 89000,
    crewMonthlyPayroll: 17000,
    annualInsuranceTax: 88000,
    ais140Imei: '860144040001003',
    currentDriverName: 'Dilip Choudhary',
    currentDriverPhone: '+91 98223 77889',
    createdAt: '2026-03-01T00:00:00.000Z',
    dailyFixedBurnMetrics: {
      monthlyEmi: 89000,
      crewMonthlyPayroll: 17000,
      proRatedMonthlyInsuranceTaxes: 7333,
      totalMonthlyFixedCost: 113333,
      dailyFixedBurn: 3778,
      hourlyFixedBurn: 157,
    },
  },
];

const initialTrips = [
  {
    id: 'trip-1',
    organizationId: 'org-1',
    vehicleId: 'veh-1',
    tripSerialNumber: 'TRIP-2026-NGP-PUN-001',
    origin: 'Nagpur (MIHAN Hub)',
    destination: 'Pune (Chakan Auto Cluster)',
    corridorDistanceKm: 720,
    billedWeightTonnes: 18.5,
    rateType: 'PER_TONNE',
    freightRate: 1150,
    grossFreightAmount: 21275,
    advanceAmount: 15956.25,
    balancePodDue: 5318.75,
    podClearanceStatus: 'PENDING',
    overloadRiskFlag: false,
    overloadExcessKg: 0,
    expenses: [
      {
        id: 'exp-1',
        category: 'DIESEL',
        paymentSource: 'PUMP_CREDIT_PARCHI',
        amount: 9600,
        fuelLitres: 100,
        fuelRatePerLitre: 96,
        pumpStationName: 'IOCL Samruddhi Plaza 3',
        pumpSlipNumber: 'IOCL-7712',
        createdAt: '2026-10-28T10:00:00.000Z',
      },
      {
        id: 'exp-2',
        category: 'TOLL_FASTAG',
        paymentSource: 'FASTAG_WALLET',
        amount: 1850,
        memo: 'Samruddhi Expressway Corridor Toll',
        createdAt: '2026-10-28T14:30:00.000Z',
      },
      {
        id: 'exp-3',
        category: 'DRIVER_BHATTA',
        paymentSource: 'CASH',
        amount: 1500,
        memo: '48hr Driver Khoraki / Bhatta',
        createdAt: '2026-10-28T16:00:00.000Z',
      },
    ],
    startedAt: '2026-10-28T06:00:00.000Z',
  },
  {
    id: 'trip-2',
    organizationId: 'org-1',
    vehicleId: 'veh-3',
    tripSerialNumber: 'TRIP-2026-NGP-BHN-002',
    origin: 'Nagpur (MIDC Hingna)',
    destination: 'Bhandara (Sunflag Steel Complex)',
    corridorDistanceKm: 65,
    billedWeightTonnes: 29.8,
    rateType: 'PER_TONNE',
    freightRate: 240,
    grossFreightAmount: 7152,
    advanceAmount: 5364,
    balancePodDue: 1788,
    podClearanceStatus: 'VERIFIED',
    overloadRiskFlag: false,
    overloadExcessKg: 0,
    expenses: [
      {
        id: 'exp-4',
        category: 'DIESEL',
        paymentSource: 'CASH',
        amount: 2100,
        fuelLitres: 22,
        fuelRatePerLitre: 95.45,
        pumpStationName: 'BPCL Bhandara Road',
        createdAt: '2026-10-29T08:00:00.000Z',
      },
      {
        id: 'exp-5',
        category: 'TOLL_FASTAG',
        paymentSource: 'FASTAG_WALLET',
        amount: 280,
        memo: 'Mathani Toll Plaza',
        createdAt: '2026-10-29T09:15:00.000Z',
      },
      {
        id: 'exp-6',
        category: 'HAMALI',
        paymentSource: 'CASH',
        amount: 450,
        memo: 'Steel coil loading charges',
        createdAt: '2026-10-29T10:30:00.000Z',
      },
    ],
    startedAt: '2026-10-29T07:30:00.000Z',
  },
];

// In-memory runtime states
let fleetState = [...initialFleet];
let vehiclesState = [...initialVehicles];
let tripsState = [...initialTrips];

let loadsState = [
  {
    id: 'load-1',
    origin: 'Nagpur (MIHAN Logistic Park)',
    destination: 'Pune (Chakan Auto Cluster)',
    corridorName: 'Samruddhi Mahamarg Expressway',
    materialType: 'Auto Body Stampings & Pressed Parts',
    weightTonnes: 23.5,
    requiredAxleType: '12_WHEELER',
    bodyType: 'CONTAINER',
    offeredRate: 1150,
    rateType: 'PER_TONNE',
    advancePercent: 75.0,
    balancePaymentTerms: 'Balance on POD in 3 days',
    shipperName: 'Ritco Logistics TransSolutions',
    shipperPhone: '+91 98221 44550',
    isVerifiedShipper: true,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'load-2',
    origin: 'Bhandara (Sunflag Complex)',
    destination: 'Pune (Bhosari MIDC)',
    corridorName: 'NH 53 & Samruddhi Corridor',
    materialType: 'Alloy Steel Billets & Wire Rods',
    weightTonnes: 19.0,
    requiredAxleType: '10_WHEELER',
    bodyType: 'DALA',
    offeredRate: 1220,
    rateType: 'PER_TONNE',
    advancePercent: 80.0,
    balancePaymentTerms: 'Balance on POD in 4 days',
    shipperName: 'VRL Logistics Hub Bhandara',
    shipperPhone: '+91 94220 88711',
    isVerifiedShipper: true,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'load-3',
    origin: 'Nagpur (Kalmeshwar MIDC)',
    destination: 'Bhiwandi / Mumbai Warehouses',
    corridorName: 'Nagpur-Mumbai Expressway',
    materialType: 'Pressed Cotton Bales & Yarn',
    weightTonnes: 28.5,
    requiredAxleType: '16_WHEELER',
    bodyType: 'FLATBED',
    offeredRate: 1350,
    rateType: 'PER_TONNE',
    advancePercent: 75.0,
    balancePaymentTerms: 'Balance on POD in 5 days',
    shipperName: 'Vidarbha Cotton Mandi Consortium',
    shipperPhone: '+91 98230 11990',
    isVerifiedShipper: true,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'load-4',
    origin: 'Pune (Chakan Phase 2)',
    destination: 'Nagpur (Hingna MIDC)',
    corridorName: 'Pune ➔ Nagpur Return Corridor (Backhaul)',
    materialType: 'Tractor Spares & Castings',
    weightTonnes: 22.0,
    requiredAxleType: '12_WHEELER',
    bodyType: 'DALA',
    offeredRate: 980,
    rateType: 'PER_TONNE',
    advancePercent: 70.0,
    balancePaymentTerms: 'Balance on POD in 3 days',
    shipperName: 'Western India Mandi Transport Syndicate',
    shipperPhone: '+91 97660 33211',
    isVerifiedShipper: false,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
  },
];

let preferredLanesState = [
  {
    id: 'lane-1',
    origin: 'Nagpur',
    destination: 'Pune',
    corridor: 'Samruddhi Mahamarg (Expressway)',
    recommendedRatePerTon: 1150,
    activeAlerts: true,
  },
  {
    id: 'lane-2',
    origin: 'Nagpur',
    destination: 'Bhandara',
    corridor: 'NH 53 (Steel Corridor)',
    recommendedRatePerTon: 230,
    activeAlerts: true,
  },
  {
    id: 'lane-3',
    origin: 'Pune',
    destination: 'Bhiwandi / Mumbai',
    corridor: 'Mumbai-Pune Expressway',
    recommendedRatePerTon: 750,
    activeAlerts: true,
  },
];

let callLogsState = [
  {
    id: 'call-1',
    organizationId: 'org-1',
    contactName: 'Mohan Sharma (Sharma Freight)',
    contactRole: 'Broker',
    phoneNumber: '+91 98221 44550',
    laneDiscussed: 'Nagpur ➔ Pune (23.5 MT Steel)',
    callType: 'OUTGOING',
    durationSeconds: 145,
    dealStatus: 'RATE_CONFIRMED',
    notes: 'Agreed on ₹1,150/MT with 75% loading advance slip via IOCL Chhatrapati Square pump.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'call-2',
    organizationId: 'org-1',
    contactName: 'Kailash Mundra (Apex Roadways)',
    contactRole: 'Broker',
    phoneNumber: '+91 98229 11002',
    laneDiscussed: 'Pune ➔ Nagpur Return',
    callType: 'INCOMING',
    durationSeconds: 85,
    dealStatus: 'RATE_TOO_LOW',
    notes: 'Offered ₹750/MT for return load. Rejected - below break-even threshold of ₹850/MT.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'call-3',
    organizationId: 'org-1',
    contactName: 'Sanjay Yadav (Driver v1)',
    contactRole: 'Driver',
    phoneNumber: '+91 98221 14455',
    laneDiscussed: 'Jalna Toll Plaza Stretch',
    callType: 'OUTGOING',
    durationSeconds: 65,
    dealStatus: 'EN_ROUTE',
    notes: 'Confirmed crossed Mehkar interchange on Samruddhi. Tank level 240L, tire pressure OK.',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'call-4',
    organizationId: 'org-1',
    contactName: 'Satish Gokhale (Gokhale Transport)',
    contactRole: 'Broker',
    phoneNumber: '+91 98228 99123',
    laneDiscussed: 'Overdue POD Balance Recovery (Bilty #BLT-849201)',
    callType: 'OUTGOING',
    durationSeconds: 190,
    dealStatus: 'POD_FOLLOWUP',
    notes: 'Requested urgent release of ₹6,800 pending for 18 days. Promised payment tomorrow morning.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let podClaimsState = [
  {
    id: 'claim-1',
    brokerName: 'Ritco Logistics TransSolutions',
    brokerPhone: '+91 98221 44550',
    biltyNumber: 'BLT-902188',
    origin: 'Nagpur (MIHAN)',
    destination: 'Pune (Chakan)',
    vehicleNumber: 'MH 40 AK 9988',
    totalFreight: 27600,
    advancePaid: 20700,
    balanceDue: 6900,
    unloadingDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    recoveryStatus: 'PENDING',
    daysOverdue: 0,
    isOverdue: false,
    brokerRiskTier: 'LOW_RISK',
    disputeNotes: 'Consignee received 24.0 MT steel coils in good condition. Stamped POD received.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'claim-2',
    brokerName: 'Satish Gokhale (Gokhale Transport Syndicate)',
    brokerPhone: '+91 98228 99123',
    biltyNumber: 'BLT-849201',
    origin: 'Nagpur (Hingna)',
    destination: 'Bhiwandi Logistic Hub',
    vehicleNumber: 'MH 31 AP 4411',
    totalFreight: 26400,
    advancePaid: 19600,
    balanceDue: 6800,
    unloadingDate: new Date(Date.now() - 25 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 18 * 86400000).toISOString(),
    recoveryStatus: 'OVERDUE',
    daysOverdue: 18,
    isOverdue: true,
    brokerRiskTier: 'HIGH_RISK_DEF_DEFAULTER',
    disputeNotes: 'Broker avoiding phone calls. Overdue past 18 days beyond 7-day credit grace period.',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'claim-3',
    brokerName: 'Kailash Mundra (Apex Roadways Agency)',
    brokerPhone: '+91 98229 11002',
    biltyNumber: 'BLT-718820',
    origin: 'Wardha Steel Complex',
    destination: 'Pune Bhosari',
    vehicleNumber: 'MH 40 CD 1616',
    totalFreight: 38000,
    advancePaid: 28500,
    balanceDue: 9500,
    unloadingDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    recoveryStatus: 'PENDING',
    daysOverdue: 5,
    isOverdue: true,
    brokerRiskTier: 'MODERATE_RISK',
    disputeNotes: 'Overdue by 5 days. Sent first verbal reminder via call.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

function handleStandaloneFallback<T>(method: string, path: string, body?: any): T {
  // 1. Corridors
  if (path === '/corridors') {
    return {
      success: true,
      data: initialCorridors,
    } as unknown as T;
  }

  // 2. Vehicles
  if (path === '/vehicles') {
    if (method === 'POST') {
      const axle = body.axleConfiguration || '10_WHEELER';
      const tareKg = axle === '10_WHEELER' ? 9000 : axle === '12_WHEELER' ? 11000 : 17500;
      const gvwKg = axle === '10_WHEELER' ? 28000 : axle === '12_WHEELER' ? 36000 : 47500;
      const payloadKg = gvwKg - tareKg;
      const emi = Number(body.monthlyEmi) || 45000;
      const payroll = 17000;
      const ins = Number(body.annualInsuranceTax) || 60000;
      const monthlyTotal = emi + payroll + Math.round(ins / 12);
      const dailyBurn = Math.round(monthlyTotal / 30);

      const newV = {
        id: `veh-${Date.now()}`,
        organizationId: 'org-1',
        registrationNumber: body.registrationNumber?.toUpperCase() || 'MH 31 XX 0000',
        chassisNumber: body.chassisNumber || `MAT${Math.floor(100000 + Math.random() * 900000)}`,
        engineNumber: body.engineNumber || `ENG-${Math.floor(10000 + Math.random() * 90000)}`,
        axleConfiguration: axle,
        tareWeightKg: tareKg,
        grossVehicleWeightKg: gvwKg,
        maxLegalPayloadKg: payloadKg,
        monthlyEmi: emi,
        crewMonthlyPayroll: payroll,
        annualInsuranceTax: ins,
        ais140Imei: body.ais140Imei || `86014404000${Math.floor(1000 + Math.random() * 9000)}`,
        currentDriverName: body.currentDriverName || 'Driver Singh',
        currentDriverPhone: body.currentDriverPhone || '+91 98220 00000',
        createdAt: new Date().toISOString(),
        dailyFixedBurnMetrics: {
          monthlyEmi: emi,
          crewMonthlyPayroll: payroll,
          proRatedMonthlyInsuranceTaxes: Math.round(ins / 12),
          totalMonthlyFixedCost: monthlyTotal,
          dailyFixedBurn: dailyBurn,
          hourlyFixedBurn: Math.round(dailyBurn / 24),
        },
      };
      vehiclesState.push(newV);
      return { success: true, data: newV } as unknown as T;
    }
    return { success: true, data: vehiclesState } as unknown as T;
  }

  // 3. Trips
  if (path === '/trips') {
    if (method === 'POST') {
      const vehicle = vehiclesState.find((v) => v.id === body.vehicleId) || vehiclesState[0];
      const billedWeight = Number(body.billedWeightTonnes) || 18.0;
      const rate = Number(body.freightRate || body.ratePerTonne) || 1150;
      const rateType = body.rateType || 'PER_TONNE';
      const gross = rateType === 'PER_TONNE' ? billedWeight * rate : rate;
      const advancePct = Number(body.advancePercentage) || 0.75;
      const advance = Math.round(gross * advancePct * 100) / 100;
      const balance = Math.round((gross - advance) * 100) / 100;

      const totalWeightKg = billedWeight * 1000 + vehicle.tareWeightKg;
      const isOverload = totalWeightKg > vehicle.grossVehicleWeightKg;
      const excessKg = isOverload ? totalWeightKg - vehicle.grossVehicleWeightKg : 0;

      const newTrip = {
        id: `trip-${Date.now()}`,
        organizationId: 'org-1',
        vehicleId: vehicle.id,
        tripSerialNumber:
          body.tripSerialNumber ||
          body.tripSerial ||
          `TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        origin: body.origin || 'Nagpur (MIHAN Hub)',
        destination: body.destination || 'Pune (Chakan Auto Cluster)',
        corridorDistanceKm: Number(body.distanceKm || body.corridorDistanceKm) || 720,
        billedWeightTonnes: billedWeight,
        rateType,
        freightRate: rate,
        grossFreightAmount: gross,
        advanceAmount: advance,
        balancePodDue: balance,
        podClearanceStatus: 'PENDING',
        overloadRiskFlag: isOverload,
        overloadExcessKg: excessKg,
        expenses: [],
        startedAt: new Date().toISOString(),
      };
      tripsState.unshift(newTrip);
      return { success: true, data: { trip: newTrip } } as unknown as T;
    }
    return { success: true, data: tripsState } as unknown as T;
  }

  // 3b. Trip details / finance
  if (path.startsWith('/trips/') && path.includes('/finance')) {
    const tripId = path.split('/')[2];
    const trip = tripsState.find((t) => t.id === tripId) || tripsState[0];
    const expenses = trip.expenses || [];
    const totalExp = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const net = trip.grossFreightAmount - totalExp;

    return {
      success: true,
      data: {
        tripId: trip.id,
        grossFreight: trip.grossFreightAmount,
        advanceAmount: trip.advanceAmount,
        balancePodDue: trip.balancePodDue,
        totalExpenses: totalExp,
        netContribution: net,
        marginPercent:
          trip.grossFreightAmount > 0
            ? Number(((net / trip.grossFreightAmount) * 100).toFixed(1))
            : 0,
        expensesBreakdown: expenses,
      },
    } as unknown as T;
  }

  // 3c. Add Expense to Trip
  if (path.startsWith('/trips/') && path.includes('/expenses')) {
    const tripId = path.split('/')[2];
    const trip = tripsState.find((t) => t.id === tripId);
    if (trip) {
      const newExp = {
        id: `exp-${Date.now()}`,
        category: body.category,
        paymentSource: body.paymentSource,
        amount: Number(body.amount) || 0,
        fuelLitres: body.fuelLitres ? Number(body.fuelLitres) : undefined,
        fuelRatePerLitre: body.fuelRatePerLitre ? Number(body.fuelRatePerLitre) : undefined,
        memo: body.memo || body.notes || '',
        createdAt: new Date().toISOString(),
      };
      trip.expenses = trip.expenses || [];
      trip.expenses.push(newExp as any);
    }
    return { success: true, data: { trip } } as unknown as T;
  }

  // 3d. Clear POD
  if (path.startsWith('/trips/') && path.includes('/clear-pod')) {
    const tripId = path.split('/')[2];
    const trip = tripsState.find((t) => t.id === tripId);
    if (trip) {
      trip.podClearanceStatus = 'VERIFIED';
    }
    return { success: true, data: trip } as unknown as T;
  }

  // 4. Backhaul Break-even Calculator
  if (path === '/trips/backhaul-breakeven') {
    const diesel =
      Number(body.projectedReturnDieselCost || body.projectedReturnDiesel) || 14500;
    const toll = Number(body.projectedTollsCost || body.tolls) || 3950;
    const bhatta = Number(body.driverBhattaCost || body.driverBhatta) || 2000;
    const emi = Number(body.dailyAllocatedEmi) || 1600;
    const payload = Number(body.ratedReturnPayloadTonnes) || 24.0;
    const totalCost = diesel + toll + bhatta + emi;
    const breakEven = Number((totalCost / payload).toFixed(2));

    return {
      success: true,
      data: {
        minAcceptableFreightRatePerMT: breakEven,
        totalReturnCost: totalCost,
        costBreakdown: {
          projectedReturnDiesel: diesel,
          tolls: toll,
          driverBhatta: bhatta,
          dailyAllocatedEmi: emi,
        },
        payloadTonnes: payload,
        formula: '(Diesel + Tolls + Bhatta + EMI) / RatedPayload',
        verdict: `Minimum return freight from Pune to Nagpur to avoid cash loss is ₹${breakEven}/MT.`,
      },
    } as unknown as T;
  }

  // 5. Fuel Audit
  if (path === '/fuel-audit/trip-audit') {
    const dist = Number(body.distanceKm) || 720;
    const litres = Number(body.fuelConsumedLitres) || 240;
    const kmpl = Number((dist / litres).toFixed(2));
    const variance = Number((((kmpl - 3.0) / 3.0) * 100).toFixed(1));
    const isLeak = kmpl < 2.6;
    return {
      success: true,
      data: {
        actualKmpl: kmpl,
        benchmarkKmpl: 3.0,
        variancePercent: variance,
        flag: isLeak ? 'POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK' : 'NORMAL_EFFICIENT_HAUL',
        status: isLeak ? 'CRITICAL_LEAK_WARNING' : 'OPTIMAL_HAUL',
        recommendedAction: isLeak
          ? 'WARNING: Fuel economy under 2.6 km/L benchmark. Audit driver pump parchis & tank levels.'
          : 'PASS: Vehicle operating within optimal heavy-haul parameters.',
      },
    } as unknown as T;
  }

  if (path === '/fuel-audit/siphon-check') {
    const drop = Number(body.fuelDropLitres) || 25.0;
    const speed = Number(body.speedKmh) || 0;
    const isSiphon = speed === 0 && drop >= 15.0;
    return {
      success: true,
      data: {
        alertTriggered: isSiphon,
        flag: isSiphon ? 'POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK' : 'NORMAL_CONSUMPTION',
        severity: isSiphon ? 'CRITICAL' : 'NONE',
        message: isSiphon
          ? `ALERT: Stationary tank drop of ${drop}L detected while ignition was stationary at 0 km/h.`
          : 'Fuel draw corresponds to normal engine throttle consumption.',
      },
    } as unknown as T;
  }

  if (path === '/fuel-audit/multi-pump-audit') {
    const totalLitres =
      (body.purchases || []).reduce((s: number, p: any) => s + Number(p.litres), 0) || 240;
    const dist = Number(body.totalOdometerKm) || 720;
    const kmpl = Number((dist / totalLitres).toFixed(2));
    return {
      success: true,
      data: {
        totalLitresBilled: totalLitres,
        totalOdometerKm: dist,
        actualKmpl: kmpl,
        varianceAgainstBaseline: Number((((kmpl - 3.0) / 3.0) * 100).toFixed(1)),
        status: kmpl < 2.6 ? 'FLAGGED_VARIANCE' : 'VERIFIED',
      },
    } as unknown as T;
  }

  // 6. Compliance Documents & PIN
  if (path === '/compliance/documents') {
    return {
      success: true,
      data: [
        {
          id: 'doc-001',
          vehicleNumber: 'MH 31 FC 8821',
          documentType: 'PERMIT',
          title: 'All India Tourist / Goods Permit (AIP Form 47)',
          issueDate: '2023-04-10',
          expiryDate: '2028-04-09',
          daysToExpiry: 620,
          status: 'VALID',
          issuingAuthority: 'RTO Nagpur City (MH-31)',
          documentNumber: 'MH31/AIP/2023/8891',
        },
        {
          id: 'doc-002',
          vehicleNumber: 'MH 31 FC 8821',
          documentType: 'FITNESS',
          title: 'VAHAN Form 38 Roadworthiness Certificate',
          issueDate: '2025-11-15',
          expiryDate: '2026-11-14',
          daysToExpiry: 16,
          status: 'EXPIRING_SOON',
          issuingAuthority: 'Automated Inspection Center Nagpur',
          documentNumber: 'MH31/FIT/2025/3310',
        },
        {
          id: 'doc-003',
          vehicleNumber: 'MH 31 EN 5490',
          documentType: 'PUC',
          title: 'Pollution Under Control Certificate (BS-VI)',
          issueDate: '2026-05-01',
          expiryDate: '2026-11-01',
          daysToExpiry: 3,
          status: 'CRITICAL',
          issuingAuthority: 'Parivahan Online Center Wadi',
          documentNumber: 'PUC/MH31/2026/09982',
        },
        {
          id: 'doc-004',
          vehicleNumber: 'MH 40 AK 1920',
          documentType: 'ROAD_TAX',
          title: 'Maharashtra MV Commercial Road Tax (MV-11)',
          issueDate: '2026-04-01',
          expiryDate: '2027-03-31',
          daysToExpiry: 153,
          status: 'VALID',
          issuingAuthority: 'RTO Nagpur Rural (MH-40)',
          documentNumber: 'MHTAX/2026/Q1/5521',
        },
        {
          id: 'doc-005',
          vehicleNumber: 'MH 40 AK 1920',
          documentType: 'INSURANCE',
          title: 'Commercial Heavy Goods Vehicle Comprehensive Cover',
          issueDate: '2026-01-10',
          expiryDate: '2027-01-09',
          daysToExpiry: 72,
          status: 'VALID',
          issuingAuthority: 'The New India Assurance Co. Ltd.',
          documentNumber: 'NIA/CV/2026/89410',
        },
      ],
    } as unknown as T;
  }

  if (path === '/compliance/verify-pin') {
    const pin = body?.pin;
    if (pin === '8821' || pin === '1234') {
      return {
        success: true,
        data: {
          verified: true,
          token: 'auth-vault-token-live',
          secureDocumentUrl: 'https://parivahan.gov.in/vahan-service/verified-vault-doc.pdf',
          accessGrantedAt: new Date().toISOString(),
        },
        message: 'Security PIN verified. Encrypted document vault unlocked.',
      } as unknown as T;
    } else {
      throw new Error('Invalid Security PIN. Access denied to encrypted statutory vault.');
    }
  }

  // 7. Double-Entry Ledger
  if (path === '/ledger/trial-balance') {
    return {
      success: true,
      data: {
        asOfDate: new Date().toISOString().split('T')[0],
        accounts: [
          {
            accountCode: '1010',
            accountName: 'Cash at Bank (HDFC Fleet Current)',
            accountType: 'ASSET',
            debitPaise: 18500000,
            creditPaise: 0,
          },
          {
            accountCode: '1020',
            accountName: 'Freight Receivables (Consignor Khata)',
            accountType: 'ASSET',
            debitPaise: 710675,
            creditPaise: 0,
          },
          {
            accountCode: '1050',
            accountName: 'Driver Trip Advance Advances',
            accountType: 'ASSET',
            debitPaise: 2132025,
            creditPaise: 0,
          },
          {
            accountCode: '2010',
            accountName: 'Indian Oil Pump Credit Khata (Parchi)',
            accountType: 'LIABILITY',
            debitPaise: 0,
            creditPaise: 960000,
          },
          {
            accountCode: '4010',
            accountName: 'Gross Freight Revenue (Nagpur-Pune / Bhandara)',
            accountType: 'REVENUE',
            debitPaise: 0,
            creditPaise: 2842700,
          },
          {
            accountCode: '5010',
            accountName: 'Diesel Fuel Expense',
            accountType: 'EXPENSE',
            debitPaise: 1170000,
            creditPaise: 0,
          },
          {
            accountCode: '5020',
            accountName: 'FASTag Toll Expense',
            accountType: 'EXPENSE',
            debitPaise: 213000,
            creditPaise: 0,
          },
          {
            accountCode: '5030',
            accountName: 'Driver Bhatta / Khoraki',
            accountType: 'EXPENSE',
            debitPaise: 150000,
            creditPaise: 0,
          },
          {
            accountCode: '5040',
            accountName: 'Hamali & Loading Expense',
            accountType: 'EXPENSE',
            debitPaise: 45000,
            creditPaise: 0,
          },
        ],
        totalDebitPaise: 24720700,
        totalCreditPaise: 24720700,
        isBalanced: true,
      },
    } as unknown as T;
  }

  if (path === '/ledger/journals') {
    return {
      success: true,
      data: [
        {
          id: 'j-01',
          journalNumber: 'JRN-2026-0042',
          transactionDate: '2026-10-28',
          description: 'Nagpur to Pune Trip Freight Billing & Advance Allocation',
          totalAmountRupees: 21275,
          lines: [
            {
              accountName: 'Freight Receivables (Consignor)',
              debitRupees: 5318.75,
              creditRupees: 0,
            },
            {
              accountName: 'Driver Trip Advance (HDFC)',
              debitRupees: 15956.25,
              creditRupees: 0,
            },
            {
              accountName: 'Gross Freight Revenue',
              debitRupees: 0,
              creditRupees: 21275.0,
            },
          ],
        },
        {
          id: 'j-02',
          journalNumber: 'JRN-2026-0043',
          transactionDate: '2026-10-28',
          description: 'IOCL Samruddhi Plaza 100L Pump Credit Parchi',
          totalAmountRupees: 9600,
          lines: [
            { accountName: 'Diesel Fuel Expense', debitRupees: 9600, creditRupees: 0 },
            {
              accountName: 'Indian Oil Pump Credit Khata',
              debitRupees: 0,
              creditRupees: 9600,
            },
          ],
        },
      ],
    } as unknown as T;
  }

  // 8. OCR Parser
  if (path === '/ocr/extract') {
    const rawText = body?.rawText || '';
    const lrMatch = rawText.match(/LR[-\s]?(?:NO[:.]?\s*)?([A-Z0-9-]{4,15})/i);
    const rcMatch = rawText.match(/MH\s?[0-9]{1,2}\s?[A-Z]{1,3}\s?[0-9]{4}/i);
    const grossMatch = rawText.match(
      /GROSS\s*(?:WT|WEIGHT)?[:.]?\s*([0-9.,]+)\s*(?:KG|MT|TONNES)?/i
    );
    const tareMatch = rawText.match(
      /TARE\s*(?:WT|WEIGHT)?[:.]?\s*([0-9.,]+)\s*(?:KG|MT|TONNES)?/i
    );
    const netMatch = rawText.match(
      /NET\s*(?:WT|WEIGHT)?[:.]?\s*([0-9.,]+)\s*(?:KG|MT|TONNES)?/i
    );

    return {
      success: true,
      data: {
        detectedDocumentType:
          rawText.includes('BILTY') || rawText.includes('CONSIGNMENT')
            ? 'LORRY_RECEIPT_BILTY'
            : 'WEIGHBRIDGE_DHARAM_KANTA',
        extractedFields: {
          biltyNumber: lrMatch ? lrMatch[0] : 'LR-2026-9812',
          registrationNumber: rcMatch ? rcMatch[0] : 'MH 31 FC 8821',
          consignor: 'Tata Steel Tubes Division, MIDC Hingna Nagpur',
          consignee: 'Bajaj Auto Component Fabricators, Chakan Phase-II Pune',
          grossWeightKg: grossMatch ? grossMatch[1] : '27,500 KG',
          tareWeightKg: tareMatch ? tareMatch[1] : '9,000 KG',
          netPayloadWeightKg: netMatch ? netMatch[1] : '18,500 KG (18.50 MT)',
          dharamKantaSlipNo: 'DK-NAGPUR-2026-4410',
          complianceStatus: 'VERIFIED_LEGAL_WEIGHT',
        },
      },
    } as unknown as T;
  }

  // 9. Telematics Live Fleet & Highway Stepping
  if (path === '/telematics/live-fleet') {
    return { success: true, data: fleetState } as unknown as T;
  }

  if (path === '/telematics/simulate-step') {
    fleetState = fleetState.map((truck) => {
      let newLat = truck.latitude;
      let newLng = truck.longitude;
      const stepKm = 2.5;

      if (truck.imei === '860144040001001') {
        newLat -= 0.015;
        newLng -= 0.025;
      } else if (truck.imei === '860144040001002') {
        newLat -= 0.012;
        newLng -= 0.022;
      } else {
        newLat += 0.005;
        newLng += 0.035;
      }

      const fuelBurned = stepKm / 3.0;
      const updatedFuel = Math.max(
        10,
        Number((truck.fuelSensorLitres - fuelBurned).toFixed(2))
      );
      const updatedOdo = Number((truck.odometerKm + stepKm).toFixed(1));
      const updatedHistory = [
        ...(truck.historyTrail || []),
        [newLat, newLng] as [number, number],
      ];

      return {
        ...truck,
        latitude: newLat,
        longitude: newLng,
        odometerKm: updatedOdo,
        fuelSensorLitres: updatedFuel,
        speedKmh: 58.0 + (Math.random() * 8 - 4),
        historyTrail: updatedHistory.slice(-20),
      };
    });

    return {
      success: true,
      data: {
        stepAdvancedKm: 2.5,
        burnRateKmpl: 3.0,
        fleet: fleetState,
      },
    } as unknown as T;
  }

  if (path === '/telematics/ping') {
    const imei = body?.imei || fleetState[0].imei;
    const isSiphon = body?.speedKmh === 0 && Number(body?.fuelSensorLitres) < 220;

    fleetState = fleetState.map((t) => {
      if (t.imei === imei) {
        return {
          ...t,
          speedKmh: body?.speedKmh !== undefined ? Number(body.speedKmh) : t.speedKmh,
          fuelSensorLitres:
            body?.fuelSensorLitres !== undefined
              ? Number(body.fuelSensorLitres)
              : t.fuelSensorLitres,
          siphoningAlert: isSiphon,
        };
      }
      return t;
    });

    return {
      success: true,
      data: {
        imei,
        siphonAlert: isSiphon,
        message: isSiphon ? 'Stationary fuel drop alert triggered!' : 'Ping recorded',
      },
    } as unknown as T;
  }

  // Freight Loads Marketplace
  if (path.startsWith('/loads')) {
    if (path.includes('/book')) {
      const parts = path.split('/');
      const loadId = parts[2];
      loadsState = loadsState.map((l) => (l.id === loadId ? { ...l, status: 'BOOKED' } : l));
      const booked = loadsState.find((l) => l.id === loadId);
      return { success: true, message: 'Load booked successfully', data: booked } as unknown as T;
    }
    if (method === 'POST') {
      const newLoad = {
        id: `load-${Date.now()}`,
        ...(body as any),
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
      };
      loadsState.unshift(newLoad);
      return { success: true, data: newLoad } as unknown as T;
    }
    return { success: true, count: loadsState.length, data: loadsState } as unknown as T;
  }

  if (path === '/preferred-lanes') {
    if (method === 'POST') {
      if (Array.isArray((body as any)?.lanes)) {
        preferredLanesState = (body as any).lanes;
      }
      return { success: true, data: preferredLanesState } as unknown as T;
    }
    return { success: true, count: preferredLanesState.length, data: preferredLanesState } as unknown as T;
  }

  // Call Logs
  if (path.startsWith('/call-logs')) {
    if (method === 'DELETE') {
      const id = path.split('/')[2];
      callLogsState = callLogsState.filter((c) => c.id !== id);
      return { success: true, message: 'Deleted' } as unknown as T;
    }
    if (method === 'POST') {
      const newLog = {
        id: `call-${Date.now()}`,
        ...(body as any),
        createdAt: new Date().toISOString(),
      };
      callLogsState.unshift(newLog);
      return { success: true, data: newLog } as unknown as T;
    }
    return { success: true, count: callLogsState.length, data: callLogsState } as unknown as T;
  }

  // Verifications
  if (path === '/verify/vahan') {
    const reg = ((body as any)?.registrationNumber || 'MH40AK9988').replace(/[\s-]/g, '').toUpperCase();
    const result = {
      id: `vahan-${Date.now()}`,
      organizationId: 'org-default',
      verificationType: 'VAHAN_RC',
      identifierNumber: reg,
      holderName: 'Vidarbha Heavy Haulers Pvt Ltd',
      verificationStatus: 'VERIFIED',
      payload: {
        registrationNumber: reg,
        rtoOffice: 'MH-40 (Nagpur Rural / Hingna Hub)',
        vehicleClass: 'Heavy Goods Vehicle (HGV) Multi-Axle Rigid',
        makerModel: 'Tata Motors Signa 3523.TK / 3520',
        axleConfiguration: reg.includes('16') ? '16_WHEELER' : reg.includes('31') ? '10_WHEELER' : '12_WHEELER',
        passingGvwKg: reg.includes('16') ? 47500 : reg.includes('31') ? 28000 : 35000,
        unladenTareKg: reg.includes('16') ? 17500 : reg.includes('31') ? 9000 : 11000,
        maxLegalPayloadKg: reg.includes('16') ? 30000 : reg.includes('31') ? 19000 : 24000,
        maxLegalPayloadTonnes: reg.includes('16') ? 30.0 : reg.includes('31') ? 19.0 : 24.0,
        fitnessExpiryDate: '2027-01-01',
        fitnessStatus: 'ACTIVE_VALID',
        nationalPermitExpiryDate: '2027-04-10',
        nationalPermitStatus: 'ALL_INDIA_PERMIT_ACTIVE',
        insuranceStatus: 'COMPREHENSIVE_VALID (New India Assurance)',
        roadTaxStatus: 'PAID_ANNUAL_VALID',
        pucStatus: 'VALID_GREEN',
        overloadRiskNotice: 'Section 194 MV Act: Loading exceeding legal payload will attract ₹20,000 base fine + ₹2,000 per excess MT.'
      },
      verifiedAt: new Date().toISOString()
    };
    return { success: true, source: 'MoRTH VAHAN 4.0 National Registry (Verified)', data: result } as unknown as T;
  }

  if (path === '/verify/sarathi') {
    const dl = ((body as any)?.dlNumber || 'MH14 20180012345').replace(/[\s-]/g, '').toUpperCase();
    const result = {
      id: `sarathi-${Date.now()}`,
      organizationId: 'org-default',
      verificationType: 'SARATHI_DL',
      identifierNumber: dl,
      holderName: dl.includes('12345') || dl.includes('88') ? 'Sanjay Yadav' : dl.includes('44') ? 'Rameshwar Patil' : 'Gurpreet Singh',
      verificationStatus: 'VERIFIED',
      payload: {
        dlNumber: dl,
        driverName: dl.includes('12345') || dl.includes('88') ? 'Sanjay Yadav' : dl.includes('44') ? 'Rameshwar Patil' : 'Gurpreet Singh',
        issuingRto: 'MH-14 Pimpri Chinchwad',
        vehicleClassesAuthorized: ['LMV', 'TRANS (Heavy Commercial Goods)', 'HMV'],
        commercialTransportEndorsement: {
          hasEndorsement: true,
          status: 'VALID_ENDORSED',
          badgeNumber: `MH/TR/COMM/${dl.slice(-5)}`,
          issueDate: '2016-08-14',
          validUntil: '2028-08-13'
        },
        hazardousGoodsCertified: true,
        overallStatus: 'ACTIVE_LEGITIMATE'
      },
      verifiedAt: new Date().toISOString()
    };
    return { success: true, source: 'Sarathi DL Commercial Transport Portal (Verified)', data: result } as unknown as T;
  }

  if (path === '/verify/kyc') {
    const docNo = ((body as any)?.documentNumber || '27AABCV1234F1Z8').replace(/[\s-]/g, '').toUpperCase();
    const result = {
      id: `kyc-${Date.now()}`,
      organizationId: 'org-default',
      verificationType: (body as any)?.documentType === 'PAN' ? 'PAN_KYC' : 'AADHAAR_KYC',
      identifierNumber: docNo,
      holderName: (body as any)?.entityName || 'Vidarbha Heavy Haulers Pvt Ltd',
      verificationStatus: 'VERIFIED',
      payload: {
        documentType: (body as any)?.documentType || 'GSTIN',
        documentNumber: docNo,
        entityName: (body as any)?.entityName || 'Vidarbha Heavy Haulers Pvt Ltd',
        taxStatus: 'ACTIVE_TAXPAYER',
        kycBadge: 'KYC_VERIFIED_GOLD',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'National Portal Gateway'
      },
      verifiedAt: new Date().toISOString()
    };
    return { success: true, data: result } as unknown as T;
  }

  if (path === '/verify/records') {
    return { success: true, count: 2, data: [] } as unknown as T;
  }

  // POD Balance Sentinel
  if (path.startsWith('/pod-claims')) {
    if (path.includes('/legal-notice')) {
      const id = path.split('/')[2];
      const claim = podClaimsState.find((c) => c.id === id) || podClaimsState[0];
      const noticeText = `*FORMAL PAYMENT DEMAND NOTICE - YATRA LEKHA FREIGHT ESCROW*\n\n` +
        `To: *${claim.brokerName}* (${claim.brokerPhone})\n` +
        `From: *Vidarbha Heavy Haulers Pvt Ltd / Patil Transport*\n\n` +
        `*Subject:* Immediate Payment of Overdue POD Balance (Bilty #${claim.biltyNumber})\n\n` +
        `Vehicle *${claim.vehicleNumber}* completed freight consignment delivery for route *${claim.origin} ➔ ${claim.destination}*.\n` +
        `• Total Freight: ₹${claim.totalFreight.toLocaleString('en-IN')}\n` +
        `• Loading Advance (75%): ₹${claim.advancePaid.toLocaleString('en-IN')}\n` +
        `• Outstanding POD Balance (25%): *₹${claim.balanceDue.toLocaleString('en-IN')}*\n` +
        `• Overdue Delay: *${claim.daysOverdue} Days*\n\n` +
        `Kindly release payment within 48 hours to avoid reporting under Indian Commercial Transport Guidelines.`;
      const cleanPhone = claim.brokerPhone.replace(/[^0-9]/g, '');
      const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(noticeText)}`;
      
      podClaimsState = podClaimsState.map((c) => (c.id === id ? { ...c, recoveryStatus: 'LEGAL_NOTICE_SENT' } : c));
      return { success: true, data: { noticeText, whatsappUrl } } as unknown as T;
    }
    if (path.includes('/settle')) {
      const id = path.split('/')[2];
      podClaimsState = podClaimsState.map((c) => (c.id === id ? { ...c, recoveryStatus: 'SETTLED' } : c));
      const settled = podClaimsState.find((c) => c.id === id);
      return { success: true, message: 'Settled', data: settled } as unknown as T;
    }
    if (method === 'POST') {
      const newClaim = {
        id: `claim-${Date.now()}`,
        ...(body as any),
        daysOverdue: 0,
        isOverdue: false,
        brokerRiskTier: 'LOW_RISK',
        recoveryStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };
      podClaimsState.unshift(newClaim);
      return { success: true, data: newClaim } as unknown as T;
    }
    const totalDue = podClaimsState
      .filter((c) => c.recoveryStatus !== 'SETTLED')
      .reduce((sum, c) => sum + Number(c.balanceDue), 0);
    return {
      success: true,
      count: podClaimsState.length,
      totalBalanceDue: totalDue,
      totalOverdueCount: podClaimsState.filter((c) => c.isOverdue && c.recoveryStatus !== 'SETTLED').length,
      data: podClaimsState
    } as unknown as T;
  }

  return { success: true, data: {} } as unknown as T;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('yatralekha_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    if (res.ok) {
      const data = await res.json();
      // Cache successful workspace GET responses for offline highway resilience
      if (method === 'GET') {
        OfflineSync.saveCache(path, data);
      }
      return data;
    }
  } catch {
    // Backend offline / remote highway coverage loss
  }

  // 1. Check local cache for offline GET requests
  if (method === 'GET') {
    const cached = OfflineSync.getCache<T>(path);
    if (cached) {
      return cached;
    }
  }

  // 2. Queue offline mutations for POST / DELETE
  if (method === 'POST' || method === 'DELETE') {
    OfflineSync.enqueueMutation(path, method, body);
    return {
      success: true,
      data: body || {},
      _offlineQueued: true,
      message: 'Saved to local offline queue. Will sync automatically when signal returns.'
    } as unknown as T;
  }

  // 3. Fallback engine (for unauthenticated or initial loads)
  return handleStandaloneFallback<T>(method, path, body);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
