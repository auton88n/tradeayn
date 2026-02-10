
# Fix: React.Children.only Crash in Button Component

## Root Cause

The `Button` component (`src/components/ui/button.tsx`) always renders two children:
1. `{props.children}` (the button content)
2. `<RippleContainer />` (the ripple effect)

When `asChild` is true, the component uses Radix `Slot`, which requires **exactly one** child element. The extra `<RippleContainer />` causes the crash: "React.Children.only expected to receive a single React element child."

This breaks every `Button` with `asChild` across the entire app, including the Download button in CreativeEditor and the image preview dialog.

## Fix

In `src/components/ui/button.tsx`, skip rendering `<RippleContainer />` when `asChild` is true. The ripple effect doesn't work with `Slot` anyway since the rendered element is not controlled by Button.

### Change (lines 68-80)

```tsx
return (
  <Comp
    className={cn(buttonVariants({ variant, size, className }))}
    ref={ref}
    onClick={handleClick}
    onMouseDown={handleInteraction}
    onTouchStart={handleInteraction}
    {...props}
  >
    {props.children}
    {!asChild && <RippleContainer />}
  </Comp>
)
```

## Impact

- Fixes the crash when opening the Creative Editor dialog
- Fixes the crash in the image preview Download button
- Fixes any other `asChild` Button usage across the app
- No visual change -- ripple effects continue working on regular buttons
