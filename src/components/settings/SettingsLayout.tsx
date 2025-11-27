import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Bell, Shield, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsLayoutProps {
  children: {
    account: React.ReactNode;
    notifications: React.ReactNode;
    privacy: React.ReactNode;
    sessions: React.ReactNode;
  };
}

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-background p-6 pt-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        </div>

        <Tabs defaultValue="account" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <TabsList className="w-full grid grid-cols-4 mb-8 bg-muted">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.account')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.privacy')}</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.sessions')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">{children.account}</TabsContent>
          <TabsContent value="notifications">{children.notifications}</TabsContent>
          <TabsContent value="privacy">{children.privacy}</TabsContent>
          <TabsContent value="sessions">{children.sessions}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
