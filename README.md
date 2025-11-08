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
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Routing**: React Router v6
- **Icons**: Lucide React

## Kom i gang 🚀

### Forutsetninger

- Node.js 18+ og npm
- Supabase konto ([supabase.com](https://supabase.com))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Installasjon

1. **Klon repository**
   ```bash
   git clone <repository-url>
   cd workout-assistant
   ```

2. **Installer avhengigheter**
   ```bash
   npm install
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
     - `VITE_ANTHROPIC_API_KEY`: Din Anthropic API key

5. **Start dev server**
   ```bash
   npm run dev
   ```

6. **Åpne appen**
   - Gå til [http://localhost:5173](http://localhost:5173)

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

## Design Principles 🎨

Appen bruker **neomorphism** design-prinsipper:

- Myke, ekstruderte skygger (`.shadow-neo`)
- Innover-skygger for inndata-felt (`.shadow-neo-inset`)
- Lyse pastellfarger (#e0e5ec bakgrunn)
- Subtile gradienter for call-to-action knapper
- Runde hjørner (`.rounded-2xl`, `.rounded-3xl`)

## Sikkerhet 🔒

- Row Level Security (RLS) er aktivert på alle Supabase-tabeller
- Brukere kan kun se og endre sine egne data
- Anthropic API key brukes client-side (for demo - bruk backend proxy i produksjon)

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

**VIKTIG**: For produksjonsmiljø bør du:
1. Flytte Anthropic API-kall til en backend proxy (ikke bruk API key i frontend)
2. Sett opp Supabase RLS policies grundig
3. Aktiver e-post bekreftelse i Supabase Auth
4. Konfigurer custom domene og SSL

## Lisens 📄

MIT

## Support 💬

For spørsmål eller problemer, åpne en issue på GitHub.

---

Laget med ❤️ og Claude AI
