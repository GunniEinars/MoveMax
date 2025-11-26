# MoveMax - Bugs & Issues Found

**Status:** Pre-Launch Code Review
**Date:** 2025-11-26
**Severity Scale:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 CRITICAL BUGS (App Breaking)

### 1. Profiles Page Not Using StoreContext
**File:** `pages/Profiles.tsx:3`
**Issue:** Imports `INITIAL_STAFF` directly from mockData instead of using `useStore()` hook
**Impact:**
- Staff changes don't persist
- Adding/editing staff in Settings won't show in Profiles page
- Page always shows initial 4 staff members only

**Fix:**
```typescript
// BEFORE:
import { INITIAL_STAFF } from '../services/mockData';
...
{INITIAL_STAFF.map((staff) => (

// AFTER:
import { useStore } from '../context/StoreContext';
...
const { staff } = useStore();
...
{staff.map((staff) => (
```

---

### 2. Clock Out Bug - Wrong Project
**File:** `context/StoreContext.tsx:178`
**Issue:** `clockOut()` finds first active time entry across ALL projects
**Impact:** If a staff member is clocked into multiple projects, clocking out might close the wrong project's timer

**Current Code:**
```typescript
const activeEntryIndex = (m.timeEntries || []).findIndex(
  te => te.staffId === staffId && !te.endTime
);
```

**Problem:** This searches EVERY project's time entries but only updates first match

**Recommendation:**
- Require `projectId` parameter in `clockOut()`
- OR: Track "currently active project" per staff member
- OR: Show "Clock Out From: Project X" in UI

---

## 🟠 HIGH PRIORITY (Bad UX)

### 3. No Form Validation
**Files:** Multiple forms across `pages/Moves.tsx`, `pages/Settings.tsx`
**Issue:** Forms accept empty required fields
**Impact:** Users can create projects/staff with missing critical data

**Examples:**
- Create project with no customer name
- Add inventory item with quantity = 0
- Save expense with no amount

**Fix Needed:** Add validation before save:
```typescript
if (!projectForm.customerName?.trim()) {
  showToast('Customer name is required', 'error');
  return;
}
```

---

### 4. No Delete Confirmation Dialogs
**Files:** `pages/Moves.tsx:169`, `pages/Settings.tsx` (staff delete)
**Issue:** Uses `window.confirm()` which is ugly and non-customizable
**Impact:** Users might accidentally delete important data

**Current:**
```typescript
if(window.confirm('Are you sure?'))
```

**Recommendation:** Create a proper Modal component for confirmations

---

### 5. Missing Loading States
**Files:** `pages/Moves.tsx` (AI functions)
**Issue:** AI operations show generic "Analyzing..." but no progress indicator
**Impact:** Users don't know if app froze or is processing

**Fix:** Add spinner components during:
- Floorplan upload
- Image analysis
- Summary generation

---

### 6. Auditor Page - No Error Handling for Missing Move
**File:** `pages/Auditor.tsx:28`
**Issue:** If `selectedMoveId` doesn't exist, `selectedMove` is undefined
**Impact:** Page might crash when accessing `selectedMove.inventory`

**Fix:** Add null check:
```typescript
if (!selectedMove) {
  return <div>Please select a valid project</div>;
}
```

---

## 🟡 MEDIUM PRIORITY (Polish Needed)

### 7. Hardcoded "Admin" Fallback
**File:** `pages/Moves.tsx:232`
**Issue:** `loggedBy: currentUser?.name||'Admin'`
**Impact:** If not logged in, shows "Admin" which is confusing

**Fix:** Use 'Unknown User' or force login before accessing

---

### 8. Duplicate Coordinates in AI Upload
**Files:**
- `pages/Moves.tsx:202` - `coordinates:{x:Math.random()*80+10,y:Math.random()*80+10}`
- `pages/Moves.tsx:216` - Same random coordinates

**Issue:** Detected assets get random coordinates (10-90% of map)
**Impact:** Assets might overlap on floorplan map

**Improvement:** Use grid layout or better spacing algorithm

---

### 9. No File Size Validation
**Files:** All image upload handlers
**Issue:** No limit on uploaded images
**Impact:** Uploading 50MB image will:
- Slow down app
- Exceed localStorage 10MB limit (if storing base64)
- Crash browser tab

**Fix:** Add check:
```typescript
if (file.size > 5 * 1024 * 1024) { // 5MB
  showToast('Image must be under 5MB', 'error');
  return;
}
```

---

### 10. LocalStorage Size Limit Risk
**File:** `context/StoreContext.tsx:77`
**Issue:** Stores everything (moves, staff, logs) as JSON in localStorage
**Impact:** With many projects/photos, could hit 10MB browser limit and crash

**Current State:** Each project with base64 images ~= 2-3MB
**Breaking Point:** ~3-4 projects with photos

**Solutions:**
1. **Short-term:** Warn user when approaching limit
2. **Medium-term:** Use IndexedDB (larger storage)
3. **Long-term:** Backend API

---

### 11. Missing Alt Text on Images
**Files:** Multiple (avatars, uploaded images)
**Example:** `pages/Profiles.tsx:36` - `<img ... alt="" />`
**Impact:** Fails accessibility standards (WCAG)

**Fix:**
```typescript
alt={`${staff.name} avatar`}
```

---

### 12. Search Results - Case Sensitive
**File:** `components/Layout.tsx:75-99`
**Issue:** Search uses `.toLowerCase()` but might have edge cases
**Impact:** Works fine, but could improve fuzzy matching

**Enhancement:** Consider using a library like Fuse.js for fuzzy search

---

### 13. Date Handling - No Timezone Support
**Files:** All date fields
**Issue:** Uses `new Date().toISOString()` which is UTC
**Impact:**
- User in PST creates project at 11pm → Shows next day
- Time entries might be off by hours

**Fix:** Use a library like `date-fns-tz` or display in user's local timezone consistently

---

## 🟢 LOW PRIORITY (Nice to Have)

### 14. Console Errors in Production
**File:** `services/geminiService.ts` (lines 43, 103, 186, etc.)
**Issue:** `console.error()` calls will show in production
**Impact:** Users see red errors in browser console (looks unprofessional)

**Fix:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.error("Gemini API Error:", error);
}
```

---

### 15. Magic Numbers in Code
**Examples:**
- `pages/Moves.tsx:159` - `Math.floor(Math.random()*1000000)`
- `pages/Moves.tsx:147` - `P-2024-${Math.floor(1000+Math.random()*9000)}`

**Issue:** Random IDs might collide (unlikely but possible)
**Impact:** Very low, but IDs should be guaranteed unique

**Fix:** Use UUID library or timestamp-based IDs

---

### 16. Bundle Size Warning
**Build Output:** `1,142.37 kB` (compressed: 310.42 kB)
**Issue:** Single large JS file
**Impact:** Slower initial load on mobile

**Fix:** Code splitting with dynamic imports:
```typescript
const MovesPage = lazy(() => import('./pages/Moves'));
```

---

### 17. Hardcoded Port
**File:** `vite.config.ts:9` - `port: 3000`
**Issue:** If port 3000 is taken, app won't start
**Fix:** Use environment variable or auto-detect

---

### 18. No Favicon
**File:** `index.html`
**Issue:** Browser shows generic icon
**Impact:** Unprofessional in browser tabs

**Fix:** Add:
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
```

---

### 19. Tailwind CDN in Production
**File:** `index.html:7` - `<script src="https://cdn.tailwindcss.com"></script>`
**Issue:** Loads ~400KB of CSS at runtime (slow)
**Impact:** Performance hit on first load

**Better Approach:** Use PostCSS + Tailwind CLI to generate optimized CSS file

---

### 20. Missing Error Boundary
**Issue:** No React Error Boundary component
**Impact:** If any component crashes, entire app white-screens

**Fix:** Wrap `<App />` in Error Boundary:
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

## Edge Cases to Test

### 21. Empty Project with No Inventory
- What happens if you try to generate AI summary?
- Does disposition chart show "No data"?

### 22. Staff Member with Same Name
- Can you have two "John Smith" entries?
- Does search distinguish them?

### 23. Expired/Invalid Gemini API Key
- Does it gracefully fall back to mock data? ✅ (Yes, already handled)

### 24. Special Characters in Names
- Try project name: `Test & "Quotes" <script>`
- Verify no XSS vulnerability

### 25. Very Long Text Fields
- Customer name with 500 characters
- Does UI break/overflow?

---

## Security Concerns

### 26. API Key Exposure
**File:** `vite.config.ts:14` - `'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)`
**Issue:** API key is bundled into client-side JavaScript
**Risk:** Anyone can view source and steal key

**CRITICAL FIX NEEDED:**
- API calls MUST go through backend proxy
- Never expose API keys to frontend

**Temporary Mitigation:** Use API key restrictions in Google Cloud Console (limit to specific domains)

---

### 27. No Input Sanitization
**Files:** All text inputs
**Risk:** XSS attacks if data ever rendered as HTML
**Current State:** React escapes by default (safe), but watch for `dangerouslySetInnerHTML`

**Test:** Enter `<img src=x onerror=alert('xss')>` in project name

---

### 28. Client Portal - No Access Control
**File:** `pages/ClientPortal.tsx:10`
**Issue:** Anyone with project ID can view portal
**Risk:** If IDs are predictable (P-2024-001, P-2024-002...), anyone can enumerate all projects

**Fix:**
- Use UUIDs for project IDs
- OR: Require secret token in URL (`/portal/:moveId/:token`)

---

## Performance Issues

### 29. No Memoization on Expensive Calculations
**File:** `pages/Dashboard.tsx:10` - `useMemo()` ✅ Good!
**But:** Moves.tsx doesn't memoize `filteredMoves` recalculation

**Potential Issue:** With 1000+ projects, filtering on every keystroke might lag

---

### 30. Image Base64 Storage
**Issue:** Storing images as base64 in localStorage is inefficient
**Impact:**
- Base64 is 33% larger than binary
- Every re-render reads large strings from storage

**Alternative:** Use IndexedDB for Blob storage

---

## Documentation Gaps

### 31. No README Section on Environment Variables
**Missing:** Clear instructions on where to get Gemini API key

### 32. No Deployment Guide
**Missing:** How to deploy to Vercel/Netlify/etc.

### 33. No Contribution Guide
**Missing:** If you want others to contribute code

---

## Summary

| Severity | Count | Must Fix Before Launch |
|----------|-------|------------------------|
| 🔴 Critical | 2 | ✅ YES |
| 🟠 High | 4 | ✅ YES |
| 🟡 Medium | 9 | 🤔 Recommended |
| 🟢 Low | 11 | ❌ Optional |
| **Security** | 3 | ⚠️ **URGENT** |

---

## Recommended Fix Priority

1. **FIX IMMEDIATELY:**
   - #26: API Key Exposure (move to backend)
   - #1: Profiles page not updating
   - #3: Form validation

2. **FIX BEFORE PUBLIC LAUNCH:**
   - #2: Clock out bug
   - #4: Delete confirmations
   - #5: Loading states
   - #9: File size limits
   - #28: Portal access control

3. **FIX IN NEXT SPRINT:**
   - #10: localStorage size management
   - #13: Timezone handling
   - #20: Error boundary
   - #19: Tailwind optimization

4. **BACKLOG (Nice to Have):**
   - Everything else

---

**Next Steps:**
1. Review this document with your team
2. Create GitHub Issues for top 10 bugs
3. Fix critical bugs (test each fix!)
4. Re-run TESTING_CHECKLIST.md
5. Deploy beta version

Would you like me to create fix PR descriptions for any of these? 🚀
