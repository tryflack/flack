# Flack

A modern, real-time team communication platform built with Next.js, PartyKit, and Better Auth. Self-hostable and privacy-focused.

## Features

- 💬 **Real-time messaging** - Channels and direct messages with instant delivery
- 👥 **Organizations** - Multi-tenant workspace support
- 🔐 **Authentication** - Email/password auth with Better Auth
- 🌐 **Real-time presence** - See who's online
- 📱 **Modern UI** - Beautiful, responsive interface
- 🏠 **Self-hostable** - Run on your own infrastructure

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: Better Auth
- **Real-time**: PartyKit (WebSockets on Cloudflare)
- **Monorepo**: Turborepo with Bun

---

## Quick Start (Development)

### Prerequisites

- [Bun](https://bun.sh/) (v1.3+)
- [Node.js](https://nodejs.org/) (v18+)

### 1. Clone and Install

```bash
git clone https://github.com/tryflack/flack.git
cd flack
bun install
```

### 2. Configure Environment

```bash
# Copy example environment files
cp .env.example .env

# Generate a secure auth secret
openssl rand -base64 32
# Add the output to BETTER_AUTH_SECRET in .env
```

### 3. Initialize Database

```bash
# Generate Prisma client
turbo db:generate

# Run migrations
turbo db:migrate
```

### 4. Start Development Servers

```bash
# Start everything (web app + partykit)
turbo dev
```

This starts:

- **Web app**: http://localhost:3000
- **PartyKit (real-time)**: http://localhost:1999

---

## Environment Variables

### Required

| Variable                    | Description                    | Example                   |
| --------------------------- | ------------------------------ | ------------------------- |
| `BETTER_AUTH_SECRET`        | Secret for signing auth tokens | `openssl rand -base64 32` |
| `BETTER_AUTH_URL`           | Your app's base URL            | `http://localhost:3000`   |
| `DATABASE_URL`              | SQLite database path           | `file:./dev.db`           |
| `NEXT_PUBLIC_PARTYKIT_HOST` | PartyKit server host           | `localhost:1999`          |

### Optional

| Variable              | Description                                  | Default                   |
| --------------------- | -------------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_APP_URL` | Public app URL                               | Same as `BETTER_AUTH_URL` |
| `DATABASE_AUTH_TOKEN` | Turso auth token (if using Turso)            | —                         |
| `LOCAL_DATABASE_URL`  | Local SQLite for migrations (if using Turso) | —                         |
| `NODE_ENV`            | Environment                                  | `development`             |

---

## Deployment

### Option 1: Managed PartyKit (Recommended for Getting Started)

The easiest way to deploy real-time features is using PartyKit's managed platform.

#### Deploy PartyKit

```bash
# Login to PartyKit
npx partykit login

# Deploy from realtime package
turbo deploy:partykit
```

Your PartyKit server will be available at `your-project.partykit.dev`.

#### Configure PartyKit Environment

PartyKit needs to know your app's URL to validate authentication tokens:

```bash
cd packages/realtime

# Set the auth URL (your production domain)
npx partykit env add BETTER_AUTH_URL
# Enter: https://your-domain.com

# Redeploy to apply
npx partykit deploy
```

You can also manage environment variables at https://partykit.io in the project dashboard.

#### Deploy Web App

Deploy to Vercel, Railway, or any Node.js host:

```bash
turbo build
```

Set environment variables on your hosting platform:

```env
DATABASE_URL="file:/data/flack.db"
BETTER_AUTH_URL="https://your-domain.com"
BETTER_AUTH_SECRET="your-production-secret"
NEXT_PUBLIC_PARTYKIT_HOST="your-project.partykit.dev"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

---

### Option 2: Self-Hosted (Cloud-Prem) on Cloudflare

Deploy PartyKit to your own Cloudflare account for full control.

#### 1. Get Cloudflare Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Get your **Account ID** from the overview page
3. Create an **API Token** at https://dash.cloudflare.com/profile/api-tokens
   - Use the "Edit Cloudflare Workers" template

#### 2. Deploy PartyKit to Cloudflare

```bash
# Set environment variables
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"

# Deploy with custom domain
cd packages/realtime
npx partykit deploy --domain realtime.yourdomain.com
```

Or add to `packages/realtime/partykit.json`:

```json
{
  "name": "flack-realtime",
  "domain": "realtime.yourdomain.com"
}
```

#### 3. Configure DNS

Add a CNAME record pointing `realtime.yourdomain.com` to Cloudflare Workers.

#### 4. Configure PartyKit Environment

```bash
cd packages/realtime
bunx partykit env add BETTER_AUTH_URL
# Enter: https://your-domain.com
bunx partykit deploy
```

#### 5. Deploy Web App

Same as Option 1, but update:

```env
NEXT_PUBLIC_PARTYKIT_HOST="realtime.yourdomain.com"
```

---

### Option 3: Full Self-Hosted (Docker)

Coming soon! For now, you can:

1. Build the Next.js app: `turbo build`
2. Run with Node.js: `cd apps/web && bun start`
3. Use a reverse proxy (nginx, Caddy) for HTTPS
4. Deploy PartyKit via Cloudflare (Option 2)

---

## Database

Flack uses [LibSQL](https://libsql.org/) (SQLite-compatible) via Prisma. This gives you flexibility:

- **Local development**: Use a local SQLite file
- **Production**: Use local SQLite, or upgrade to [Turso](https://turso.tech/) for edge distribution

### Commands

```bash
# Generate Prisma client after schema changes
turbo db:generate

# Create and apply migrations (development)
turbo db:migrate

# Apply migrations (production)
turbo db:deploy

# Open Prisma Studio (database GUI)
turbo db:studio
```

### Option A: Local SQLite (Default)

Store the database in a persistent location:

```env
DATABASE_URL="file:/data/flack.db"
```

Make sure the directory exists and is writable.

### Option B: Turso (Optional - Distributed Edge Database)

For production with edge replication, you can optionally use [Turso](https://turso.tech/) instead of local SQLite:

1. Create a free database at [turso.tech](https://turso.tech/)
2. Get your database URL and auth token from the Turso dashboard
3. Set environment variables:

```env
DATABASE_URL="libsql://your-database-name.turso.io"
DATABASE_AUTH_TOKEN="your-turso-auth-token"
LOCAL_DATABASE_URL="file:./dev.db"
```

4. Run migrations locally (Prisma CLI uses `LOCAL_DATABASE_URL`):

```bash
turbo db:migrate
```

5. Apply schema to Turso using their CLI:

```bash
turso db shell your-database-name < prisma/migrations/*/migration.sql
```

**Note**: Turso is completely optional. Local SQLite works great for most use cases, including production deployments. Turso adds edge replication and automatic backups if you need them.

---

## Project Structure

```
flack/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── app/             # App router pages
│       ├── components/      # React components
│       └── lib/             # Utilities and hooks
├── packages/
│   ├── auth/               # Better Auth configuration
│   ├── db/                 # Prisma schema and client
│   ├── realtime/           # PartyKit servers
│   └── ui/                 # Shared UI components
├── turbo.json              # Turborepo configuration
└── package.json            # Root package.json
```

---

## Development Commands

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `turbo dev`             | Start all services in development mode |
| `turbo build`           | Build all packages                     |
| `turbo lint`            | Run ESLint                             |
| `turbo check-types`     | TypeScript type checking               |
| `turbo db:generate`     | Generate Prisma client                 |
| `turbo db:migrate`      | Run database migrations                |
| `turbo db:deploy`       | Apply migrations (production)          |
| `turbo db:studio`       | Open Prisma Studio                     |
| `turbo deploy:partykit` | Deploy PartyKit to production          |
| `bun run format`        | Format code with Prettier              |

---

## Troubleshooting

### "BETTER_AUTH_SECRET is required"

Generate a secret and add it to your `.env`:

```bash
openssl rand -base64 32
```

### PartyKit connection issues

1. Ensure PartyKit is running: `cd packages/realtime && bun run dev`
2. Check `NEXT_PUBLIC_PARTYKIT_HOST` matches your PartyKit server
3. For production, ensure your domain is correctly configured

### Messages require hard refresh in production

This means the server-side broadcast isn't reaching PartyKit. Check that:

1. `NEXT_PUBLIC_PARTYKIT_HOST` is set correctly on your hosting platform
2. The host matches your deployed PartyKit server exactly (e.g., `your-project.partykit.dev`)
3. Your PartyKit server is deployed and running

### PartyKit shows "Invalid token" or "Not authenticated"

PartyKit validates tokens by calling your Next.js app. Set the auth URL on PartyKit:

```bash
cd packages/realtime
npx partykit env add BETTER_AUTH_URL
# Enter your production URL: https://your-domain.com
npx partykit deploy
```

### Database migration errors

```bash
# Reset and recreate database (development only!)
rm packages/db/dev.db
turbo db:migrate
```

### "Cannot find module '@flack/db'"

```bash
# Regenerate Prisma client
turbo db:generate
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.
