
-- ============================================================
-- AYN Building Code Compliance Checker — Database Setup
-- 5 tables + RLS + seed data (~180 rows)
-- ============================================================

-- 1. building_codes — IRC 2024 and NBC 2025 requirements
CREATE TABLE public.building_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_system TEXT NOT NULL CHECK (code_system IN ('IRC_2024', 'NBC_2025')),
  category TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  requirement_name TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('min', 'max', 'range', 'boolean')),
  value_min DECIMAL,
  value_max DECIMAL,
  unit TEXT,
  applies_to TEXT,
  exception_notes TEXT,
  fix_suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. climate_zones — Location-specific environmental data
CREATE TABLE public.climate_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL CHECK (country IN ('US', 'CA')),
  region TEXT NOT NULL,
  zone_code TEXT,
  frost_depth_mm INTEGER,
  ground_snow_load_kpa DECIMAL,
  wind_speed_kmh DECIMAL,
  seismic_category TEXT,
  heating_degree_days INTEGER,
  wall_insulation_min TEXT,
  ceiling_insulation_min TEXT,
  window_u_factor_max DECIMAL,
  air_sealing_max_ach50 DECIMAL
);

-- 3. compliance_projects — User projects
CREATE TABLE public.compliance_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  location_country TEXT,
  location_state_province TEXT,
  location_city TEXT,
  location_zip_postal TEXT,
  code_system TEXT CHECK (code_system IN ('IRC_2024', 'NBC_2025')),
  climate_zone_id UUID REFERENCES public.climate_zones(id),
  building_type TEXT,
  num_storeys INTEGER DEFAULT 1,
  has_basement BOOLEAN DEFAULT FALSE,
  has_garage BOOLEAN DEFAULT FALSE,
  garage_attached BOOLEAN DEFAULT FALSE,
  has_fuel_burning_appliance BOOLEAN DEFAULT FALSE,
  total_checks INTEGER DEFAULT 0,
  passed_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  report_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. compliance_inputs — Room/window/stair/door measurements
CREATE TABLE public.compliance_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.compliance_projects(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL CHECK (input_type IN ('room', 'window', 'stair', 'door', 'hallway', 'ceiling', 'alarm')),
  room_name TEXT,
  room_area DECIMAL,
  room_min_dimension DECIMAL,
  room_type TEXT,
  ceiling_height DECIMAL,
  has_sloped_ceiling BOOLEAN DEFAULT FALSE,
  sloped_area_above_min_pct DECIMAL,
  window_opening_area DECIMAL,
  window_opening_width DECIMAL,
  window_opening_height DECIMAL,
  window_sill_height DECIMAL,
  window_glazing_area DECIMAL,
  window_is_egress BOOLEAN DEFAULT FALSE,
  stair_width DECIMAL,
  stair_riser_height DECIMAL,
  stair_tread_depth DECIMAL,
  stair_headroom DECIMAL,
  stair_has_handrail BOOLEAN,
  stair_handrail_height DECIMAL,
  stair_num_risers INTEGER,
  stair_flight_height DECIMAL,
  stair_has_landing BOOLEAN,
  stair_landing_length DECIMAL,
  door_width DECIMAL,
  door_height DECIMAL,
  door_is_egress BOOLEAN DEFAULT FALSE,
  unit_system TEXT DEFAULT 'imperial' CHECK (unit_system IN ('imperial', 'metric')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. compliance_results — Pass/fail results per check
CREATE TABLE public.compliance_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.compliance_projects(id) ON DELETE CASCADE,
  input_id UUID REFERENCES public.compliance_inputs(id),
  code_requirement_id UUID REFERENCES public.building_codes(id),
  requirement_clause TEXT,
  requirement_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'not_applicable')),
  user_value DECIMAL,
  required_value TEXT,
  unit TEXT,
  room_name TEXT,
  fix_suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_building_codes_system ON public.building_codes(code_system);
CREATE INDEX idx_building_codes_category ON public.building_codes(category);
CREATE INDEX idx_compliance_projects_user ON public.compliance_projects(user_id);
CREATE INDEX idx_compliance_inputs_project ON public.compliance_inputs(project_id);
CREATE INDEX idx_compliance_results_project ON public.compliance_results(project_id);
CREATE INDEX idx_climate_zones_country ON public.climate_zones(country);

-- Updated_at trigger for compliance_projects
CREATE TRIGGER update_compliance_projects_updated_at
  BEFORE UPDATE ON public.compliance_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_engineering_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.building_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_results ENABLE ROW LEVEL SECURITY;

-- building_codes: read-only for authenticated
CREATE POLICY "Authenticated users can read building codes"
  ON public.building_codes FOR SELECT
  TO authenticated USING (true);

-- climate_zones: read-only for authenticated
CREATE POLICY "Authenticated users can read climate zones"
  ON public.climate_zones FOR SELECT
  TO authenticated USING (true);

-- compliance_projects: CRUD own, admin read all
CREATE POLICY "Users can view own compliance projects"
  ON public.compliance_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own compliance projects"
  ON public.compliance_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own compliance projects"
  ON public.compliance_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own compliance projects"
  ON public.compliance_projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all compliance projects"
  ON public.compliance_projects FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- compliance_inputs: CRUD where project belongs to user
CREATE POLICY "Users can view own compliance inputs"
  ON public.compliance_inputs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can create compliance inputs"
  ON public.compliance_inputs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own compliance inputs"
  ON public.compliance_inputs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own compliance inputs"
  ON public.compliance_inputs FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all compliance inputs"
  ON public.compliance_inputs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- compliance_results: CRUD where project belongs to user
CREATE POLICY "Users can view own compliance results"
  ON public.compliance_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can create compliance results"
  ON public.compliance_results FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own compliance results"
  ON public.compliance_results FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own compliance results"
  ON public.compliance_results FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.compliance_projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all compliance results"
  ON public.compliance_results FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- SEED: building_codes (~130 rows)
-- ============================================================

-- ROOM SIZE (8 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'room_size', 'R313.1', 'Min habitable room area', 'min', 70, NULL, 'sqft', 'habitable_room', 'Exception: kitchens', 'Increase room area to at least 70 sq ft'),
('IRC_2024', 'room_size', 'R313.2', 'Min horizontal dimension', 'min', 7, NULL, 'ft', 'habitable_room', 'Exception: kitchens', 'Widen room to at least 7 ft in shortest dimension'),
('IRC_2024', 'room_size', 'R313.3', 'Sloped ceiling area exclusion', 'min', 5, NULL, 'ft', 'ceiling_exclusion', 'Areas below 5 ft ceiling height do not count toward minimum area', 'Recalculate area excluding zones below 5 ft ceiling'),
('IRC_2024', 'room_size', 'R313.3', 'Furred ceiling area exclusion', 'min', 7, NULL, 'ft', 'ceiling_exclusion', 'Areas below 7 ft ceiling height do not count toward minimum area', 'Recalculate area excluding zones below 7 ft ceiling'),
('NBC_2025', 'room_size', '9.5.1.1', 'Min bedroom area', 'min', 6.0, NULL, 'm2', 'bedroom', NULL, 'Increase bedroom area to at least 6.0 m²'),
('NBC_2025', 'room_size', '9.5.1.1', 'Min bedroom dimension', 'min', 2.4, NULL, 'm', 'bedroom', NULL, 'Widen bedroom to at least 2.4 m in shortest dimension'),
('NBC_2025', 'room_size', '9.5.1.1', 'Min living room area', 'min', 13.5, NULL, 'm2', 'living_room', 'Combined living/dining', 'Increase living room area to at least 13.5 m²'),
('NBC_2025', 'room_size', '9.5.1.1', 'Min kitchen area', 'min', 4.2, NULL, 'm2', 'kitchen', '1.2 m clear in front of counters', 'Increase kitchen area to at least 4.2 m²');

-- CEILING HEIGHT (16 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'ceiling_height', 'R314.1', 'Habitable room ceiling height', 'min', 7, NULL, 'ft', 'habitable_room', NULL, 'Raise ceiling to at least 7 ft'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Hallway ceiling height', 'min', 7, NULL, 'ft', 'hallway', NULL, 'Raise hallway ceiling to at least 7 ft'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Bathroom ceiling height', 'min', 6.67, NULL, 'ft', 'bathroom', '6 ft 8 in', 'Raise bathroom ceiling to at least 6 ft 8 in'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Laundry room ceiling height', 'min', 6.67, NULL, 'ft', 'laundry', '6 ft 8 in', 'Raise laundry ceiling to at least 6 ft 8 in'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Existing basement conversion ceiling', 'min', 6.67, NULL, 'ft', 'basement_conversion', 'NEW in 2024 — reduced from 7 ft for existing conversions', 'Ceiling must be at least 6 ft 8 in for basement conversion'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Existing attic conversion ceiling', 'min', 6.67, NULL, 'ft', 'attic_conversion', 'NEW in 2024 — reduced from 7 ft for existing conversions', 'Ceiling must be at least 6 ft 8 in for attic conversion'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Above shower head clearance', 'min', 6.67, NULL, 'ft', 'shower', '6 ft 8 in in 30×30 in area', 'Raise ceiling above shower to at least 6 ft 8 in'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Under exposed beams', 'min', 6.5, NULL, 'ft', 'beam_clearance', 'Beams spaced ≥ 3 ft apart', 'Minimum 6 ft 6 in clearance under beams'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Under beams/ducts basement', 'min', 6.33, NULL, 'ft', 'basement_beam', 'Localized obstructions only', 'Minimum 6 ft 4 in clearance under basement beams/ducts'),
('IRC_2024', 'ceiling_height', 'R314.1', 'Sloped ceiling — min over 50% area', 'min', 7, NULL, 'ft', 'sloped_ceiling', 'Remainder minimum 5 ft', 'At least 50% of floor area must have 7 ft ceiling'),
('NBC_2025', 'ceiling_height', '9.5.3.1', 'Habitable room ceiling height', 'min', 2.3, NULL, 'm', 'habitable_room', NULL, 'Raise ceiling to at least 2.3 m'),
('NBC_2025', 'ceiling_height', '9.5.3.1', 'Hallway ceiling height', 'min', 2.1, NULL, 'm', 'hallway', NULL, 'Raise hallway ceiling to at least 2.1 m'),
('NBC_2025', 'ceiling_height', '9.5.3.1', 'Basement habitable ceiling', 'min', 2.0, NULL, 'm', 'basement', NULL, 'Raise basement ceiling to at least 2.0 m'),
('NBC_2025', 'ceiling_height', '9.5.3.1', 'Bathroom ceiling height', 'min', 2.1, NULL, 'm', 'bathroom', NULL, 'Raise bathroom ceiling to at least 2.1 m'),
('NBC_2025', 'ceiling_height', '9.5.3.1', 'Laundry room ceiling height', 'min', 2.0, NULL, 'm', 'laundry', NULL, 'Raise laundry ceiling to at least 2.0 m'),
('NBC_2025', 'ceiling_height', '9.5.3.1', 'Under beams/ducts clearance', 'min', 1.95, NULL, 'm', 'beam_clearance', 'Localized obstructions', 'Minimum 1.95 m clearance under beams/ducts');

-- SLEEPING LOFT (5 rows — IRC only, NEW 2024)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'sleeping_loft', 'R315', 'Max sleeping loft area', 'max', NULL, 70, 'sqft', 'sleeping_loft', 'Must be smaller than habitable room below', 'Sleeping loft must be less than 70 sq ft'),
('IRC_2024', 'sleeping_loft', 'R315', 'Min ceiling over 50% of loft', 'max', NULL, 7, 'ft', 'sleeping_loft', 'Ceiling ≤ 7 ft over at least half', 'Ceiling must not exceed 7 ft over at least 50% of loft area'),
('IRC_2024', 'sleeping_loft', 'R315', 'Min ceiling height anywhere', 'min', 3, NULL, 'ft', 'sleeping_loft', 'No area below 3 ft', 'No part of sleeping loft may be below 3 ft ceiling'),
('IRC_2024', 'sleeping_loft', 'R315', 'Access type', 'boolean', 1, NULL, 'boolean', 'sleeping_loft', 'Ship ladder, alternating tread, or ladder 70-80°', 'Must provide ship ladder, alternating tread device, or ladder at 70-80°'),
('IRC_2024', 'sleeping_loft', 'R315', 'Guard at open edge', 'boolean', 1, NULL, 'boolean', 'sleeping_loft', NULL, 'Guard required at open edge of sleeping loft');

-- LIGHTING & VENTILATION (12 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'lighting_ventilation', 'R325.1', 'Natural light — glazing area', 'min', 8, NULL, 'percent', 'habitable_room', 'Percent of floor area', 'Increase window glazing to at least 8% of floor area'),
('IRC_2024', 'lighting_ventilation', 'R325.1', 'Natural ventilation — openable area', 'min', 4, NULL, 'percent', 'habitable_room', 'Or mechanical per M1505', 'Increase openable window area to at least 4% of floor area'),
('IRC_2024', 'lighting_ventilation', 'R325.2', 'Adjoining room ventilation exception', 'min', 25, NULL, 'sqft', 'adjoining_room', 'Opening ≥ 25 sq ft or ≥ 8% combined', 'Opening to adjoining room must be ≥ 25 sq ft'),
('IRC_2024', 'lighting_ventilation', 'R325.3', 'Bathroom ventilation window', 'min', 1.5, NULL, 'sqft', 'bathroom', 'Or exhaust fan: 50 CFM intermittent / 20 CFM continuous', 'Add window ≥ 1.5 sq ft or install exhaust fan'),
('IRC_2024', 'lighting_ventilation', 'R325.7', 'Stairway illumination', 'min', 1, NULL, 'footcandle', 'stairs', 'Wall switch each floor if ≥ 6 risers', 'Provide at least 1 foot-candle at stair treads'),
('IRC_2024', 'lighting_ventilation', 'R325.10', 'Heating capability', 'min', 68, NULL, 'degF', 'habitable_room', 'At 3 ft above floor', 'Heating system must maintain 68°F at 3 ft above floor'),
('NBC_2025', 'lighting_ventilation', '9.7.2.2', 'Natural light — glazing area', 'min', 5, NULL, 'percent', 'habitable_room', 'Clear view to sky required from center of window', 'Increase window glazing to at least 5% of floor area'),
('NBC_2025', 'lighting_ventilation', '9.7.3.3', 'Ventilation — openable area per room', 'min', 0.28, NULL, 'm2', 'habitable_room', 'Or mechanical ventilation', 'Provide at least 0.28 m² openable area per room'),
('NBC_2025', 'lighting_ventilation', '9.32.3.3', 'Bathroom exhaust fan', 'boolean', 1, NULL, 'boolean', 'bathroom', 'Vented to outdoors', 'Install bathroom exhaust fan vented to outdoors'),
('IRC_2024', 'lighting_ventilation', 'R325.10', 'Heating capability (metric)', 'min', 20, NULL, 'degC', 'habitable_room', 'Equivalent: 68°F = 20°C', 'Heating system must maintain 20°C');

-- EGRESS (14 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'egress', 'R319.1', 'Egress window required', 'boolean', 1, NULL, 'boolean', 'bedroom', 'Every sleeping room + every basement', 'Every bedroom and basement must have an egress window'),
('IRC_2024', 'egress', 'R319.1.1', 'Min net clear opening area', 'min', 5.7, NULL, 'sqft', 'bedroom', NULL, 'Egress window must have at least 5.7 sq ft net clear opening'),
('IRC_2024', 'egress', 'R319.1.1', 'Min net clear opening — ground floor', 'min', 5.0, NULL, 'sqft', 'bedroom_ground', 'Grade-floor openings', 'Ground floor egress window must have at least 5.0 sq ft opening'),
('IRC_2024', 'egress', 'R319.1.2', 'Min opening height', 'min', 24, NULL, 'inches', 'bedroom', NULL, 'Egress opening height must be at least 24 inches'),
('IRC_2024', 'egress', 'R319.1.3', 'Min opening width', 'min', 20, NULL, 'inches', 'bedroom', NULL, 'Egress opening width must be at least 20 inches'),
('IRC_2024', 'egress', 'R319.1.4', 'Max sill height from floor', 'max', NULL, 44, 'inches', 'bedroom', NULL, 'Lower window sill to 44 inches or less from floor'),
('IRC_2024', 'egress', 'R319.2', 'Window well minimum area', 'min', 9, NULL, 'sqft', 'window_well', 'Min 36 in projection from wall', 'Window well must be at least 9 sq ft with 36 in projection'),
('IRC_2024', 'egress', 'R319.2.1', 'Window well ladder required', 'boolean', 1, NULL, 'boolean', 'window_well_deep', 'Well depth > 44 in — rungs max 18 in apart, min 12 in wide', 'Install ladder/steps in window well deeper than 44 inches'),
('IRC_2024', 'egress', 'R319.1', 'Window control device height', 'max', NULL, 70, 'inches', 'egress_control', 'Clarified in 2024', 'Window control device must be ≤ 70 inches from floor'),
('NBC_2025', 'egress', '9.9.10.1', 'Min egress opening width', 'min', 380, NULL, 'mm', 'bedroom', 'Unobstructed', 'Egress window must be at least 380 mm wide'),
('NBC_2025', 'egress', '9.9.10.1', 'Min egress opening height', 'min', 760, NULL, 'mm', 'bedroom', 'Unobstructed', 'Egress window must be at least 760 mm high'),
('NBC_2025', 'egress', '9.9.10.1', 'Max sill height from floor', 'max', NULL, 1000, 'mm', 'bedroom', NULL, 'Lower window sill to 1000 mm or less from floor'),
('NBC_2025', 'egress', '9.9.10.1', 'Egress window required', 'boolean', 1, NULL, 'boolean', 'bedroom', 'Every bedroom not served by exit', 'Every bedroom must have an egress window'),
('NBC_2025', 'egress', '9.9.10.1', 'Operable from inside', 'boolean', 1, NULL, 'boolean', 'bedroom', 'No keys or tools required', 'Egress window must open from inside without keys or tools');

-- STAIRS (20 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'stairs', 'R318.1', 'Min stair width', 'min', 36, NULL, 'inches', 'stairs', 'Clear above handrail', 'Widen stairway to at least 36 inches'),
('IRC_2024', 'stairs', 'R318.1', 'Min width at handrail (1 side)', 'min', 31.5, NULL, 'inches', 'stairs', NULL, 'Width at handrail must be at least 31.5 inches'),
('IRC_2024', 'stairs', 'R318.1', 'Min width at handrail (2 sides)', 'min', 27, NULL, 'inches', 'stairs', NULL, 'Width between handrails must be at least 27 inches'),
('IRC_2024', 'stairs', 'R318.2', 'Min headroom', 'min', 6.67, NULL, 'ft', 'stairs', '6 ft 8 in from nosing line', 'Increase stair headroom to at least 6 ft 8 in'),
('IRC_2024', 'stairs', 'R318.5.1', 'Max riser height', 'max', NULL, 7.75, 'inches', 'stairs', NULL, 'Reduce riser height to 7.75 inches or less'),
('IRC_2024', 'stairs', 'R318.5.1', 'Max riser variation', 'max', NULL, 0.375, 'inches', 'stairs', 'Within a flight', 'Riser heights must not vary more than 3/8 inch within a flight'),
('IRC_2024', 'stairs', 'R318.5.2', 'Min tread depth (with nosing)', 'min', 10, NULL, 'inches', 'stairs', NULL, 'Increase tread depth to at least 10 inches'),
('IRC_2024', 'stairs', 'R318.5.2', 'Min tread depth (no nosing)', 'min', 11, NULL, 'inches', 'stairs_no_nosing', NULL, 'Increase tread depth to at least 11 inches (no nosing)'),
('IRC_2024', 'stairs', 'R318.5.3', 'Nosing projection', 'range', 0.75, 1.25, 'inches', 'stairs', NULL, 'Nosing must project 3/4 to 1-1/4 inches'),
('IRC_2024', 'stairs', 'R318.6', 'Max flight height', 'max', NULL, 151, 'inches', 'stairs', '12 ft 7 in vertical rise', 'Add landing — max flight height is 12 ft 7 in'),
('IRC_2024', 'stairs', 'R318.6', 'Min landing length', 'min', 36, NULL, 'inches', 'stairs', 'Top and bottom of flight', 'Landing must be at least 36 inches'),
('NBC_2025', 'stairs', '9.8.2.1', 'Min stair width', 'min', 860, NULL, 'mm', 'stairs', NULL, 'Widen stairway to at least 860 mm'),
('NBC_2025', 'stairs', '9.8.2.2', 'Min headroom', 'min', 1950, NULL, 'mm', 'stairs', NULL, 'Increase stair headroom to at least 1950 mm'),
('NBC_2025', 'stairs', '9.8.4.1', 'Max riser height', 'max', NULL, 200, 'mm', 'stairs', NULL, 'Reduce riser height to 200 mm or less'),
('NBC_2025', 'stairs', '9.8.4.1', 'Min riser height', 'min', 125, NULL, 'mm', 'stairs', NULL, 'Increase riser height to at least 125 mm'),
('NBC_2025', 'stairs', '9.8.4.2', 'Min tread run', 'min', 235, NULL, 'mm', 'stairs', NULL, 'Increase tread run to at least 235 mm'),
('NBC_2025', 'stairs', '9.8.4.2', 'Max tread run', 'max', NULL, 355, 'mm', 'stairs', NULL, 'Reduce tread run to 355 mm or less'),
('NBC_2025', 'stairs', '9.8.4.5', 'Max riser/tread variation', 'max', NULL, 6, 'mm', 'stairs', 'Riser and tread', 'Riser and tread must not vary more than 6 mm'),
('NBC_2025', 'stairs', '9.8.4.3', 'Nosing projection', 'range', 15, 25, 'mm', 'stairs', NULL, 'Nosing must project 15 to 25 mm'),
('NBC_2025', 'stairs', '9.8.6.1', 'Min landing length', 'min', 860, NULL, 'mm', 'stairs', NULL, 'Landing must be at least 860 mm');

-- HANDRAILS (10 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'handrails', 'R320', 'Handrail required', 'boolean', 1, NULL, 'boolean', 'stairs', 'At least 1 side if ≥ 4 risers', 'Install handrail on at least one side'),
('IRC_2024', 'handrails', 'R320.1', 'Handrail height', 'range', 34, 38, 'inches', 'stairs', 'From nosing line', 'Handrail must be 34 to 38 inches from nosing'),
('IRC_2024', 'handrails', 'R320.5', 'Grip diameter (circular)', 'range', 1.25, 2, 'inches', 'stairs', NULL, 'Handrail grip must be 1-1/4 to 2 inches diameter'),
('IRC_2024', 'handrails', 'R320.4', 'Wall clearance', 'min', 1.5, NULL, 'inches', 'stairs', NULL, 'Handrail must be at least 1.5 inches from wall'),
('IRC_2024', 'handrails', 'R320.3', 'Max projection from wall', 'max', NULL, 4.5, 'inches', 'stairs', 'Each side', 'Handrail must not project more than 4.5 inches'),
('NBC_2025', 'handrails', '9.8.7.1', 'Handrail required', 'boolean', 1, NULL, 'boolean', 'stairs', 'At least 1 side', 'Install handrail on at least one side'),
('NBC_2025', 'handrails', '9.8.7.2', 'Handrail height', 'range', 865, 1070, 'mm', 'stairs', NULL, 'Handrail must be 865 to 1070 mm from nosing');

-- GUARDS (8 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'guards', 'R321.1', 'Guard height — flat surfaces', 'min', 36, NULL, 'inches', 'guard_flat', 'Decks/porches > 30 in above grade', 'Guard must be at least 36 inches on flat surfaces'),
('IRC_2024', 'guards', 'R321.2', 'Guard height — stairs', 'min', 34, NULL, 'inches', 'guard_stairs', 'From nosing line', 'Stair guard must be at least 34 inches from nosing'),
('IRC_2024', 'guards', 'R321.3', 'Guard opening — flat (4 in sphere)', 'max', NULL, 4, 'inches', 'guard_flat', NULL, 'Guard openings must not pass a 4-inch sphere'),
('IRC_2024', 'guards', 'R321.3', 'Guard opening — stairs (4-3/8 in sphere)', 'max', NULL, 4.375, 'inches', 'guard_stairs', NULL, 'Stair guard openings must not pass a 4-3/8 inch sphere'),
('NBC_2025', 'guards', '9.8.8.1', 'Guard height — flat surfaces', 'min', 1070, NULL, 'mm', 'guard_flat', NULL, 'Guard must be at least 1070 mm on flat surfaces'),
('NBC_2025', 'guards', '9.8.8.1', 'Guard height — stairs', 'min', 900, NULL, 'mm', 'guard_stairs', NULL, 'Stair guard must be at least 900 mm from nosing'),
('NBC_2025', 'guards', '9.8.8.5', 'Guard opening (100 mm sphere)', 'max', NULL, 100, 'mm', 'guard_flat', NULL, 'Guard openings must not pass a 100 mm sphere');

-- HALLWAYS & DOORS (10 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'hallways_doors', 'R318.6', 'Min hallway width', 'min', 36, NULL, 'inches', 'hallway', NULL, 'Widen hallway to at least 36 inches'),
('IRC_2024', 'hallways_doors', 'R318.2', 'Egress door height', 'min', 6.67, NULL, 'ft', 'egress_door', '6 ft 8 in', 'Egress door must be at least 6 ft 8 in tall'),
('IRC_2024', 'hallways_doors', 'R318.2', 'Egress door width', 'min', 32, NULL, 'inches', 'egress_door', 'Clear width at 90° open', 'Egress door must be at least 32 inches clear width'),
('IRC_2024', 'hallways_doors', 'R318.3', 'Landing at exterior door', 'min', 36, NULL, 'inches', 'exterior_door', 'In direction of travel', 'Landing at exterior door must be at least 36 inches'),
('IRC_2024', 'hallways_doors', 'R318.3.2', 'Max threshold step-down', 'max', NULL, 1.5, 'inches', 'exterior_door', 'Interior side', 'Threshold step-down must not exceed 1.5 inches'),
('NBC_2025', 'hallways_doors', '9.5.4.1', 'Min hallway width', 'min', 860, NULL, 'mm', 'hallway', NULL, 'Widen hallway to at least 860 mm'),
('NBC_2025', 'hallways_doors', '9.5.5.1', 'Min door height', 'min', 1980, NULL, 'mm', 'door', NULL, 'Door must be at least 1980 mm tall'),
('NBC_2025', 'hallways_doors', '9.5.5.1', 'Min door width (bedroom/bath)', 'min', 810, NULL, 'mm', 'bedroom_door', NULL, 'Bedroom/bathroom door must be at least 810 mm wide'),
('NBC_2025', 'hallways_doors', '9.9.6.1', 'Exit door width', 'min', 810, NULL, 'mm', 'egress_door', NULL, 'Exit door must be at least 810 mm wide'),
('NBC_2025', 'hallways_doors', '9.5.5.1', 'Barrier-free door width', 'min', 860, NULL, 'mm', 'barrier_free_door', 'Clear opening — expanded in NBC 2025', 'Barrier-free door must be at least 860 mm clear');

-- FIRE SEPARATION (8 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'fire_separation', 'R302.6', 'Garage wall to dwelling — gypsum', 'boolean', 1, NULL, 'boolean', 'garage_wall', '½ in gypsum on garage side', 'Install ½ in gypsum board on garage side of wall'),
('IRC_2024', 'fire_separation', 'R302.6', 'Garage ceiling to room above — Type X', 'boolean', 1, NULL, 'boolean', 'garage_ceiling', '⅝ in Type X gypsum', 'Install ⅝ in Type X gypsum on garage ceiling'),
('IRC_2024', 'fire_separation', 'R302.5.1', 'Garage door — self-closing', 'boolean', 1, NULL, 'boolean', 'garage_door', 'Solid wood ≥ 1⅜ in or 20-min rated; no direct to sleeping room', 'Install self-closing door between garage and dwelling'),
('IRC_2024', 'fire_separation', 'R302.2', 'Dwelling unit separation', 'boolean', 1, NULL, 'boolean', 'dwelling_separation', '1-hr fire-resistance for duplex/townhouse', 'Provide 1-hour fire-resistance rated separation'),
('NBC_2025', 'fire_separation', '9.10.9.17', 'Garage to dwelling fire resistance', 'boolean', 1, NULL, 'boolean', 'garage_wall', 'Min 45-min fire-resistance', 'Provide min 45-min fire-resistance between garage and dwelling'),
('NBC_2025', 'fire_separation', '9.10.9.17', 'Garage self-closing door', 'boolean', 1, NULL, 'boolean', 'garage_door', 'Weather-stripped', 'Install self-closing, weather-stripped door to garage'),
('NBC_2025', 'fire_separation', '9.10.9.6', 'Dwelling to dwelling separation', 'boolean', 1, NULL, 'boolean', 'dwelling_separation', 'Min 1-hr fire-resistance', 'Provide 1-hour fire-resistance between dwelling units');

-- ALARMS (12 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'alarms', 'R316', 'Smoke alarm — inside each bedroom', 'boolean', 1, NULL, 'boolean', 'smoke_bedroom', NULL, 'Install smoke alarm inside each bedroom'),
('IRC_2024', 'alarms', 'R316', 'Smoke alarm — outside sleeping area', 'boolean', 1, NULL, 'boolean', 'smoke_hallway', 'In hallway', 'Install smoke alarm outside each sleeping area'),
('IRC_2024', 'alarms', 'R316', 'Smoke alarm — each storey', 'boolean', 1, NULL, 'boolean', 'smoke_storey', 'Including basement', 'Install smoke alarm on each storey including basement'),
('IRC_2024', 'alarms', 'R316', 'Smoke alarm — hardwired + battery', 'boolean', 1, NULL, 'boolean', 'smoke_power', 'New construction', 'Smoke alarms must be hardwired with battery backup'),
('IRC_2024', 'alarms', 'R316', 'CO alarm — outside sleeping area', 'boolean', 1, NULL, 'boolean', 'co_alarm', 'If fuel-burning appliance or attached garage', 'Install CO alarm outside each sleeping area'),
('IRC_2024', 'alarms', 'R316', 'CO alarm — each storey', 'boolean', 1, NULL, 'boolean', 'co_alarm_storey', NULL, 'Install CO alarm on each storey'),
('NBC_2025', 'alarms', '9.10.18.2', 'Smoke alarm — each storey', 'boolean', 1, NULL, 'boolean', 'smoke_storey', NULL, 'Install smoke alarm on each storey'),
('NBC_2025', 'alarms', '9.10.18.2', 'Smoke alarm — each sleeping room', 'boolean', 1, NULL, 'boolean', 'smoke_bedroom', NULL, 'Install smoke alarm in each sleeping room'),
('NBC_2025', 'alarms', '9.10.18.2', 'Smoke alarm — within 5 m of bedroom', 'boolean', 1, NULL, 'boolean', 'smoke_hallway', 'In hallway', 'Install smoke alarm within 5 m of each bedroom'),
('NBC_2025', 'alarms', '9.10.18.3', 'Smoke alarm — hardwired + battery', 'boolean', 1, NULL, 'boolean', 'smoke_power', 'Or 10-yr sealed battery', 'Smoke alarms: hardwired + battery backup or 10-yr sealed'),
('NBC_2025', 'alarms', '9.10.19.1', 'CO alarm — adjacent to sleeping', 'boolean', 1, NULL, 'boolean', 'co_alarm', 'If fuel-burning appliance or garage', 'Install CO alarm adjacent to sleeping area');

-- BATHROOM (8 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'bathroom', 'R326', 'Required fixtures per unit', 'boolean', 1, NULL, 'boolean', 'dwelling_unit', '1 toilet, 1 lavatory, 1 tub/shower', 'Each dwelling must have toilet, lavatory, and tub/shower'),
('IRC_2024', 'bathroom', 'R326', 'Kitchen sink required', 'boolean', 1, NULL, 'boolean', 'kitchen', NULL, 'Each dwelling unit must have a kitchen sink'),
('IRC_2024', 'bathroom', 'R327.1', 'Fixture front clearance', 'min', 21, NULL, 'inches', 'bathroom', 'Toilet, lavatory, bidet', 'Minimum 21 inches clearance in front of fixtures'),
('IRC_2024', 'bathroom', 'R327.2', 'Toilet center to wall', 'min', 15, NULL, 'inches', 'bathroom', 'Centerline to side wall/fixture', 'Toilet centerline must be at least 15 inches from wall'),
('IRC_2024', 'bathroom', 'R327.2', 'Shower minimum size', 'min', 30, NULL, 'inches', 'bathroom', '30×30 in interior', 'Shower must be at least 30×30 inches'),
('NBC_2025', 'bathroom', '9.31.4.1', 'Required fixtures per unit', 'boolean', 1, NULL, 'boolean', 'dwelling_unit', '1 toilet, 1 lavatory, 1 tub/shower', 'Each dwelling must have toilet, lavatory, and tub/shower'),
('NBC_2025', 'bathroom', '9.31.5.1', 'Fixture front clearance', 'min', 450, NULL, 'mm', 'bathroom', NULL, 'Minimum 450 mm clearance in front of fixtures'),
('NBC_2025', 'bathroom', '9.5.8.1', 'Grab bar reinforcement', 'boolean', 1, NULL, 'boolean', 'bathroom', 'Expanded in NBC 2025 for adaptable units', 'Install reinforced walls for future grab bars');

-- FOUNDATION (10 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'foundation', 'R403.1.4', 'Footing depth below frost line', 'boolean', 1, NULL, 'boolean', 'footing', 'Per Table R301.2 by location', 'Footing must extend below frost line per local data'),
('IRC_2024', 'foundation', 'R403.1', 'Footing width — 1 storey', 'min', 12, NULL, 'inches', 'footing_1storey', 'Standard soil 2000 psf', 'Footing must be at least 12 inches wide (1 storey)'),
('IRC_2024', 'foundation', 'R403.1', 'Footing width — 2 storey', 'min', 15, NULL, 'inches', 'footing_2storey', 'Standard soil', 'Footing must be at least 15 inches wide (2 storey)'),
('IRC_2024', 'foundation', 'R403.1', 'Footing width — 3 storey', 'min', 18, NULL, 'inches', 'footing_3storey', 'Standard soil', 'Footing must be at least 18 inches wide (3 storey)'),
('IRC_2024', 'foundation', 'R403.1.1', 'Min footing thickness', 'min', 6, NULL, 'inches', 'footing', NULL, 'Footing must be at least 6 inches thick'),
('IRC_2024', 'foundation', 'R402.2', 'Concrete strength — footings', 'min', 2500, NULL, 'psi', 'footing', NULL, 'Footing concrete must be at least 2500 psi'),
('NBC_2025', 'foundation', '9.12.2.2', 'Footing below frost penetration', 'boolean', 1, NULL, 'boolean', 'footing', 'Per Appendix C', 'Footing must extend below frost penetration depth'),
('NBC_2025', 'foundation', '9.15.3.5', 'Min footing thickness — 1 storey', 'min', 100, NULL, 'mm', 'footing_1storey', NULL, 'Footing must be at least 100 mm thick (1 storey)'),
('NBC_2025', 'foundation', '9.15.3.5', 'Min footing thickness — 2+ storey', 'min', 150, NULL, 'mm', 'footing_2storey', NULL, 'Footing must be at least 150 mm thick (2+ storey)'),
('NBC_2025', 'foundation', '9.3.1.1', 'Concrete strength — footings', 'min', 15, NULL, 'MPa', 'footing', '25 MPa for exposed concrete', 'Footing concrete must be at least 15 MPa');

-- STRUCTURAL LOADS (8 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'structural_loads', 'R301.5', 'Floor live load — habitable', 'min', 40, NULL, 'psf', 'floor_habitable', NULL, 'Design for at least 40 psf live load'),
('IRC_2024', 'structural_loads', 'R301.5', 'Floor live load — sleeping', 'min', 30, NULL, 'psf', 'floor_sleeping', NULL, 'Design for at least 30 psf live load'),
('IRC_2024', 'structural_loads', 'R301.5', 'Deck live load', 'min', 40, NULL, 'psf', 'deck', NULL, 'Design deck for at least 40 psf live load'),
('IRC_2024', 'structural_loads', 'R301.5', 'Attic live load — no storage', 'min', 10, NULL, 'psf', 'attic_no_storage', NULL, 'Design attic for at least 10 psf live load'),
('IRC_2024', 'structural_loads', 'R301.5', 'Attic live load — with storage', 'min', 20, NULL, 'psf', 'attic_storage', NULL, 'Design attic for at least 20 psf live load'),
('NBC_2025', 'structural_loads', '9.4.2.1', 'Floor live load', 'min', 1.9, NULL, 'kPa', 'floor_habitable', '40 psf equivalent', 'Design for at least 1.9 kPa live load');

-- ENERGY (10 rows — simplified ranges)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'energy', 'R402.1.2', 'Wall insulation (zone 4-8)', 'min', 13, NULL, 'R-value', 'wall_insulation', 'R-13 to R-20+5ci by zone', 'Increase wall insulation to meet code minimum'),
('IRC_2024', 'energy', 'R402.1.2', 'Ceiling insulation (zone 4-8)', 'min', 30, NULL, 'R-value', 'ceiling_insulation', 'R-30 to R-60 by zone', 'Increase ceiling insulation to meet code minimum'),
('IRC_2024', 'energy', 'R402.1.2', 'Window U-factor', 'max', NULL, 0.40, 'U-factor', 'window_energy', '0.25–0.40 by zone', 'Install windows with U-factor ≤ code requirement'),
('IRC_2024', 'energy', 'R402.4', 'Air sealing — max ACH50', 'max', NULL, 5, 'ACH50', 'air_sealing', '3–5 by zone', 'Reduce air leakage to meet ACH50 requirement'),
('NBC_2025', 'energy', '9.36.2.6', 'Wall insulation', 'min', 3.0, NULL, 'RSI', 'wall_insulation', 'RSI 3.0–4.0+ by zone', 'Increase wall insulation to at least RSI 3.0'),
('NBC_2025', 'energy', '9.36.2.6', 'Ceiling insulation', 'min', 7.0, NULL, 'RSI', 'ceiling_insulation', 'RSI 7.0–10.0+ by zone', 'Increase ceiling insulation to at least RSI 7.0'),
('NBC_2025', 'energy', '9.36.2.7', 'Window U-value', 'max', NULL, 2.0, 'W/m2K', 'window_energy', '≤ 1.60–2.0 by zone', 'Install windows with U-value ≤ code requirement'),
('NBC_2025', 'energy', '9.36.5.10', 'Airtightness', 'max', NULL, 2.5, 'ACH50', 'air_sealing', 'Some tiers', 'Reduce air leakage to ≤ 2.5 ACH50');

-- RADON (2 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('NBC_2025', 'radon', '9.13.4', 'Passive radon stack required', 'boolean', 1, NULL, 'boolean', 'dwelling_unit', 'NEW in NBC 2025 — vertical pipe from sub-slab to above roof', 'Install passive radon stack from sub-slab to above roof'),
('IRC_2024', 'radon', 'Appendix F', 'Radon provisions (optional)', 'boolean', 0, NULL, 'boolean', 'dwelling_unit', 'Not mandatory nationally — adopted by some jurisdictions', 'Check if local jurisdiction requires radon mitigation');

-- ACCESSIBILITY (6 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('NBC_2025', 'accessibility', '3.8.4', 'Adaptable dwelling units — grab bar reinforcement', 'boolean', 1, NULL, 'boolean', 'bathroom', 'NEW in NBC 2025 — reinforced walls in bathrooms', 'Install reinforced walls in bathrooms for future grab bars'),
('NBC_2025', 'accessibility', '3.8.5', 'Visitable dwelling units', 'boolean', 1, NULL, 'boolean', 'dwelling_unit', 'NEW in NBC 2025 — wider travel paths, accessible washrooms', 'Provide wider travel paths and accessible washroom'),
('NBC_2025', 'accessibility', '9.5.2.1', 'Barrier-free entrance', 'boolean', 1, NULL, 'boolean', 'entrance', 'Min 1 entrance, no steps — where required', 'Provide at least one barrier-free entrance'),
('NBC_2025', 'accessibility', '9.5.5.1', 'Barrier-free doorway', 'min', 860, NULL, 'mm', 'barrier_free_door', NULL, 'Barrier-free doorway must be at least 860 mm clear'),
('IRC_2024', 'accessibility', 'R322', 'Accessible units — Type A/B', 'boolean', 0, NULL, 'boolean', 'dwelling_unit', 'Per ICC A117.1 where required by local jurisdiction', 'Check local accessibility requirements per ICC A117.1');

-- PLUMBING (7 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'plumbing', 'P2803.1', 'Water heater max temperature', 'max', NULL, 120, 'degF', 'water_heater', NULL, 'Set water heater to 120°F or less'),
('IRC_2024', 'plumbing', 'P3201.1', 'Trap per fixture', 'boolean', 1, NULL, 'boolean', 'fixture', NULL, 'Install trap for each plumbing fixture'),
('IRC_2024', 'plumbing', 'P3101.1', 'Vent per trap', 'boolean', 1, NULL, 'boolean', 'fixture', NULL, 'Provide vent for each trap'),
('IRC_2024', 'plumbing', 'P3005.2', 'Cleanout access', 'boolean', 1, NULL, 'boolean', 'plumbing_stack', 'Base of each stack, every 100 ft', 'Install cleanout at base of each stack'),
('NBC_2025', 'plumbing', '9.31.6.2', 'Hot water max temperature', 'max', NULL, 49, 'degC', 'water_heater', 'At fixtures', 'Hot water must not exceed 49°C at fixtures'),
('NBC_2025', 'plumbing', '9.31.3.1', 'Backflow prevention', 'boolean', 1, NULL, 'boolean', 'plumbing', NULL, 'Install backflow prevention devices');

-- ELECTRICAL (8 rows)
INSERT INTO public.building_codes (code_system, category, requirement_id, requirement_name, check_type, value_min, value_max, unit, applies_to, exception_notes, fix_suggestion) VALUES
('IRC_2024', 'electrical', 'E3901.2', 'Outlets in habitable rooms', 'boolean', 1, NULL, 'boolean', 'habitable_room', 'Every 12 ft wall, max 6 ft from corner', 'Install outlets every 12 ft along walls, max 6 ft from corners'),
('IRC_2024', 'electrical', 'E3901.4', 'Kitchen counter outlets', 'boolean', 1, NULL, 'boolean', 'kitchen', 'Every 4 ft, GFCI protected', 'Install GFCI outlets every 4 ft of kitchen counter'),
('IRC_2024', 'electrical', 'E3901.6', 'Bathroom outlet', 'boolean', 1, NULL, 'boolean', 'bathroom', '≥ 1 within 36 in of basin, GFCI', 'Install GFCI outlet within 36 inches of bathroom basin'),
('IRC_2024', 'electrical', 'E3902.1', 'GFCI required locations', 'boolean', 1, NULL, 'boolean', 'gfci_locations', 'Bath, kitchen, garage, outdoor, basement, laundry', 'Install GFCI protection in all required locations'),
('IRC_2024', 'electrical', 'E3901.7', 'Outdoor outlets', 'boolean', 1, NULL, 'boolean', 'outdoor', '≥ 1 front, ≥ 1 rear, GFCI', 'Install at least 1 GFCI outdoor outlet front and rear'),
('NBC_2025', 'electrical', '26-712', 'Outlet spacing', 'boolean', 1, NULL, 'boolean', 'habitable_room', 'Max 1.8 m apart along walls', 'Install outlets max 1.8 m apart along walls'),
('NBC_2025', 'electrical', '26-712', 'Kitchen counter outlets', 'boolean', 1, NULL, 'boolean', 'kitchen', 'Every 1.2 m of countertop', 'Install outlets every 1.2 m of kitchen countertop'),
('NBC_2025', 'electrical', '26-700', 'GFCI protection', 'boolean', 1, NULL, 'boolean', 'gfci_locations', 'Bath, kitchen, outdoor, garage', 'Install GFCI protection in all required locations');

-- ============================================================
-- SEED: climate_zones (~50 rows)
-- ============================================================

INSERT INTO public.climate_zones (country, region, zone_code, frost_depth_mm, ground_snow_load_kpa, wind_speed_kmh, seismic_category, heating_degree_days, wall_insulation_min, ceiling_insulation_min, window_u_factor_max, air_sealing_max_ach50) VALUES
-- US Cities
('US', 'New York, NY', '4A', 914, 0.96, 177, 'B', 4800, 'R-20', 'R-49', 0.32, 3),
('US', 'Los Angeles, CA', '3B', 0, 0, 137, 'D', 1200, 'R-13', 'R-30', 0.40, 5),
('US', 'Chicago, IL', '5A', 1067, 1.20, 145, 'A', 6500, 'R-20+5ci', 'R-49', 0.30, 3),
('US', 'Houston, TX', '2A', 0, 0, 209, 'A', 1600, 'R-13', 'R-38', 0.40, 5),
('US', 'Phoenix, AZ', '2B', 0, 0, 145, 'B', 1200, 'R-13', 'R-38', 0.40, 5),
('US', 'Philadelphia, PA', '4A', 914, 1.15, 145, 'A', 5000, 'R-20', 'R-49', 0.32, 3),
('US', 'San Antonio, TX', '2A', 0, 0, 145, 'A', 1500, 'R-13', 'R-38', 0.40, 5),
('US', 'San Diego, CA', '3B', 0, 0, 137, 'D', 1200, 'R-13', 'R-30', 0.40, 5),
('US', 'Dallas, TX', '3A', 305, 0.24, 145, 'A', 2300, 'R-13', 'R-38', 0.35, 5),
('US', 'San Jose, CA', '3C', 0, 0, 137, 'D', 2600, 'R-13', 'R-30', 0.35, 5),
('US', 'Austin, TX', '2A', 0, 0, 145, 'A', 1700, 'R-13', 'R-38', 0.40, 5),
('US', 'Jacksonville, FL', '2A', 0, 0, 177, 'A', 1300, 'R-13', 'R-38', 0.40, 5),
('US', 'Columbus, OH', '5A', 914, 1.05, 129, 'A', 5600, 'R-20+5ci', 'R-49', 0.30, 3),
('US', 'Indianapolis, IN', '5A', 914, 1.15, 129, 'A', 5600, 'R-20+5ci', 'R-49', 0.30, 3),
('US', 'Seattle, WA', '4C', 305, 0.72, 137, 'D', 4800, 'R-20', 'R-49', 0.32, 3),
('US', 'Denver, CO', '5B', 914, 1.20, 145, 'B', 6100, 'R-20+5ci', 'R-49', 0.30, 3),
('US', 'Boston, MA', '5A', 1219, 1.44, 161, 'B', 5600, 'R-20+5ci', 'R-49', 0.30, 3),
('US', 'Nashville, TN', '4A', 457, 0.48, 145, 'B', 3700, 'R-20', 'R-49', 0.32, 3),
('US', 'Detroit, MI', '5A', 1067, 1.15, 145, 'A', 6300, 'R-20+5ci', 'R-49', 0.30, 3),
('US', 'Portland, OR', '4C', 457, 0.72, 137, 'D', 4600, 'R-20', 'R-49', 0.32, 3),
('US', 'Las Vegas, NV', '3B', 0, 0, 145, 'B', 2200, 'R-13', 'R-30', 0.35, 5),
('US', 'Memphis, TN', '3A', 457, 0.24, 145, 'B', 3200, 'R-13', 'R-38', 0.35, 5),
('US', 'Miami, FL', '1A', 0, 0, 282, 'A', 200, 'R-13', 'R-30', 0.40, 5),
('US', 'Atlanta, GA', '3A', 305, 0.24, 145, 'B', 3000, 'R-13', 'R-38', 0.35, 5),
('US', 'Minneapolis, MN', '6A', 1524, 1.68, 145, 'A', 7900, 'R-20+5ci', 'R-49', 0.28, 3),
('US', 'Anchorage, AK', '7', 1829, 2.39, 137, 'D', 10500, 'R-20+5ci', 'R-60', 0.25, 3),
('US', 'Fairbanks, AK', '8', 2438, 1.92, 113, 'C', 14000, 'R-20+5ci', 'R-60', 0.25, 3),
('US', 'Salt Lake City, UT', '5B', 914, 1.20, 129, 'D', 5700, 'R-20+5ci', 'R-49', 0.30, 3),
('US', 'Charlotte, NC', '3A', 305, 0.24, 145, 'B', 3200, 'R-13', 'R-38', 0.35, 5),
-- Canadian Cities
('CA', 'Toronto, ON', '6', 1200, 1.1, 130, 'Low', 3800, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Montreal, QC', '7A', 1500, 2.6, 130, 'Low', 4500, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Vancouver, BC', '4', 300, 1.6, 120, 'High', 2900, 'RSI 3.0', 'RSI 7.0', 2.00, 2.5),
('CA', 'Calgary, AB', '7A', 1800, 1.0, 130, 'Low', 5100, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Edmonton, AB', '7A', 2100, 1.0, 110, 'Low', 5600, 'RSI 4.0', 'RSI 10.0', 1.60, 2.5),
('CA', 'Ottawa, ON', '6', 1500, 2.4, 120, 'Low', 4600, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Winnipeg, MB', '7A', 2100, 2.3, 130, 'Low', 5900, 'RSI 4.0', 'RSI 10.0', 1.60, 2.5),
('CA', 'Quebec City, QC', '7A', 1800, 3.5, 130, 'Low', 5200, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Halifax, NS', '6', 1500, 2.0, 140, 'Low', 4100, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Saskatoon, SK', '7B', 2100, 1.4, 130, 'Low', 6000, 'RSI 4.0', 'RSI 10.0', 1.60, 2.5),
('CA', 'Regina, SK', '7B', 2100, 1.3, 130, 'Low', 5900, 'RSI 4.0', 'RSI 10.0', 1.60, 2.5),
('CA', 'St. Johns, NL', '6', 1200, 2.8, 160, 'Low', 4800, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Victoria, BC', '5', 300, 1.2, 110, 'High', 3000, 'RSI 3.0', 'RSI 7.0', 2.00, 2.5),
('CA', 'Kelowna, BC', '5', 900, 1.8, 100, 'Moderate', 3500, 'RSI 3.0', 'RSI 7.0', 1.80, 2.5),
('CA', 'London, ON', '6', 1200, 1.5, 120, 'Low', 4000, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Fredericton, NB', '6', 1500, 2.8, 120, 'Low', 4700, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Charlottetown, PE', '6', 1200, 2.3, 130, 'Low', 4600, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5),
('CA', 'Yellowknife, NT', '8', 3000, 2.0, 110, 'Low', 8500, 'RSI 4.0', 'RSI 10.0', 1.40, 2.5),
('CA', 'Whitehorse, YT', '8', 2400, 1.5, 100, 'Moderate', 7200, 'RSI 4.0', 'RSI 10.0', 1.40, 2.5),
('CA', 'Thunder Bay, ON', '7A', 1800, 2.0, 120, 'Low', 5600, 'RSI 4.0', 'RSI 10.0', 1.60, 2.5),
('CA', 'Sudbury, ON', '7A', 1500, 2.2, 110, 'Low', 5200, 'RSI 3.5', 'RSI 8.6', 1.60, 2.5);
