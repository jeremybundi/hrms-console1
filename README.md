# HRMS Console

The platform owner's console for HRMS. It covers every organisation on the platform:
- **Overview**: platform-wide totals.
- **Organisations**: create, edit, switch on or off.
- **Users**: reset passwords, unlock, sign out, switch off, change roles, move between organisations, make platform admins.
- **System health**: failed jobs, scheduled tasks, integration failures, DD-Sign and ERP connections.

It talks to hrm-engine's `/api/v1/platform/*` endpoints.

## Run it

```bash
npm install
npm run dev          # http://localhost:5180
```

`.env.development` points at the local engine (`https://api.hrmspay.com.test/api/v1`); `.env.production` at production. Put a different `VITE_API_BASE_URL` in `.env.development.local` to override it without committing.

## Who can sign in

Only sign-ins marked as platform admins. On the hrm-engine server:

```bash
php artisan migrate                              # adds users.is_platform_admin
php artisan platform:admin you@example.com       # give access
php artisan platform:admin you@example.com --revoke
```

After that, platform admins can give or take away access from the Users page.

## Scheduled tasks on the health page

The engine records each scheduled task as it runs. The list stays empty until cron runs `php artisan schedule:run` every minute on the server.
# hrms-console1
