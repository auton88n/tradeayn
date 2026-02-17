

## Add Back Navigation to the Standalone Performance Page

The `/performance` page currently has no navigation element to return to the main app.

### Change

**Modify `src/pages/Performance.tsx`**

Add a "Back" button at the top of the page (above the header), matching the style used in `ChartAnalyzerPage.tsx`:
- Import `useNavigate` from `react-router-dom`, `ArrowLeft` from `lucide-react`, and the `Button` component
- Add a ghost button with `ArrowLeft` icon that navigates to `/` (home) on click
- Place it just above the existing header inside the `max-w-6xl` container

This keeps the standalone page functional for direct-link access while giving users a clear way back.

