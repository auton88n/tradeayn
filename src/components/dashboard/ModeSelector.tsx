import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';

interface Mode {
  name: string;
  translatedName: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  webhookUrl: string;
}

interface ModeSelectorProps {
  modes: Mode[];
  selectedMode: string;
  onModeChange: (modeName: string) => void;
  disabled: boolean;
  language: string;
  t: (key: string) => string;
}

export const ModeSelector = ({ 
  modes, 
  selectedMode, 
  onModeChange, 
  disabled, 
  language,
  t 
}: ModeSelectorProps) => {
  return (
    <SidebarGroup>
      <div className={`w-full flex px-4 py-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
        <SidebarGroupLabel className={language === 'ar' ? 'text-right ml-auto' : 'text-left'}>{t('common.quickStart')}</SidebarGroupLabel>
      </div>
      <SidebarGroupContent className={language === 'ar' ? 'text-right' : ''}>
        <SidebarMenu>
          {modes.map((mode) => (
            <SidebarMenuItem key={mode.name}>
              <SidebarMenuButton
                onClick={() => onModeChange(mode.name)}
                disabled={disabled}
                tooltip={mode.description}
                className={`${selectedMode === mode.name ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
              >
                <mode.icon className={`w-4 h-4 flex-shrink-0 ${mode.color} mr-2`} />
                <span className={`group-data-[collapsible=icon]:hidden ${language === 'ar' ? 'text-right' : ''}`}>{mode.translatedName}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
