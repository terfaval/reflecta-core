# Reflecta login token flow

## Overview
This document describes the proposed one‑time login token mechanism for Reflecta. The solution relies on Supabase Auth for user management and email sending. Only already registered Supabase users will be able to log in via a short‑lived token that is issued through a backend API.

## Database additions

A new `login_tokens` table is required in Supabase:

```sql
create table if not exists login_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  token text not null,
  expires_at timestamp not null,
  created_at timestamp default now()
);
```

The `token` column stores a random UUID. The entry is removed after use or when expired.

## Backend API

A new FastAPI router `login_token.py` exposes the token issuance endpoint.

### POST `/api/login-token`

**Body:** `{ email: string }`

1. Look up the Supabase Auth user by email.
2. Generate a UUID token and expiry (e.g. 15 minutes).
3. Insert a row into `login_tokens` table.
4. Call `supabase.auth.admin.generate_link(type='magiclink', email=email)` to obtain a magic link.
5. Append the token as query parameter `?login_token=<uuid>` to the redirect URL.
6. Supabase sends the email automatically using the default template.

Only admin‑level API key should be allowed to call this endpoint. Optionally restrict it via role guard.

### GET `/api/login-token/validate`

Used by the frontend when landing on Reflecta after the magic link login.

**Query params:** `token=<uuid>`

1. Check that the token exists and is not expired.
2. Delete the row.
3. Respond with `{ supabaseToken: string, user: {...} }` where `supabaseToken` is `session.access_token` obtained from `supabase.auth.get_session()` using the cookie set by Supabase.

The frontend will then store the returned token and user info in `sessionStorage` just like the current login flow does.

### POST `/api/register-user`

Registers a new user row in the `users` table when only an email address is provided. Used if the login page detects that the email does not exist yet.

**Body:** `{ email: string }`

Responds with `{ message: "Registration successful." }` on success. Returns 400 if the user already exists.

## Frontend adjustments

### Login page

Replace the password form with a single email field and “Send me a login link” button. When submitted it calls `POST /api/login-token` with the provided email. Show confirmation or error.

### Magic link landing

1. Supabase magic link redirects to `/login` with `token` param.
2. The page detects the param and calls `GET /api/login-token/validate?token=...`.
3. On success it stores `reflecta_user_id`, `reflecta_email`, `reflecta_role` and `reflecta_token` in `sessionStorage` and redirects to `/loading`.

### Session restoration

`UserProvider` already checks `sessionStorage` on mount. No change is needed except ensuring the Supabase session is restored using the returned token.

### Optional admin UI

An admin‑only section could list users and trigger `/api/login-token` for them. This is optional and can be added later using role guards.

## File‑level tasks

Backend (`backend/`):
- `db/schema.sql` – add `login_tokens` table.
- `login_token.py` – new router with `/login-token` and `/login-token/validate` endpoints.
- `app.py` – include the new router.
- Possibly update `auth.py` with admin guard utilities.

Frontend (`pages/` and `contexts/`):
- `pages/login.tsx` – rewrite form to send the login link and handle magic link redirect.
- `contexts/UserContext.tsx` – add logic in `useEffect` to read the `token` query param on the login page and validate.
- `lib/api.ts` – no change; still attaches `reflecta_token` header.
- Optionally add `components/AdminLoginTrigger.tsx` if an admin interface is desired.

## Flow summary

1. Admin or the login page calls `/api/login-token` for a known email.
2. Supabase emails the user a magic link containing `login_token=<uuid>`.
3. User clicks the link → Supabase authenticates → redirects back to `/login?token=<uuid>`.
4. Frontend calls `/api/login-token/validate` to verify and get the Supabase session token.
5. User context stores credentials in `sessionStorage` and the app proceeds to `/loading` just as today.
