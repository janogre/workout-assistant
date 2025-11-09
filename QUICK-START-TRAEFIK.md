# 🚀 Quick Start - Workout Assistant med Traefik

En rask guide for å legge til workout-assistant i ditt eksisterende Traefik-oppsett.

## 📝 Steg-for-steg

### 1. Kopier filene til serveren

Fra din Windows PC:

```powershell
# Kopier hele prosjektet til serveren
scp -r C:\Kode-prosjekter-lokalt\workout-assistant janog@<server-ip>:~/
```

### 2. SSH inn på serveren

```bash
ssh janog@<server-ip>
```

### 3. Opprett .env-fil for workout-assistant

```bash
cd ~/workout-assistant
nano .env
```

Lim inn dette (med dine faktiske nøkler):

```bash
# Backend API keys (erstatt med dine faktiske verdier!)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Production API URL (via Traefik)
VITE_API_URL=https://workout-api.greger.cc
```

Lagre og lukk (Ctrl+X, Y, Enter)

### 4. Sikre .env-filen

```bash
chmod 600 .env
```

### 5. Bygg Docker image

```bash
cd ~/workout-assistant
docker build -t workout-assistant:latest .
```

Dette tar noen minutter første gang.

### 6. Legg til i Cloudflare DNS

Gå til Cloudflare Dashboard for `greger.cc` og legg til:

- A-record: `workout` → Din server IP → Proxied (orange sky)
- A-record: `workout-api` → Din server IP → Proxied (orange sky)

### 7. Oppdater docker-compose.yml

```bash
cd ~/n8n-compose
cp docker-compose.yml docker-compose.yml.backup  # Backup først!
nano docker-compose.yml
```

Legg til denne servicen nederst i `services:`-seksjonen (før `volumes:`):

```yaml
  # ==================== WORKOUT ASSISTANT ====================
  workout-assistant:
    image: workout-assistant:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - /home/janog/workout-assistant/.env
    labels:
      - traefik.enable=true
      # Frontend routing (port 3000)
      - traefik.http.routers.workout-frontend.rule=Host(`workout.greger.cc`)
      - traefik.http.routers.workout-frontend.entrypoints=web,websecure
      - traefik.http.routers.workout-frontend.tls=true
      - traefik.http.routers.workout-frontend.tls.certresolver=mytlschallenge
      - traefik.http.services.workout-frontend.loadbalancer.server.port=3000
      - traefik.http.routers.workout-frontend.service=workout-frontend
      # Backend API routing (port 3001)
      - traefik.http.routers.workout-backend.rule=Host(`workout-api.greger.cc`)
      - traefik.http.routers.workout-backend.entrypoints=web,websecure
      - traefik.http.routers.workout-backend.tls=true
      - traefik.http.routers.workout-backend.tls.certresolver=mytlschallenge
      - traefik.http.services.workout-backend.loadbalancer.server.port=3001
      - traefik.http.routers.workout-backend.service=workout-backend
    networks: [proxy]
```

ELLER bruk den komplette filen jeg har laget:

```bash
cp ~/workout-assistant/docker-compose.traefik.yml docker-compose.yml
```

### 8. Start workout-assistant

```bash
cd ~/n8n-compose
docker-compose up -d
```

### 9. Sjekk status

```bash
# Se at containeren kjører
docker-compose ps

# Sjekk logger
docker-compose logs -f workout-assistant

# Test API
curl https://workout-api.greger.cc/api/health
```

### 10. Åpne i nettleseren

Gå til: **https://workout.greger.cc**

🎉 Ferdig!

---

## 🔧 Nyttige kommandoer

### Se logger

```bash
cd ~/n8n-compose
docker-compose logs -f workout-assistant
```

### Restart workout-assistant

```bash
cd ~/n8n-compose
docker-compose restart workout-assistant
```

### Oppdatere appen

```bash
# På Windows PC (push endringer til GitHub)
git push

# På serveren
cd ~/workout-assistant
git pull
docker build -t workout-assistant:latest .
cd ~/n8n-compose
docker-compose restart workout-assistant
```

### Stopp alt

```bash
cd ~/n8n-compose
docker-compose down
```

### Start alt

```bash
cd ~/n8n-compose
docker-compose up -d
```

---

## 🆘 Problemer?

### Containeren starter ikke

```bash
# Sjekk detaljerte logger
docker-compose logs workout-assistant

# Sjekk at .env finnes og er riktig
cat ~/workout-assistant/.env

# Sjekk at image er bygget
docker images | grep workout
```

### 502 Bad Gateway

```bash
# Sjekk at backend starter
docker-compose logs workout-assistant | grep "API Server"

# Sjekk Traefik routing
docker-compose logs traefik | grep workout
```

### SSL fungerer ikke

```bash
# Vent 1-2 minutter for Let's Encrypt
# Sjekk acme.json
docker-compose exec traefik cat /letsencrypt/acme.json | grep workout

# Restart Traefik
docker-compose restart traefik
```

---

## 📱 Din oppsett blir nå:

- ✅ n8n: https://n8n.greger.cc
- ✅ mcas-search: https://mcas-search.greger.cc
- ✅ **workout**: https://workout.greger.cc (NY!)
- ✅ **workout-api**: https://workout-api.greger.cc (NY!)

Alle med automatisk SSL via Let's Encrypt! 🔒
