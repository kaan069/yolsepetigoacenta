import type { RequestFormState } from './types';

export function buildServiceDetails(form: RequestFormState): Record<string, unknown> {
  switch (form.service_type) {
    case 'towTruck':
      return { vehicle_type: form.tw_vehicle_type || 'sedan' };
    case 'crane':
      return {
        ...(form.cr_load_type && { load_type: form.cr_load_type }),
        ...(form.cr_load_weight && { load_weight: Number(form.cr_load_weight) }),
        ...(form.cr_lift_height && { lift_height: Number(form.cr_lift_height) }),
        ...(form.cr_floor && { floor: Number(form.cr_floor) }),
        has_obstacles: form.cr_has_obstacles,
        ...(form.cr_obstacle_note && { obstacle_note: form.cr_obstacle_note }),
        ...(form.cr_duration && { duration: Number(form.cr_duration) }),
      };
    case 'roadAssistance':
      return {
        ...(form.ra_vehicle_type && { vehicle_type: form.ra_vehicle_type }),
        ...(form.ra_problem_types.length && { problem_types: form.ra_problem_types }),
        ...(form.ra_problem_description && { problem_description: form.ra_problem_description }),
      };
    case 'homeToHomeMoving':
      return {
        ...(form.hm_home_type && { home_type: form.hm_home_type }),
        ...(form.hm_floor_from && { floor_from: Number(form.hm_floor_from) }),
        ...(form.hm_floor_to && { floor_to: Number(form.hm_floor_to) }),
        has_elevator_from: form.hm_has_elevator_from,
        has_elevator_to: form.hm_has_elevator_to,
        has_large_items: form.hm_has_large_items,
        has_fragile_items: form.hm_has_fragile_items,
        needs_packing: form.hm_needs_packing,
        needs_disassembly: form.hm_needs_disassembly,
        ...(form.hm_preferred_date && { preferred_date: form.hm_preferred_date }),
        ...(form.hm_preferred_time_slot && { preferred_time_slot: form.hm_preferred_time_slot }),
      };
    case 'cityToCity':
      return {
        ...(form.cc_load_type && { load_type: form.cc_load_type }),
        ...(form.cc_load_weight && { load_weight: Number(form.cc_load_weight) }),
        ...(form.cc_width && { width: Number(form.cc_width) }),
        ...(form.cc_length && { length: Number(form.cc_length) }),
        ...(form.cc_height && { height: Number(form.cc_height) }),
        ...(form.cc_preferred_date && { preferred_date: form.cc_preferred_date }),
        ...(form.cc_preferred_time_slot && { preferred_time_slot: form.cc_preferred_time_slot }),
      };
    default:
      return {};
  }
}
