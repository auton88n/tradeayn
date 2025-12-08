import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface ProfileAvatarUploadProps {
  currentAvatarUrl?: string;
  userName?: string;
  onAvatarUpdated: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  accessToken: string;
}

export const ProfileAvatarUpload = ({
  currentAvatarUrl,
  userName,
  onAvatarUpdated,
  open,
  onOpenChange,
  userId,
  accessToken,
}: ProfileAvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadAvatar, removeAvatar, isUploading } = useAvatarUpload({ userId, accessToken });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadAvatar(selectedFile);
    if (result) {
      setPreviewUrl(null);
      setSelectedFile(null);
      onAvatarUpdated();
      onOpenChange(false);
    }
  };

  const handleRemove = async () => {
    const result = await removeAvatar();
    if (result) {
      setPreviewUrl(null);
      setSelectedFile(null);
      onAvatarUpdated();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Avatar Preview */}
          <div className="relative group">
            <Avatar className="w-32 h-32 transition-all duration-300">
              <AvatarImage 
                src={previewUrl || currentAvatarUrl} 
                alt="Profile" 
              />
              <AvatarFallback className="text-4xl">
                {userName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera Icon Overlay */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 w-full">
            {!previewUrl ? (
              <>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                
                {currentAvatarUrl && (
                  <Button
                    onClick={handleRemove}
                    disabled={isUploading}
                    variant="destructive"
                    className="w-full"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Remove Photo
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Confirm Upload'
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isUploading}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
