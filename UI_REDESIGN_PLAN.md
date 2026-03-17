You are a senior product designer and frontend engineer.

Your task is to redesign and improve the UI/UX of my Tax Refund Dashboard.

IMPORTANT: The entire interface must be in Hebrew (RTL).
All labels, buttons, messages, and text must be written in Hebrew.

====================================
⚠️ RULE #1 – DO NOT BREAK FUNCTIONALITY
=======================================

The system is already working correctly.

You must:

* Preserve all existing functionality
* Do not change API calls
* Do not change logic or state management
* Do not remove features

Only improve:

* UI design
* Layout
* UX flow
* Visual hierarchy

====================================
🎯 PRODUCT GOAL
===============

The dashboard must help the user quickly understand:

1. כמה כסף מגיע לו (או אם יש חוב)
2. מה הסטטוס הנוכחי שלו בתהליך
3. מה הפעולה הבאה שהוא צריך לבצע

The interface must feel:

* ברור
* מקצועי
* אמין
* מודרני
* פשוט להבנה

====================================
שלב 1 – אזור ראשי (Hero Section)
================================

Create a prominent hero section at the top of the dashboard.

This section must display:

כותרת:
"סטטוס החזר המס שלך"

מידע מרכזי:
סכום ההחזר או החוב (גדול וברור)

דוגמה:
"₪692 החזר מס"

סטטוס:
"הבקשה מוכנה להגשה"
או
"הבקשה נמצאת בבדיקה"

כפתור פעולה מרכזי:
"כפתור: המשך תהליך"
או
"כפתור: הגש בקשה להחזר"

The hero section must be the most visually dominant part of the page.

====================================
שלב 2 – הצגת התקדמות בתהליך
===========================

Add a clear progress / timeline section.

השלבים בתהליך:

שלב 1:
"העלאת מסמכים"

שלב 2:
"בדיקה וניתוח הנתונים"

שלב 3:
"קבלת החזר המס"

Requirements:

* Highlight the current step
* Show completed steps clearly
* Use icons and progress indicators
* The user must immediately understand where they are in the process

====================================
שלב 3 – מידע מרכזי (Key Insights)
=================================

Add a section showing important insights about the user's tax situation.

Examples:

"כמה הכנסות דווחו"
"כמה מס שולם"
"כמה החזר צפוי"

Use cards with clear titles in Hebrew.

Example titles:

"כמה מס שילמת השנה"
"הערכת החזר מס"
"סטטוס הבקשה"

====================================
שלב 4 – פירוט החישוב
====================

Create a section explaining the calculation.

Title:

"איך חישבנו את החזר המס שלך"

This section should display:

* פירוט הכנסות
* פירוט מסים
* זיכויים
* החזר צפוי

The layout should be clear and readable.

====================================
שלב 5 – מידע משני
=================

Move less important sections lower on the page.

Examples:

"היסטוריית בקשות"
"אבטחת מידע"
"פרטי חשבון"

These sections should not compete with the main action.

They can be:

* smaller cards
* collapsible sections
* or located lower in the page

====================================
שלב 6 – שיפור שימוש בצבעים
==========================

Use colors meaningfully:

ירוק:
החזר מס חיובי

אדום:
חוב למס הכנסה

כחול:
פעולות מרכזיות (כפתורים)

אפור:
מידע משני

Make sure the design works well in both:

* Light Mode
* Dark Mode

====================================
שלב 7 – שיפור כפתורים ופעולות
=============================

Ensure there is always one clear primary action.

Examples of buttons in Hebrew:

"העלה מסמכים"
"המשך תהליך"
"הגש בקשה"
"בדוק סטטוס"

Secondary buttons should be less visually prominent.

====================================
שלב 8 – שיפור טקסטים (Microcopy)
================================

All text must be simple and clear.

Examples:

Instead of technical language, use friendly explanations.

Example:

"גרור קובץ לכאן או לחץ להעלאה"

"תומך בקבצי PDF או תמונה"

"ננתח את הנתונים ונחשב עבורך את החזר המס"

====================================
שלב 9 – ניווט צדדי
==================

Improve the sidebar navigation.

Menu items in Hebrew:

"דשבורד"
"העלאת מסמכים"
"היסטוריה"
"פרופיל"
"הגדרות"

Highlight the active page clearly.

====================================
שלב 10 – אינטראקציות וחוויית משתמש
==================================

Add modern UI interactions:

* Hover effects
* Smooth transitions
* Clear feedback for actions
* Loading states
* Success messages
* Error messages

The interface must feel modern and responsive.

====================================
⚙️ TECHNICAL REQUIREMENTS
=========================

* React
* Next.js (App Router)
* Tailwind CSS
* ShadCN UI components

Important:

Keep existing functionality intact.
Refactor only UI components if necessary.

====================================
🧪 FINAL SAFETY CHECK
=====================

After redesign verify:

* All buttons still work
* Upload functionality still works
* API calls are unchanged
* Data is displayed correctly
* No functionality is broken

====================================
EXPECTED RESULT
===============

A clean, modern, professional Hebrew dashboard that:

* Clearly shows the user's tax refund
* Guides the user step by step
* Feels like a real fintech SaaS product
* Maintains all existing
