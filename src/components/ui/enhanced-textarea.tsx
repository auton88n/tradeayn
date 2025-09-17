import * as React from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"

export interface EnhancedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  unstyled?: boolean
}

const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ className, unstyled = false, ...props }, ref) => {
    const { language } = useLanguage()
    
    return (
      <textarea
        className={cn(
          !unstyled && [
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          ],
          language === 'ar' && [
            "text-right font-arabic",
            "[direction:rtl]"
          ],
          className
        )}
        style={{
          direction: language === 'ar' ? 'rtl' : 'ltr',
          ...props.style
        }}
        ref={ref}
        {...props}
      />
    )
  }
)

EnhancedTextarea.displayName = "EnhancedTextarea"

export { EnhancedTextarea }