import React from 'react';
import type { ComplianceProject } from '../hooks/useComplianceProject';
import type { ComplianceInput } from '../utils/complianceEngine';

interface Props {
  project: ComplianceProject;
  rooms: ComplianceInput[];
  windows: ComplianceInput[];
  stair: ComplianceInput;
  doors: ComplianceInput[];
  hasStairs: boolean;
}

export const ReviewStep: React.FC<Props> = ({ project, rooms, windows, stair, doors, hasStairs }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Review & Run Check</h3>
        <p className="text-sm text-muted-foreground">Review your inputs then run the compliance check</p>
      </div>

      <div className="space-y-4">
        {/* Project */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <h4 className="font-medium text-sm mb-2">Project</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span><span>{project.project_name || '—'}</span>
            <span className="text-muted-foreground">Location:</span><span>{project.location_city}, {project.location_state_province}</span>
            <span className="text-muted-foreground">Code:</span><span>{project.code_system === 'IRC_2024' ? 'IRC 2024' : 'NBC 2025'}</span>
            <span className="text-muted-foreground">Building:</span><span>{project.building_type} • {project.num_storeys} storey{project.num_storeys > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Rooms */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <h4 className="font-medium text-sm mb-2">Rooms ({rooms.length})</h4>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rooms entered</p>
          ) : (
            <div className="space-y-1">
              {rooms.map((r, i) => (
                <div key={i} className="text-sm flex gap-2">
                  <span className="font-medium">{r.room_name}</span>
                  <span className="text-muted-foreground">({r.room_type}) — {r.room_area} {r.unit_system === 'imperial' ? 'sq ft' : 'm²'}, ceiling {r.ceiling_height} {r.unit_system === 'imperial' ? 'ft' : 'm'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Windows */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <h4 className="font-medium text-sm mb-2">Windows ({windows.length})</h4>
          {windows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No windows entered</p>
          ) : (
            <div className="space-y-1">
              {windows.map((w, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{w.room_name}</span>
                  <span className="text-muted-foreground"> — {w.window_is_egress ? 'Egress' : 'Standard'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stairs */}
        {hasStairs && (
          <div className="p-4 rounded-xl border border-border/50 bg-card/50">
            <h4 className="font-medium text-sm mb-2">Stairs</h4>
            <div className="text-sm text-muted-foreground">
              Width: {stair.stair_width || '—'} • Riser: {stair.stair_riser_height || '—'} • Tread: {stair.stair_tread_depth || '—'}
            </div>
          </div>
        )}

        {/* Doors */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <h4 className="font-medium text-sm mb-2">Doors & Hallways ({doors.length})</h4>
          {doors.length === 0 ? (
            <p className="text-sm text-muted-foreground">None entered</p>
          ) : (
            <div className="space-y-1">
              {doors.map((d, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{d.room_name}</span>
                  <span className="text-muted-foreground"> — {d.input_type} • Width: {d.door_width || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
