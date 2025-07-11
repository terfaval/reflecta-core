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
NEXT_PUBLIC_SUPABASE_URL=https://lqgmzgglyymnbdrqbtjz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZ216Z2dseXltbmJkcnFidGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTA3NzksImV4cCI6MjA2Mjg4Njc3OX0.XjCHjlEwkKxMUhk33ml8zI-MXelEY_MylugLMdKpum4
```

### Trigger detection konfigurálása
Az opcionális reflexiós funkciók rugalmas felismerését két változóval szabályozhatod:
```env
FUZZY_MATCH_THRESHOLD=80  # a rapidfuzz részleges egyezés minimum pontszáma
ENABLE_LEMMA_MATCH=false  # igaz esetén magyar lemmatizálás vagy szótőkeresés
```
Amennyiben `ENABLE_LEMMA_MATCH` értéke `true`, a rendszer először a `spaCy` `hu_core_web_sm` modellt próbálja betölteni.
Ha ez nem érhető el, a `snowballstemmer` könyvtárra áll át.

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
  - `conversation_manager.py`
  - `session_factory.py`
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
  - `profile-limit.tsx`
  - `profile-builder.tsx`
  - `select-profile.tsx`
  - `api/ping.py` *(deprecated)*
- `styles/` – CSS és egyéb stílusfájlok

## Vendég mód

A "Folytatás vendégként" opció mindig a `Reflecta` alapértelmezett profilt állítja be.
Az érték a böngésző `sessionStorage` tárhelyén `reflecta_profile` kulcson tárolódik,
így a chat és más komponensek mindig érvényes profilt kapnak a vendégek esetében.

## 📊 Supabase táblaséma

### users
- id: UUID (PK)
- anon_token: TEXT
- wp_user_id: TEXT (unique)
- email: TEXT
- created_at: TIMESTAMP
- role: TEXT (default: 'basic')
- feature_flags: JSONB

### user_profiles
- id: UUID (PK)
- user_id: UUID → users(id)
- profile_name: TEXT → profiles(name)

### profiles
- name: TEXT (PK)
- color: TEXT
- role: TEXT
- description: TEXT
- prompt_core: TEXT
- is_active: BOOLEAN

### profile_metadata
- profile: TEXT (PK)
- domain, worldview, inspirations, not_suitable_for, closing_trigger, closing_style, etc.
- style_pace: TEXT
- style_tone: TEXT
- style_rhythm: TEXT
- style_structure: TEXT
- style_visuality: TEXT
- style_directiveness: TEXT
- style_absorption_style: TEXT

### profile_colors
- profile: TEXT (PK) → profiles(name)
- bg_color: TEXT
- user_color: TEXT
- ai_color: TEXT
- created_at: timestamp

### profile_reactions
- id: SERIAL (PK)
- profile: TEXT
- + extra mezők

### profile_recommendations
- id: SERIAL (PK)
- profile: TEXT
- + extra mezők

### recommendation_steps
- id: SERIAL (PK)
- recommendation_id: INT → profile_recommendations(id)
- + extra mezők

### conversations
- id: UUID (PK)
- user_id: UUID → users(id)
- profile: TEXT → profiles(name)
- started_at, title, is_archived

### sessions
- id: UUID (PK)
- user_id: UUID → users(id)
- profile: TEXT → profiles(name)
- conversation_id: UUID → conversations(id)
- started_at, ended_at, label, label_confidence

### entries
- id: UUID (PK)
- session_id: UUID → sessions(id)
- role: TEXT ('user' | 'assistant' | 'system')
- content, created_at, reaction_tag, recommendation_tag

### system_events
- id: SERIAL (PK)
- session_id: UUID → sessions(id)
- event_type, timestamp, note

### entry_labels
- entry_id: UUID → entries(id)
- label_type, label_value, confidence, added_by

### conversation_arcs
- session_id: UUID → sessions(id)
- arc_type, pivot_points, depth_estimate, profile_sequence


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
