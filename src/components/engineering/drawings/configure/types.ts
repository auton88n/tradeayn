// === Property Section Types ===

export type CardinalDirection = 'north' | 'south' | 'east' | 'west';
export type LotShape = 'rectangle' | 'square' | 'l-shaped' | 'irregular';
export type SlopeType = 'flat' | 'gentle' | 'steep';
export type DrivewayLocation = 'left' | 'right' | 'center';
export type ProximityLevel = 'close' | 'medium' | 'far';

export interface Setbacks {
  front: number;
  rear: number;
  left: number;
  right: number;
}

export interface NeighborProximity {
  left: ProximityLevel;
  right: ProximityLevel;
}

export interface PropertyData {
  has_specific_lot: boolean;
  // Lot dimensions (only when has_specific_lot)
  lot_shape?: LotShape;
  lot_width_ft?: number;
  lot_depth_ft?: number;
  // Orientation
  street_direction?: CardinalDirection;
  preferred_front_direction?: CardinalDirection;
  driveway_location?: DrivewayLocation;
  // Setbacks
  use_default_setbacks?: boolean;
  setbacks?: Setbacks;
  // Features
  trees_to_preserve?: boolean;
  slope?: SlopeType;
  view_direction?: CardinalDirection | 'none';
  neighbor_proximity?: NeighborProximity;
}

// === Placeholder types for other sections (to be filled in later) ===

export interface BasicsData {
  style_preset: string;
  num_bedrooms: number;
  num_bathrooms: number;
  target_sqft: number;
  num_storeys: number;
  has_garage: boolean;
  garage_type: 'none' | 'attached' | 'detached';
  location_country: string;
  location_state_province: string;
  exterior_materials: string[];
  custom_description: string;
}

export interface LifestyleData {
  family_type?: string;
  work_from_home?: string;
  cooking_style?: string;
  entertaining_frequency?: string;
  morning_routine?: string;
  privacy_level?: string;
  outdoor_living?: string[];
  pets?: string;
  accessibility?: boolean;
  storage_priority?: string;
}

export interface RoomPrioritiesData {
  ranked_priorities: string[];
  special_rooms: string[];
}

export interface StylePreferencesData {
  interior_feel?: string;
  ceiling_preference?: string;
  natural_light_priority?: string;
  front_of_house_priority?: string;
}

export interface DesignConfiguration {
  basics: BasicsData;
  property: PropertyData;
  lifestyle: LifestyleData;
  priorities: RoomPrioritiesData;
  style_preferences: StylePreferencesData;
}
