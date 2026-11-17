export { TipperTruck } from './TipperTruck';
export { FlatbedTruck } from './FlatbedTruck';
export { LowbedTruck } from './LowbedTruck';
export { ContainerCarrier } from './ContainerCarrier';
export { TankerTruck } from './TankerTruck';
export { CraneTruck } from './CraneTruck';
export { TowRecoveryTruck } from './TowRecoveryTruck';
export { RefrigeratedTruck } from './RefrigeratedTruck';

import { TipperTruck } from './TipperTruck';
import { FlatbedTruck } from './FlatbedTruck';
import { LowbedTruck } from './LowbedTruck';
import { ContainerCarrier } from './ContainerCarrier';
import { TankerTruck } from './TankerTruck';
import { CraneTruck } from './CraneTruck';
import { TowRecoveryTruck } from './TowRecoveryTruck';
import { RefrigeratedTruck } from './RefrigeratedTruck';
import type { VehicleType } from '../tokens/constants';
import React from 'react';

interface TruckIconProps {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Map from VehicleType to its icon component */
export const TRUCK_ICONS: Record<VehicleType, React.FC<TruckIconProps>> = {
  tipper: TipperTruck,
  flatbed: FlatbedTruck,
  lowbed: LowbedTruck,
  container_carrier: ContainerCarrier,
  tanker: TankerTruck,
  crane_truck: CraneTruck,
  tow_recovery: TowRecoveryTruck,
  refrigerated: RefrigeratedTruck,
};

/** Renders the correct truck icon for a given vehicle type */
export function TruckIcon({
  type,
  ...props
}: TruckIconProps & { type: VehicleType }) {
  const Icon = TRUCK_ICONS[type];
  return <Icon {...props} />;
}

