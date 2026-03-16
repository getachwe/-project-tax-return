# Dark Mode UI Fix – Step by Step

This document explains how to fix and standardize the Dark Mode UI in the application.

Tech stack:

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* ShadCN/UI

The application already supports dark mode but the UI is not consistent or readable.

The goal is to make the entire system look professional in both Light Mode and Dark Mode.

---

# STEP 1 — Audit the Current UI

Scan the entire codebase and find hardcoded colors that break dark mode.

Common problems include:

bg-white
text-black
border-gray-200
text-gray-700

These colors do not adapt to dark mode.

Create a list of components that use hardcoded colors.

Examples:

Dashboard components
Sidebar
Forms
Cards
Tables

---

# STEP 2 — Replace Hardcoded Colors

Replace all hardcoded Tailwind colors with theme tokens.

Do NOT use:

bg-white
text-black
border-gray-200

Instead use:

bg-background
text-foreground
border-border
bg-card
text-muted-foreground
bg-muted

These automatically adapt to dark mode.

---

# STEP 3 — Fix Input Fields

Input fields must be clearly visible in dark mode.

Ensure inputs use:

bg-background
border-border
text-foreground
placeholder:text-muted-foreground

Check:

Text readability
Placeholder visibility
Input borders

---

# STEP 4 — Fix Cards and Panels

Cards must have proper contrast.

Use styles like:

bg-card
border-border
shadow-sm

Ensure cards are readable in both dark and light modes.

---

# STEP 5 — Fix Sidebar Navigation

The sidebar must remain readable in dark mode.

Ensure the sidebar uses:

bg-muted or bg-card
text-foreground

Add proper hover states such as:

hover:bg-muted

Icons and labels must remain visible.

---

# STEP 6 — Fix Forms

Forms must maintain readability and consistent design.

Check:

Form labels
Helper text
Validation messages
Buttons

Ensure all use theme tokens.

Example:

text-foreground
text-muted-foreground

---

# STEP 7 — Ensure Consistency Across Pages

Check all pages:

Dashboard
Incomes
History
Settings
Profile

Make sure all pages use the same design system.

No page should use different color logic.

---

# STEP 8 — Test Dark Mode

Test the UI in both themes.

Check:

Text readability
Input visibility
Sidebar contrast
Buttons and links
Cards and panels

Verify the entire UI remains consistent.

---

# FINAL RESULT

After completing these steps:

✔ Dark mode should be clean and readable
✔ All inputs and forms should be visible
✔ Text should have proper contrast
✔ The entire application should follow one consistent design system
