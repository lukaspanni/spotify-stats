# Spotify Stats

A Spotify statistics viewer application that displays your top tracks and artists with personalized recommendations.

## Features

- 📊 View your top tracks and artists across different time ranges
- 🎵 Get personalized music recommendations based on your listening history
- 📝 Create playlists from your favorites or recommendations
- 🌐 Runs on Cloudflare Workers for fast, global performance

## Documentation

### Quick Links

- **[Enable Recommendations Feature](docs/ENABLE_RECOMMENDATIONS.md)** - Step-by-step guide to enable recommendations
- **[Spotify API Status Research](docs/API_STATUS_SUMMARY.md)** - Summary of recommendations API research
- **[Feature Flags](docs/FEATURE_FLAGS.md)** - Runtime feature configuration
- **[Implementation Guide](docs/RECOMMENDATION_IMPLEMENTATION_GUIDE.md)** - Technical details

### Recommendations Feature

The Spotify recommendations feature is **fully implemented and ready to use**. To enable it:

1. Set `ENABLE_RECOMMENDATIONS = "true"` in `wrangler.toml`
2. Deploy: `npm run deploy`

See [ENABLE_RECOMMENDATIONS.md](docs/ENABLE_RECOMMENDATIONS.md) for detailed instructions.

**Note**: Recent research confirms the Spotify recommendations API (`/v1/recommendations`) is **NOT deprecated** and remains fully functional. See [API_STATUS_SUMMARY.md](docs/API_STATUS_SUMMARY.md) for details.

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for deployment)

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Running Locally

```bash
# Build frontend and start Cloudflare Workers dev server
npm run dev

# Or run frontend dev server only
npm run dev:frontend
```

### Deployment

```bash
# Build and deploy to Cloudflare Workers
npm run deploy
```

## Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Cloudflare Workers
- **Build**: Vite (frontend), Wrangler (Workers)
- **Testing**: Jest/Vitest
- **Package Manager**: npm/pnpm

## License

See LICENSE file for details.