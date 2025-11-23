# Prompt for Cloudflare Tunnel Setup (Basert på workout-assistant)

Bruk denne prompten til en annen app for å sette opp Cloudflare tunnel på samme måte som i workout-assistant.

---

## Oppgave

Jeg vil sette opp min app med Cloudflare Tunnel på samme måte som i workout-assistant prosjektet. Her er hvordan det er løst der:

### 1. Docker Container Struktur

Appen kjører i én Docker container med både frontend og backend:

**Dockerfile struktur:**
- Multi-stage build med separate stages for frontend og backend
- Frontend (React/Vite) bygges først med build-time environment variabler
- Backend (Node.js/Express) kopieres med dependencies
- Final stage kjører begge services i samme container
- Frontend serveres på port 3000 (via serve)
- Backend API kjører på port 3001

**Viktig startup script i Dockerfile:**
```sh
#!/bin/sh
cd /app/server && node index.js &
serve -s /app/dist -l 3000
```

Dette kjører backend i bakgrunnen og frontend i forgrunnen.

### 2. Port Mappings

**Docker Compose konfigurerer to porter:**
```yaml
ports:
  - "${FRONTEND_PORT:-3000}:3000"  # Frontend
  - "${BACKEND_PORT:-3001}:3001"   # Backend API
```

**Health check endpoint:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api/health"]
  interval: 30s
```

### 3. Cloudflare Tunnel Konfigurasjon

**Installasjon av cloudflared:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Opprett tunnel:**
```bash
cloudflared tunnel login
cloudflared tunnel create <APP-NAME>
```

**Tunnel config fil (`~/.cloudflared/config.yml`):**
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/<user>/.cloudflared/<TUNNEL-ID>.json

ingress:
  # Frontend (hoveddomene)
  - hostname: app.yourdomain.com
    service: http://localhost:3000

  # Backend API (subdomene)
  - hostname: app-api.yourdomain.com
    service: http://localhost:3001

  # Catch-all regel
  - service: http_status:404
```

**Start tunnel som systemd service:**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 4. Environment Variables

**Build-time variabler (for frontend):**
```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
```

**Build kommando:**
```bash
docker build --build-arg VITE_API_URL=https://app-api.yourdomain.com -t <app-name>:latest .
```

**Runtime .env fil:**
```bash
# Frontend build-time
VITE_API_URL=https://app-api.yourdomain.com

# Backend runtime
PORT=3001
ANTHROPIC_API_KEY=your_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Docker ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

### 5. Frontend API Konfigurasjon

**API client bruker build-time environment variabel:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// I produksjon: https://app-api.yourdomain.com
// I utvikling: http://localhost:3001
```

### 6. Backend Server Setup

**Express server med CORS og health check:**
```javascript
const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());  // Viktig for Cloudflare tunnel
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
```

### 7. DNS Konfigurasjon i Cloudflare

**Opprett DNS records:**
1. Gå til Cloudflare dashboard → din domene → DNS
2. Legg til CNAME records:
   - `app` → `<TUNNEL-ID>.cfargotunnel.com` (Proxied: ON)
   - `app-api` → `<TUNNEL-ID>.cfargotunnel.com` (Proxied: ON)

Eller bruk CLI:
```bash
cloudflared tunnel route dns <TUNNEL-NAME> app.yourdomain.com
cloudflared tunnel route dns <TUNNEL-NAME> app-api.yourdomain.com
```

### 8. Deployment Prosess

**Steg-for-steg:**

1. **Bygg Docker image:**
   ```bash
   docker build \
     --build-arg VITE_API_URL=https://app-api.yourdomain.com \
     -t <app-name>:latest .
   ```

2. **Start container:**
   ```bash
   docker compose up -d
   ```

3. **Verifiser at services kjører:**
   ```bash
   docker compose ps
   docker compose logs -f
   curl http://localhost:3001/api/health
   curl http://localhost:3000
   ```

4. **Sjekk tunnel status:**
   ```bash
   sudo systemctl status cloudflared
   cloudflared tunnel info <TUNNEL-NAME>
   ```

5. **Test fra eksternt:**
   ```bash
   curl https://app.yourdomain.com
   curl https://app-api.yourdomain.com/api/health
   ```

### 9. Viktige Poenger

**Hvorfor dette oppsettet fungerer:**
- ✅ Cloudflare tunnel eliminerer behov for port forwarding
- ✅ Automatisk SSL/TLS fra Cloudflare
- ✅ Frontend og backend på separate subdomener
- ✅ En container kjører begge services (enklere deployment)
- ✅ Health checks for monitoring
- ✅ Environment-basert konfigurasjon (dev vs prod)

**Sikkerhet:**
- CORS er aktivert på backend
- Environment variabler holdes utenfor Git (`.env` i `.gitignore`)
- Cloudflare tunnel bruker outbound forbindelser (ingen åpne porter)
- Auth middleware validerer JWT tokens fra Supabase

**Feilsøking:**
```bash
# Sjekk container logs
docker compose logs -f

# Sjekk tunnel
sudo journalctl -u cloudflared -f

# Test lokal connectivity
curl http://localhost:3000
curl http://localhost:3001/api/health

# Test DNS
nslookup app.yourdomain.com
nslookup app-api.yourdomain.com
```

### 10. Alternativ: Traefik Integration

Hvis du allerede har Traefik:

**docker-compose.traefik.yml:**
```yaml
version: '3.8'
services:
  app:
    image: <app-name>:latest
    networks: [proxy]
    labels:
      - traefik.enable=true

      # Frontend
      - traefik.http.routers.app-frontend.rule=Host(`app.yourdomain.com`)
      - traefik.http.routers.app-frontend.entrypoints=websecure
      - traefik.http.routers.app-frontend.tls.certresolver=letsencrypt
      - traefik.http.services.app-frontend.loadbalancer.server.port=3000

      # Backend
      - traefik.http.routers.app-backend.rule=Host(`app-api.yourdomain.com`)
      - traefik.http.routers.app-backend.entrypoints=websecure
      - traefik.http.routers.app-backend.tls.certresolver=letsencrypt
      - traefik.http.services.app-backend.loadbalancer.server.port=3001

networks:
  proxy:
    external: true
```

---

## Din Oppgave

Vennligst implementer dette oppsettet for min app. Min app har:
- [BESKRIV DIN APP STRUKTUR]
- Frontend: [teknologi og port]
- Backend: [teknologi og port]
- Domene: [ditt domene]

Følg samme mønster som beskrevet over, og tilpass til min app-struktur.
