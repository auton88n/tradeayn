import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatarUpload } from '@/components/dashboard/ProfileAvatarUpload';
import { UsageCard } from '@/components/dashboard/UsageCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useSettingsContext } from '@/contexts/SettingsContext';

interface AccountPreferencesProps {
  userId: string;
  userEmail: string;
  accessToken: string;
}

interface UsageData {
  currentMonthUsage: number;
  monthlyLimit: number | null;
  usageResetDate: string | null;
}

export const AccountPreferences = ({ userId, userEmail, accessToken }: AccountPreferencesProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { searchTerm, registerFormChange } = useSettingsContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [profile, setProfile] = useState({
    contact_person: '',
    company_name: '',
    business_type: '',
    business_context: '',
    avatar_url: '',
  });
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [usageData, setUsageData] = useState<UsageData>({
    currentMonthUsage: 0,
    monthlyLimit: null,
    usageResetDate: null,
  });

  useEffect(() => {
    loadProfile();
    loadUsageData();
  }, [userId]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    registerFormChange('account', hasChanges);
  }, [profile, originalProfile, registerFormChange]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      // Fetch profile data (without plaintext business_context - it's encrypted)
      const { data, error } = await supabase
        .from('profiles')
        .select('contact_person, company_name, business_type, avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      // Fetch decrypted business_context via secure RPC function
      const { data: businessContext } = await supabase
        .rpc('get_profile_business_context', { _user_id: userId });

      if (data) {
        const profileData = {
          contact_person: data.contact_person || '',
          company_name: data.company_name || '',
          business_type: data.business_type || '',
          business_context: businessContext || '',
          avatar_url: data.avatar_url || '',
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageData = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('current_month_usage, monthly_limit, usage_reset_date')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUsageData({
          currentMonthUsage: data.current_month_usage ?? 0,
          monthlyLimit: data.monthly_limit ?? null,
          usageResetDate: data.usage_reset_date ?? null,
        });
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      // Update non-encrypted fields directly
      const { error } = await supabase
        .from('profiles')
        .update({
          contact_person: profile.contact_person,
          company_name: profile.company_name,
          business_type: profile.business_type,
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Update encrypted business_context via secure RPC function
      const { error: contextError } = await supabase
        .rpc('update_profile_business_context', {
          _user_id: userId,
          _business_context: profile.business_context,
        });

      if (contextError) throw contextError;

      setOriginalProfile(profile);
      registerFormChange('account', false);

      toast({
        title: t('common.success'),
        description: t('settings.profileUpdated'),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter fields based on search
  const matchesSearch = (text: string) => {
    if (!searchTerm) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const showContactPerson = matchesSearch(t('settings.contactPerson'));
  const showCompanyName = matchesSearch(t('settings.companyName'));
  const showEmail = matchesSearch(t('settings.email'));
  const showBusinessType = matchesSearch(t('settings.businessType'));
  const showBusinessContext = matchesSearch(t('settings.businessContext'));
  const showAvatar = matchesSearch(t('profile.changePhoto'));

  const showUsage = matchesSearch('Usage') || matchesSearch('Limit') || matchesSearch('Messages');

  const hasVisibleFields = showContactPerson || showCompanyName || showEmail || showBusinessType || showBusinessContext || showAvatar || showUsage;

  return (
    <div className="space-y-6">
      {/* Usage & Limits Card */}
      {showUsage && (
        <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
          <h2 className="text-xl font-semibold mb-4">Usage & Limits</h2>
          <UsageCard
            currentUsage={usageData.currentMonthUsage}
            monthlyLimit={usageData.monthlyLimit}
            resetDate={usageData.usageResetDate}
          />
        </Card>
      )}

      {!hasVisibleFields && searchTerm && (
        <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
          <p className="text-center text-muted-foreground">{t('settings.noResultsFound')}</p>
        </Card>
      )}
      {hasVisibleFields && (
        <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
          <h2 className="text-xl font-semibold mb-6">{t('settings.profileInformation')}</h2>
          
          <div className="space-y-6">
            {showAvatar && (
              <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 cursor-pointer" onClick={() => setShowAvatarUpload(true)}>
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-background border border-border text-lg">
                {profile.contact_person?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
                <Button variant="outline" onClick={() => setShowAvatarUpload(true)}>
                  {t('profile.changePhoto')}
                </Button>
              </div>
            )}

            {(showContactPerson || showCompanyName) && (
              <div className="grid gap-4 md:grid-cols-2">
                {showContactPerson && (
                  <div className="space-y-2">
                    <Label htmlFor="account-contact_person">{t('settings.contactPerson')}</Label>
                    <Input
                      id="account-contact_person"
                      name="account-contact_person"
                      value={profile.contact_person}
                      onChange={(e) => setProfile({ ...profile, contact_person: e.target.value })}
                      placeholder={t('settings.contactPersonPlaceholder')}
                    />
                  </div>
                )}

                {showCompanyName && (
                  <div className="space-y-2">
                    <Label htmlFor="account-company_name">{t('settings.companyName')}</Label>
                    <Input
                      id="account-company_name"
                      name="account-company_name"
                      value={profile.company_name}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                      placeholder={t('settings.companyNamePlaceholder')}
                    />
                  </div>
                )}
              </div>
            )}

            {showEmail && (
              <div className="space-y-2">
                <Label htmlFor="account-email">{t('settings.email')}</Label>
                <Input
                  id="account-email"
                  name="account-email"
                  value={userEmail}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            )}

            {showBusinessType && (
              <div className="space-y-2">
                <Label htmlFor="account-business_type">{t('settings.businessType')}</Label>
                <Select
                  value={profile.business_type}
                  onValueChange={(value) => setProfile({ ...profile, business_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('settings.selectBusinessType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulting">{t('settings.consulting')}</SelectItem>
                    <SelectItem value="ecommerce">{t('settings.ecommerce')}</SelectItem>
                    <SelectItem value="agency">{t('settings.agency')}</SelectItem>
                    <SelectItem value="saas">{t('settings.saas')}</SelectItem>
                    <SelectItem value="other">{t('settings.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showBusinessContext && (
              <div className="space-y-2">
                <Label htmlFor="account-business_context">{t('settings.businessContext')}</Label>
                <Textarea
                  id="account-business_context"
                  name="account-business_context"
                  value={profile.business_context}
                  onChange={(e) => setProfile({ ...profile, business_context: e.target.value })}
                  placeholder={t('settings.businessContextPlaceholder')}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {hasVisibleFields && (
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('common.saveChanges')
                )}
              </Button>
            )}
          </div>
        </Card>
      )}

      <ProfileAvatarUpload
        open={showAvatarUpload}
        onOpenChange={setShowAvatarUpload}
        currentAvatarUrl={profile.avatar_url}
        onAvatarUpdated={() => {
          loadProfile();
          setShowAvatarUpload(false);
        }}
        userId={userId}
        accessToken={accessToken}
      />
    </div>
  );
};
