# Cloudflare Tunnel Setup - Fokusert Prompt

Bruk denne prompten for å sette opp Cloudflare Tunnel for en eksisterende containerisert app.

---

## Oppgave

Jeg har en containerisert app som kjører og trenger å sette opp Cloudflare Tunnel for ekstern tilgang uten port forwarding. Her er hvordan det er løst i workout-assistant:

### 1. Forutsetninger

**Min app kjører på:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

**Jeg vil eksponere den på:**
- Frontend: `https://app.yourdomain.com`
- Backend: `https://app-api.yourdomain.com`

### 2. Installer Cloudflared

```bash
# Last ned og installer cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Verifiser installasjon
cloudflared --version
```

### 3. Autentiser mot Cloudflare

```bash
# Logger inn med Cloudflare-kontoen din
cloudflared tunnel login
```

Dette åpner en nettleser hvor du logger inn og velger domenet ditt. En cert-fil lagres i `~/.cloudflared/cert.pem`.

### 4. Opprett Tunnel

```bash
# Opprett tunnel med navn
cloudflared tunnel create <APP-NAME>

# Eksempel:
# cloudflared tunnel create workout-assistant
```

Dette oppretter:
- En tunnel ID (UUID)
- En credentials-fil: `~/.cloudflared/<TUNNEL-ID>.json`

**Ta vare på tunnel ID-en!** Den trenger du i neste steg.

### 5. Konfigurer Tunnel

Opprett konfigurasjonsfil: `~/.cloudflared/config.yml`

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/<brukernavn>/.cloudflared/<TUNNEL-ID>.json

ingress:
  # Frontend - hoveddomene
  - hostname: app.yourdomain.com
    service: http://localhost:3000

  # Backend API - subdomene
  - hostname: app-api.yourdomain.com
    service: http://localhost:3001

  # Catch-all (påkrevd)
  - service: http_status:404
```

**Viktig:**
- Erstatt `<TUNNEL-ID>` med din tunnel ID
- Erstatt `<brukernavn>` med ditt brukernavn
- Erstatt `app.yourdomain.com` med dine domener
- `localhost:3000` og `localhost:3001` må matche portene appen din kjører på

### 6. Konfigurer DNS i Cloudflare

**Metode 1: Via CLI (enklest)**
```bash
cloudflared tunnel route dns <TUNNEL-NAME> app.yourdomain.com
cloudflared tunnel route dns <TUNNEL-NAME> app-api.yourdomain.com
```

**Metode 2: Manuelt via Cloudflare Dashboard**
1. Gå til Cloudflare Dashboard
2. Velg ditt domene → DNS → Records
3. Legg til CNAME records:
   - **Name:** `app`
   - **Target:** `<TUNNEL-ID>.cfargotunnel.com`
   - **Proxy status:** Proxied (oransje sky)
4. Gjenta for `app-api`

### 7. Start Tunnel som Service

```bash
# Installer som systemd service
sudo cloudflared service install

# Start servicen
sudo systemctl start cloudflared

# Aktiver autostart ved reboot
sudo systemctl enable cloudflared

# Sjekk status
sudo systemctl status cloudflared
```

### 8. Verifisering

**Sjekk at tunnel kjører:**
```bash
# Service status
sudo systemctl status cloudflared

# Se live logs
sudo journalctl -u cloudflared -f

# Vis tunnel info
cloudflared tunnel info <TUNNEL-NAME>

# List alle tunnels
cloudflared tunnel list
```

**Test tilgang:**
```bash
# Test DNS
nslookup app.yourdomain.com
nslookup app-api.yourdomain.com

# Test HTTPS tilgang
curl https://app.yourdomain.com
curl https://app-api.yourdomain.com/api/health
```

### 9. Frontend Konfigurasjon

**Viktig:** Frontend må vite hvor backend API-et er!

**For Vite/React apps:**

**I `.env` (produksjon):**
```bash
VITE_API_URL=https://app-api.yourdomain.com
```

**I API client (f.eks. `src/lib/api.ts`):**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Alle API-kall bruker denne URL-en
export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    return response.json();
  },
  // ... andre metoder
};
```

**For Next.js apps:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**For Vue apps:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

**Rebuild frontend etter endring:**
```bash
# Hvis Docker:
docker compose down
docker compose build --no-cache
docker compose up -d

# Hvis lokal Node.js:
npm run build
```

### 10. Backend CORS Konfigurasjon

**Express.js backend trenger CORS for å akseptere requests fra Cloudflare:**

```javascript
const cors = require('cors');
const express = require('express');
const app = express();

// Aktiver CORS for alle origins
app.use(cors());

// ELLER: Spesifikk CORS konfigurasjon
app.use(cors({
  origin: [
    'https://app.yourdomain.com',
    'http://localhost:3000'  // For lokal utvikling
  ],
  credentials: true
}));

app.use(express.json());

// Din API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
```

### 11. Feilsøking

**Problem: Tunnel starter ikke**
```bash
# Sjekk logs
sudo journalctl -u cloudflared -f

# Sjekk config syntax
cat ~/.cloudflared/config.yml

# Test tunnel manuelt
cloudflared tunnel run <TUNNEL-NAME>
```

**Problem: DNS virker ikke**
```bash
# Sjekk DNS propagering
nslookup app.yourdomain.com

# Sjekk at CNAME peker til tunnel
dig app.yourdomain.com CNAME
```

**Problem: 502 Bad Gateway**
- Sjekk at containeren kjører: `docker compose ps`
- Sjekk at portene er korrekte i config.yml
- Sjekk at servicene faktisk lytter på localhost: `curl http://localhost:3000`

**Problem: CORS errors i frontend**
- Verifiser at backend har `app.use(cors())` aktivert
- Sjekk at VITE_API_URL er korrekt satt
- Rebuild frontend med riktig API URL

**Problem: 404 på API-kall**
- Sjekk at frontend bruker riktig API URL
- Verifiser at `VITE_API_URL` er satt i build
- Sjekk network tab i browser DevTools

### 12. Vedlikehold

**Restart tunnel:**
```bash
sudo systemctl restart cloudflared
```

**Se live logs:**
```bash
sudo journalctl -u cloudflared -f
```

**Oppdater cloudflared:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
sudo systemctl restart cloudflared
```

**Slett tunnel:**
```bash
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared
cloudflared tunnel delete <TUNNEL-NAME>
```

### 13. Sikkerhet

**Hva Cloudflare Tunnel gir deg:**
- ✅ Ingen åpne porter på routeren (ingen port forwarding)
- ✅ Automatisk SSL/TLS (HTTPS)
- ✅ DDoS beskyttelse fra Cloudflare
- ✅ Outbound-only forbindelse (tunnel initierer fra serveren)
- ✅ Ingen direkt eksponering av server IP

**Beste praksis:**
- Beskytt `~/.cloudflared/` mappen: `chmod 600 ~/.cloudflared/*`
- Bruk Cloudflare Access for ekstra autentisering om nødvendig
- Aktiver Cloudflare Firewall Rules for rate limiting
- Bruk environment variables for secrets, ikke hardkod i kode

---

## Oppsummering

**For å sette opp Cloudflare Tunnel:**

1. ✅ Installer `cloudflared`
2. ✅ Login og opprett tunnel
3. ✅ Konfigurer `~/.cloudflared/config.yml` med dine porter og domener
4. ✅ Sett opp DNS (CNAME records)
5. ✅ Start tunnel som systemd service
6. ✅ Oppdater frontend med produksjon API URL
7. ✅ Aktiver CORS på backend
8. ✅ Test og verifiser

**Resultat:**
- `https://app.yourdomain.com` → localhost:3000 (frontend)
- `https://app-api.yourdomain.com` → localhost:3001 (backend)
- Ingen port forwarding nødvendig
- Automatisk SSL/TLS

---

## Din oppgave

Vennligst sett opp Cloudflare Tunnel for min app:

- **Mine lokale porter:**
  - Frontend: [din port]
  - Backend: [din port]

- **Mine ønskede domener:**
  - Frontend: [ditt domene]
  - Backend: [ditt domene]

Følg stegene over og tilpass til min konfigurasjon.
