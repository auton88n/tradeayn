import React from 'react';
import { Building2, Calendar, User, FileText, MapPin } from 'lucide-react';

interface ReportHeaderProps {
  projectName: string;
  projectNumber?: string;
  clientName?: string;
  consultantName?: string;
  location?: string;
  date?: string;
  revisionNumber?: string;
  preparedBy?: string;
  checkedBy?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  projectName,
  projectNumber = 'PRJ-001',
  clientName = 'Municipality / Client',
  consultantName = 'Engineering Consultant',
  location = 'Project Location',
  date = new Date().toLocaleDateString('en-GB'),
  revisionNumber = 'Rev. 0',
  preparedBy = 'Engineer',
  checkedBy = 'Senior Engineer',
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg overflow-hidden print:bg-slate-900">
      {/* Top header bar */}
      <div className="bg-primary/20 px-6 py-2 flex justify-between items-center text-xs border-b border-white/10">
        <span className="font-mono tracking-wider">GRADING DESIGN REPORT</span>
        <span className="font-mono">{revisionNumber}</span>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Project Name</p>
                <p className="font-semibold text-lg leading-tight">{projectName}</p>
                <p className="text-xs text-slate-400 mt-1">No. {projectNumber}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Location</p>
                <p className="text-sm">{location}</p>
              </div>
            </div>
          </div>
          
          {/* Client & Consultant */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                <Building2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Client</p>
                <p className="font-medium">{clientName}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Consultant</p>
                <p className="font-medium">{consultantName}</p>
              </div>
            </div>
          </div>
          
          {/* Date & Personnel */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Date</p>
                <p className="font-medium">{date}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Prepared By</p>
                  <p className="text-sm">{preparedBy}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Checked By</p>
                  <p className="text-sm">{checkedBy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom border accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-emerald-500" />
    </div>
  );
};
