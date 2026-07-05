# Dentify Frontend

React SPA (Vite + TypeScript + Tailwind v4 + shadcn/ui-style components) for the GiapTech.Dentify clinic app. Talks to the ABP backend's REST API (`/api/app/*`) and authenticates via OAuth2 Authorization Code + PKCE against the backend's OpenIddict AuthServer.

## Run locally

```bash
cp .env.example .env   # adjust VITE_API_URL / VITE_AUTHORITY if the backend isn't on localhost:44348
npm install
npm run dev            # http://localhost:5173
```

Backend must be running (see repo root `CLAUDE.md`) and its `App:CorsOrigins` / `OpenIddict:Applications:Dentify_App:RootUrl` settings must include this app's origin.

## Structure

- `src/auth/` — `oidc-client-ts` `UserManager` config + `AuthProvider` context (PKCE sign-in/out).
- `src/lib/api.ts` — fetch wrapper attaching the bearer access token; `patients-api.ts` / `appointments-api.ts` are thin typed wrappers around the backend AppServices.
- `src/types/` — DTOs mirrored from `Application.Contracts`. Enum wire format: responses serialize enums as **numbers** (C# ordinal), requests accept the enum member **name** as a string — see comments in `types/patient.ts` / `types/appointment.ts`.
- `src/components/ui/` — hand-vendored shadcn/ui-style primitives (Button, Input, Dialog, Select, Table, ...), owned in-repo per the shadcn convention (no runtime dependency on a "shadcn" package).
- `src/pages/` — route-level pages (Patients, Appointments, auth callback).

## Build

```bash
npm run build
```
