import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { VehicleType } from '@prisma/client';

export interface PricingCalculationInput {
  vehicleType: VehicleType;
  distanceKm: number;
  weightTonnes: number;
  isOversized?: boolean;
  needLoadingHelp?: boolean;
  needOffloadingHelp?: boolean;
  isHazardous?: boolean;
  isUrgent?: boolean;
}

export interface PriceBreakdownItem {
  code: string;
  name: string;
  amountMinorUnits: bigint; // in Pesewas
}

export interface PricingCalculationResult {
  breakdown: PriceBreakdownItem[];
  totalMinorUnits: bigint;
  depositMinorUnits: bigint;
  balanceMinorUnits: bigint;
  currency: string;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Default base rates per vehicle type in Pesewas (GHS * 100)
   */
  private readonly DEFAULT_BASE_RATES: Record<VehicleType, bigint> = {
    [VehicleType.TIPPER]: 120000n, // GHS 1,200.00
    [VehicleType.FLATBED]: 180000n, // GHS 1,800.00
    [VehicleType.LOWBED]: 280000n, // GHS 2,800.00
    [VehicleType.CONTAINER_CARRIER]: 150000n, // GHS 1,500.00
    [VehicleType.TANKER]: 200000n, // GHS 2,000.00
    [VehicleType.CRANE_TRUCK]: 250000n, // GHS 2,500.00
    [VehicleType.TOW_RECOVERY]: 90000n, // GHS 900.00
    [VehicleType.REFRIGERATED]: 160000n, // GHS 1,600.00
  };

  /**
   * Calculate exact quotation breakdown and deposit requirements in minor units (Pesewas)
   */
  async calculateQuote(input: PricingCalculationInput): Promise<PricingCalculationResult> {
    const breakdown: PriceBreakdownItem[] = [];

    // 1. Base rate
    const baseRate = this.DEFAULT_BASE_RATES[input.vehicleType] || 150000n;
    breakdown.push({
      code: 'BASE_RATE',
      name: `Base Rate (${input.vehicleType.replace('_', ' ')})`,
      amountMinorUnits: baseRate,
    });

    // 2. Distance charge: approx GHS 30/km for heavy freight (3000 pesewas/km)
    const distanceKmRounded = Math.max(1, Math.round(input.distanceKm));
    const distanceRatePerKm = 3000n;
    const distanceAmount = BigInt(distanceKmRounded) * distanceRatePerKm;
    breakdown.push({
      code: 'DISTANCE_FEE',
      name: `Distance Fee (${distanceKmRounded} km @ GHS 30/km)`,
      amountMinorUnits: distanceAmount,
    });

    // 3. Weight / Tonnage charge: approx GHS 35/tonne (3500 pesewas/t)
    const weightTonnesRounded = Math.max(1, Math.round(input.weightTonnes));
    const tonnageRate = 3500n;
    const tonnageAmount = BigInt(weightTonnesRounded) * tonnageRate;
    breakdown.push({
      code: 'TONNAGE_FEE',
      name: `Tonnage Surcharge (${weightTonnesRounded}t @ GHS 35/t)`,
      amountMinorUnits: tonnageAmount,
    });

    // 4. Loading assistance
    if (input.needLoadingHelp) {
      breakdown.push({
        code: 'LOADING_ASSISTANCE',
        name: 'Pickup Site Loading Logistics',
        amountMinorUnits: 80000n, // GHS 800.00
      });
    }

    // 5. Offloading assistance
    if (input.needOffloadingHelp) {
      breakdown.push({
        code: 'OFFLOADING_ASSISTANCE',
        name: 'Destination Site Offloading Logistics',
        amountMinorUnits: 120000n, // GHS 1,200.00
      });
    }

    // 6. Oversized Cargo Surcharge
    if (input.isOversized) {
      breakdown.push({
        code: 'OVERSIZED_PERMIT',
        name: 'Oversized Securing & Transit Escort Permit',
        amountMinorUnits: 60000n, // GHS 600.00
      });
    }

    // 7. Hazardous Cargo
    if (input.isHazardous) {
      breakdown.push({
        code: 'HAZARDOUS_SURCHARGE',
        name: 'Hazardous / Dangerous Goods Safety Compliance',
        amountMinorUnits: 75000n, // GHS 750.00
      });
    }

    // 8. Urgent dispatch
    if (input.isUrgent) {
      breakdown.push({
        code: 'URGENT_DISPATCH',
        name: 'Priority Emergency Dispatch Surcharge',
        amountMinorUnits: 50000n, // GHS 500.00
      });
    }

    // Sum total
    const totalMinorUnits = breakdown.reduce(
      (acc, item) => acc + item.amountMinorUnits,
      0n
    );

    // Standard deposit is 50%, rounded to nearest pesewa
    const depositMinorUnits = totalMinorUnits / 2n;
    const balanceMinorUnits = totalMinorUnits - depositMinorUnits;

    return {
      breakdown,
      totalMinorUnits,
      depositMinorUnits,
      balanceMinorUnits,
      currency: 'GHS',
    };
  }
}

