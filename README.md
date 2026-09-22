# Applywise

A job application tracker with a Kanban pipeline, AI career assistance, analytics, private resume uploads, and live status notifications.

Live app and API: [applywise-flax.vercel.app](https://applywise-flax.vercel.app). Vercel serves the Vite client and the Express REST API from the same origin.

The interface uses teal glass panels and supports day and night modes. The sign-in hero uses Aceternity UI's Background Beams, recolored to match the theme. The theme toggle appears on the sign-in page and in the workspace header, and the preference is saved in the browser.

## Stack

- Client: React 19, Vite, Tailwind CSS 4, shadcn/ui components, Framer Motion, Recharts, `@hello-pangea/dnd`, Socket.io client
- API: Node.js, Express 5, MongoDB with Mongoose, JWT, bcrypt, Google Gemini API, AWS S3, Socket.io
- Local containers: Docker Compose with MongoDB, API, and Vite client
- Production: Vercel for the Vite client and Express API, MongoDB Atlas for persistent data
- Alternative API host: Render configuration is included in `render.yaml`

## Quick start

Requires Node.js 22+ and pnpm 10+. For local development without Docker, start a MongoDB instance first.

```bash
cd applywise
pnpm install
cp server/.env.example server/.env
cp client/.env.example client/.env
pnpm dev
```

If MongoDB and Docker are not installed, use `pnpm dev:local` instead. On its first run, this development-only command downloads a MongoDB binary and starts it with data stored in `server/.local/db`. The local JWT secret is generated in `server/.local/jwt-secret`. Resume PDFs are stored privately in `server/.local/resumes` unless an S3 bucket is configured. These files are ignored by Git. `pnpm dev:local` starts the client and API together; no `.env` files are required for local resume uploads. For live Follow-up and Tips responses, add `GEMINI_API_KEY=your-key` to `server/.env` and restart `pnpm dev:local`. Without a key, these actions show clearly labeled example output for local demos.

Edit `server/.env` before starting: set a random `JWT_SECRET` with at least 32 characters and a reachable `MONGODB_URI`. The client is at `http://localhost:5173`; the API is at `http://localhost:4000/api`.

For Docker, set a Gemini API key in an untracked `.env` in this folder if you want live AI features, then run:

```bash
docker compose up --build
```

The Compose file supplies a local MongoDB URL and a development JWT secret. It stores resume PDFs in a persistent Docker volume and enables labeled AI previews by default. To use AWS S3 in Docker, set `RESUME_STORAGE=s3` and the AWS variables in `.env`. To use live AI, set `GEMINI_API_KEY` in `.env`; a configured key always takes precedence over previews. Set your own `JWT_SECRET` for anything beyond local development. Docker is not needed to run the apps directly.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing key, at least 32 characters |
| `CLIENT_ORIGIN` | Exact client origin allowed by CORS and Socket.io; comma separated for multiple origins |
| `GEMINI_API_KEY` | Google AI Studio credential for follow-up emails and interview tips |
| `GEMINI_MODEL` | Gemini model; defaults to `gemini-3.1-flash-lite` |
| `AI_DEMO_MODE` | `true` enables clearly labeled preview output when the configured AI provider is unavailable |
| `AWS_REGION`, `AWS_S3_BUCKET` | Private S3 bucket location |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Optional locally; use IAM role credentials in AWS when possible |
| `RESUME_STORAGE` | `local` for development files, `s3` for AWS S3; `dev:local` selects local storage when no S3 bucket is set |
| `VITE_API_URL` | Optional separate API origin for the Vite client, without `/api`; omit for the same-origin Vercel deployment |
| `VITE_SOCKET_URL` | Optional persistent Socket.io service origin for production live events |

Without a Gemini key, `dev:local` and Docker Compose return labeled example output for AI actions. The local preview does not make a Gemini request or claim knowledge of a company's interview process. Local development resume and profile photo uploads stay in the ignored `server/.local` folder. Resume links expire after five minutes; profile photo links expire after one hour. Production uploads require a private S3 bucket; S3 objects are encrypted at rest and opened through signed links. S3 credentials need `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` on the `resumes/` and `profile-photos/` prefixes. Profile photos accept JPG, PNG, or WebP files up to 2 MB. The email notification switch stores a preference in MongoDB; outbound email delivery is not part of this project.

## Deployment

The current production deployment uses the root `vercel.json`. It builds `client/dist`, exposes Express through `api/index.js`, and rewrites `/api/*` to that function. MongoDB Atlas is connected through the Vercel Marketplace and supplies `MONGODB_URI`.

1. Import this repository into Vercel with `applywise` as the project root, or deploy from that directory with `vercel --prod`.
2. Connect MongoDB Atlas and set `JWT_SECRET` plus `CLIENT_ORIGIN` in Vercel project environment variables.
3. Add `GEMINI_API_KEY` from Google AI Studio for live Follow-up and Tips generation. `GEMINI_MODEL` defaults to the stable free-tier model `gemini-3.1-flash-lite`.
4. Create a private S3 bucket and add `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` to enable production resume and profile photo uploads.
5. Redeploy after changing environment variables.

The application saves accounts, profile preferences, and applications in MongoDB Atlas. Status changes always update through the REST API and show a toast. For cross-client Socket.io events in production, set `VITE_SOCKET_URL` to a persistent Socket.io service; local Docker and Node development use the included Socket.io server directly.

## API

| Method | Route | Use |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Get JWT |
| `GET` | `/api/auth/me` | Validate current session |
| `PATCH` | `/api/auth/profile` | Update name and optional profile photo |
| `PATCH` | `/api/auth/settings` | Save email notification preference |
| `GET`, `POST` | `/api/applications` | List or create applications |
| `DELETE` | `/api/applications` | Delete all of the signed-in user's applications |
| `PATCH`, `DELETE` | `/api/applications/:id` | Edit, move, or remove an application |
| `GET` | `/api/applications/:id/resume` | Get a short lived private download URL |
| `POST` | `/api/ai/:id/follow-up` | Generate follow-up email |
| `POST` | `/api/ai/generate-email` | Generate a follow-up email from `{ applicationId }` |
| `POST` | `/api/ai/:id/tips` | Generate three interview preparation tips |
| `GET` | `/api/health` | Health check |

The bearer JWT scopes application and AI routes to the signed in user. The API validates inputs, rate limits auth and AI calls, and limits resume uploads to valid PDFs up to 5 MB. Status changes are emitted to the user's Socket.io room.

## Verification

```bash
pnpm --filter @applywise/client build
pnpm --filter @applywise/server test
```

For a visual browser check with Chrome installed, start the app and run `pnpm --filter @applywise/client visual:check`. This captures the sign-in page in both modes and checks that the theme survives a reload. Set `DEMO_EMAIL` and `DEMO_PASSWORD` to also capture the board and analytics screens. Screenshots are saved to the ignored `.screenshots/` folder.
