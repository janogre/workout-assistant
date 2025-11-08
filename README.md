# AI Treningsassistent 🏋️‍♂️

En AI-drevet treningsassistent web-app bygget med React, Vite, TailwindCSS, Supabase og Claude AI.

## Funksjoner ✨

- **AI-samtale for programoppretting**: Chat med Claude AI for å lage skreddersydde treningsprogrammer basert på dine mål og utfordringer
- **Programlagring**: Lagre treningsprogrammer i Supabase med øvelser, sett, repetisjoner, hviletid og notater
- **Progress tracking**: Logg dine treningsøkter og følg fremgang over tid
- **Neomorphism design**: Moderne UI med myke skygger og elegante gradienter
- **Autentisering**: Sikker innlogging og registrering med Supabase Auth

## Teknologi Stack 🛠️

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS med custom neomorphism utilities
- **Backend API**: Express.js (proxy for Anthropic API)
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Deployment**: Docker + Cloudflare Tunnel

## Kom i gang 🚀

### Forutsetninger

**For lokal utvikling:**
- Node.js 18+ og npm
- Supabase konto ([supabase.com](https://supabase.com))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

**For produksjon (Docker):**
- Docker og Docker Compose
- Cloudflare-konto (valgfritt, for tunnel)

### Installasjon (Lokal Utvikling)

1. **Klon repository**
   ```bash
   git clone <repository-url>
   cd workout-assistant
   ```

2. **Installer avhengigheter**
   ```bash
   # Frontend
   npm install

   # Backend
   cd server
   npm install
   cd ..
   ```

3. **Sett opp Supabase**
   - Opprett et nytt prosjekt på [supabase.com](https://supabase.com)
   - Gå til SQL Editor og kjør scriptet i `supabase-schema.sql`
   - Dette oppretter alle nødvendige tabeller og RLS policies

4. **Konfigurer miljøvariabler**
   - Kopier `.env.example` til `.env`
   ```bash
   cp .env.example .env
   ```
   - Fyll inn dine credentials i `.env`:
     - `VITE_SUPABASE_URL`: Din Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Din Supabase anon key
     - `VITE_API_URL`: Backend API URL (default: http://localhost:3001)
     - `ANTHROPIC_API_KEY`: Din Anthropic API key (brukes av backend)

5. **Start backend og frontend**

   Terminal 1 (Backend):
   ```bash
   cd server
   npm start
   ```

   Terminal 2 (Frontend):
   ```bash
   npm run dev
   ```

6. **Åpne appen**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Docker Deployment 🐳

For produksjonsmiljø med Docker:

1. **Bygg og start**
   ```bash
   docker-compose up -d
   ```

2. **Åpne appen**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:3001](http://localhost:3001)

3. **Se logger**
   ```bash
   docker-compose logs -f
   ```

4. **Stopp**
   ```bash
   docker-compose down
   ```

**For fullstendig deployment-guide, se [DEPLOYMENT.md](DEPLOYMENT.md)**

## Database Schema 📊

Appen bruker følgende tabeller:

- **workout_programs**: Treningsprogrammer
- **exercises**: Øvelser tilknyttet programmer
- **workout_logs**: Logg over fullførte treningsøkter
- **chat_messages**: AI chat historikk (valgfritt)

Se `supabase-schema.sql` for komplett schema med RLS policies.

## Sider 📱

1. **Login/Signup** (`/login`, `/signup`)
   - Autentisering med e-post og passord

2. **Dashboard** (`/dashboard`)
   - Oversikt over statistikk og programmer
   - Hurtigvalg for å opprette nye programmer eller se eksisterende

3. **Chat** (`/chat`)
   - AI-drevet samtale med Claude for å lage skreddersydde treningsprogrammer
   - Automatisk lagring av genererte programmer

4. **Programmer** (`/programs`)
   - Liste over alle dine treningsprogrammer
   - Slett og administrer programmer

5. **Programvisning** (`/program/:id`)
   - Detaljert visning av et treningsprogram med alle øvelser
   - Logg økter med sett, reps og notater
   - Se historikk og fremgang for hver øvelse

6. **Statistikk** (`/statistics`)
   - Oversikt over alle treningsdager
   - Månedlig breakdown av aktivitet
   - Streak tracking og gjennomsnitt

## Design Principles 🎨

Appen bruker **neomorphism** design-prinsipper:

- Myke, ekstruderte skygger (`.shadow-neo`)
- Innover-skygger for inndata-felt (`.shadow-neo-inset`)
- Lyse pastellfarger (#e0e5ec bakgrunn)
- Subtile gradienter for call-to-action knapper
- Runde hjørner (`.rounded-2xl`, `.rounded-3xl`)

## Sikkerhet 🔒

- **Backend API Proxy**: Anthropic API-nøkkelen er kun tilgjengelig på backend-serveren, ikke i frontend
- **Row Level Security (RLS)**: Aktivert på alle Supabase-tabeller med strenge policies
- **Bruker-isolasjon**: Brukere kan kun se og endre sine egne data
- **CORS**: Backend er konfigurert med CORS for å kontrollere API-tilgang
- **Environment Variables**: Sensitive nøkler lagres i miljøvariabler, ikke i kode
- **HTTPS**: Cloudflare Tunnel gir automatisk SSL/TLS-kryptering

## Utvikling 💻

```bash
# Start dev server
npm run dev

# Type checking
npm run build

# Preview production build
npm run preview
```

## Produksjon ⚡

Applikasjonen er **produksjonsklar** med:
- ✅ Backend API proxy for Anthropic (API-nøkkel er sikret)
- ✅ Docker containerisering for enkel deployment
- ✅ Cloudflare Tunnel support for sikker eksponering
- ✅ Supabase RLS policies implementert

**Deployment-steg:**
1. Konfigurer miljøvariabler (`.env`)
2. Bygg Docker image: `docker-compose build`
3. Start container: `docker-compose up -d`
4. Sett opp Cloudflare Tunnel (se [DEPLOYMENT.md](DEPLOYMENT.md))
5. Aktiver e-post bekreftelse i Supabase Auth

**Se [DEPLOYMENT.md](DEPLOYMENT.md) for fullstendig guide.**

## Lisens 📄

MIT

## Support 💬

For spørsmål eller problemer, åpne en issue på GitHub.

---

Laget med ❤️ og Claude AI
