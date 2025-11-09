# Integration med eksisterende Traefik-oppsett

Siden du allerede har Traefik kjørende, kan du enkelt legge til workout-assistant i din eksisterende `n8n-compose/docker-compose.yml`.

## 🚀 Metode 1: Integrer i eksisterende docker-compose.yml (Anbefalt)

### 1. Kopier workout-assistant koden til serveren

```bash
# På serveren
cd ~
git clone https://github.com/janogre/workout-assistant.git
# Eller last opp filene med scp
```

### 2. Opprett .env for workout-assistant

```bash
cd ~/workout-assistant
nano .env
```

Legg inn:
```bash
# Backend API keys
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# API URL - dette vil være backend-URL via Traefik
VITE_API_URL=https://workout-api.greger.cc
```

### 3. Bygg workout-assistant image

```bash
cd ~/workout-assistant
docker build -t workout-assistant:latest .
```

### 4. Oppdater n8n-compose/docker-compose.yml

Legg til workout-assistant service i din eksisterende `~/n8n-compose/docker-compose.yml`:

```yaml
services:
  traefik:
    # ... eksisterende traefik config ...

  n8n:
    # ... eksisterende n8n config ...

  mcas-app:
    # ... eksisterende mcas config ...

  # LEGG TIL WORKOUT-ASSISTANT HER:
  workout-frontend:
    image: workout-assistant:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - /home/janog/workout-assistant/.env
    labels:
      - traefik.enable=true
      # Frontend routing
      - traefik.http.routers.workout-frontend.rule=Host(`workout.greger.cc`)
      - traefik.http.routers.workout-frontend.entrypoints=web,websecure
      - traefik.http.routers.workout-frontend.tls=true
      - traefik.http.routers.workout-frontend.tls.certresolver=mytlschallenge
      - traefik.http.services.workout-frontend.loadbalancer.server.port=3000
      # Backend API routing (på port 3001 i samme container)
      - traefik.http.routers.workout-backend.rule=Host(`workout-api.greger.cc`)
      - traefik.http.routers.workout-backend.entrypoints=web,websecure
      - traefik.http.routers.workout-backend.tls=true
      - traefik.http.routers.workout-backend.tls.certresolver=mytlschallenge
      - traefik.http.services.workout-backend.loadbalancer.server.port=3001
      - traefik.http.routers.workout-backend.service=workout-backend
    networks: [proxy]

volumes:
  n8n_data:
  traefik_data:
  mcas_data:
  # Ikke nødvendig med volume for workout-assistant hvis du ikke trenger persistent data

networks:
  proxy:
```

### 5. Legg til DNS-records i Cloudflare

I Cloudflare Dashboard for `greger.cc`:

1. Legg til A-record: `workout.greger.cc` → Din server IP
2. Legg til A-record: `workout-api.greger.cc` → Din server IP
3. Sett begge til "Proxied" (orange sky)

### 6. Start tjenesten

```bash
cd ~/n8n-compose
docker-compose up -d
```

### 7. Sjekk at det fungerer

```bash
# Sjekk logger
docker-compose logs -f workout-frontend

# Test API
curl https://workout-api.greger.cc/api/health

# Åpne i browser
# https://workout.greger.cc
```

---

## 🔧 Metode 2: Kjør workout-assistant som egen docker-compose

Hvis du foretrekker å holde det separat:

### 1. Opprett ~/workout-assistant/docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        VITE_API_URL: https://workout-api.greger.cc
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    labels:
      - traefik.enable=true
      - traefik.docker.network=n8n-compose_proxy
      # Frontend
      - traefik.http.routers.workout-frontend.rule=Host(`workout.greger.cc`)
      - traefik.http.routers.workout-frontend.entrypoints=web,websecure
      - traefik.http.routers.workout-frontend.tls=true
      - traefik.http.routers.workout-frontend.tls.certresolver=mytlschallenge
      - traefik.http.services.workout-frontend.loadbalancer.server.port=3000
      # Backend API
      - traefik.http.routers.workout-backend.rule=Host(`workout-api.greger.cc`)
      - traefik.http.routers.workout-backend.entrypoints=web,websecure
      - traefik.http.routers.workout-backend.tls=true
      - traefik.http.routers.workout-backend.tls.certresolver=mytlschallenge
      - traefik.http.services.workout-backend.loadbalancer.server.port=3001
      - traefik.http.routers.workout-backend.service=workout-backend
    networks:
      - n8n-compose_proxy

networks:
  n8n-compose_proxy:
    external: true
```

### 2. Start separat

```bash
cd ~/workout-assistant
docker-compose up -d
```

---

## 📊 Etter deployment

Din oppsatte vil nå være:

- **n8n**: https://n8n.greger.cc (eksisterende)
- **mcas-search**: https://mcas-search.greger.cc (eksisterende)
- **workout**: https://workout.greger.cc (ny!)
- **workout API**: https://workout-api.greger.cc (ny!)

Alle med automatisk SSL via Let's Encrypt gjennom Traefik! 🎉

---

## 🔒 Sikkerhetstips

### Beskytt .env-filen

```bash
chmod 600 ~/workout-assistant/.env
```

### Cloudflare Firewall (valgfritt)

I Cloudflare kan du lage regler for å begrense tilgang:

1. Gå til Security → WAF → Custom rules
2. Opprett regel: "Block hvis ikke fra Norge" (valgfritt)
3. Rate limiting for API-endepunkter

---

## 🆘 Feilsøking

### Problem: Traefik finner ikke containeren

```bash
# Sjekk at containeren er på riktig nettverk
docker network inspect n8n-compose_proxy

# Restart Traefik
cd ~/n8n-compose
docker-compose restart traefik
```

### Problem: SSL-sertifikat feiler

```bash
# Sjekk Traefik logger
docker-compose logs traefik | grep acme

# Sjekk at DNS peker riktig
nslookup workout.greger.cc
```

### Problem: API returnerer 502

```bash
# Sjekk at backend starter
docker-compose logs workout-frontend | grep "API Server"

# Sjekk miljøvariabler
docker-compose exec workout-frontend env | grep ANTHROPIC
```

---

## 🎯 Anbefaling

Jeg anbefaler **Metode 1** (integrer i eksisterende docker-compose.yml) fordi:

- ✅ Alt administreres fra ett sted
- ✅ Enklere å vedlikeholde
- ✅ Deler Traefik-nettverk automatisk
- ✅ En kommando for å starte/stoppe alt

Vil du at jeg skal lage en komplett `docker-compose.yml` for deg med workout-assistant integrert?
