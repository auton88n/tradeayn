// Core compliance checking engine
import { normalizeToCodeUnit } from './unitConversion';

export interface BuildingCode {
  id: string;
  code_system: string;
  category: string;
  requirement_id: string;
  requirement_name: string;
  check_type: 'min' | 'max' | 'range' | 'boolean';
  value_min: number | null;
  value_max: number | null;
  unit: string;
  applies_to: string;
  exception_notes: string | null;
  fix_suggestion: string | null;
}

export interface ComplianceInput {
  id?: string;
  input_type: string;
  room_name?: string;
  room_area?: number;
  room_min_dimension?: number;
  room_type?: string;
  ceiling_height?: number;
  has_sloped_ceiling?: boolean;
  sloped_area_above_min_pct?: number;
  window_opening_area?: number;
  window_opening_width?: number;
  window_opening_height?: number;
  window_sill_height?: number;
  window_glazing_area?: number;
  window_is_egress?: boolean;
  stair_width?: number;
  stair_riser_height?: number;
  stair_tread_depth?: number;
  stair_headroom?: number;
  stair_has_handrail?: boolean;
  stair_handrail_height?: number;
  stair_num_risers?: number;
  stair_flight_height?: number;
  stair_has_landing?: boolean;
  stair_landing_length?: number;
  door_width?: number;
  door_height?: number;
  door_is_egress?: boolean;
  unit_system: 'imperial' | 'metric';
}

export interface ComplianceResult {
  code_requirement_id: string;
  requirement_clause: string;
  requirement_name: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  user_value: number | null;
  required_value: string;
  unit: string;
  room_name: string;
  fix_suggestion: string;
  category: string;
}

interface ProjectConfig {
  has_basement: boolean;
  has_garage: boolean;
  garage_attached: boolean;
  has_fuel_burning_appliance: boolean;
  num_storeys: number;
  building_type: string;
}

/** Run all compliance checks for a set of inputs against building codes */
export function runComplianceChecks(
  inputs: ComplianceInput[],
  codes: BuildingCode[],
  projectConfig: ProjectConfig
): ComplianceResult[] {
  const results: ComplianceResult[] = [];

  // Check room-based requirements
  const rooms = inputs.filter(i => i.input_type === 'room');
  for (const room of rooms) {
    const roomAppliesTo = mapRoomType(room.room_type);
    const applicableCodes = codes.filter(c => 
      roomAppliesTo.includes(c.applies_to) && 
      (c.category === 'room_size' || c.category === 'ceiling_height' || c.category === 'lighting_ventilation')
    );
    
    for (const code of applicableCodes) {
      const result = checkRoom(room, code);
      if (result) results.push(result);
    }
  }

  // Check window/egress requirements
  const windows = inputs.filter(i => i.input_type === 'window');
  for (const win of windows) {
    const egressCodes = codes.filter(c => c.category === 'egress');
    for (const code of egressCodes) {
      const result = checkEgress(win, code);
      if (result) results.push(result);
    }
  }

  // Check stair requirements
  const stairs = inputs.filter(i => i.input_type === 'stair');
  for (const stair of stairs) {
    const stairCodes = codes.filter(c => c.category === 'stairs' || c.category === 'handrails');
    for (const code of stairCodes) {
      const result = checkStair(stair, code);
      if (result) results.push(result);
    }
  }

  // Check door/hallway requirements
  const doors = inputs.filter(i => i.input_type === 'door' || i.input_type === 'hallway');
  for (const door of doors) {
    const doorCodes = codes.filter(c => c.category === 'hallways_doors');
    for (const code of doorCodes) {
      const result = checkDoor(door, code);
      if (result) results.push(result);
    }
  }

  // Check fire separation (project-level)
  if (projectConfig.has_garage) {
    const fireCodes = codes.filter(c => c.category === 'fire_separation');
    const fireInputs = inputs.filter(i => i.input_type === 'alarm');
    for (const code of fireCodes) {
      results.push({
        code_requirement_id: code.id,
        requirement_clause: code.requirement_id,
        requirement_name: code.requirement_name,
        status: 'warning',
        user_value: null,
        required_value: code.fix_suggestion || 'Required',
        unit: code.unit || '',
        room_name: 'Garage',
        fix_suggestion: code.fix_suggestion || 'Verify fire separation is installed',
        category: code.category,
      });
    }
  }

  // Check alarm requirements (project-level booleans)
  const alarmCodes = codes.filter(c => c.category === 'alarms');
  const alarmInputs = inputs.filter(i => i.input_type === 'alarm');
  for (const code of alarmCodes) {
    // CO alarms only apply if fuel-burning or garage
    if (code.applies_to?.startsWith('co_') && !projectConfig.has_fuel_burning_appliance && !projectConfig.has_garage) {
      continue;
    }
    results.push({
      code_requirement_id: code.id,
      requirement_clause: code.requirement_id,
      requirement_name: code.requirement_name,
      status: alarmInputs.length > 0 ? 'pass' : 'warning',
      user_value: null,
      required_value: 'Required',
      unit: 'boolean',
      room_name: 'Building',
      fix_suggestion: code.fix_suggestion || '',
      category: code.category,
    });
  }

  return results;
}

function mapRoomType(roomType?: string): string[] {
  switch (roomType) {
    case 'bedroom': return ['bedroom', 'habitable_room'];
    case 'living_room': return ['living_room', 'habitable_room'];
    case 'kitchen': return ['kitchen', 'habitable_room'];
    case 'bathroom': return ['bathroom'];
    case 'laundry': return ['laundry'];
    case 'hallway': return ['hallway'];
    case 'basement': return ['basement', 'habitable_room'];
    default: return ['habitable_room'];
  }
}

function checkRoom(room: ComplianceInput, code: BuildingCode): ComplianceResult | null {
  let userValue: number | undefined;
  
  if (code.category === 'room_size') {
    if (code.requirement_name.includes('area')) {
      userValue = room.room_area;
    } else if (code.requirement_name.includes('dimension')) {
      userValue = room.room_min_dimension;
    }
  } else if (code.category === 'ceiling_height') {
    userValue = room.ceiling_height;
  }
  
  if (userValue === undefined || userValue === null) return null;
  
  const normalized = normalizeToCodeUnit(userValue, room.unit_system, code.unit || '');
  return compareValue(normalized, code, room.room_name || 'Room');
}

function checkEgress(win: ComplianceInput, code: BuildingCode): ComplianceResult | null {
  if (!win.window_is_egress && code.check_type !== 'boolean') return null;
  
  let userValue: number | undefined;
  
  if (code.requirement_name.includes('opening area') || code.requirement_name.includes('net clear')) {
    userValue = win.window_opening_area;
  } else if (code.requirement_name.includes('width')) {
    userValue = win.window_opening_width;
  } else if (code.requirement_name.includes('height') && !code.requirement_name.includes('sill')) {
    userValue = win.window_opening_height;
  } else if (code.requirement_name.includes('sill')) {
    userValue = win.window_sill_height;
  } else if (code.check_type === 'boolean') {
    return {
      code_requirement_id: code.id,
      requirement_clause: code.requirement_id,
      requirement_name: code.requirement_name,
      status: win.window_is_egress ? 'pass' : 'fail',
      user_value: win.window_is_egress ? 1 : 0,
      required_value: 'Required',
      unit: 'boolean',
      room_name: win.room_name || 'Window',
      fix_suggestion: code.fix_suggestion || '',
      category: code.category,
    };
  }
  
  if (userValue === undefined) return null;
  
  const normalized = normalizeToCodeUnit(userValue, win.unit_system, code.unit || '');
  return compareValue(normalized, code, win.room_name || 'Window');
}

function checkStair(stair: ComplianceInput, code: BuildingCode): ComplianceResult | null {
  let userValue: number | undefined;
  
  if (code.requirement_name.includes('width')) {
    userValue = stair.stair_width;
  } else if (code.requirement_name.includes('riser height') || code.requirement_name.includes('Max riser')) {
    userValue = stair.stair_riser_height;
  } else if (code.requirement_name.includes('tread')) {
    userValue = stair.stair_tread_depth;
  } else if (code.requirement_name.includes('headroom')) {
    userValue = stair.stair_headroom;
  } else if (code.requirement_name.includes('flight height')) {
    userValue = stair.stair_flight_height;
  } else if (code.requirement_name.includes('landing')) {
    userValue = stair.stair_landing_length;
  } else if (code.requirement_name.includes('Handrail height')) {
    userValue = stair.stair_handrail_height;
  } else if (code.requirement_name.includes('Handrail required') || code.check_type === 'boolean') {
    return {
      code_requirement_id: code.id,
      requirement_clause: code.requirement_id,
      requirement_name: code.requirement_name,
      status: stair.stair_has_handrail ? 'pass' : 'fail',
      user_value: stair.stair_has_handrail ? 1 : 0,
      required_value: 'Required',
      unit: 'boolean',
      room_name: stair.room_name || 'Stairs',
      fix_suggestion: code.fix_suggestion || '',
      category: code.category,
    };
  }
  
  if (userValue === undefined) return null;
  
  const normalized = normalizeToCodeUnit(userValue, stair.unit_system, code.unit || '');
  return compareValue(normalized, code, stair.room_name || 'Stairs');
}

function checkDoor(door: ComplianceInput, code: BuildingCode): ComplianceResult | null {
  let userValue: number | undefined;
  
  if (code.requirement_name.includes('hallway') || code.applies_to === 'hallway') {
    if (door.input_type === 'hallway') userValue = door.door_width;
  } else if (code.requirement_name.includes('height')) {
    userValue = door.door_height;
  } else if (code.requirement_name.includes('width')) {
    userValue = door.door_width;
  }
  
  if (userValue === undefined) return null;
  
  const normalized = normalizeToCodeUnit(userValue, door.unit_system, code.unit || '');
  return compareValue(normalized, code, door.room_name || 'Door');
}

function compareValue(userValue: number, code: BuildingCode, roomName: string): ComplianceResult {
  let status: 'pass' | 'fail' = 'pass';
  let requiredStr = '';
  
  switch (code.check_type) {
    case 'min':
      status = userValue >= (code.value_min || 0) ? 'pass' : 'fail';
      requiredStr = `≥ ${code.value_min} ${code.unit}`;
      break;
    case 'max':
      status = userValue <= (code.value_max || Infinity) ? 'pass' : 'fail';
      requiredStr = `≤ ${code.value_max} ${code.unit}`;
      break;
    case 'range':
      status = userValue >= (code.value_min || 0) && userValue <= (code.value_max || Infinity) ? 'pass' : 'fail';
      requiredStr = `${code.value_min}–${code.value_max} ${code.unit}`;
      break;
    case 'boolean':
      status = userValue ? 'pass' : 'fail';
      requiredStr = 'Required';
      break;
  }
  
  return {
    code_requirement_id: code.id,
    requirement_clause: code.requirement_id,
    requirement_name: code.requirement_name,
    status,
    user_value: Math.round(userValue * 100) / 100,
    required_value: requiredStr,
    unit: code.unit || '',
    room_name: roomName,
    fix_suggestion: status === 'fail' ? (code.fix_suggestion || '') : '',
    category: code.category,
  };
}
