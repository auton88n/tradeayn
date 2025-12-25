import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Image,
  Type,
  ImagePlus,
  Trash2,
  Square,
  RectangleVertical,
  Smartphone,
  Monitor,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Layers,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AspectRatio, CanvasElement, TextElement, ImageElement } from '@/hooks/useDesignCanvas';

interface DesignToolbarProps {
  selectedElement: CanvasElement | null;
  aspectRatio: AspectRatio;
  onUploadBackground: (file: File) => void;
  onUploadLogo: (file: File) => void;
  onAddText: () => void;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  onClearCanvas: () => void;
}

const aspectRatioOptions: { value: AspectRatio; label: string; icon: React.ReactNode }[] = [
  { value: '1:1', label: 'Square', icon: <Square className="w-4 h-4" /> },
  { value: '4:5', label: 'Portrait', icon: <RectangleVertical className="w-4 h-4" /> },
  { value: '9:16', label: 'Story', icon: <Smartphone className="w-4 h-4" /> },
  { value: '16:9', label: 'Wide', icon: <Monitor className="w-4 h-4" /> },
];

const fontFamilies = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Impact'];

export const DesignToolbar: React.FC<DesignToolbarProps> = ({
  selectedElement,
  aspectRatio,
  onUploadBackground,
  onUploadLogo,
  onAddText,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
  onSetAspectRatio,
  onClearCanvas,
}) => {
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBackground(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadLogo(file);
    }
  };

  const isTextElement = selectedElement?.type === 'text';
  const isImageElement = selectedElement?.type === 'image';
  const textElement = selectedElement as TextElement | null;
  const imageElement = selectedElement as ImageElement | null;

  return (
    <div className="w-72 bg-background border-l border-border flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Add Elements */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Add Elements
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={backgroundInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBackgroundUpload}
              />
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => backgroundInputRef.current?.click()}
              >
                <Image className="w-5 h-5" />
                <span className="text-xs">Background</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={onAddText}
              >
                <Type className="w-5 h-5" />
                <span className="text-xs">Text</span>
              </Button>
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => logoInputRef.current?.click()}
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs">Logo/Image</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex-col gap-1 text-destructive hover:text-destructive"
                onClick={onClearCanvas}
              >
                <RotateCcw className="w-5 h-5" />
                <span className="text-xs">Clear</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Canvas Size
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {aspectRatioOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={aspectRatio === option.value ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => onSetAspectRatio(option.value)}
                >
                  {option.icon}
                  <span className="text-xs">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Element Properties */}
          {selectedElement && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    {isTextElement ? 'Text Properties' : 'Image Properties'}
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onDuplicateElement}
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onBringToFront}
                      title="Bring to front"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onSendToBack}
                      title="Send to back"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={onDeleteElement}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Text-specific properties */}
                {isTextElement && textElement && (
                  <div className="space-y-4">
                    {/* Font Family */}
                    <div className="space-y-2">
                      <Label className="text-xs">Font</Label>
                      <select
                        value={textElement.fontFamily}
                        onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        {fontFamilies.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                      <Label className="text-xs">Size: {textElement.fontSize}px</Label>
                      <Slider
                        value={[textElement.fontSize]}
                        onValueChange={([value]) => onUpdateElement({ fontSize: value })}
                        min={12}
                        max={120}
                        step={2}
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={textElement.color}
                          onChange={(e) => onUpdateElement({ color: e.target.value })}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={textElement.color}
                          onChange={(e) => onUpdateElement({ color: e.target.value })}
                          className="flex-1 h-9"
                        />
                      </div>
                    </div>

                    {/* Text Style */}
                    <div className="space-y-2">
                      <Label className="text-xs">Style</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={textElement.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => onUpdateElement({ 
                            fontWeight: textElement.fontWeight === 'bold' ? 'normal' : 'bold' 
                          })}
                        >
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={textElement.textAlign === 'left' ? 'default' : 'outline'}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => onUpdateElement({ textAlign: 'left' })}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={textElement.textAlign === 'center' ? 'default' : 'outline'}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => onUpdateElement({ textAlign: 'center' })}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={textElement.textAlign === 'right' ? 'default' : 'outline'}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => onUpdateElement({ textAlign: 'right' })}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Shadow toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Text Shadow</Label>
                      <Button
                        variant={textElement.shadow ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onUpdateElement({ shadow: !textElement.shadow })}
                      >
                        {textElement.shadow ? 'On' : 'Off'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Image-specific properties */}
                {isImageElement && imageElement && (
                  <div className="space-y-4">
                    {/* Opacity */}
                    <div className="space-y-2">
                      <Label className="text-xs">Opacity: {Math.round(imageElement.opacity * 100)}%</Label>
                      <Slider
                        value={[imageElement.opacity * 100]}
                        onValueChange={([value]) => onUpdateElement({ opacity: value / 100 })}
                        min={10}
                        max={100}
                        step={5}
                      />
                    </div>

                    {/* Size */}
                    <div className="space-y-2">
                      <Label className="text-xs">Size: {Math.round(imageElement.width)}px</Label>
                      <Slider
                        value={[imageElement.width]}
                        onValueChange={([value]) => {
                          const aspectRatio = imageElement.width / imageElement.height;
                          onUpdateElement({ 
                            width: value,
                            height: value / aspectRatio 
                          });
                        }}
                        min={30}
                        max={500}
                        step={10}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
