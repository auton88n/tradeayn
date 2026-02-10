

# Fix Tutorial Illustrations to Match Current UI

## Issue 1: Chat Input Illustration (Screenshot 1)
The `ChatIllustration` shows an outdated chat input with a "General" dropdown, old "Eng" + "New" buttons below, and wrong layout. The actual chat input has:
- Textarea with placeholder
- Send button (appears when typing)
- Bottom toolbar row: "+ New" pill, "+" attach, mic, sound, center "History", right counter + AYN brain icon

**Fix in `TutorialIllustrations.tsx`**: Rewrite `ChatIllustration` to match the real toolbar layout -- remove the "General" dropdown and the "Eng"/"+ New" row below. Replace with the actual toolbar: "+ New" pill, "+" button, mic icon on left; "History" in center; "AYN" brain on right.

## Issue 2: Documents Illustration Language Badges (Screenshot 2)
The EN/AR/FR badges at the bottom of `DocumentsIllustration` use `absolute bottom-6` positioning, which overlaps with the "Skip" button in the tutorial navigation area.

**Fix in `TutorialIllustrations.tsx`**: Remove the floating EN/AR/FR language badges entirely. The documents illustration already clearly shows PDF and XLSX -- the description text mentions multilingual support, so the badges are redundant.

## Issue 3: Navigation/Sidebar Illustration (Screenshot 3)
The `NavigationIllustration` shows old "Eng" and "+ New" buttons that don't exist in the current sidebar. Need to update to match the actual sidebar layout.

**Fix in `TutorialIllustrations.tsx`**: Update `NavigationIllustration` to remove the "Eng" and "+ New" button row. Replace with the current sidebar elements: AYN AI header, search bar, "Recent Chats" section.

---

## Technical Details

| File | Changes |
|------|---------|
| `src/components/tutorial/TutorialIllustrations.tsx` | Rewrite `ChatIllustration` (lines 109-161): remove "General" dropdown and "Eng/New" row, add real toolbar with "+ New" pill, "+", mic, History, AYN brain |
| `src/components/tutorial/TutorialIllustrations.tsx` | Fix `DocumentsIllustration` (lines 746-759): remove the absolute-positioned EN/AR/FR badges |
| `src/components/tutorial/TutorialIllustrations.tsx` | Update `NavigationIllustration` (lines 189-246): remove "Eng" + "+ New" button row, keep AYN header, search, and recent chats |

