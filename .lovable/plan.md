

# Fix Arabic RTL Bullet/List Positioning

## The Problem

When AYN responds in Arabic, bullet points and list numbers appear on the **left side** instead of the **right side**. This is because the `MessageFormatter` component uses CSS classes that hardcode left-side positioning:

- `pl-5` (padding-left) on list items
- `before:left-0` for bullet positioning
- `pl-1` and `pl-5` on `<ul>` and `<ol>` containers

While the component sets `dir="rtl"` on the wrapper for Arabic text, the inner list styling ignores this and always positions bullets/numbers on the left.

## Solution

Use Tailwind's RTL-aware utility classes (`rtl:` and `ltr:` variants) or logical properties (`ps-` / `pe-` for padding-start/end, `start-0` / `end-0` for positioning). This makes the layout automatically flip based on the `dir` attribute.

## Technical Changes

### File: `src/components/shared/MessageFormatter.tsx`

**1. Update `<ul>` styling (line 277)**

| Before | After |
|--------|-------|
| `pl-1` | `ps-1` (padding-start) |

**2. Update `<ol>` styling (line 281)**

| Before | After |
|--------|-------|
| `pl-5` | `ps-5` (padding-start) |

**3. Update `<li>` styling (line 285)** - Most critical fix

| Before | After |
|--------|-------|
| `pl-5` | `ps-5` (padding-start) |
| `before:left-0` | `before:start-0` (inline-start) |
| `[ol>&]:pl-0` | `[ol>&]:ps-0` (padding-start) |

### Why Logical Properties Work

- `ps-5` = padding-start → becomes `padding-left` in LTR, `padding-right` in RTL
- `before:start-0` = inset-inline-start → positions element at start of text direction
- These automatically flip based on the `dir="rtl"` attribute on the parent

## Expected Result

| Language | Bullet Position | Number Position |
|----------|-----------------|-----------------|
| English (LTR) | Left (• item) | Left (1. item) |
| Arabic (RTL) | Right (item •) | Right (item .1) |

## Visual Comparison

```text
Before (broken):                After (fixed):
• نقطة أولى                     نقطة أولى •
• نقطة ثانية                    نقطة ثانية •
```

