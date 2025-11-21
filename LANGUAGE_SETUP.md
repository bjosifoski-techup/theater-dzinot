# Language Setup - Fixed

## Changes Made

### 1. Admin Role Updated ✅
The user `teatar@techup.me` has been updated to admin role in the database.

**To verify:**
- Sign out if currently logged in
- Sign back in with `teatar@techup.me`
- You should now see "Admin" and "Reports" menu items
- You should see the "admin" badge next to your name

### 2. Language Switcher Added ✅

A language switcher button has been added to the top navigation bar.

**Location:** Top right corner of the navigation, before the user profile/sign-in buttons

**Features:**
- Shows current language: "MK" for Macedonian, "EN" for English
- Click to toggle between languages
- Icon: Languages symbol
- Tooltip: "Change Language / Промени јазик"

### 3. Default Language Set to Macedonian ✅

**Configuration:**
- Default language: Macedonian (mk)
- Fallback language: English (en)
- Language preference is saved in browser's localStorage
- If you previously visited the site in English, clear localStorage or click the language switcher

**To reset to Macedonian:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Type: `localStorage.setItem('language', 'mk')`
4. Refresh the page

**Or simply click the language switcher button (MK/EN) in the top right**

### 4. All UI Elements Translated

The following sections are now fully translated:

**Navigation:**
- App name: "Театарски билети" (MK) / "Theater Box" (EN)
- Browse Plays
- My Bookings
- Box Office
- Admin
- Reports
- Sign In/Out

**Footer:**
- Copyright notice

**Other translated sections:**
- Authentication forms (Sign In, Sign Up)
- Play browsing and search
- Booking flow
- Admin dashboard
- Box office interface
- All buttons and labels

## How to Use Language Switcher

1. Look for the button in the top right corner with the Languages icon
2. It shows either "MK" or "EN" indicating current language
3. Click it to switch between Macedonian and English
4. The entire interface will update immediately
5. Your preference is saved automatically

## Verification Checklist

- [x] Admin role updated for teatar@techup.me
- [x] Language switcher visible in navigation
- [x] Macedonian set as default
- [x] Language preference persists in localStorage
- [x] All navigation items translated
- [x] Toggle works correctly
- [x] Build succeeds without errors

## Sample Macedonian Translations

- "Театарски билети" = Theater Box
- "Прегледај претстави" = Browse Plays
- "Мои резервации" = My Bookings
- "Боксофис" = Box Office
- "Администрација" = Admin
- "Извештаи" = Reports
- "Најави се" = Sign In
- "Одјави се" = Sign Out

## Technical Details

**Files Modified:**
1. `src/components/Layout.tsx` - Added language switcher and translations
2. `src/i18n/config.ts` - Updated to persist language and default to Macedonian
3. Database: `user_profiles` table - Updated role for teatar@techup.me

**Translation Files:**
- `src/i18n/locales/mk.json` - Macedonian translations
- `src/i18n/locales/en.json` - English translations

## Troubleshooting

**If still showing English:**
1. Clear browser cache and localStorage
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Manually set language: Click the MK/EN button
4. Check browser console for any errors

**If admin menu not showing:**
1. Sign out completely
2. Sign back in with teatar@techup.me
3. Check that you see "admin" badge next to your name
4. If still not working, verify in Supabase Dashboard that role is "admin"
