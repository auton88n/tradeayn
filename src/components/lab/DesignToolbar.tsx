import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  MessageSquareQuote,
  Tag,
  Megaphone,
  Layers,
  ChevronDown,
  ChevronRight,
  Loader2,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AspectRatio, CanvasElement, TextElement, ImageElement } from '@/hooks/useDesignCanvas';

type DesignStyle = 'minimalist' | 'engaging' | 'promotional' | 'inspirational';

const styleOptions: { value: DesignStyle; label: string; description: string }[] = [
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, bold headline only' },
  { value: 'engaging', label: 'Engaging', description: 'Headline + subtitle + hashtags' },
  { value: 'promotional', label: 'Promotional', description: 'Sale/offer focused with CTA' },
  { value: 'inspirational', label: 'Inspirational', description: 'Quote-style elegant text' },
];

interface DesignToolbarProps {
  selectedElement: CanvasElement | null;
  aspectRatio: AspectRatio;
  onUploadBackground: (file: File) => void;
  onUploadLogo: (file: File) => void;
  onAddText: (text?: string, fontSize?: number, fontWeight?: 'normal' | 'bold', color?: string) => void;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  onClearCanvas: () => void;
  // AI Design props
  designContext: string;
  onDesignContextChange: (value: string) => void;
  designStyle: DesignStyle;
  onDesignStyleChange: (style: DesignStyle) => void;
  onGenerateDesign: () => void;
  isGeneratingDesign: boolean;
  hasBackgroundImage: boolean;
}

const aspectRatioOptions: { value: AspectRatio; label: string; icon: React.ReactNode }[] = [
  { value: '1:1', label: 'Square', icon: <Square className="w-3.5 h-3.5" /> },
  { value: '4:5', label: 'Portrait', icon: <RectangleVertical className="w-3.5 h-3.5" /> },
  { value: '9:16', label: 'Story', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { value: '16:9', label: 'Wide', icon: <Monitor className="w-3.5 h-3.5" /> },
];

const fontFamilies = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Impact', 'Montserrat', 'Playfair Display'];

const textTemplates = [
  { 
    label: 'Headline', 
    icon: Sparkles,
    text: 'Your Headline Here',
    fontSize: 56,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  { 
    label: 'Quote', 
    icon: MessageSquareQuote,
    text: '"Inspiring quote goes here"',
    fontSize: 36,
    fontWeight: 'normal' as const,
    color: '#ffffff',
  },
  { 
    label: 'CTA', 
    icon: Megaphone,
    text: 'Shop Now →',
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#FFD700',
  },
  { 
    label: 'Hashtag', 
    icon: Tag,
    text: '#YourBrand',
    fontSize: 24,
    fontWeight: 'normal' as const,
    color: '#87CEEB',
  },
];

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
  designContext,
  onDesignContextChange,
  designStyle,
  onDesignStyleChange,
  onGenerateDesign,
  isGeneratingDesign,
  hasBackgroundImage,
}) => {
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Collapsible states
  const [elementsOpen, setElementsOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [canvasSizeOpen, setCanvasSizeOpen] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateDesign();
  };

  return (
    <div className="w-72 bg-background border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium">Tools</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Add Elements - Collapsible */}
          <Collapsible open={elementsOpen} onOpenChange={setElementsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-9 px-2 hover:bg-muted"
              >
                <span className="text-xs font-medium">Add Elements</span>
                {elementsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pb-1">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBackgroundUpload}
                />
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => backgroundInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Background</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => onAddText()}
                >
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Text</span>
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
                  className="h-14 flex-col gap-1 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Image</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1 border-dashed hover:border-destructive/50 hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={onClearCanvas}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px]">Clear</span>
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          {/* Text Templates - Collapsible */}
          <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-9 px-2 hover:bg-muted"
              >
                <span className="text-xs font-medium">Quick Templates</span>
                {templatesOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pb-1">
              <div className="space-y-1">
                {textTemplates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Button
                      key={template.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 h-8 text-xs font-normal hover:bg-muted"
                      onClick={() => onAddText(template.text, template.fontSize, template.fontWeight, template.color)}
                    >
                      <IconComponent className="w-3.5 h-3.5 text-primary" />
                      <span>{template.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          {/* Canvas Size - Collapsible */}
          <Collapsible open={canvasSizeOpen} onOpenChange={setCanvasSizeOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-9 px-2 hover:bg-muted"
              >
                <span className="text-xs font-medium">Canvas Size</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{aspectRatio}</span>
                  {canvasSizeOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pb-1">
              <div className="grid grid-cols-4 gap-1">
                {aspectRatioOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={aspectRatio === option.value ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "h-10 flex-col gap-0.5 text-[10px]",
                      aspectRatio !== option.value && "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onSetAspectRatio(option.value)}
                  >
                    {option.icon}
                    <span className="sr-only sm:not-sr-only">{option.label.slice(0, 3)}</span>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Selected Element Properties */}
          {selectedElement && (
            <>
              <Separator className="my-2" />
              
              <div className="space-y-3 px-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    {isTextElement ? 'Text Properties' : 'Image Properties'}
                  </Label>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-muted"
                      onClick={onDuplicateElement}
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-muted"
                      onClick={onBringToFront}
                      title="Bring forward"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-muted"
                      onClick={onSendToBack}
                      title="Send back"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive/10 text-destructive"
                      onClick={onDeleteElement}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Text-specific properties */}
                {isTextElement && textElement && (
                  <div className="space-y-3">
                    {/* Font Family */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Font</Label>
                      <select
                        value={textElement.fontFamily}
                        onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
                        className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                      >
                        {fontFamilies.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Label className="text-[10px] text-muted-foreground">Size</Label>
                        <span className="text-[10px] text-muted-foreground">{textElement.fontSize}px</span>
                      </div>
                      <Slider
                        value={[textElement.fontSize]}
                        onValueChange={([value]) => onUpdateElement({ fontSize: value })}
                        min={12}
                        max={120}
                        step={2}
                        className="py-1"
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Color</Label>
                      <div className="flex gap-1.5">
                        <div className="relative">
                          <Input
                            type="color"
                            value={textElement.color}
                            onChange={(e) => onUpdateElement({ color: e.target.value })}
                            className="w-8 h-8 p-0.5 cursor-pointer rounded-md"
                          />
                        </div>
                        <Input
                          type="text"
                          value={textElement.color}
                          onChange={(e) => onUpdateElement({ color: e.target.value })}
                          className="flex-1 h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Text Style */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Style</Label>
                      <div className="flex gap-0.5">
                        <Button
                          variant={textElement.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateElement({ 
                            fontWeight: textElement.fontWeight === 'bold' ? 'normal' : 'bold' 
                          })}
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant={textElement.textAlign === 'left' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateElement({ textAlign: 'left' })}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant={textElement.textAlign === 'center' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateElement({ textAlign: 'center' })}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant={textElement.textAlign === 'right' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateElement({ textAlign: 'right' })}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Shadow toggle */}
                    <div className="flex items-center justify-between py-1">
                      <Label className="text-[10px] text-muted-foreground">Shadow</Label>
                      <Button
                        variant={textElement.shadow ? 'default' : 'outline'}
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => onUpdateElement({ shadow: !textElement.shadow })}
                      >
                        {textElement.shadow ? 'On' : 'Off'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Image-specific properties */}
                {isImageElement && imageElement && (
                  <div className="space-y-3">
                    {/* Opacity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Label className="text-[10px] text-muted-foreground">Opacity</Label>
                        <span className="text-[10px] text-muted-foreground">{Math.round(imageElement.opacity * 100)}%</span>
                      </div>
                      <Slider
                        value={[imageElement.opacity * 100]}
                        onValueChange={([value]) => onUpdateElement({ opacity: value / 100 })}
                        min={10}
                        max={100}
                        step={5}
                        className="py-1"
                      />
                    </div>

                    {/* Size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Label className="text-[10px] text-muted-foreground">Size</Label>
                        <span className="text-[10px] text-muted-foreground">{Math.round(imageElement.width)}px</span>
                      </div>
                      <Slider
                        value={[imageElement.width]}
                        onValueChange={([value]) => {
                          const ratio = imageElement.width / imageElement.height;
                          onUpdateElement({ 
                            width: value,
                            height: value / ratio 
                          });
                        }}
                        min={30}
                        max={500}
                        step={5}
                        className="py-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* AI Input Footer - Fixed at bottom */}
      <div className="border-t border-border p-3 bg-muted/30">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1 px-2 text-xs font-medium shrink-0"
                >
                  {styleOptions.find(s => s.value === designStyle)?.label}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {styleOptions.map((style) => (
                  <DropdownMenuItem
                    key={style.value}
                    onClick={() => onDesignStyleChange(style.value)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-medium text-sm">{style.label}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="relative flex items-center">
            <Sparkles className="absolute left-3 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Describe your design..."
              value={designContext}
              onChange={(e) => onDesignContextChange(e.target.value)}
              className="h-10 pl-9 pr-12 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isGeneratingDesign || !hasBackgroundImage}
              className="absolute right-1.5 h-7 w-7 rounded-md bg-primary hover:bg-primary/90"
            >
              {isGeneratingDesign ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
          
          {!hasBackgroundImage && (
            <p className="text-[10px] text-muted-foreground text-center">
              Add a background image first
            </p>
          )}
        </form>
      </div>
    </div>
  );
};