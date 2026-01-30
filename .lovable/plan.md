
# Voice-to-Text Feature Implementation Plan

## Overview

Add a voice-to-text feature to the AYNN chat interface using the browser's native Web Speech API. Users will be able to tap a microphone button to dictate messages instead of typing.

## Technical Approach

### Why Web Speech API?
- **Free** - No API keys or costs
- **Offline capable** - Works without internet (in some browsers)
- **Privacy-focused** - Audio processed locally in browser
- **Zero latency** - Real-time transcription as you speak
- **Wide support** - Chrome, Edge, Safari, Firefox (partial)

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    ChatInput Component                       │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │   Textarea          │  │  Mic Button (new)            │  │
│  │   (existing)        │  │  • Tap to start/stop         │  │
│  └─────────────────────┘  │  • Visual recording state    │  │
│                           │  • Pulse animation           │  │
│                           └──────────────────────────────┘  │
│                                      │                       │
│                                      ▼                       │
│               ┌──────────────────────────────────┐          │
│               │    useSpeechRecognition hook     │          │
│               │    (new custom hook)             │          │
│               │    • Browser compatibility       │          │
│               │    • Continuous recognition      │          │
│               │    • Auto-restart on pause       │          │
│               └──────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Part 1: Create Custom Hook (`useSpeechRecognition`)

**New file**: `src/hooks/useSpeechRecognition.ts`

The hook will handle:
- Browser support detection (Chrome, Edge, Safari)
- Starting/stopping speech recognition
- Handling interim and final transcripts
- Auto-restart when user pauses (continuous mode)
- Error handling with user-friendly messages
- Microphone permission management

**Key features**:
- `isSupported` - Boolean indicating browser compatibility
- `isListening` - Current recording state
- `transcript` - Latest transcribed text
- `interimTranscript` - Real-time partial results
- `startListening()` - Begin recording
- `stopListening()` - End recording
- `error` - Any error messages

### Part 2: Add Microphone Button to ChatInput

**Modified file**: `src/components/dashboard/ChatInput.tsx`

Add a microphone button in the toolbar (Row 2) next to the existing file upload button:

| Before | After |
|--------|-------|
| [+] [Sound] | [+] [Mic] [Sound] |

**Button states**:
1. **Idle** - Gray microphone icon
2. **Listening** - Red pulsing microphone with recording indicator
3. **Processing** - Brief loading state
4. **Unsupported** - Hidden (graceful degradation)

**Behavior**:
- Tap to start listening
- Tap again to stop (or auto-stop after silence)
- Transcribed text appends to textarea
- Auto-resize textarea as text flows in
- Trigger "attention blink" on AYN eye when listening starts

### Part 3: Visual Feedback

**Recording indicator**:
- Pulsing red dot next to microphone
- Microphone icon changes color (gray → red)
- Optional: subtle border glow on input area

**Interim text display**:
- Show partial transcription in textarea in real-time
- Different styling for interim vs final (italic for interim)

### Part 4: Mobile Optimization

- Touch-friendly button size (44x44px minimum)
- Haptic feedback on start/stop
- Handle iOS Safari quirks (requires user gesture)
- Respect system permissions gracefully

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useSpeechRecognition.ts` | Custom hook for Web Speech API |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ChatInput.tsx` | Add microphone button, integrate hook |

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome (Desktop/Android) | Full support |
| Edge | Full support |
| Safari (macOS/iOS) | Full support |
| Firefox | Partial (flag required) |
| Other | Graceful fallback (button hidden) |

## User Experience Flow

1. User taps microphone button in chat input toolbar
2. Browser shows microphone permission prompt (first time only)
3. Microphone icon turns red with pulsing animation
4. User speaks - text appears in real-time in textarea
5. User taps again (or pauses for 2+ seconds) to stop
6. Final transcript is in textarea, ready to edit or send
7. User can continue typing or tap Send

## Error Handling

| Error | User Message |
|-------|--------------|
| No microphone | "Please connect a microphone" |
| Permission denied | "Microphone access needed for voice input" |
| No speech detected | (Silent fail, stop listening) |
| Network error | "Voice recognition unavailable offline" |
| Not supported | (Hide button entirely) |

## Testing Checklist

- [ ] Microphone button appears in toolbar (Chrome/Edge/Safari)
- [ ] Button hidden on unsupported browsers
- [ ] Tap starts recording with visual feedback
- [ ] Text transcribes in real-time to textarea
- [ ] Second tap stops recording
- [ ] Auto-stop after silence works
- [ ] Permission prompt appears on first use
- [ ] Error states show appropriate messages
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] Haptic feedback on mobile
- [ ] Send button works after voice input
- [ ] AYN eye reacts to voice activity

## Technical Notes

**Web Speech API setup**:
```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US'; // Auto-detect or use user language
```

**TypeScript declarations needed**:
- Add `webkitSpeechRecognition` to Window interface
- Type the recognition events properly

## Expected Outcome

Users can now speak to AYNN instead of typing, with:
- Zero configuration required
- Real-time feedback as they speak
- Seamless integration with existing chat flow
- Professional visual feedback
- Graceful degradation for unsupported browsers
