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

Az összes frontend API-hívás a `NEXT_PUBLIC_BACKEND_URL` alatti `/api` útvonalra
irányul.

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
  - `__init__.py`
  - `access.py`
  - `app.py`
  - `auth.py`
  - `chatload.py`
  - `check_profile_access.py`
  - `conversation_new.py`
  - `db.py`
  - `description_role_generator.py`
  - `entries.py`
  - `generate_personal_profile.py`
  - `has_history.py`
  - `last_session.py`
  - `main.py`
  - `memory_prompt_utils.py`
  - `memory_summary.py`
    `ping.py`
  - `profile_from_survey.py`
  - `profile_handler.py`
  - `profile_list.py`
  - `prompt_builder.py`
  - `respond.py`
  - `session.py`
  - `session_close.py`
  - `session_create.py`
  - `session_update_label.py`
  - `strategy_detector.py`
  - `strategy_prompt_map.py`
  - `strategy_response_templates.py`
  - `style_summary_block.py`
  - `supabase_client.py`
  - `user.py`
  - `user_create.py`
  - `users.py`
- `components/` – újrafelhasználható React komponensek
  - `ChatFooter.tsx`
  - `ChatMessagesList.tsx`
  - `ProfileCard.tsx`
  - `ProfileIcons.tsx`
  - `ProfileSelectorSidebar.tsx`
  - `ProfileSlider.tsx`
  - `ReflectiveMemoryPanel.tsx`
  - `ResponseTweakButtons.tsx`
  - `ScrollToBottomButton.tsx`
  - `SessionLabelBubble.tsx`
  - `SpiralLoader.tsx`
  - `StartingPromptSelector.tsx`
  - `SurveySlide.tsx`
  - `SurveySuccess.tsx`
  - `ThinkingDots.tsx`
  - `ThreeStateSwitch.tsx`
  - `UserErrorDisplay.tsx`
  - `icons/index.ts`
- `contexts/` – globális React context-ek
  - `ProfileContext.tsx`
  - `UserContext.tsx`
- `hooks/` – egyedi React hookok
  - `useAutoTextareaResize.ts`
  - `useHandleSend.ts`
  - `useScrollHandler.ts`
  - `useUserSession.ts`
- `lib/` – API hívások és segédfüggvények
  - `api.ts`
- `pages/` – Next.js oldalak
  - `_app.tsx`
  - `chat.tsx`
  - `non-authorized.tsx`
  - `profile-builder.tsx`
  - `select-profile.tsx`
  - `api/ping.py`
- `styles/` – CSS és egyéb stílusfájlok
  - `profileStyles.ts`

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
