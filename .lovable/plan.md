

# AYN Building Code Compliance Checker — Complete Implementation Plan (with Full Dataset)

## Overview
Add a "Building Code Check" tool to the Engineering Workspace. Users input residential design data and get an instant pass/fail compliance report against IRC 2024 (US) or NBC 2025 (Canada). This plan incorporates the full 120+ requirement dataset provided.

---

## Step 1: Database Tables + RLS

Create 5 new tables via SQL migration.

### Table: `building_codes`
Stores all IRC 2024 and NBC 2025 requirements. Columns: `id` (UUID PK), `code_system` (TEXT, 'IRC_2024' or 'NBC_2025'), `category`, `requirement_id`, `requirement_name`, `check_type` ('min'/'max'/'range'/'boolean'), `value_min` (DECIMAL), `value_max` (DECIMAL), `unit`, `applies_to`, `exception_notes`, `fix_suggestion`, `created_at`.

### Table: `climate_zones`
Columns: `id` (UUID PK), `country`, `region`, `zone_code`, `frost_depth_mm`, `ground_snow_load_kpa`, `wind_speed_kmh`, `seismic_category`, `heating_degree_days`, `wall_insulation_min`, `ceiling_insulation_min`, `window_u_factor_max`, `air_sealing_max_ach50`.

### Table: `compliance_projects`
Columns: `id` (UUID PK), `user_id` (UUID), `project_name`, `location_country`, `location_state_province`, `location_city`, `location_zip_postal`, `code_system`, `climate_zone_id` (FK to climate_zones), `building_type`, `num_storeys`, `has_basement` (BOOLEAN DEFAULT FALSE), `has_garage` (BOOLEAN DEFAULT FALSE), `garage_attached` (BOOLEAN DEFAULT FALSE), `has_fuel_burning_appliance` (BOOLEAN DEFAULT FALSE), `total_checks` (INTEGER), `passed_checks` (INTEGER), `failed_checks` (INTEGER), `report_pdf_url`, `created_at`, `updated_at`.

### Table: `compliance_inputs` (Full Column List)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID PK | gen_random_uuid() | |
| project_id | UUID FK | | CASCADE delete to compliance_projects |
| input_type | TEXT NOT NULL | | 'room', 'window', 'stair', 'door', 'hallway', 'ceiling', 'alarm' |
| room_name | TEXT | | 'Bedroom 1', 'Living Room', etc. |
| room_area | DECIMAL | | sq ft or m2 |
| room_min_dimension | DECIMAL | | shortest wall length |
| room_type | TEXT | | 'habitable', 'bedroom', 'bathroom', 'kitchen', 'laundry', 'hallway', 'basement' |
| ceiling_height | DECIMAL | | ft or m |
| has_sloped_ceiling | BOOLEAN | FALSE | |
| sloped_area_above_min_pct | DECIMAL | | % of area above 7ft/2.3m |
| window_opening_area | DECIMAL | | sq ft or m2 |
| window_opening_width | DECIMAL | | inches or mm |
| window_opening_height | DECIMAL | | inches or mm |
| window_sill_height | DECIMAL | | from floor |
| window_glazing_area | DECIMAL | | total glass area |
| window_is_egress | BOOLEAN | FALSE | |
| stair_width | DECIMAL | | |
| stair_riser_height | DECIMAL | | |
| stair_tread_depth | DECIMAL | | |
| stair_headroom | DECIMAL | | |
| stair_has_handrail | BOOLEAN | | |
| stair_handrail_height | DECIMAL | | |
| stair_num_risers | INTEGER | | |
| stair_flight_height | DECIMAL | | |
| stair_has_landing | BOOLEAN | | |
| stair_landing_length | DECIMAL | | |
| door_width | DECIMAL | | |
| door_height | DECIMAL | | |
| door_is_egress | BOOLEAN | FALSE | |
| unit_system | TEXT | 'imperial' | 'imperial' or 'metric' |
| created_at | TIMESTAMPTZ | NOW() | |

### Table: `compliance_results`
Columns: `id` (UUID PK), `project_id` (UUID FK, CASCADE), `input_id` (UUID FK to compliance_inputs), `code_requirement_id` (UUID FK to building_codes), `requirement_clause`, `requirement_name`, `status` ('pass'/'fail'/'warning'/'not_applicable'), `user_value` (DECIMAL), `required_value` (TEXT), `unit`, `room_name`, `fix_suggestion`, `created_at`.

### RLS Policies
- `building_codes`, `climate_zones`: SELECT for all authenticated users (read-only reference)
- `compliance_projects`: CRUD where `user_id = auth.uid()`; admin SELECT all
- `compliance_inputs`: CRUD where project belongs to user (via join); admin SELECT all
- `compliance_results`: CRUD where project belongs to user; admin SELECT all

---

## Step 2: Seed `building_codes` Table (~130 rows)

All data from the provided dataset, organized by category:

### Category: room_size (8 rows)
- IRC_2024 R313.1: Min habitable room area, min 70 sqft, applies_to habitable_room
- IRC_2024 R313.2: Min horizontal dimension, min 7 ft, applies_to habitable_room
- IRC_2024 R313.3: Sloped ceiling exclusion, areas < 5ft ceiling don't count
- IRC_2024 R313.3: Furred ceiling exclusion, areas < 7ft ceiling don't count
- NBC_2025 9.5.1.1: Min bedroom area, min 6.0 m2, applies_to bedroom
- NBC_2025 9.5.1.1: Min bedroom dimension, min 2.4 m, applies_to bedroom
- NBC_2025 9.5.1.1: Min living room area, min 13.5 m2, applies_to living_room
- NBC_2025 9.5.1.1: Min kitchen area, min 4.2 m2, applies_to kitchen

### Category: ceiling_height (~20 rows)
- IRC_2024 R314.1: Habitable rooms min 7ft, hallways min 7ft, bathrooms min 6ft8in, laundry min 6ft8in, existing basement/attic conversion min 6ft8in (NEW 2024), above shower min 6ft8in, under beams min 6ft6in, under beams basement min 6ft4in, sloped ceilings min 7ft over 50% area
- NBC_2025 9.5.3.1: Habitable rooms min 2.3m, hallways min 2.1m, basements min 2.0m, bathrooms min 2.1m, laundry min 2.0m, under beams min 1.95m

### Category: sleeping_loft (5 rows, IRC only -- NEW 2024)
- IRC_2024 R315: Max area 70sqft, min ceiling 7ft over 50%, min ceiling anywhere 3ft, access via ship's ladder, guard required

### Category: lighting_ventilation (~12 rows)
- IRC_2024 R325.1: Glazing min 8% of floor area, openable min 4% of floor area
- IRC_2024 R325.2: Adjoining room exception (25 sqft or 8% combined)
- IRC_2024 R325.3: Bathroom ventilation (1.5 sqft window or exhaust fan)
- IRC_2024 R325.7: Stairway illumination 1 foot-candle
- IRC_2024 R325.10: Heating 68F minimum
- NBC_2025 9.7.2.2: Glazing min 5% of floor area, clear view to sky
- NBC_2025 9.7.3.3: Openable min 0.28 m2 per room
- NBC_2025 9.32.3.3: Bathroom exhaust fan required

### Category: egress (~14 rows)
- IRC_2024 R319.1: Required in every sleeping room + basement
- IRC_2024 R319.1.1: Min opening 5.7 sqft (5.0 sqft ground floor)
- IRC_2024 R319.1.2: Min height 24in, R319.1.3: min width 20in
- IRC_2024 R319.1.4: Max sill 44in
- IRC_2024 R319.2: Window well min 9 sqft, 36in projection
- IRC_2024 R319.2.1: Well depth > 44in needs ladder
- NBC_2025 9.9.10.1: Min opening 380mm x 760mm, max sill 1000mm

### Category: stairs (~20 rows)
- IRC_2024 R318: Width min 36in, at handrail min 31.5in (1 side) / 27in (2 sides), headroom min 6ft8in, max riser 7.75in, max variation 3/8in, min tread 10in (with nosing) / 11in (no nosing), nosing 3/4-1.25in, max flight 12ft7in, landing min 36in
- NBC_2025 9.8: Width min 860mm, headroom min 1950mm, max riser 200mm, min riser 125mm, tread run 235-355mm, variation max 6mm, nosing 15-25mm, landing min 860mm

### Category: handrails (~10 rows)
- IRC_2024 R320: Required if 4+ risers, height 34-38in, grip 1.25-2in diameter, full length, wall clearance 1.5in
- NBC_2025 9.8.7: Required 1 side, height 865-1070mm

### Category: guards (~8 rows)
- IRC_2024 R321: Flat guard 36in, stair guard 34in, no 4in sphere (flat), no 4.375in sphere (stairs)
- NBC_2025 9.8.8: Flat guard 1070mm, stair guard 900mm, no 100mm sphere

### Category: hallways_doors (~10 rows)
- IRC_2024 R318: Hallway min 36in, egress door 32in wide x 6ft8in, landing 36in, threshold max 1.5in
- NBC_2025 9.5/9.9: Hallway min 860mm, door height 1980mm, door width 810mm, barrier-free 860mm clear

### Category: fire_separation (~8 rows)
- IRC_2024 R302: Garage wall 1/2in gypsum, garage ceiling 5/8in Type X, self-closing door, dwelling separation 1-hr
- NBC_2025 9.10: Garage 45-min fire-resistance, self-closing door, dwelling-to-dwelling 1-hr

### Category: alarms (~12 rows)
- IRC_2024 R316: Smoke in each bedroom, outside sleeping area, each storey, hardwired + battery; CO outside sleeping area (if fuel/garage), each storey
- NBC_2025 9.10.18/19: Smoke each storey, each bedroom, within 5m of bedroom, hardwired + battery; CO adjacent to sleeping (if fuel/garage)

### Category: bathroom (~8 rows)
- IRC_2024 R326/R327: 1 toilet + lavatory + tub/shower + kitchen sink per unit, clearance 21in, toilet center 15in from wall, shower min 30x30in
- NBC_2025 9.31: Same fixtures, clearance 450mm, grab bar reinforcement (NEW 2025)

### Category: foundation (~10 rows)
- IRC_2024 R403: Footing below frost, width 12/15/18in by storeys, thickness min 6in, concrete 2500psi
- NBC_2025 9.15: Footing below frost, per table, thickness 100/150mm, concrete 15/25 MPa

### Category: structural_loads (~10 rows)
- IRC_2024 R301: Floor 40psf habitable, 30psf sleeping, deck 40psf, attic 10/20psf
- NBC_2025 9.4: Floor 1.9kPa, snow/wind/seismic per Appendix C

### Category: energy (~12 rows)
- IRC_2024 Ch11: Wall R-13 to R-20+5ci, ceiling R-30 to R-60, window U 0.25-0.40, air sealing 3-5 ACH50
- NBC_2025 9.36: Wall RSI 3.0-4.0+, ceiling RSI 7.0-10.0+, window U 1.60-2.0, airtightness 2.5 ACH50, GHG limits (NEW), thermal bridging (NEW)

### Category: radon (2 rows)
- NBC_2025 9.13.4: Passive radon stack required (NEW 2025)
- IRC_2024 Appendix F: Optional (not mandatory nationally)

### Category: accessibility (6 rows)
- NBC_2025 3.8.4/3.8.5: Adaptable units, visitable units, barrier-free entrance/doorway (EXPANDED 2025)
- IRC_2024 R322: Per ICC A117.1 where required locally

### Category: plumbing (4 rows per code)
- IRC_2024: Water heater max 120F, trap required, vent required, cleanout at stack base
- NBC_2025: Hot water max 49C, backflow prevention, condensate drainage

### Category: electrical (6 rows per code)
- IRC_2024: Outlets every 12ft, kitchen every 4ft GFCI, bathroom GFCI, AFCI locations, outdoor outlets
- NBC_2025/CEC: Outlets max 1.8m apart, kitchen every 1.2m, GFCI locations

---

## Step 3: Seed `climate_zones` Table (~50 rows)

Top 50 US and Canadian cities with zone code, frost depth, snow load, wind speed, seismic category, insulation requirements. Examples:
- New York, NY: Zone 4A, frost 914mm, snow 0.96kPa, wind 177km/h, Seismic B
- Toronto, ON: Zone 6, frost 1200mm, snow 1.1kPa, wind 130km/h, Seismic Low
- Halifax, NS: Zone 6, frost 1500mm, snow 2.0kPa, wind 140km/h, Seismic Low

---

## Step 4: Sidebar Integration

### Modified: `src/types/engineering.types.ts`
Add `'compliance'` to the `CalculatorType` union.

### Modified: `src/components/engineering/workspace/CalculatorSidebar.tsx`
Add new entry: id `'compliance'`, title "Code Compliance", shortTitle "Code Check", icon `ClipboardCheck`, gradient `from-teal-500 to-cyan-500`.

### Modified: `src/components/engineering/workspace/EngineeringWorkspace.tsx`
When `selectedCalculator === 'compliance'`, render `<ComplianceWizard />`.

---

## Step 5: Wizard UI (16 new files)

```text
src/components/engineering/compliance/
  ComplianceWizard.tsx              -- Step navigation, state management
  steps/
    ProjectSetupStep.tsx            -- Country, state, building type, toggles
    RoomEntryStep.tsx               -- Repeatable room cards with LxW helper
    WindowEntryStep.tsx             -- Per-room windows, egress details
    StairEntryStep.tsx              -- Conditional (multi-storey/basement)
    DoorsHallwaysStep.tsx           -- Egress door, hallway widths
    FireSafetyStep.tsx              -- Garage separation, alarms, radon
    ReviewStep.tsx                  -- Summary of all inputs
    ResultsStep.tsx                 -- Pass/fail dashboard with score
  hooks/
    useComplianceProject.ts         -- CRUD operations with Supabase
    useComplianceCheck.ts           -- Run checks, save results
    useClimateZone.ts               -- Auto-detect from location
  utils/
    complianceEngine.ts             -- Core comparison logic
    unitConversion.ts               -- Imperial/metric helpers
  ComplianceResultCard.tsx          -- Individual result with color coding
  ComplianceSummaryBadge.tsx        -- Overall score badge
```

### Key behaviors:
- Unit system auto-set: imperial for US, metric for Canada, togglable
- Step 4 (stairs) only shown if multi-storey or basement
- Step 6 radon section only shown for Canada
- Step 6 CO alarm section only shown if fuel-burning appliance or garage
- Bedroom windows auto-flagged as egress
- Room area has a "length x width" helper calculator
- All inputs saved to `compliance_inputs` table
- "Run Compliance Check" fetches `building_codes` for the selected code system, runs `complianceEngine`, saves to `compliance_results`, updates project counts

---

## Step 6: Compliance Engine

File: `complianceEngine.ts`

Core logic:
1. Fetch all `building_codes` rows where `code_system` matches project
2. For each `compliance_input`, find matching requirements by `applies_to` and `input_type`
3. Compare user values against `check_type`:
   - `min`: user_value >= value_min -> pass
   - `max`: user_value <= value_max -> pass
   - `range`: value_min <= user_value <= value_max -> pass
   - `boolean`: user_value matches expected -> pass
4. Handle unit conversion (imperial inputs vs metric code values or vice versa)
5. Return results array with status, clause, fix suggestion
6. Save to `compliance_results`, update project pass/fail counts

---

## Step 7: PDF Report Edge Function

### New: `supabase/functions/generate-compliance-pdf/index.ts`
- Accepts `project_id`
- Fetches project, inputs, results, climate zone from Supabase
- Generates PDF with: cover page (AYN branding, project info, code edition), executive summary, color-coded results by category, code clause references, fix instructions, structural results (if available), material quantities, disclaimer, unique report ID
- Uploads to Supabase Storage `compliance-reports` bucket
- Saves URL to project record

---

## Step 8: AI System Prompt Update

### Modified: `supabase/functions/ayn-unified/systemPrompts.ts`
Add to engineering mode prompt:
- IRC 2024 and NBC 2025 key requirements (room sizes, ceiling heights, egress, stairs, fire separation, alarms, energy, radon, accessibility)
- Section renumbering note (2024 IRC reorganized Chapter 3)
- NBC 2025 key changes (snow load formula, radon stack, accessibility, energy tiers, GHG limits)
- Instruction to suggest Compliance Checker tool when relevant
- Context-aware location handling

---

## Step 9: Calculator Integration

- Feed climate zone data (frost depth, snow load, wind speed, seismic) into existing structural calculators
- Foundation calculator uses frost depth for footing depth
- Beam calculator uses code loads (40 psf habitable, 30 psf sleeping for IRC; 1.9 kPa for NBC)
- Optional "Run Structural Check" button in results step
- Display material quantities (concrete, rebar, formwork) from structural calcs

---

## Build Order
1. Database migration (5 tables + RLS)
2. Seed `building_codes` (~130 rows from dataset above)
3. Seed `climate_zones` (~50 cities)
4. Sidebar + workspace integration (3 files modified)
5. Wizard UI (16 new files)
6. Compliance engine
7. Results dashboard
8. PDF report edge function
9. AI system prompt update
10. Calculator integration

