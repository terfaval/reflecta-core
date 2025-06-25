# Reflecta Core

## Projektleírás
A Reflecta egy beágyazható, önreflexiós AI-naplórendszer. A felhasználók különböző profilokon keresztül beszélgethetnek a GPT-alapú asszisztensekkel, így támogatva a mindennapi naplózási gyakorlatot. A rendszer jelenleg Next.js frontendből és Supabase háttérrendszerből áll, de a backend funkcionalitás hamarosan teljesen Python alapú FastAPI-ra költözik.

## Használt technológiák
- **Next.js** és **React**
- **TypeScript**
- **Supabase** (PostgreSQL és Auth)
- **OpenAI API** a GPT-asszisztensekhez
- **FastAPI** (Python) – a jövőben tervezett teljes backend megoldás

## Telepítési lépések
1. Klónozd a repót és lépj be a könyvtárba.
2. Futtasd `npm install` vagy `yarn` a JavaScript függőségekhez.
3. (Opcionális) A Python komponenshez `pip install -r requirements.txt`.
4. Hozd létre a `.env.local` fájlt a szükséges környezeti változókkal.

## Környezeti változók példája
```env
NEXT_PUBLIC_BACKEND_URL=https://reflecta-core.onrender.com
NEXT_PUBLIC_API_HOST=https://reflecta-backend.vercel.app
NEXT_PUBLIC_WP_ORIGIN=https://beenook.hu/reflecta
SUPABASE_URL=https://lqgmzgglyymnbdrqbtjz.supabase.co
```

## Fejlesztés indítása
```bash
npm run dev       # vagy yarn dev
```
A Python backend lokálisan így indítható:
```bash
uvicorn backend.main:app --reload
```

## Fájlszerkezet
- `backend/` – FastAPI alapú szerverkód
- `components/` – újrafelhasználható React komponensek
- `contexts/` – globális React context-ek
- `hooks/` – egyedi React hookok
- `lib/` – API hívások és segédfüggvények
- `pages/` – Next.js oldalak
- `styles/` – CSS és egyéb stílusfájlok

## Fontosabb parancsok
- `npm run dev` / `yarn dev` – fejlesztői szerver indítása
- `npm run build` / `yarn build` – production build
- `npm start` / `yarn start` – az elkészült build futtatása
- `pip install -r requirements.txt` – Python függőségek telepítése

## Specifikációs dokumentáció forrása
A részletes tervek és követelmények a gyökérkönyvtárban található `Reflecta_Spec_*` Word-dokumentumokban olvashatók.

## További fejlesztési tervek
- A Python FastAPI backend teljeskörű bevezetése és mélyebb integrációja
- Dinamikus profilépítés és testreszabható reflexiós ívek
- Bővített jogosultság- és szerepkörkezelés
