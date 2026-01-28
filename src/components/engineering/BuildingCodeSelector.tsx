import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Scale, Clock, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AVAILABLE_CODES, type BuildingCodeId, type NBCCVersion } from '@/lib/buildingCodes';
import { cn } from '@/lib/utils';

interface BuildingCodeSelectorProps {
  selectedCode: BuildingCodeId;
  onCodeChange: (code: BuildingCodeId) => void;
  nbccVersion: NBCCVersion;
  onNbccVersionChange: (version: NBCCVersion) => void;
  isCollapsed?: boolean;
}

const NBCC_VERSIONS = [
  {
    id: '2020' as NBCCVersion,
    name: 'NBCC 2020',
    label: 'Recommended',
    description: 'Currently adopted across Canada',
    icon: Check,
    iconColor: 'text-green-500',
  },
  {
    id: '2025' as NBCCVersion,
    name: 'NBCC 2025',
    label: 'New',
    description: 'Provincial adoption pending',
    icon: Clock,
    iconColor: 'text-amber-500',
  },
];

export const BuildingCodeSelector: React.FC<BuildingCodeSelectorProps> = ({
  selectedCode,
  onCodeChange,
  nbccVersion,
  onNbccVersionChange,
  isCollapsed = false,
}) => {
  const currentCode = AVAILABLE_CODES.find(c => c.id === selectedCode) || AVAILABLE_CODES[0];
  const currentNbcc = NBCC_VERSIONS.find(v => v.id === nbccVersion) || NBCC_VERSIONS[0];

  return (
    <div className="space-y-2">
      {/* Primary Building Code Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-between gap-2 bg-background/80 border-border/50 hover:bg-accent hover:text-accent-foreground",
              isCollapsed && "justify-center px-2"
            )}
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              {!isCollapsed && (
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span>{currentCode.flag}</span>
                  <span>{currentCode.id}</span>
                </span>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-3 h-3 opacity-50" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64 bg-popover border border-border shadow-lg z-50"
          sideOffset={4}
        >
          <div className="px-3 py-2 border-b border-border/50">
            <p className="text-xs font-semibold text-foreground">Building Code</p>
            <p className="text-[10px] text-muted-foreground">Select design standard</p>
          </div>
          {AVAILABLE_CODES.map((code) => (
            <DropdownMenuItem
              key={code.id}
              onClick={() => onCodeChange(code.id)}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent focus:bg-accent"
            >
              <div className="text-xl">{code.flag}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{code.name}</p>
                  {selectedCode === code.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </motion.div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {code.fullName} ({code.version})
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {code.loadCombination} • φ = {code.id === 'ACI' ? '0.90' : '0.65/0.85'}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Secondary NBCC Version Dropdown - Only shown when CSA is selected */}
      <AnimatePresence>
        {selectedCode === 'CSA' && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between gap-2 bg-background/80 border-border/50 hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-center gap-2">
                    <currentNbcc.icon className={cn("w-4 h-4", currentNbcc.iconColor)} />
                    <span className="text-xs font-medium">
                      {currentNbcc.name}
                      <span className="ml-1.5 text-[10px] text-muted-foreground">
                        ({currentNbcc.label})
                      </span>
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-64 bg-popover border border-border shadow-lg z-50"
                sideOffset={4}
              >
                <div className="px-3 py-2 border-b border-border/50">
                  <p className="text-xs font-semibold text-foreground">NBCC Edition</p>
                  <p className="text-[10px] text-muted-foreground">National Building Code of Canada</p>
                </div>
                {NBCC_VERSIONS.map((version) => (
                  <DropdownMenuItem
                    key={version.id}
                    onClick={() => onNbccVersionChange(version.id)}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent focus:bg-accent"
                  >
                    <version.icon className={cn("w-4 h-4 mt-0.5", version.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {version.name}
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            ({version.label})
                          </span>
                        </p>
                        {nbccVersion === version.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {version.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Warning when NBCC 2025 is selected */}
            <AnimatePresence>
              {nbccVersion === '2025' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/30"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                    Verify NBCC 2025 has been adopted in your jurisdiction before using for permits.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
