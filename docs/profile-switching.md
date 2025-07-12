# Profile recommendation and session switching

This document proposes a unified approach for recommending profiles and seamlessly switching an ongoing session to another profile when it fits the conversation.

## Detection points

- **User request detection** – `detect_requested_profile` parses the last user message for phrases like “Mit mondana Éana?” and returns the requested profile name. It is used in `respond.py` before generating the reply.
- **Assistant suggestion detection** – `recommend_profile_switch` inspects the AI response for invite‑like patterns and keyword hints. If another profile is mentioned it returns a profile name.
- **Keyword based hints** – `suggest_profiles` compares the user message to metadata keywords (`prompt_core`, `domain`, `preferred_context`) to rank candidate profiles. This is helpful when no direct mention is made.
- Emotion labels, conversation arc state and strategy history (`detect_strategy`, `estimate_arc_state`) can be considered to further refine the trigger logic.

## Returning a recommendation

`respond.py` aggregates the above signals. The response payload already includes fields `recommendedProfile` and `suggestedProfiles`:
```python
return {
    "content": result["reply"],
    "recommendedProfile": result.get("recommended_profile"),
    "suggestedProfiles": result.get("suggested_profiles"),
}
```
The frontend can check `recommendedProfile` and optionally show a popup explaining why the switch is recommended.

## Switching endpoint

A dedicated endpoint exists for migrating a session:
```python
@router.post("/session/switch-profile")
async def switch_profile(payload: SwitchProfileRequest, user=Depends(role_guard(Role.BASIC))) -> Dict[str, str]:
    new_session_id, conversation_id = migrate_session_to_profile(payload.sessionId, payload.newProfile)
    return {
        "newProfile": payload.newProfile,
        "newSessionId": new_session_id,
        "conversationId": conversation_id,
    }
```
The helper `migrate_session_to_profile` closes the old session, creates a new one under the target profile and re‑assigns all previous `entries`.

## Frontend flow

1. When `recommendedProfile` is returned, display: “Ez a téma talán jobban kapcsolódik `{name}`‑hoz. Átváltasz?” with buttons **Maradok** / **Váltás `{name}`‑ra**.
2. On acceptance call `/api/session/switch-profile` with the current `sessionId` and the new profile name. The response contains the `newSessionId` which replaces the current session in the chat context.
3. All past messages remain visible because they are migrated to the new session.

## Prompt logic after switching

`prompt_builder.build_system_prompt` always fetches the session’s active profile and its metadata. After switching, subsequent calls automatically use the new profile’s `prompt_core`, tone and stylistic settings, so the conversation continues smoothly.

## Optional tuning

- Log user decision (accept or decline) in `system_events` for future analytics.

This approach allows Reflecta to gently guide the user towards the most relevant profile without losing conversation history.