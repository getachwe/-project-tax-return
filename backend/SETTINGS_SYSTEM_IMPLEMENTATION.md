# Settings System Implementation Guide

This document describes how to implement the Settings and Profile system in the application.

Tech stack:

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* ShadCN/UI
* Supabase Authentication

The application already includes the following sidebar navigation:

Dashboard
Incomes
History
Settings
Profile

Currently the Settings and Profile pages exist but they are empty.

The goal is to build a complete Settings system step-by-step.

---

# STEP 1 — Create Settings Route Structure

Create the following folder structure using Next.js App Router.

app/settings/layout.tsx
app/settings/page.tsx
app/settings/account/page.tsx
app/settings/security/page.tsx
app/settings/preferences/page.tsx

This will allow nested settings routes.

Routes that will exist in the application:

/settings
/settings/account
/settings/security
/settings/preferences

---

# STEP 2 — Create Settings Layout

Create a shared layout for all settings pages.

File:

app/settings/layout.tsx

The layout should include:

* Page title: "Settings"
* Settings sidebar navigation
* Content area for settings pages

Sidebar navigation should include:

Account
Security
Preferences

Use ShadCN components:

Card
Button
Separator

The design should look like a modern SaaS settings page.

---

# STEP 3 — Build Settings Main Page

File:

app/settings/page.tsx

Purpose:

Provide an overview of the user account.

Display:

User avatar
Full name
Email
Account creation date

Also include quick navigation cards linking to:

Account Settings
Security Settings
Preferences Settings

---

# STEP 4 — Implement Account Settings

File:

app/settings/account/page.tsx

Features:

Update full name
Update phone number
Upload profile avatar

Use ShadCN components:

Input
Button
Avatar
Card
Toast messages for success

Validate inputs properly.

---

# STEP 5 — Implement Security Settings

File:

app/settings/security/page.tsx

Features:

Change password
Logout from all sessions
Display last login information

Use components:

Input
Button
Dialog (for confirmation)

Security operations should use Supabase authentication.

---

# STEP 6 — Implement Preferences Settings

File:

app/settings/preferences/page.tsx

Features:

Dark / Light mode toggle
Language selection
Email notifications toggle

Use components:

Switch
Select
Card

Preferences should be saved in the database.

---

# STEP 7 — Implement Profile Page

File:

app/profile/page.tsx

Purpose:

Display user information.

Show:

Avatar
Full name
Email
Phone number
Account creation date

Include an edit form to update:

Name
Phone number

---

# STEP 8 — Authentication Protection

Protect these routes:

/settings
/settings/account
/settings/security
/settings/preferences
/profile

If the user is not authenticated:

Redirect to:

/login

Use Supabase authentication middleware.

---

# STEP 9 — UI Consistency

All pages should use ShadCN components:

Card
Input
Button
Avatar
Switch
Select
Dialog
Separator
Toast

The UI must match the existing dashboard style.

---

# FINAL GOAL

At the end of this implementation the system should include:

✔ Fully functional Settings system
✔ Account management
✔ Security controls
✔ User preferences
✔ Profile page

All implemented using Next.js App Router and modern SaaS UI patterns.
