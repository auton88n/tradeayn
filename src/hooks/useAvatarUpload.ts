import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseApi } from '@/lib/supabaseApi';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface UseAvatarUploadOptions {
  userId: string;
  accessToken: string;
}

export const useAvatarUpload = ({ userId, accessToken }: UseAvatarUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);

  const validateImage = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG, or WebP)');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be less than 5MB');
      return false;
    }

    return true;
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 400,
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Image compression error:', error);
      return file;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!validateImage(file)) {
      return null;
    }

    if (!userId || !accessToken) {
      toast.error('You must be logged in to upload an avatar');
      return null;
    }

    setIsUploading(true);

    try {
      // Compress the image
      const compressedFile = await compressImage(file);

      // Get file extension
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Delete old avatar if exists (keep using supabase.storage for storage operations)
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map(f => `${userId}/${f.name}`));
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload avatar');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL using REST API
      await supabaseApi.patch(
        `profiles?user_id=eq.${userId}`,
        accessToken,
        { avatar_url: publicUrl }
      );

      toast.success('Profile photo updated!');
      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('An error occurred while uploading');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async (): Promise<boolean> => {
    if (!userId || !accessToken) {
      toast.error('You must be logged in');
      return false;
    }

    setIsUploading(true);

    try {
      // Delete from storage (keep using supabase.storage)
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map(f => `${userId}/${f.name}`));
      }

      // Update profile using REST API
      await supabaseApi.patch(
        `profiles?user_id=eq.${userId}`,
        accessToken,
        { avatar_url: null }
      );

      toast.success('Profile photo removed');
      return true;
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error('An error occurred');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    isUploading,
  };
};
