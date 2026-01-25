# GitHub Copilot Instructions for spotify-stats

## Project Overview

This is a Spotify statistics viewer application that displays user's top tracks and artists. The application consists of:
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
  index.ts                    - Main entry point for Cloudflare Worker
  handlers.ts                 - Request handlers (login, callback, proxy)
  auth.ts                     - Spotify OAuth authentication
  spotify-client.ts           - Spotify API client
  cookies.ts                  - Cookie parsing and building
  cors.ts                     - CORS handling
  types.ts                    - TypeScript type definitions
/public                       - Frontend React application
  /components                 - React components
    /ui                       - Reusable UI components
  index.html                  - Entry HTML file
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
- **ES2020 target** - Use modern JavaScript features
- **Module system**: node16
- Always use explicit types, avoid `any`
- Use `.js` extensions in imports (TypeScript module resolution requirement)

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
- Client-side API calls through the backend proxy

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

## Important Patterns and Conventions

1. **Environment Variables**: Defined in `wrangler.toml` and accessed via `env` parameter
2. **CORS**: Custom CORS handling in `cors.ts` - add allowed origins there
3. **Authentication**: OAuth tokens stored in HTTP-only cookies for security
4. **API Proxy**: All Spotify API calls go through `/proxy-api` endpoint to avoid CORS issues
5. **Error Handling**: Return appropriate HTTP status codes with meaningful error messages
6. **Type Safety**: Use Zod for runtime validation where needed

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

### Updating Spotify API Integration

1. Check `spotify-client.ts` for existing patterns
2. Add new methods following existing conventions
3. Update type definitions in `types.ts`
4. Proxy calls through `/proxy-api` endpoint

## Dependencies

- Keep dependencies up to date but test thoroughly
- Use `pnpm` for package management
- Check for security vulnerabilities regularly
- Core dependencies:
  - `axios` for HTTP requests
  - `zod` for validation
  - `react` and `react-dom` for UI
  - `class-variance-authority`, `clsx`, `tailwind-merge` for styling utilities
  - `lucide-react` for icons

## Deployment

- Hosted on Cloudflare Workers
- Custom domain: `top-lists.lukaspanni.de`
- Deploy with `pnpm run deploy`
- Ensure frontend is built before deploying
- Environment variables must be set in Cloudflare Workers dashboard

## Notes for Copilot

- This is a full-stack TypeScript project with clear separation between backend (Workers) and frontend (React)
- When making changes, consider both backend and frontend implications
- Always maintain type safety
- Follow existing patterns for consistency
- Test changes locally with `pnpm run dev` before deploying
- When suggesting new features, consider Cloudflare Workers limitations and pricing
