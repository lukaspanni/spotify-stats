# GitHub Copilot Instructions for spotify-stats

## Project Overview

This is a Spotify statistics viewer application that displays a user's top tracks and artists. The application consists of:
- **Backend**: Cloudflare Workers serving as API proxy and authentication handler
- **Frontend**: React application with TypeScript for displaying Spotify statistics

## Technology Stack

- **Runtime**: Cloudflare Workers (backend), Browser (frontend)
- **Languages**: TypeScript
- **Frontend Framework**: React 19
- **Build Tools**: Vite (frontend), Wrangler (Cloudflare Workers)
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## Project Structure

```
/src                          - Backend Cloudflare Workers code
  /test                       - Backend tests
/public                       - Frontend React application
  /components                 - React components
    /ui                       - Reusable UI components
/dist                         - Build output (not committed)
```

## Development Workflow

### Available Commands

- `pnpm run lint` - Run ESLint on all files
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run Jest tests
- `pnpm run build:frontend` - Build React frontend with Vite
- `pnpm run dev` - Build frontend and start Wrangler dev server
- `pnpm run dev:frontend` - Start Vite dev server for frontend only
- `pnpm run deploy` - Build and deploy to Cloudflare Workers

### Building

1. **Frontend**: Uses Vite to build React application into `/dist/public`
2. **Backend**: Cloudflare Workers uses the TypeScript source directly from `/src`

### Testing

- Backend tests are located in `/src/test`
- Frontend tests are located in `/public/test`
- Run tests with `pnpm run test`
- Tests use Jest with ts-jest preset
- Test environment is Node.js

## Code Style and Patterns

### TypeScript

- **Strict mode enabled** - All strict TypeScript checks are on
- Always use explicit types, avoid `any`

- **Backend TypeScript (Cloudflare Workers)**
  - `tsconfig.json` uses **ES2020 target** and **`module: node16`**
  - Use `.js` extensions in relative imports to match Node 16 / Cloudflare module resolution

- **Frontend TypeScript (React / browser)**
  - `tsconfig.browser.json` uses **ES2016 target**, **`module: ESNext`**, and **`moduleResolution: bundler`**
  - Rely on Vite/bundler for module resolution; do not use `.js` extensions in frontend imports

### Backend (Cloudflare Workers)

- Entry point exports a default object with `fetch` method
- Request handlers are async functions returning `Response` objects
- Use `Env` type for environment variables and bindings
- Cookie handling uses custom parser and builder (not using external cookie library)
- CORS is handled manually with appropriate headers
- OAuth flow: `/login` → Spotify → `/spotify-callback` → set cookies → redirect
- API proxy endpoint: `/proxy-api` forwards requests to Spotify API

### Frontend (React)

- Use functional components with TypeScript
- Props should have explicit type definitions
- Use Tailwind CSS for styling with `class-variance-authority` and `clsx` for conditional classes
- UI components follow shadcn/ui patterns (see `/public/components/ui`)
- Client-side API calls use the Spotify Web API directly and fall back to the backend `/proxy-api` endpoint on error

### Testing

- Test files use `.spec.ts` extension
- Mock external dependencies (Spotify API, fetch, etc.)
- Test both success and error cases
- For Workers, test request/response patterns

### Formatting and Linting

- Code is formatted with Prettier (config in `.prettierrc`)
- ESLint config in `eslint.config.mjs` (flat config format)
- Always run linting before committing: `pnpm run lint`
- Auto-format code: `pnpm run format`

## Common Tasks

### Adding a New Backend Route

1. Add handler function in `handlers.ts`
2. Export the handler
3. Add route check in `handleRequest()` in `index.ts`
4. Add tests in `src/test/`

### Adding a New React Component

1. Create component in `public/components/`
2. Define prop types with TypeScript interfaces
3. Use Tailwind classes for styling
4. Add to parent component imports
