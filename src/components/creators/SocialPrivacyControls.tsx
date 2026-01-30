import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Instagram, Youtube } from 'lucide-react';

interface PrivacySettings {
  show_instagram: boolean;
  show_tiktok: boolean;
  show_youtube: boolean;
  show_twitter: boolean;
}

interface SocialPrivacyControlsProps {
  settings: PrivacySettings;
  onToggle: (field: keyof PrivacySettings, value: boolean) => void;
}

export function SocialPrivacyControls({ settings, onToggle }: SocialPrivacyControlsProps) {
  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          Privacy Controls
        </CardTitle>
        <CardDescription>
          Choose which social handles to display on your public profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-instagram" className="flex items-center gap-2">
            <Instagram className="w-4 h-4" />
            Show Instagram publicly
          </Label>
          <Switch
            id="show-instagram"
            checked={settings.show_instagram}
            onCheckedChange={(checked) => onToggle('show_instagram', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-tiktok" className="flex items-center gap-2">
            <span className="w-4 h-4 text-center text-xs font-bold">TT</span>
            Show TikTok publicly
          </Label>
          <Switch
            id="show-tiktok"
            checked={settings.show_tiktok}
            onCheckedChange={(checked) => onToggle('show_tiktok', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-youtube" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            Show YouTube publicly
          </Label>
          <Switch
            id="show-youtube"
            checked={settings.show_youtube}
            onCheckedChange={(checked) => onToggle('show_youtube', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-twitter" className="flex items-center gap-2">
            <span className="w-4 h-4 text-center text-xs font-bold">𝕏</span>
            Show Twitter/X publicly
          </Label>
          <Switch
            id="show-twitter"
            checked={settings.show_twitter}
            onCheckedChange={(checked) => onToggle('show_twitter', checked)}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-3 border-t pt-3">
          ⚠️ These settings only affect your public profile page. 
          Admins can still see all handles for verification purposes.
        </p>
      </CardContent>
    </Card>
  );
}

export default SocialPrivacyControls;
