# Deployment Guide - AI Treningsassistent

Guide for å deploye applikasjonen med Docker og Cloudflare Tunnel.

## Arkitektur

Applikasjonen består av to komponenter i én Docker-container:
- **Frontend** (React + Vite) - Port 3000
- **Backend API** (Express.js) - Port 3001

Backend fungerer som sikker proxy for Anthropic API-kall, slik at API-nøkkelen ikke eksponeres i frontend.

## Forutsetninger

- Docker og Docker Compose installert
- Cloudflare-konto
- Supabase-prosjekt opprettet
- Anthropic API-nøkkel

## Lokal Utvikling

### 1. Installer avhengigheter

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Konfigurer miljøvariabler

Kopier `.env.example` til `.env` og fyll inn verdiene:

```bash
cp .env.example .env
```

Rediger `.env`:
```env
# Frontend environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001

# Backend environment variables
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

### 3. Start backend og frontend separat

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## Docker Deployment

### 1. Bygg Docker image

```bash
docker-compose build
```

### 2. Start containeren

```bash
docker-compose up -d
```

### 3. Sjekk status

```bash
docker-compose ps
docker-compose logs -f
```

### 4. Test applikasjonen

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/health

### 5. Stopp containeren

```bash
docker-compose down
```

## Cloudflare Tunnel Setup

Cloudflare Tunnel gjør det mulig å eksponere applikasjonen på internett uten å åpne porter i brannmuren.

### 1. Installer cloudflared

**MacOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
Last ned fra: https://github.com/cloudflare/cloudflared/releases

### 2. Autentiser med Cloudflare

```bash
cloudflared tunnel login
```

Dette åpner en nettleser hvor du logger inn og velger domene.

### 3. Opprett en tunnel

```bash
cloudflared tunnel create workout-assistant
```

Dette oppretter en tunnel og genererer en `tunnel-id` og `credentials.json`.

### 4. Konfigurer tunnelen

Opprett `cloudflare-tunnel.yml`:

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /path/to/.cloudflared/<TUNNEL-ID>.json

ingress:
  # Route root domain to frontend
  - hostname: workout.yourdomain.com
    service: http://localhost:3000

  # Route /api to backend
  - hostname: workout.yourdomain.com
    path: /api/*
    service: http://localhost:3001

  # Catch-all rule (required)
  - service: http_status:404
```

### 5. Opprett DNS-oppføring

```bash
cloudflared tunnel route dns workout-assistant workout.yourdomain.com
```

### 6. Start tunnelen

```bash
cloudflared tunnel run workout-assistant
```

Eller som daemon:
```bash
cloudflared service install
```

### 7. Oppdater miljøvariabler for produksjon

Oppdater `.env`:
```env
VITE_API_URL=https://workout.yourdomain.com
```

Bygg på nytt med nye miljøvariabler:
```bash
docker-compose build
docker-compose up -d
```

## Docker Compose + Cloudflare Tunnel (Komplett)

For en komplett løsning, lag en `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - PORT=3001
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - workout-net

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    networks:
      - workout-net
    depends_on:
      - app

networks:
  workout-net:
    driver: bridge
```

Start begge:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Sikkerhetstips

1. **Miljøvariabler**: Aldri commit `.env` til git
2. **API-nøkler**: Kun backend har tilgang til Anthropic API-nøkkel
3. **CORS**: Backend er konfigurert med CORS for å kun tillate kjente domener
4. **HTTPS**: Cloudflare Tunnel gir automatisk SSL/TLS
5. **Supabase RLS**: Sørg for at Row Level Security er aktivert

## Overvåking

### Sjekk container-status
```bash
docker-compose ps
```

### Se logger
```bash
# Alle logger
docker-compose logs -f

# Kun backend
docker-compose logs -f app | grep "API Server"

# Kun frontend
docker-compose logs -f app | grep "serve"
```

### Health check
```bash
curl http://localhost:3001/api/health
```

## Feilsøking

### Container starter ikke
```bash
docker-compose logs
docker-compose down
docker-compose up --build
```

### API-kall feiler
- Sjekk at backend kjører: `curl http://localhost:3001/api/health`
- Verifiser ANTHROPIC_API_KEY i `.env`
- Sjekk logger: `docker-compose logs app`

### Cloudflare Tunnel problemer
```bash
# Test tunnel
cloudflared tunnel info workout-assistant

# Se tunnel-logger
cloudflared tunnel run workout-assistant --loglevel debug
```

## Skalering

For produksjonsmiljø, vurder:
- Separate containere for frontend og backend
- Load balancer (Nginx)
- Redis for session management
- PostgreSQL for database (i stedet for Supabase hvis self-hosted)
- Monitoring med Prometheus/Grafana

## Oppdateringer

```bash
# Pull siste kode
git pull

# Bygg på nytt
docker-compose build

# Restart
docker-compose down
docker-compose up -d
```

## Backup

Viktige filer å ta backup av:
- `.env` (miljøvariabler)
- `cloudflare-tunnel.yml` (tunnel-konfigurasjon)
- `.cloudflared/<TUNNEL-ID>.json` (credentials)
- Supabase database (via Supabase dashboard)

---

## Support

For problemer eller spørsmål, sjekk:
- [Cloudflare Tunnel dokumentasjon](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Docker dokumentasjon](https://docs.docker.com/)
- GitHub Issues
