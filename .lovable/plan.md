

## Professional AI Response Rendering Overhaul

This is a significant upgrade to make AYN's chat experience match the polish of Claude/ChatGPT. The work is broken into focused phases.

---

### Phase 1: Syntax Highlighting for Code Blocks

**Current state**: Code blocks have basic styling (background, monospace font, copy button) but NO syntax highlighting.

**Change**: Install `rehype-highlight` and the `highlight.js` CSS theme, then wire it into `MessageFormatter.tsx` and `StreamingMarkdown.tsx`.

- Install `rehype-highlight` package
- Import a dark highlight.js theme (e.g., `github-dark`) in `App.tsx` or the formatter
- Add `rehypeHighlight` to the `rehypePlugins` array in `ReactMarkdown`
- The existing code block UI (language label, copy button) stays -- syntax colors now apply inside the `<code>` element

---

### Phase 2: User Message Bubble Redesign (Claude-style)

**Current state**: User bubbles use `bg-muted/70` with rounded corners -- slightly heavy.

**Change in `TranscriptMessage.tsx`**:
- User messages: remove the bubble background entirely (or use a very subtle `bg-muted/30`), keep right-alignment
- Reduce avatar size slightly, make it more subtle
- Keep AI messages with their current subtle background (`bg-muted/50`)
- Result: visual weight shifts to AI content, matching Claude's clean conversation flow

---

### Phase 3: Enhanced Action Buttons on AI Messages

**Current state**: Only Copy and Reply buttons exist on transcript messages. The ResponseCard has Copy, Thumbs up/down, Expand, and Design.

**Changes to `TranscriptMessage.tsx`** (history bubbles):
- Add a **Download** button with a small dropdown (Markdown .md, Plain Text .txt)
- Add **Thumbs up/down** feedback buttons (reuse the rating logic from ResponseCard)
- Show action bar on hover (desktop) with smooth opacity transition, always visible on mobile
- Add `backdrop-blur-sm bg-background/80` background to the action bar for readability

**Changes to `ResponseCard.tsx`** (live response card):
- Add a **Download** button to the action bar (Markdown .md, Text .txt options)
- Wire download logic: create a Blob and trigger `URL.createObjectURL` download

---

### Phase 4: MessageFormatter Typography Polish

**Current state**: Already has good markdown rendering with styled headers, tables, lists, blockquotes, links, images. Some refinements needed.

**Changes to `MessageFormatter.tsx`**:
- Remove any residual background highlighting on bold/italic text
- Ensure `line-height: 1.75` (leading-relaxed) is consistent across all elements
- Blockquote: use `border-primary/40` (already done) -- verify no visual issues
- Links: ensure `target="_blank"` and accent color (already done)
- Tables: already have borders and alternating rows -- verify styling is clean
- Add `max-w-none` to the wrapper to prevent unexpected width constraints

---

### Phase 5: Streaming Cursor and Animation

**Current state**: Blinking cursor exists (`animate-pulse` on a span). Word-by-word streaming works.

**Refinements to `StreamingMarkdown.tsx`**:
- Change cursor from `animate-pulse` to a true blinking bar using a custom CSS animation (`@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }`)
- Ensure code blocks render properly during streaming (they already do since MessageFormatter handles partial markdown)

---

### Technical Details

**New dependency**: `rehype-highlight` (lightweight, widely used)

**Files modified**:
1. `src/components/shared/MessageFormatter.tsx` -- add rehype-highlight plugin, minor typography tweaks
2. `src/components/transcript/TranscriptMessage.tsx` -- user bubble restyle, add download + rating buttons
3. `src/components/eye/ResponseCard.tsx` -- add download button to action bar
4. `src/components/eye/StreamingMarkdown.tsx` -- improve cursor animation
5. `src/index.css` or `src/App.tsx` -- import highlight.js theme CSS

**What is NOT included** (out of scope / impractical):
- PDF thumbnail previews (requires `pdf.js` which is very heavy, ~500KB)
- PDF export of responses (requires `jspdf` + complex styling)
- DXF/engineering file previews (extremely specialized)
- Edit button for user messages (requires message re-send architecture changes)
- Regenerate button (requires re-triggering the AI pipeline, not a rendering change)

These can be added as follow-up tasks.

