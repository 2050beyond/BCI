# Laser Knife Blog

A minimal, bulletproof Next.js blog powered by DatoCMS.

## Features

- **Minimal**: Only text, images, and quotes
- **Forgiving**: Never crashes, handles missing data gracefully
- **Type-safe**: Full TypeScript support
- **Production-ready**: Configured for Vercel deployment

## Tech Stack

- Next.js 14 (App Router)
- DatoCMS (Headless CMS)
- Tailwind CSS + Typography
- TypeScript

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then add your DatoCMS API tokens:
- `NEXT_PUBLIC_DATOCMS_API_TOKEN` - Read-only token for frontend
- `DATOCMS_MANAGEMENT_API_TOKEN` - Full-access token for setup scripts (optional)

### 3. Initialize DatoCMS

Run the initialization script to set up your CMS:

```bash
npm run init-laser-blog
```

This will:
- Create Quote and Post models
- Configure structured text fields
- Create 4 seed articles

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your blog.

## Deployment

### Deploy to Vercel

1. Push this repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add `NEXT_PUBLIC_DATOCMS_API_TOKEN` as an environment variable
4. Deploy!

The project is pre-configured for Vercel with:
- ✅ DatoCMS image domain whitelisted
- ✅ TypeScript in devDependencies
- ✅ Production-optimized build settings

## Project Structure

```
├── app/
│   ├── blog/[slug]/    # Blog post pages
│   ├── page.tsx        # Homepage
│   └── layout.tsx      # Root layout
├── lib/
│   └── datocms.ts      # DatoCMS GraphQL client
├── scripts/
│   └── init-laser-blog.mjs  # CMS setup script
└── components/
    └── Navigation.tsx  # Site navigation
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run init-laser-blog` - Initialize DatoCMS schema

## License

MIT

