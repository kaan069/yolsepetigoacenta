import { ServiceType } from '../../../types';
import type { ServiceTypeValue } from '../../../types';

export interface RequestFormState {
  service_type: ServiceTypeValue;
  insured_name: string;
  insured_phone: string;
  insured_plate: string;
  policy_number: string;
  insurance_name: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  estimated_km: number;

  // towTruck
  tw_vehicle_type: string;

  // crane
  cr_load_type: string;
  cr_load_weight: string;
  cr_lift_height: string;
  cr_floor: string;
  cr_has_obstacles: boolean;
  cr_obstacle_note: string;
  cr_duration: string;

  // roadAssistance
  ra_vehicle_type: string;
  ra_problem_types: string[];
  ra_problem_description: string;

  // homeToHomeMoving
  hm_home_type: string;
  hm_floor_from: string;
  hm_floor_to: string;
  hm_has_elevator_from: boolean;
  hm_has_elevator_to: boolean;
  hm_has_large_items: boolean;
  hm_has_fragile_items: boolean;
  hm_needs_packing: boolean;
  hm_needs_disassembly: boolean;
  hm_preferred_date: string;
  hm_preferred_time_slot: string;

  // cityToCity
  cc_load_type: string;
  cc_load_weight: string;
  cc_width: string;
  cc_length: string;
  cc_height: string;
  cc_preferred_date: string;
  cc_preferred_time_slot: string;
}

export const initialFormState: RequestFormState = {
  service_type: ServiceType.TowTruck as ServiceTypeValue,
  insured_name: '',
  insured_phone: '',
  insured_plate: '',
  policy_number: '',
  insurance_name: '',
  pickup_address: '',
  pickup_latitude: 0,
  pickup_longitude: 0,
  dropoff_address: '',
  dropoff_latitude: 0,
  dropoff_longitude: 0,
  estimated_km: 0,

  tw_vehicle_type: 'sedan',

  cr_load_type: '',
  cr_load_weight: '',
  cr_lift_height: '',
  cr_floor: '',
  cr_has_obstacles: false,
  cr_obstacle_note: '',
  cr_duration: '',

  ra_vehicle_type: 'sedan',
  ra_problem_types: [],
  ra_problem_description: '',

  hm_home_type: '',
  hm_floor_from: '',
  hm_floor_to: '',
  hm_has_elevator_from: false,
  hm_has_elevator_to: false,
  hm_has_large_items: false,
  hm_has_fragile_items: false,
  hm_needs_packing: false,
  hm_needs_disassembly: false,
  hm_preferred_date: '',
  hm_preferred_time_slot: '',

  cc_load_type: '',
  cc_load_weight: '',
  cc_width: '',
  cc_length: '',
  cc_height: '',
  cc_preferred_date: '',
  cc_preferred_time_slot: '',
};
