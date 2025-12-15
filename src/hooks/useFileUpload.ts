import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import type { FileAttachment, UseFileUploadReturn } from '@/types/dashboard.types';

export const useFileUpload = (userId: string): UseFileUploadReturn => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Allowed file types - aligned with edge function support
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/json'
  ];

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  // Validate file type and size
  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF, Word document, image, text, or JSON file.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > MAX_SIZE) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [toast]);

  // Compress image files before upload
  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);

      return compressedFile;
    } catch (error) {
      return file; // Return original if compression fails
    }
  }, []);

  // Upload file to Supabase Storage via edge function
  const uploadFile = useCallback(async (file: File): Promise<FileAttachment | null> => {
    try {
      setIsUploading(true);

      // CRITICAL: Refresh session if token is expiring soon
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const expiresAt = sessionData.session.expires_at;
        const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 300;
        
        if (expiresAt && expiresAt < fiveMinutesFromNow) {
          await supabase.auth.refreshSession();
        }
      }

      // Compress if image
      const processedFile = await compressImage(file);

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(processedFile);
      });

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('file-upload', {
        body: {
          file: base64,
          fileName: processedFile.name,
          fileType: processedFile.type,
          userId
        }
      });

      if (error) throw error;

      return {
        url: data.fileUrl,
        name: data.fileName,
        type: data.fileType,
        size: processedFile.size
      };
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [userId, toast, compressImage]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    
    if (validateFile(file)) {
      setSelectedFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} is ready to send.`,
      });
    }
  }, [validateFile, toast]);

  // Remove selected file
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Check for folders using webkitGetAsEntry
    const items = Array.from(e.dataTransfer.items);
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        toast({
          title: "Folders Not Supported",
          description: "Please drag individual files, not folders.",
          variant: "destructive"
        });
        return;
      }
    }

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 1) {
      toast({
        title: "Multiple Files",
        description: "Please drop only one file at a time.",
        variant: "destructive"
      });
      return;
    }

    const file = files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect, toast]);

  return {
    selectedFile,
    isUploading,
    isDragOver,
    fileInputRef,
    uploadFile,
    handleFileSelect,
    removeFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop
  };
};
