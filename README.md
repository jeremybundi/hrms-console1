# HRMS Console

The platform owner's console for HRMS. One place to run every organisation on the platform: see how the platform is doing, manage organisations and sign-ins, watch system health, and review audit trails.

It is a React app that talks to [hrm-engine](../hrm-engine)'s `/api/v1/platform/*` endpoints. Only accounts marked as **platform admins** can sign in.

---

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Giving someone access](#giving-someone-access)
- [How pausing and deleting work](#how-pausing-and-deleting-work)
- [Project structure](#project-structure)
- [Theme and language](#theme-and-language)
- [Backend API](#backend-api)
- [Deploying](#deploying)
- [Troubleshooting](#troubleshooting)

---

## Features

| Page | What it does |
|---|---|
| **Overview** | Totals across every organisation: organisations, users, employees, payroll this month, sign-ins (today, 7 days, failed, locked out), active sessions, documents and signatures, work waiting for approval (leave, expenses, job postings). Charts for sign-ins (14 days), growth and payroll runs (6 months), and which integrations organisations use. |
| **Organisations** | Search and filter (active, paused, deleted). Create an organisation with its owner, who gets an invitation email. Edit, pause, resume, delete, restore, or remove for good. Shows people, numbers, history and a link to its audit log. |
| **Users** | Every sign-in, filterable by organisation and status. Send a password reset or resend an invitation, unlock after too many wrong passwords, sign out everywhere, pause, delete, restore or erase. Change someone's role or access per organisation, move them between organisations, and grant or remove platform admin. |
| **System health** | Failed queue jobs (retry or remove), scheduled tasks with last run, next run and missed runs, integration failures in the last 24 hours, DD-Sign and ERP connections, signature checks, and server details. Refreshes every 30 seconds. |
| **Console activity** | Every action taken in this console: who, what, when and why. Kept even after the organisation or sign-in it's about is removed. |
| **Audit logs** | Every organisation's own audit trail in one place: record changes, sign-ins and sensitive-data access. Filter by organisation, kind, date and person; expand an entry to see each field before and after. Salaries and bank details are never sent to the console. |

Also: light, dark and system themes; English and Kiswahili; works on phones.

---

## Quick start

Needs Node 20+ and a running hrm-engine.

```bash
npm install
npm run dev            # http://localhost:5180
```

Other scripts:

```bash
npm run build          # production build in dist/
npm run preview        # serve the build locally
npm run lint           # ESLint
```

On the engine, once:

```bash
php artisan migrate
php artisan platform:admin you@example.com
```

Then sign in with that account's normal email and password.

---

## Configuration

The console has one setting: which engine it talks to.

| File | Used by | Default |
|---|---|---|
| `.env.development` | `npm run dev` | `https://api.hrmspay.com.test/api/v1` (local engine via Herd) |
| `.env.production` | `npm run build` | `https://api.hrmspay.ddsign.ae/api/v1` |
| `.env.development.local` | overrides the above, not committed | — |

```bash
# .env.development.local
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

The badge under the logo shows which engine you're on: **Local**, **Staging** or **Production** (red), so production is hard to mistake.

### Engine settings

| Setting | Where | Default | What it does |
|---|---|---|---|
| `PLATFORM_PURGE_AFTER_DAYS` | engine `.env` | `30` | How long deleted organisations and sign-ins can be restored before the daily job removes them for good. |

---

## Giving someone access

Platform access is a flag on the account (`users.is_platform_admin`), separate from the person's role in any organisation. Switching organisations never removes it.

- **First admin:** on the engine server, `php artisan platform:admin you@example.com`
- **Remove from the command line:** `php artisan platform:admin you@example.com --revoke`
- **After that:** any platform admin can turn it on or off from a user's page in the console.

You can't remove your own access, pause yourself or delete yourself, so the console can never be left without an admin.

Someone without the flag who signs in is turned away, and their token is revoked straight away.

---

## How pausing and deleting work

| | Pause | Delete | Remove / erase for good |
|---|---|---|---|
| **Organisation** | Nobody there can sign in. People already signed in are blocked on their next request. Data untouched. | Hidden and unusable. People who belong to other organisations carry on there. Restorable for 30 days. | All its records are deleted, along with its files on HRMS storage and sign-ins that belong nowhere else. Files in the organisation's own S3, R2 or Azure bucket are left alone. |
| **User** | Can't sign in anywhere. Sessions end now. | Hidden from staff lists, can't sign in, and the email can't be re-invited. Restorable for 30 days. | Name, email and password are wiped; memberships removed. The row stays as "Erased user" so payroll and approval history still make sense. |
| **Needs** | A reason | A reason, plus the organisation's name typed | The name or email typed |
| **Undo** | Resume | Restore (a paused one comes back paused) | Not possible |

- After 30 days, `php artisan platform:purge-deleted` (scheduled daily at 02:00) removes or erases what's left. Run it with `--dry-run` to see what would go.
- You can't pause or delete the organisation you're signed in to.
- Removing for good is limited to 10 a minute per admin.
- Every one of these actions is written to **Console activity** with the reason.

---

## Project structure

```
src/
├── api/
│   ├── client.js          fetch wrapper, token storage, ApiError (with field errors)
│   └── platform.js        one function per /platform endpoint
├── auth/                  AuthProvider + useAuth: sign-in, platform-admin check, sign-out on 401
├── i18n/
│   ├── context.js         LANGUAGES, useI18n()
│   ├── I18nProvider.jsx   current language, remembered in the browser
│   └── sw.js              Kiswahili, keyed by the English text
├── components/
│   ├── ui.jsx             Button, Card, Table, Modal, Input, Select, Toggle, Stat, Pagination…
│   ├── ActionModal.jsx    asks for a reason and/or typed confirmation before risky actions
│   ├── ActivityFeed.jsx   readable console-activity entries
│   ├── LifecycleBanner.jsx why something is paused or deleted, and the restore deadline
│   ├── Shell.jsx          sidebar layout, theme and language switches
│   └── …
├── lib/
│   ├── useResource.js     load data with loading/error state; reload({ quiet })
│   ├── format.js          dates, numbers, relative time in the current language
│   ├── theme.js           light / dark / system
│   └── activity.js        labels for console-activity actions
└── pages/                 Overview, Organisations, Organisation, Users, User, Health, Activity, Audit, Login
```

**Conventions**

- Colours are CSS variables on `:root` (`--c-bg`, `--c-surface`, `--c-text`, `--c-brand`, `--c-side`, …), with dark values under `[data-theme='dark']` and `prefers-color-scheme`. Use the variables, not hard-coded colours, so both themes work.
- Visible text goes through `t('English text', { params })`. Add the Kiswahili to `src/i18n/sw.js`; anything missing shows in English.
- Pages keep their filters in the URL where it helps (`/users?tenant_id=5&status=paused`), so a filtered view can be shared or bookmarked.

---

## Theme and language

- **Theme:** Light, Dark or System, at the bottom of the sidebar and on the sign-in page. Stored in `localStorage` (`hrms-console-theme`) and applied before the page paints, so there's no flash.
- **Language:** English or Kiswahili, under the theme switch. Stored in `localStorage` (`hrms-console-language`); dates and numbers follow it.

### Adding a language

1. Add it to `LANGUAGES` in `src/i18n/context.js`, e.g. `{ code: 'fr', label: 'Français', locale: 'fr-FR' }`.
2. Create `src/i18n/fr.js` shaped like `sw.js`.
3. Register it in `DICTIONARIES` in `src/i18n/I18nProvider.jsx`.

---

## Backend API

Every route sits under `/api/v1/platform`, needs a Sanctum token from `POST /api/v1/auth/login`, and needs `is_platform_admin`. Others get `403 AUTH_006`. The group allows 240 requests a minute.

| Method | Path | Body | What it does |
|---|---|---|---|
| GET | `/overview` | | Totals, trends, sign-ins, workload, adoption |
| GET | `/health` | | Queue, scheduler, integrations, signatures, server |
| POST | `/failed-jobs/{uuid}/retry` | | Put a failed job back on the queue |
| DELETE | `/failed-jobs/{uuid}` | | Remove a failed job |
| GET | `/activity` | `?subject_type&subject_id&action&search` | Console activity |
| GET | `/audit-logs` | `?tenant_id&category&action&actor_id&search&from&to` | Every organisation's audit trail |
| GET | `/audit-logs/filters` | | Categories and actions for filters |
| GET | `/tenants` | `?search&status=active\|paused\|deleted&sort` | List organisations |
| POST | `/tenants` | `name, domain?, owner_name, owner_email` | Create, invite owner |
| GET | `/tenants/{id}` | | Details, members, roles |
| PATCH | `/tenants/{id}` | `name?, domain?` | Edit |
| POST | `/tenants/{id}/pause` | `reason` | Pause |
| POST | `/tenants/{id}/resume` | | Resume |
| DELETE | `/tenants/{id}` | `confirm, reason` | Delete (restorable) |
| POST | `/tenants/{id}/restore` | | Restore |
| POST | `/tenants/{id}/purge` | `confirm` | Remove for good |
| GET | `/users` | `?search&tenant_id&status=active\|paused\|deleted\|unverified\|platform_admin` | List sign-ins |
| GET | `/users/{id}` | | Details, memberships, sessions, last sign-in |
| PATCH | `/users/{id}` | `name?, is_platform_admin?` | Edit, grant or remove console access |
| POST | `/users/{id}/pause` | `reason` | Pause |
| POST | `/users/{id}/resume` | | Resume |
| DELETE | `/users/{id}` | `reason` | Delete (restorable) |
| POST | `/users/{id}/restore` | | Restore |
| POST | `/users/{id}/erase` | `confirm` | Erase for good |
| POST | `/users/{id}/password-link` | | Reset link, or the invitation again if not yet accepted |
| POST | `/users/{id}/unlock` | | Clear the wrong-password lockout |
| POST | `/users/{id}/sign-out` | | End every session |
| POST | `/users/{id}/switch` | `tenant_id` | Move them to another of their organisations |
| PATCH | `/users/{id}/memberships/{tenantId}` | `role?, is_active?` | Change role or access in one organisation |

Errors use the engine's usual shape: `{ "error": { "id": "VALIDATION_001", "message": "…", "details": { "confirm": ["…"] } } }`. The console shows `details` next to the matching field.

**Engine pieces behind it**

| Piece | File |
|---|---|
| Access guard | `app/Http/Middleware/EnsurePlatformAdmin.php` |
| Blocks paused or deleted accounts and organisations on every request | `app/Http/Middleware/EnsureAccountUsable.php` |
| Organisations and users | `app/Services/Platform/PlatformDirectory.php` |
| Overview and health | `app/Services/Platform/PlatformInsights.php` |
| Console activity | `app/Services/Platform/PlatformActivityLog.php`, table `platform_activities` |
| Scheduler last runs | `app/Support/ScheduleHeartbeat.php` |
| Commands | `platform:admin`, `platform:purge-deleted` |
| Tests | `tests/Feature/Api/V1/Platform/` |

---

## Deploying

**Engine** (once per environment):

```bash
php artisan migrate
php artisan platform:admin you@example.com
```

Make sure cron runs the scheduler every minute. It drives the daily purge, and the health page's scheduler panel stays empty without it:

```
* * * * * cd /path/to/hrm-engine && php artisan schedule:run >> /dev/null 2>&1
```

**Console:**

```bash
npm ci
npm run build          # uses .env.production
```

Serve `dist/` as a static site, sending unknown paths to `index.html` so routes such as `/users/12` work on refresh. For nginx:

```nginx
location / {
  try_files $uri /index.html;
}
```

Put the console on its own address (for example `console.hrmspay.com`), and limit who can reach it if you can (VPN or IP allow-list). It controls every organisation.

---

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| "This sign-in can't use the console" | The account isn't a platform admin. Run `php artisan platform:admin email`. |
| Signed out straight after signing in | The token was rejected. Check `VITE_API_BASE_URL` points at the right engine and the engine is running. |
| Requests fail with a network or CORS error | The engine isn't reachable at that address, or CORS on the engine doesn't allow the console's origin (`config/cors.php`). |
| Scheduler shows "Hasn't run yet" | Cron isn't running `schedule:run`. Locally, run `php artisan schedule:work`. |
| "Too many requests" when removing for good | More than 10 permanent removals in a minute. Wait a minute. |
| Can't pause or delete an organisation | It's the one you're signed in to. Switch to another organisation in HRMS first. |
| Deleted user can't be invited again | Restore them from **Users → Deleted**, or erase them first. |
