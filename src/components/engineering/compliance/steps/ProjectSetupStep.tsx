import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ComplianceProject } from '../hooks/useComplianceProject';
import { useClimateZone } from '../hooks/useClimateZone';

interface Props {
  project: ComplianceProject;
  onUpdate: (updates: Partial<ComplianceProject>) => void;
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

const CA_PROVINCES = [
  'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador',
  'Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'
];

export const ProjectSetupStep: React.FC<Props> = ({ project, onUpdate }) => {
  const { zones } = useClimateZone(project.location_country);
  const states = project.location_country === 'US' ? US_STATES : CA_PROVINCES;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Project Setup</h3>
        <p className="text-sm text-muted-foreground">Enter your project location and building details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input value={project.project_name} onChange={e => onUpdate({ project_name: e.target.value })} placeholder="My Residential Project" />
        </div>
        
        <div className="space-y-2">
          <Label>Country</Label>
          <Select value={project.location_country} onValueChange={v => onUpdate({ location_country: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States (IRC 2024)</SelectItem>
              <SelectItem value="CA">Canada (NBC 2025)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{project.location_country === 'US' ? 'State' : 'Province'}</Label>
          <Select value={project.location_state_province} onValueChange={v => onUpdate({ location_state_province: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <Input value={project.location_city} onChange={e => onUpdate({ location_city: e.target.value })} placeholder="City name" />
        </div>

        <div className="space-y-2">
          <Label>{project.location_country === 'US' ? 'ZIP Code' : 'Postal Code'}</Label>
          <Input value={project.location_zip_postal} onChange={e => onUpdate({ location_zip_postal: e.target.value })} placeholder={project.location_country === 'US' ? '10001' : 'A1B 2C3'} />
        </div>

        <div className="space-y-2">
          <Label>Climate Zone (auto)</Label>
          <Select value={project.climate_zone_id || ''} onValueChange={v => onUpdate({ climate_zone_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select zone..." /></SelectTrigger>
            <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.region} — Zone {z.zone_code}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Building Type</Label>
          <Select value={project.building_type} onValueChange={v => onUpdate({ building_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single_family">Single Family</SelectItem>
              <SelectItem value="duplex">Duplex</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Number of Storeys</Label>
          <Select value={String(project.num_storeys)} onValueChange={v => onUpdate({ num_storeys: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Storey</SelectItem>
              <SelectItem value="2">2 Storeys</SelectItem>
              <SelectItem value="3">3 Storeys</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base">Building Features</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'has_basement', label: 'Basement' },
            { key: 'has_garage', label: 'Garage' },
            { key: 'garage_attached', label: 'Garage Attached', show: project.has_garage },
            { key: 'has_fuel_burning_appliance', label: 'Fuel-Burning Appliance (gas furnace, fireplace, etc.)' },
          ].filter(f => f.show !== false).map(f => (
            <div key={f.key} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
              <Label className="cursor-pointer">{f.label}</Label>
              <Switch
                checked={(project as any)[f.key]}
                onCheckedChange={v => onUpdate({ [f.key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
        <strong>Code:</strong> {project.code_system === 'IRC_2024' ? 'IRC 2024 (International Residential Code)' : 'NBC 2025 (National Building Code of Canada)'}
        <span className="text-muted-foreground ml-2">• Auto-selected based on country</span>
      </div>
    </div>
  );
};
