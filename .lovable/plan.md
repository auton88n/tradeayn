

# Document Generation: Paid-Only + Credit Limits

## Overview

Implement document generation as a **premium feature** with significant credit costs to prevent abuse and reflect the value of professionally formatted documents.

---

## Credit Costs

| Document Type | Credit Cost |
|--------------|-------------|
| **PDF** | 30 credits |
| **Excel** | 25 credits |

### Impact by Tier

| Tier | Monthly Credits | Max PDFs/month | Max Excel/month |
|------|-----------------|----------------|-----------------|
| **Free** | 50 | ❌ Not allowed | ❌ Not allowed |
| **Starter** | 200 | 6 PDFs | 8 Excel files |
| **Pro** | 1,000 | 33 PDFs | 40 Excel files |
| **Business** | 5,000 | 166 PDFs | 200 Excel files |

---

## Technical Changes

### 1. Backend: `supabase/functions/ayn-unified/index.ts`

**Add credit cost constants and tier validation:**

```typescript
const DOCUMENT_CREDIT_COST = {
  pdf: 30,
  excel: 25
};
```

**Add document intent handler with these checks:**

1. Get user's subscription tier from `user_subscriptions` table
2. Block free tier users with upgrade message
3. Check if user has enough credits in `user_ai_limits`
4. Deduct credits after successful document generation

### 2. Backend: `supabase/functions/generate-document/index.ts`

**Add server-side content limits (safety caps):**

- Maximum 12 sections per document
- Maximum 50 rows per table
- Truncate if LLM exceeds limits

### 3. Frontend: `src/hooks/useMessages.ts`

**Handle document-specific error responses:**

- 403 status: Show "Upgrade required" toast with pricing link
- 429 status: Show "Not enough credits" with balance info

### 4. Frontend: `src/contexts/LanguageContext.tsx`

**Add translation keys:**

```text
English:
- document.requiresUpgrade: "Document generation requires a paid plan"
- document.notEnoughCredits: "Not enough credits for this document"
- document.pdfCost: "PDF documents cost 30 credits"
- document.excelCost: "Excel sheets cost 25 credits"

Arabic:
- document.requiresUpgrade: "إنشاء المستندات يتطلب حساباً مدفوعاً"
- document.notEnoughCredits: "لا يوجد رصيد كافٍ لهذا المستند"
- document.pdfCost: "مستندات PDF تكلف 30 رصيد"
- document.excelCost: "جداول Excel تكلف 25 رصيد"

French:
- document.requiresUpgrade: "La génération de documents nécessite un abonnement"
- document.notEnoughCredits: "Crédits insuffisants pour ce document"
- document.pdfCost: "Les PDF coûtent 30 crédits"
- document.excelCost: "Les Excel coûtent 25 crédits"
```

---

## User Experience Examples

### Free User
```text
User: Create a PDF about blockchain

AYN: 📄 Document generation is a premium feature. 
     Upgrade to create professional PDF and Excel documents!
```

### Paid User (Insufficient Credits)
```text
User: Make a PDF report

AYN: ❌ Not enough credits. PDF documents cost 30 credits, 
     you have 12 remaining.
```

### Paid User (Success)
```text
User: Create a PDF about AI trends

AYN: ✅ Document created! 
     📄 [AI Trends Report](download-link)
     (30 credits deducted)
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ayn-unified/index.ts` | Add tier check, credit costs (30/25), deduction logic |
| `supabase/functions/generate-document/index.ts` | Add content hard caps (12 sections, 50 rows) |
| `src/hooks/useMessages.ts` | Handle 403/429 responses for documents |
| `src/contexts/LanguageContext.tsx` | Add document translation keys (EN/AR/FR) |

