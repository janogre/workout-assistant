# Deployment Guide - Docker + Cloudflare

Dette er en guide for å deploye AI Workout Assistant til din Docker-server og eksponere den via Cloudflare.

## 📋 Forutsetninger

- Docker og Docker Compose installert på serveren
- Cloudflare-konto med et domene
- API-nøkler (Anthropic og Supabase)

## 🚀 Deployment til Docker-server

### 1. Forbered filene på serveren

På din Docker-server, opprett en mappe for applikasjonen:

```bash
mkdir -p ~/apps/workout-assistant
cd ~/apps/workout-assistant
```

### 2. Kopier filene til serveren

Fra din lokale PC (i PowerShell):

```powershell
# Erstatt <server-ip> med din servers IP-adresse
scp -r C:\Kode-prosjekter-lokalt\workout-assistant\* user@<server-ip>:~/apps/workout-assistant/
```

Eller bruk SFTP, WinSCP, eller git clone hvis du har repoet på GitHub.

### 3. Konfigurer miljøvariabler

På serveren, opprett `.env`-filen:

```bash
cd ~/apps/workout-assistant
nano .env
```

Legg inn følgende (erstatt med dine faktiske verdier):

```bash
# Backend API keys (SENSITIVE - Keep secure!)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Production URL - Dette er URL-en Cloudflare vil eksponere
VITE_API_URL=https://workout-api.yourdomain.com

# Optional: Custom ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

**⚠️ VIKTIG SIKKERHET:**
```bash
# Sikre .env-filen (kun root/eier kan lese)
chmod 600 .env
```

### 4. Bygg og start Docker-container

```bash
# Bygg image
docker-compose build

# Start container i bakgrunnen
docker-compose up -d

# Se logger
docker-compose logs -f

# Sjekk status
docker-compose ps
```

### 5. Test at det fungerer lokalt

```bash
# Test backend
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:3000
```

## 🌐 Cloudflare-oppsett

Du har to alternativer: **Cloudflare Tunnel** (anbefalt) eller **tradisjonell DNS + port forwarding**.

---

## Metode 1: Cloudflare Tunnel (Anbefalt) ⭐

Cloudflare Tunnel er den sikreste og enkleste metoden. Ingen port forwarding nødvendig!

### 1. Installer cloudflared på serveren

```bash
# For Ubuntu/Debian
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# For andre distroer, se: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### 2. Logg inn på Cloudflare

```bash
cloudflared tunnel login
```

Dette åpner en browser. Velg domenet ditt og autoriser.

### 3. Opprett en tunnel

```bash
cloudflared tunnel create workout-assistant
```

Noter ned tunnel-ID-en som vises.

### 4. Konfigurer tunnel

Opprett config-fil:

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Legg inn (erstatt med din tunnel-ID):

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/<user>/.cloudflared/<TUNNEL-ID>.json

ingress:
  # Frontend (hoveddomenet)
  - hostname: workout.yourdomain.com
    service: http://localhost:3000

  # Backend API (subdomene)
  - hostname: workout-api.yourdomain.com
    service: http://localhost:3001

  # Catch-all regel (må være sist)
  - service: http_status:404
```

### 5. Opprett DNS-records i Cloudflare

```bash
# Frontend
cloudflared tunnel route dns workout-assistant workout.yourdomain.com

# Backend API
cloudflared tunnel route dns workout-assistant workout-api.yourdomain.com
```

### 6. Start tunnel som service

```bash
# Installer som systemd service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Sjekk status
sudo systemctl status cloudflared
```

### 7. Oppdater miljøvariabler

Oppdater `.env` på serveren:

```bash
VITE_API_URL=https://workout-api.yourdomain.com
```

Rebuild og restart Docker:

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

---

## Metode 2: Tradisjonell DNS + Port Forwarding

Hvis du foretrekker tradisjonell oppsett:

### 1. Port forwarding på router

Åpne disse portene i routeren din:
- Port `80` → Docker-server IP:3000 (HTTP)
- Port `443` → Docker-server IP:3000 (HTTPS)
- Port `3001` → Docker-server IP:3001 (Backend API)

### 2. Cloudflare DNS

I Cloudflare Dashboard:

1. Gå til DNS-innstillinger
2. Legg til A-records:
   - `workout.yourdomain.com` → Din offentlige IP
   - `workout-api.yourdomain.com` → Din offentlige IP

3. Aktiver Cloudflare Proxy (orange sky)

### 3. SSL/TLS

I Cloudflare:
- Gå til SSL/TLS → Overview
- Sett til **"Flexible"** (Cloudflare ↔ Server = HTTP)

### 4. Oppdater miljøvariabler

```bash
VITE_API_URL=https://workout-api.yourdomain.com
```

---

## 🔒 Ekstra sikkerhetstips

### 1. Bruk Cloudflare Access (valgfritt)

Hvis du vil beskytte appen med ekstra autentisering:

```bash
# I Cloudflare Dashboard:
# Zero Trust → Access → Applications
# Opprett ny applikasjon for workout.yourdomain.com
```

### 2. Begrens API-tilgang

I Cloudflare Firewall:
- Opprett regel som kun tillater trafikk til `/api/*` fra `workout.yourdomain.com`

### 3. Backup og logging

```bash
# Backup .env (kryptert)
tar -czf backup.tar.gz .env
gpg -c backup.tar.gz

# Sett opp logging
docker-compose logs -f > workout-assistant.log 2>&1
```

---

## 📊 Vedlikehold

### Oppdatere applikasjonen

```bash
cd ~/apps/workout-assistant

# Pull nye endringer (hvis du bruker git)
git pull

# Rebuild og restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Sjekk logger

```bash
# Alle logger
docker-compose logs -f

# Kun backend
docker-compose logs -f app | grep "API Server"

# Siste 100 linjer
docker-compose logs --tail=100
```

### Restart services

```bash
# Restart Docker
docker-compose restart

# Restart Cloudflare Tunnel
sudo systemctl restart cloudflared
```

---

## 🆘 Feilsøking

### Problemet: Frontend laster ikke
```bash
# Sjekk at frontend kjører
curl http://localhost:3000

# Sjekk Cloudflare Tunnel status
cloudflared tunnel info workout-assistant
```

### Problemet: API-kall feiler
```bash
# Test API direkte
curl http://localhost:3001/api/health

# Sjekk miljøvariabler
docker-compose exec app env | grep API
```

### Problemet: "Cannot find Anthropic API key"
```bash
# Sjekk at .env lastes
docker-compose config

# Restart med nye env vars
docker-compose down && docker-compose up -d
```

---

## 📱 Tilgang til appen

Når alt er satt opp:

- **Frontend**: https://workout.yourdomain.com
- **Backend API**: https://workout-api.yourdomain.com/api/health

Gratulerer! Din AI Workout Assistant er nå tilgjengelig på internett! 🎉
