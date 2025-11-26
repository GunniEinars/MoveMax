# MoveMax Testing Checklist

## Setup Complete ✅
- [x] Dependencies installed
- [x] TypeScript compilation successful
- [x] Production build works (1.14MB bundle)
- [x] No TypeScript errors

## Testing Guide

### How to Test the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Access at: `http://localhost:3000`

2. **Add Gemini API Key (for AI features):**
   - Get key from: https://aistudio.google.com/app/apikey
   - Edit `.env.local` and replace `PLACEHOLDER_API_KEY` with real key

---

## Critical Features to Test

### 1. Authentication & Login Flow
- [ ] Visit `http://localhost:3000` - should redirect to `/login`
- [ ] Login page displays 4 user options (Admin, PM, Supervisor, Mover)
- [ ] Click "Sign In" for Sarah Jenkins (Admin) - should navigate to dashboard
- [ ] Verify user name/avatar shows in top-right nav
- [ ] Logout works - returns to login page
- [ ] Login as different roles and verify navigation items change

**Known Behavior:** No password required (demo mode)

---

### 2. Navigation & Routing
- [ ] Dashboard (`/reports`) - shows metrics and charts
- [ ] Projects (`/moves`) - shows project grid
- [ ] Auditor (`/audit`) - mobile tool for field ops
- [ ] My Tasks (`/my-tasks`) - task list view
- [ ] Profiles (`/profiles`) - staff management
- [ ] Dispatch (`/dispatch`) - logistics dashboard
- [ ] Settings (`/settings`) - configuration panel
- [ ] Global search bar (top center) works for projects/assets/staff
- [ ] Notification bell shows activity log

**Test Mobile:** Hamburger menu appears on small screens

---

### 3. Role-Based Permissions

Login as each role and verify access:

| Feature | Admin | PM | Supervisor | Mover |
|---------|-------|----|-----------| ------|
| View Projects | ✅ | ✅ | ✅ | ✅ |
| Edit Projects | ✅ | ✅ | ✅ | ❌ |
| Delete Projects | ✅ | ✅ | ❌ | ❌ |
| View Profiles | ✅ | ✅ | ✅ | ✅ |
| Edit Staff | ✅ | ✅ | ❌ | ❌ |
| View Settings | ✅ | ❌ | ❌ | ❌ |

---

### 4. Project Management (CRUD)

#### Create New Project
- [ ] Click "+ Create Project" button (top-right on Projects page)
- [ ] Fill out form: Customer Name, Origin, Destination, Date, Status
- [ ] Toggle "Retain Audit Images" feature flag
- [ ] Save - should appear in project grid
- [ ] Verify it persists after page refresh (localStorage)

#### View Project Details
- [ ] Click any project card
- [ ] Should open detailed view with tabs:
  - Overview, Departments, Planning, Outputs, Timeline, Logistics, Disposition, Budget, Risks, Documents, Tasks, Activity

#### Edit Project
- [ ] Click "Edit Project" button (top-right of detail view)
- [ ] Modify fields (customer name, dates, etc.)
- [ ] Save and verify changes persist

#### Delete Project
- [ ] Need to test if delete button exists (check permissions)

---

### 5. AI Integration Features

**REQUIRES GEMINI API KEY**

#### Floorplan Analysis
- [ ] Open project → Planning tab → Origin step
- [ ] Click "Upload Floorplan"
- [ ] Upload office blueprint image (JPG/PNG)
- [ ] Wait for AI to detect furniture/cabinets
- [ ] Verify assets appear in "Detected Assets" list
- [ ] Check each asset has: name, type, location, estimated crates

#### Photo Asset Detection
- [ ] Planning tab → "Scan Asset Photo" button
- [ ] Upload photo of office furniture
- [ ] AI should identify items, condition (Good/Fair/Poor)
- [ ] Should suggest disposition (Keep/Resell/Recycle)

#### Drawer Content Scanning
- [ ] Go to Auditor page (`/audit`)
- [ ] Select a project → navigate to room → cabinet → drawer
- [ ] Take photo or upload image
- [ ] AI counts items and recommends digitization/recycling

#### Damage Assessment
- [ ] Risks tab → Report Incident
- [ ] Upload photo of damaged item
- [ ] AI should auto-fill description and severity

#### Project Summary Generation
- [ ] Outputs tab → "Generate AI Summary" button
- [ ] AI writes executive summary based on inventory
- [ ] Should mention volume, fragile items, logistics

---

### 6. Inventory & Asset Management

#### Add Department
- [ ] Departments tab → "+ Add Department"
- [ ] Fill: Name, Move Date, Budget, Contact Info
- [ ] Save and verify appears in list

#### Add Asset/Inventory Item
- [ ] Overview tab → Inventory section → "+" icon
- [ ] Fill: Name, Quantity, Volume, Room, Fragile flag
- [ ] Assign to department
- [ ] Set disposition (Keep/Resell/Donate/Recycle/Trash/Digitize)
- [ ] Set condition (New/Good/Fair/Poor/Damaged)
- [ ] Save and verify in inventory table

#### Add Crate
- [ ] Planning tab → Strategy step → "Provision Crates"
- [ ] Generate 10 crates with prefix "CRT-" starting at 100
- [ ] Verify crates appear in list

#### Map Crate to Destination
- [ ] Planning tab → Destination step → Add zones
- [ ] Strategy step → Drag crate to zone (if drag-drop works)
- [ ] OR: Select crate → Click zone → Map button

#### Storage Unit Tracking
- [ ] Planning → Origin → Manually add cabinet
- [ ] Add sub-units (drawers/shelves)
- [ ] Assign items to specific drawers
- [ ] Verify hierarchical relationship

---

### 7. Logistics & Dispatch

#### View Fleet
- [ ] Dispatch page → Shows 4 vehicles:
  - Truck 101 (26ft Box)
  - Truck 102 (26ft Box)
  - Trailer 500 (53ft)
  - Van 05

#### Create Load
- [ ] Logistics tab → "+ Add Load"
- [ ] Select vehicle
- [ ] Name load (e.g. "Load 1 - IT Equipment")
- [ ] Add seal number
- [ ] Assign driver name
- [ ] Set status: Planned/Loading/In Transit/Unloading/Complete
- [ ] Save

#### Assign Assets to Load
- [ ] Edit inventory item
- [ ] Select loadId from dropdown
- [ ] Verify item appears in load manifest

#### View Load Manifest
- [ ] Logistics tab → Click load → "View Manifest"
- [ ] Shows all items assigned to that load
- [ ] Total volume vs. capacity indicator

---

### 8. Staff Management

#### Add Staff Member
- [ ] Profiles page → "+ Add Staff"
- [ ] Fill: Name, Email, Phone, Role
- [ ] Set hourly rate
- [ ] Configure permissions (view/edit/delete per page)
- [ ] Save

#### Edit Staff
- [ ] Click staff card
- [ ] Modify details
- [ ] Change status (Active/Inactive)
- [ ] Update permissions
- [ ] Save

#### Delete Staff
- [ ] Click trash icon
- [ ] Confirm deletion
- [ ] Verify removed from list

---

### 9. Time Tracking & Budget

#### Clock In
- [ ] My Tasks page → Select project → "Clock In"
- [ ] Should create time entry with start time

#### Clock Out
- [ ] Click "Clock Out"
- [ ] Should calculate duration and cost (hourly rate × hours)
- [ ] Verify entry appears in Budget tab

#### Log Expense
- [ ] Budget tab → "+ Add Expense"
- [ ] Category: Fuel/Materials/Parking/Food/Permits/Other
- [ ] Amount and description
- [ ] Save
- [ ] Verify appears in expense table

#### Budget Tracking
- [ ] Departments tab → Each department shows:
  - Budgeted amount
  - Actual spend
  - Variance (over/under budget)

---

### 10. Client Portal

#### Generate Share Link
- [ ] Projects page → Select project → Share icon
- [ ] Copy link (format: `/portal/:moveId`)
- [ ] Example: `http://localhost:3000/#/portal/P-2024-001`

#### Test Client View
- [ ] Open link in incognito/private window (simulates client)
- [ ] Should NOT require login
- [ ] Shows: Status, timeline, progress bar, documents
- [ ] Read-only (no edit buttons)

**Bug Check:** Ensure sensitive data (costs, notes) is hidden from clients

---

### 11. Auditor Field Tool

#### Select Project
- [ ] Visit `/audit` page
- [ ] Select project from dropdown
- [ ] Should show room list

#### Navigate Rooms
- [ ] Toggle between List and Map view
- [ ] Click room → shows cabinets
- [ ] Click cabinet → shows drawers
- [ ] Breadcrumb navigation works

#### Add Asset Tag
- [ ] Select cabinet
- [ ] Enter physical tag number (e.g. "1005")
- [ ] Save
- [ ] Verify tag appears on cabinet

#### Scan Drawer Contents
- [ ] Open drawer → "📷 Scan Contents"
- [ ] Upload photo
- [ ] AI returns detected items
- [ ] Accept or edit results
- [ ] Items added to inventory

---

### 12. Reporting & Analytics

#### Dashboard Metrics
- [ ] Dashboard shows:
  - Total sq ft reclaimed
  - Active projects count
  - Recycled weight
  - Crew utilization %
- [ ] Monthly project volume chart renders
- [ ] Verify chart data updates when projects change

#### Disposition Pie Chart
- [ ] Projects → Disposition tab
- [ ] Shows breakdown: Keep/Resell/Donate/Recycle/Trash
- [ ] Percentages and counts
- [ ] Chart renders correctly

#### Sustainability Report
- [ ] Outputs tab shows:
  - Projected sq ft savings
  - Recycled weight
  - Liquidation value
  - Disposal cost savings

---

### 13. Data Persistence (localStorage)

- [ ] Create new project
- [ ] Add inventory, tasks, expenses
- [ ] Close browser completely
- [ ] Reopen `http://localhost:3000`
- [ ] Verify all data still exists

#### Reset Demo Data
- [ ] User menu (top-right) → "Reset Demo Data"
- [ ] Confirms and reloads
- [ ] All custom data cleared
- [ ] Back to initial mock data

---

### 14. Forms & Validation

Test each form for:
- [ ] Required fields (should show error if empty)
- [ ] Number fields (reject non-numeric input)
- [ ] Date fields (proper date picker)
- [ ] Dropdown selects (all options work)
- [ ] Toggle switches (state changes)

**Forms to Test:**
- Project create/edit
- Department form
- Inventory item form
- Staff member form
- Expense form
- Incident report form
- Load manifest form
- Destination zone form

---

### 15. Mobile Responsiveness

Test on phone or browser dev tools (375px width):
- [ ] Navigation collapses to hamburger menu
- [ ] Project cards stack vertically
- [ ] Tables become scrollable
- [ ] Forms adjust to single column
- [ ] Auditor page (optimized for mobile)
- [ ] All modals fit on screen

---

### 16. Edge Cases & Error Handling

#### Empty States
- [ ] Delete all projects → Should show "No projects" message
- [ ] Project with no inventory → Shows empty table
- [ ] No incidents → Shows "No risks reported"

#### Large Data Sets
- [ ] Create 50+ projects → Check performance
- [ ] Add 500+ inventory items → Table should paginate (if implemented)

#### Missing Images
- [ ] If floorplan image fails to load → Show placeholder
- [ ] If avatar URL broken → Show initials fallback

#### API Errors
- [ ] Remove/break Gemini API key
- [ ] Try AI feature
- [ ] Should show fallback/mock data (not crash)

---

## Known Issues to Watch For

### Potential Bugs Identified in Code Review

1. **Moves.tsx Line 244**: `resolveIncident` doesn't update `selectedMove` state properly
   - **Test:** Resolve incident → Check if status changes in UI immediately

2. **AuthContext**: No persistent session
   - **Test:** Refresh page → User logged out (expected behavior for demo)

3. **StoreContext Line 178**: `clockOut` finds first active entry across ALL moves
   - **Bug:** If same staff clocked into multiple projects, might clock out wrong one
   - **Test:** Clock in to 2 projects → Clock out → Verify correct entry closed

4. **Missing Input Validation**: Forms don't validate required fields
   - **Test:** Submit empty forms → Should show errors (currently might accept)

5. **No Confirmation Dialogs**: Destructive actions need warnings
   - **Test:** Delete expensive assets → Should ask "Are you sure?"

6. **Image Upload**: No file size limits
   - **Test:** Upload 50MB image → Might crash browser

7. **Date Handling**: No timezone consideration
   - **Test:** Create project with date → Check if date matches across timezones

---

## Performance Checks

- [ ] Initial page load < 3 seconds
- [ ] Project list renders in < 500ms
- [ ] Search results appear instantly (<100ms)
- [ ] Chart animations smooth (60fps)
- [ ] No console errors in dev tools
- [ ] Bundle size < 2MB (currently 1.14MB ✅)

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Security Checks

- [ ] API key NOT visible in browser dev tools Network tab
- [ ] localStorage doesn't contain sensitive passwords
- [ ] Client portal can't access admin features
- [ ] XSS: Try entering `<script>alert('xss')</script>` in text fields

---

## Accessibility (a11y)

- [ ] Tab navigation works (keyboard only)
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader announces page changes

---

## Next Steps After Testing

1. **Document all bugs found** in a separate `BUGS.md` file
2. **Prioritize fixes**: Critical (app breaks) → High (bad UX) → Low (polish)
3. **Add missing validations** to forms
4. **Write unit tests** for critical functions (StoreContext, geminiService)
5. **Implement error boundaries** to catch React crashes
6. **Add loading states** for all async operations

---

## Test Data

### Default Projects
- `P-2024-001`: TechCorp HQ Relocation (In Progress)
- `P-2024-002`: Law Firm Partners (Booked)
- `P-2024-003`: StartUp Inc. (Pending)
- `P-2024-004`: Global Logistics Branch (Booked)

### Default Users
1. Sarah Jenkins (Admin) - Full access
2. David Chen (PM) - No settings access
3. Mike Ross (Supervisor) - View only on profiles
4. Marcus Johnson (Mover) - Limited edit rights

---

## How to Report Issues

When you find a bug, document:
1. **What you did** (steps to reproduce)
2. **What happened** (actual behavior)
3. **What you expected** (desired behavior)
4. **Browser/device** (Chrome on Windows, etc.)
5. **Screenshot** (if applicable)
6. **Console errors** (F12 → Console tab)

---

**Good luck with testing! 🚀**
