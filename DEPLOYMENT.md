# Deployment Guide

This guide covers deploying Tides Virtual Concierge to various platforms.

## Table of Contents

- [Vercel (Recommended)](#vercel-recommended)
- [Self-Hosted](#self-hosted)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Vercel (Recommended)

Vercel is the recommended deployment platform for Next.js applications, offering zero-configuration deployment, automatic HTTPS, and global CDN.

### Prerequisites

- GitHub account
- Vercel account (free tier available)
- All environment variables ready

### Deployment Steps

#### 1. Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add GitHub remote
git remote add origin https://github.com/yourusername/tides-virtual-concierge.git
git branch -M main
git push -u origin main
```

#### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js configuration

#### 3. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_VOICE_ID_ES=your_spanish_voice_id
```

**Important:** Add these to all environments (Production, Preview, Development).

#### 4. Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Build the application
- Deploy to edge network
- Provide a production URL

#### 5. Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate generation (~5 minutes)

### Vercel Configuration

The `vercel.json` file configures:

- **Edge Runtime**: All API routes run on edge for <200ms latency
- **CORS Headers**: Allow API access from any origin (adjust for production)
- **Regions**: Default to `iad1` (US East), adjust based on your location

### Updating Deployment

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel automatically redeploys on every push to `main`.

---

## Self-Hosted

Deploy on your own server using Node.js.

### Prerequisites

- Node.js 18+ installed
- PM2 or similar process manager
- Nginx or Caddy for reverse proxy
- SSL certificate (Let's Encrypt recommended)

### Setup

#### 1. Clone and Install

```bash
git clone https://github.com/yourusername/tides-virtual-concierge.git
cd tides-virtual-concierge
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
nano .env.local
```

#### 3. Build

```bash
npm run build
```

#### 4. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "tides-vc" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

#### 5. Configure Nginx

Create `/etc/nginx/sites-available/tides-vc`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/tides-vc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Updating

```bash
cd tides-virtual-concierge
git pull origin main
npm install
npm run build
pm2 restart tides-vc
```

---

## Docker

Containerize the application for consistent deployments.

### Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

### Build and Run

```bash
# Build image
docker build -t tides-vc .

# Run container
docker run -p 3000:3000 --env-file .env.local tides-vc

# Or with Docker Compose
docker-compose up -d
```

### Docker Hub

```bash
# Tag image
docker tag tides-vc yourusername/tides-vc:latest

# Push to Docker Hub
docker push yourusername/tides-vc:latest
```

---

## Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o and Whisper | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |

### Optional Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS | [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys) |
| `ELEVENLABS_VOICE_ID` | English voice ID | [elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library) |
| `ELEVENLABS_VOICE_ID_ES` | Spanish voice ID | Same as above |
| `NEXT_PUBLIC_DEBUG_MODE` | Enable debug panel | Set to `true` for development |

### Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use secrets management** for production (Vercel Secrets, AWS Secrets Manager, etc.)
3. **Rotate API keys regularly**
4. **Use environment-specific keys** (separate keys for dev/staging/prod)
5. **Restrict API key permissions** where possible

---

## Post-Deployment Checklist

### Functional Testing

- [ ] Voice recording works on all target devices
- [ ] Transcription accuracy is acceptable
- [ ] AI responses are relevant and accurate
- [ ] Database queries return correct data
- [ ] Text-to-speech plays without errors
- [ ] Language switching works (EN ↔ ES)
- [ ] Unit number selector updates context
- [ ] Text input fallback functions

### Performance Testing

- [ ] API response time <500ms (check browser network tab)
- [ ] Audio playback is smooth
- [ ] No memory leaks after extended use
- [ ] Mobile performance is acceptable

### Security

- [ ] Environment variables are not exposed in client
- [ ] Database RLS policies are enforced
- [ ] CORS headers are appropriately configured
- [ ] HTTPS is enabled (SSL certificate valid)
- [ ] API keys have appropriate scopes

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up cost alerts for OpenAI and ElevenLabs
- [ ] Enable Vercel Analytics (if using Vercel)

### Documentation

- [ ] Update README with production URL
- [ ] Document any custom configuration
- [ ] Share access credentials with team
- [ ] Create user guide for staff

---

## Troubleshooting

### "Module not found" errors after deployment

**Solution:** Ensure `npm run build` completes without errors locally.

### API routes return 500 errors

**Solution:** Check environment variables are set correctly in deployment platform.

### "CORS policy" errors

**Solution:** Update `vercel.json` or nginx configuration to allow your domain.

### Audio doesn't play

**Solution:** Ensure ElevenLabs API key is valid and has available characters.

### Database connection fails

**Solution:**
1. Verify Supabase URL and key
2. Check database is not paused (Supabase free tier pauses after 7 days inactivity)
3. Verify RLS policies allow operations

---

## Rollback Procedure

### Vercel

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"

### Self-Hosted

```bash
git log --oneline  # Find commit hash
git checkout <commit-hash>
npm install
npm run build
pm2 restart tides-vc
```

### Docker

```bash
docker pull yourusername/tides-vc:<previous-tag>
docker-compose up -d
```

---

## Scaling Considerations

### When to Scale

- Response time >1 second consistently
- Error rate >1%
- OpenAI rate limits hit frequently
- Database query time >100ms

### Vertical Scaling (Vercel)

- Upgrade Vercel plan for better performance
- Enable Vercel Analytics for insights

### Horizontal Scaling (Self-Hosted)

1. Add load balancer (Nginx, HAProxy)
2. Deploy multiple app instances
3. Use Redis for session storage
4. Implement connection pooling for Supabase

---

For additional help, refer to:
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
