

# Update Terms, Privacy, and Terms Modal with New v2.0 Content

## Overview

Replace all legal content across 3 files with the new comprehensive document (v2.0, February 7, 2026). Keep two separate pages (industry standard). Add clickable links in the Terms Modal checkboxes so users can review the full documents before accepting.

## Changes

### 1. `src/pages/Terms.tsx` -- Full Content Replacement

Replace all section content with Part I: Terms of Service (Sections 1-11) plus the Acceptance of Terms intro:

- Update title to "Privacy Policy & Terms of Service"
- Add header info block: Platform (aynn.io), Operator (AYN Team), Jurisdiction (Nova Scotia, Canada), Contact (support@aynn.io)
- Dates updated to February 7, 2026
- Sections:
  1. Description of Service (Platform Overview, Global Availability, Service Availability)
  2. User Accounts & Eligibility (Creation, Security, Suspension)
  3. Acceptable Use Policy (Permitted, Prohibited, Consequences)
  4. Intellectual Property (AYN's IP, User Content, AI-Generated Content)
  5. Payment Terms (Plans, Billing, Refund Policy, Disputes) -- with amber warning on no-refund
  6. AI Limitations & Disclaimers (General, Professional Advice, Engineering-Specific, PDF) -- with amber warnings
  7. Limitation of Liability (As-Is, Consequential Damages, Cap, Indemnification)
  8. Data & Privacy (summary with link to /privacy)
  9. Service Modifications & Termination
  10. Dispute Resolution (Governing Law, Jurisdiction, Arbitration, Class Action Waiver)
  11. Miscellaneous (Entire Agreement, Severability, No Waiver, Assignment, Force Majeure, Updates)
- Document version block at bottom (v2.0)
- Footer: copyright 2026, links to /privacy and contact

### 2. `src/pages/Privacy.tsx` -- Full Content Replacement

Replace all section content with Part II: Privacy Policy (Sections 12-24):

- Update title to "Privacy Policy"
- Dates updated to February 7, 2026
- Sections:
  12. Information We Collect (You Provide with account/content/payment details, Automatically with usage/technical/cookies, AI Service Providers listing OpenAI/Anthropic/Google)
  13. How We Use Your Information (Operation, Improvement, Security, Communications, Legal)
  14. Information Sharing & Disclosure (No Sale, Service Providers with specific names, Legal, Business Transfers, Aggregated)
  15. Data Security (Encryption, Access Controls, Monitoring, Development Practices, Limitations)
  16. Data Retention & Deletion (Retention periods, Deletion rights with steps)
  17. Your Privacy Rights (Access, Correction, Deletion, Objection, Withdrawal, Exercising)
  18. International Data Transfers (Cross-Border, Safeguards, Consent)
  19. Cookies & Tracking (Essential/Functional/Analytics types, Management, DNT)
  20. Children's Privacy (Age 18+, No Knowingly Collected, Parental Rights)
  21. Regional Privacy Laws (PIPEDA, GDPR, CCPA, Other)
  22. Privacy Policy Updates (Changes, Notification, Effective Date, Older Versions)
  23. Contact Information (support@aynn.io, dpo@aynn.io, Regulatory Authorities)
  24. Acknowledgment & Acceptance
- Footer: copyright 2026, links to /terms and contact

### 3. `src/components/shared/TermsModal.tsx` -- Updated Summary + Linked Checkboxes

This is the modal new users see before they can use the platform.

**Header updates:**
- Title: "PRIVACY POLICY & TERMS OF SERVICE"
- Dates: February 7, 2026
- Copyright: 2026

**Content:** Replace the 12 detailed sections with a condensed summary covering key highlights:
- What AYN is (AI platform with consulting, engineering tools, document analysis)
- Key terms highlights (no refunds, acceptable use, IP rights)
- AI & Engineering disclaimer (with amber warning styling)
- Privacy highlights (what we collect, who we share with, your rights)
- Contact: support@aynn.io

**Checkbox labels with clickable links (open in new tab):**
1. "I have read and understood the [Privacy Policy](/privacy)" -- link to /privacy
2. "I accept the [Terms of Service](/terms) including the no-refund policy" -- link to /terms
3. "I understand AYN is AI with limitations and engineering outputs require Professional Engineer (PE) review" -- kept as plain text (no link needed)

Links styled as `text-white underline hover:text-white/80` with `target="_blank" rel="noopener noreferrer"` so clicking opens the full page without closing the modal.

### Technical Notes

- Same component structure (PolicySection, SubSection, BulletList) reused in all files
- AlertTriangle icon already imported for warning sections
- All pages remain forced LTR (no useLanguage/direction)
- No new dependencies needed
- Routes unchanged: /terms, /privacy
- Sequential checkbox logic preserved (must check in order)

