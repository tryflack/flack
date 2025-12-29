<p align="center">
  <img src="https://tryflack.com/favicon-32x32.png" width="64" height="64" alt="Flack Logo" />
</p>

<h1 align="center">Flack</h1>

<p align="center">
  <strong>An open source alternative to Slack</strong><br/>
  Real-time team communication that you can self-host
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#feature-comparison">Comparison</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/bun-%3E%3D1.3-black.svg" alt="Bun" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node" />
</p>

---

## Why Flack?

Slack is great, but it's expensive and your data lives on someone else's servers. Flack gives you the same real-time collaboration experience with full control over your data and infrastructure.

- 🏠 **Self-hostable** — Run on your own servers, keep your data private
- 💰 **Free forever** — No per-user pricing, no feature gates
- 🔓 **Open source** — MIT licensed, fork and customize as you need
- ⚡ **Modern stack** — Built with Next.js 16, React 19, and WebSockets on Cloudflare

---

## Features

### Core Messaging

- 💬 **Real-time messaging** — Instant message delivery via WebSockets
- 📢 **Channels** — Public and private channels for team discussions
- 💌 **Direct messages** — 1:1 conversations with teammates
- 👥 **Group DMs** — Multi-person private conversations
- 🧵 **Threads** — Reply to messages in threads to keep discussions organized
- ✏️ **Edit & delete** — Edit or delete your own messages
- 😀 **Reactions** — React to messages with emoji

### Organization & Discovery

- 🏢 **Multi-tenant workspaces** — Separate organizations with their own channels and members
- 🔍 **Global search** — Find messages, channels, and people with Cmd+K
- 📋 **Browse channels** — Discover and join public channels
- 🔔 **Unread indicators** — Never miss a message with unread counts

### Presence & Profiles

- 🟢 **Real-time presence** — See who's online across your workspace
- 👤 **User profiles** — Custom display names, bios, and avatar uploads
- 🖼️ **Avatar uploads** — Personalized profile pictures with Vercel Blob storage

### Administration

- 👑 **Role management** — Admin and member roles with appropriate permissions
- ✉️ **Email invitations** — Invite teammates with email verification
- ⚙️ **Channel settings** — Edit, delete, and manage channel membership

---

## Feature Comparison

See how Flack compares to Slack's functionality:

| Feature                        | Slack | Flack | Status       |
| ------------------------------ | :---: | :---: | ------------ |
| **Messaging**                  |       |       |              |
| Real-time messages             |  ✅   |  ✅   | Shipped      |
| Channels (public & private)    |  ✅   |  ✅   | Shipped      |
| Direct messages                |  ✅   |  ✅   | Shipped      |
| Group DMs                      |  ✅   |  ✅   | Shipped      |
| Threaded replies               |  ✅   |  ✅   | Shipped      |
| Message editing                |  ✅   |  ✅   | Shipped      |
| Message deletion               |  ✅   |  ✅   | Shipped      |
| Emoji reactions                |  ✅   |  ✅   | Shipped      |
| Typing indicators              |  ✅   |  ✅   | Shipped      |
| **Organization**               |       |       |              |
| Workspaces                     |  ✅   |  ✅   | Shipped      |
| Channel browser                |  ✅   |  ✅   | Shipped      |
| Global search                  |  ✅   |  ✅   | Shipped      |
| Unread message counts          |  ✅   |  ✅   | Shipped      |
| User presence (online/offline) |  ✅   |  ✅   | Shipped      |
| Member invitations             |  ✅   |  ✅   | Shipped      |
| Role-based permissions         |  ✅   |  ✅   | Shipped      |
| **Profiles**                   |       |       |              |
| Custom display names           |  ✅   |  ✅   | Shipped      |
| Profile bio                    |  ✅   |  ✅   | Shipped      |
| Avatar uploads                 |  ✅   |  ✅   | Shipped      |
| **Notifications**              |       |       |              |
| Unread indicators              |  ✅   |  ✅   | Shipped      |
| Desktop notifications          |  ✅   |  ❌   | Planned      |
| Push notifications             |  ✅   |  ❌   | Planned      |
| Notification preferences       |  ✅   |  ❌   | Planned      |
| **Files & Media**              |       |       |              |
| File attachments               |  ✅   |  ❌   | Planned      |
| Image previews                 |  ✅   |  ❌   | Planned      |
| File search                    |  ✅   |  ❌   | Planned      |
| **Advanced**                   |       |       |              |
| Message formatting (Markdown)  |  ✅   |  ⚠️   | Basic        |
| Link previews                  |  ✅   |  ❌   | Planned      |
| Custom emoji                   |  ✅   |  ❌   | Planned      |
| Integrations/Apps              |  ✅   |  ❌   | Planned      |
| Slash commands                 |  ✅   |  ❌   | Planned      |
| Workflows                      |  ✅   |  ❌   | Planned      |
| SSO/SAML                       |  ✅   |  ❌   | Planned      |
| **Deployment**                 |       |       |              |
| Cloud hosted                   |  ✅   |  ✅   | tryflack.com |
| Self-hosted                    |  ❌   |  ✅   | Shipped      |
| Open source                    |  ❌   |  ✅   | MIT License  |

**Legend:** ✅ Available | ⚠️ Partial | ❌ Not yet available

---

## Tech Stack

| Layer             | Technology                            |
| ----------------- | ------------------------------------- |
| **Frontend**      | Next.js 16, React 19, Tailwind CSS v4 |
| **Backend**       | Next.js Server Actions, API Routes    |
| **Database**      | SQLite/LibSQL with Prisma ORM         |
| **Auth**          | Better Auth (email/password)          |
| **Real-time**     | PartyKit (WebSockets on Cloudflare)   |
| **File Storage**  | Vercel Blob (for avatars)             |
| **Monorepo**      | Turborepo with Bun                    |
| **UI Components** | shadcn/ui, Radix primitives           |

---

## Quick Start

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

| Variable                | Description                       | Default                   |
| ----------------------- | --------------------------------- | ------------------------- |
| `NEXT_PUBLIC_APP_URL`   | Public app URL                    | Same as `BETTER_AUTH_URL` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for avatars     | —                         |
| `DATABASE_AUTH_TOKEN`   | Turso auth token (if using Turso) | —                         |
| `LOCAL_DATABASE_URL`    | Local SQLite for migrations       | —                         |
| `NODE_ENV`              | Environment                       | `development`             |

---

## Deployment

### Option 1: Managed PartyKit (Recommended)

The easiest way to deploy real-time features:

```bash
# Login to PartyKit
npx partykit login

# Deploy from realtime package
turbo deploy:partykit
```

Configure PartyKit environment:

```bash
cd packages/realtime
npx partykit env add BETTER_AUTH_URL
# Enter: https://your-domain.com
npx partykit deploy
```

Deploy web app to Vercel, Railway, or any Node.js host:

```bash
turbo build
```

### Option 2: Self-Hosted on Cloudflare

Deploy PartyKit to your own Cloudflare account:

```bash
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"

cd packages/realtime
npx partykit deploy --domain realtime.yourdomain.com
```

### Option 3: Docker (Coming Soon)

Full Docker deployment with docker-compose is on the roadmap.

---

## Project Structure

```
flack/
├── apps/
│   └── web/                  # Next.js frontend
│       ├── app/              # App router pages & API
│       │   ├── (auth)/       # Login, register, email verification
│       │   ├── (dashboard)/  # Main app (channels, messages)
│       │   ├── (onboarding)/ # Workspace setup flow
│       │   ├── actions/      # Server actions
│       │   ├── api/          # API routes for SWR
│       │   └── lib/          # Hooks and utilities
│       └── components/       # Shared components
├── packages/
│   ├── auth/                 # Better Auth configuration
│   ├── db/                   # Prisma schema and client
│   ├── email/                # Email templates (React Email)
│   ├── realtime/             # PartyKit servers
│   └── ui/                   # Shared UI components (shadcn)
├── turbo.json                # Turborepo configuration
└── package.json              # Root package.json
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

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/flack.git`
3. **Create a branch**: `git checkout -b feature/amazing-feature`
4. **Make changes** and test locally
5. **Commit**: `git commit -m 'Add amazing feature'`
6. **Push**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Guidelines

- Follow the existing code style (Prettier + ESLint)
- Write meaningful commit messages
- Add tests for new features when applicable
- Update documentation as needed
- Keep PRs focused on a single feature/fix

### Good First Issues

Look for issues labeled `good first issue` for beginner-friendly tasks.

### Reporting Bugs

Open an issue with:

- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## Troubleshooting

<details>
<summary><strong>"BETTER_AUTH_SECRET is required"</strong></summary>

Generate a secret and add it to your `.env`:

```bash
openssl rand -base64 32
```

</details>

<details>
<summary><strong>PartyKit connection issues</strong></summary>

1. Ensure PartyKit is running: `cd packages/realtime && bun run dev`
2. Check `NEXT_PUBLIC_PARTYKIT_HOST` matches your PartyKit server
3. For production, ensure your domain is correctly configured
</details>

<details>
<summary><strong>Messages require hard refresh</strong></summary>

This means server-side broadcast isn't reaching PartyKit. Check:

1. `NEXT_PUBLIC_PARTYKIT_HOST` is set correctly
2. The host matches your deployed PartyKit server exactly
3. PartyKit server is deployed and running
</details>

<details>
<summary><strong>PartyKit shows "Invalid token"</strong></summary>

PartyKit validates tokens by calling your app. Set the auth URL:

```bash
cd packages/realtime
npx partykit env add BETTER_AUTH_URL
npx partykit deploy
```

</details>

<details>
<summary><strong>Database migration errors</strong></summary>

```bash
# Reset database (development only!)
rm packages/db/dev.db
turbo db:migrate
```

</details>

<details>
<summary><strong>"Cannot find module '@flack/db'"</strong></summary>

```bash
turbo db:generate
```

</details>

---

## Roadmap

- [ ] Desktop notifications
- [ ] File attachments and image previews
- [ ] Link previews (unfurling)
- [ ] Custom emoji
- [ ] Slash commands
- [ ] Integration/webhook support
- [ ] Docker deployment
- [ ] SSO/SAML authentication
- [ ] Message pinning
- [ ] Channel bookmarks

See our [TODO.md](./TODO.md) for detailed implementation progress.

---

## Security

If you discover a security vulnerability, please send an email to security@tryflack.com instead of opening a public issue.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ by the Flack community</sub>
</p>
