

# Fix Support Page Links & Update Email Branding

## Summary

Two issues need to be fixed:

1. **Policy pages link to Support page** - The Terms and Privacy pages have "Contact Support" links that go to `/support` (the full Support Center with AI chat, tickets, FAQ). The user wants these to instead scroll to the "Contact Us" form on the landing page.

2. **Password reset email branding needs improvement** - The current email (image 2) has a complex design with gradient header, "YOUR AI BUSINESS PARTNER" tagline, and bilingual content. The preferred design (image 3) is cleaner and simpler:
   - Dark background throughout
   - Just bold "AYN" text (no tagline, no gradient)
   - Simple horizontal line separator
   - Clean white button
   - No Arabic text
   - Simpler, more minimal layout

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Terms.tsx` | Change "Contact Support" link from `/support` to `/#contact` |
| `src/pages/Privacy.tsx` | Change "Contact Support" link from `/support` to `/#contact` |
| `supabase/functions/auth-send-email/index.ts` | Redesign email template to match the cleaner preferred style |

---

## Technical Implementation

### Part 1: Fix Policy Page Links

**Terms.tsx (line 222-223):**
```tsx
// Before
<Link to="/support" className="text-sm text-white/50 hover:text-white transition-colors">
  Contact Support
</Link>

// After
<Link to="/#contact" className="text-sm text-white/50 hover:text-white transition-colors">
  Contact Us
</Link>
```

**Privacy.tsx (line 192-193):**
```tsx
// Before
<Link to="/support" className="text-sm text-white/50 hover:text-white transition-colors">
  Contact Support
</Link>

// After
<Link to="/#contact" className="text-sm text-white/50 hover:text-white transition-colors">
  Contact Us
</Link>
```

Using `/#contact` will navigate to the landing page and automatically scroll to the contact section (id="contact").

---

### Part 2: Redesign Password Reset Email Template

The email template in `supabase/functions/auth-send-email/index.ts` will be updated to match the cleaner design shown in image 3.

**Current design (complex):**
- Gradient purple header with "AYN" and "YOUR AI BUSINESS PARTNER" tagline
- Bilingual text (English + Arabic)
- Purple gradient button
- Multiple info boxes with purple/red borders
- Complex footer

**New design (clean & minimal like image 3):**
- Full dark background (`#1a1a1a` or similar)
- Simple bold "AYN" text in white (no gradient, no tagline)
- Thin horizontal line separator
- Clean section headings
- White/neutral button (not purple gradient)
- English only (no Arabic)
- Simple expiry notice
- Minimal footer

**New Header:**
```typescript
const AYN_HEADER = `
<div style="background: #1a1a1a; padding: 50px 20px 30px; text-align: center;">
  <h1 style="font-size: 48px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin: 0;">AYN</h1>
  <div style="width: 60px; height: 3px; background: #ffffff; margin: 20px auto 0;"></div>
</div>
`;
```

**New Recovery Template:**
```typescript
case 'recovery':
  return {
    subject: 'Reset your password | AYN',
    html: wrapEmail(`
      <div style="padding: 40px 30px; color: #9ca3af;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 24px 0; font-weight: 600;">
          Reset your password
        </h1>
        
        <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 10px 0; font-size: 16px;">
          We received a request to reset your password for your AYN account.
        </p>
        <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 30px 0; font-size: 16px;">
          Click the button below to create a new password.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${confirmationUrl}" style="display: inline-block; background: #f5f5f5; color: #1a1a1a; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin-top: 40px;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email and your password will remain unchanged.
        </p>
      </div>
    `)
  };
```

**New Footer:**
```typescript
const AYN_FOOTER = `
<div style="background: #1a1a1a; padding: 25px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
  <p style="color: #4b5563; font-size: 12px; margin: 0;">
    © ${new Date().getFullYear()} AYN. All rights reserved.
  </p>
</div>
`;
```

---

## Key Design Changes for Email

| Element | Current | New (Preferred) |
|---------|---------|-----------------|
| Header background | Purple gradient | Solid dark (#1a1a1a) |
| Logo style | Gradient text + tagline | Plain white bold "AYN" |
| Separator | None | Simple white line |
| Button | Purple gradient | White/light neutral |
| Language | Bilingual (EN+AR) | English only |
| Footer | Complex with Arabic | Minimal copyright only |
| Overall feel | Busy, colorful | Clean, minimal, professional |

---

## Expected Results

After these changes:

1. **Policy pages**: The "Contact Support" link will become "Contact Us" and take users directly to the landing page contact form instead of the full Support Center

2. **Password reset emails**: Will have a cleaner, more professional appearance matching image 3:
   - Simple bold "AYN" header
   - Clean white button
   - Minimal text
   - No Arabic translation
   - Professional, modern look

