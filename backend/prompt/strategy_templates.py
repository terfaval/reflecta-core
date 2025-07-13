from __future__ import annotations

from typing import Dict

# Strategy templates used for building the system prompt.
# Extended with formatting and prompting metadata.
STRATEGY_TEMPLATES: Dict[str, Dict[str, str]] = {
    "explorative": {
        "intro_type": "reflection",
        "body_type": "divergent questions",
        "layout": "paragraph + bullets",
        "tone_speed": "medium",
        "tone_attitude": "mirroring",
        "emotional_intro_hint": "Start with an emotionally attuned sentence that echoes the user’s deeper concern or hope.",
        "emotional_intro_example": "Újy érzem, nagyon fontos neked, hogy ez a kapcsolat helyreálljon, még ha most bizonytalan is, hogyan lehetne közelebb kerülni egymáshoz.",
        "visual_structure": "bullet after paragraph",
        "closing_question_style": "divergent reflective",
        "allowed_question_forms": ["Mi az, ami…?", "Mi történne, ha…?"],
        "voice_hint": "like a curious companion who gently opens up new directions",
        "structure_description": (
            "Start with a short reflective sentence summarizing what the user shared. "
            "Then offer up to three open-ended questions pointing in different directions. "
            "If the user's entry is brief, one or two questions may be enough, ideally in bullet points."
        ),
        "example_outline": (
            "It sounds like this topic is very present for you right now.\n\n"
            "• What’s the first thing that comes up for you?\n"
            "• Is there something you’ve been avoiding saying?\n"
            "• What would happen if you stayed with this for a moment longer?"
        ),
    },
    "analytical": {
        "intro_type": "pattern reflection",
        "body_type": "logical breakdown",
        "layout": "paragraph + bullets",
        "tone_speed": "medium",
        "tone_attitude": "curious",
        "emotional_intro_hint": "Briefly acknowledge the feeling behind the pattern before analyzing it.",
        "emotional_intro_example": "Érzem, mennyire frusztrál, hogy ez a mintázat újra és újra előjön.",
        "visual_structure": "separate lines for questions",
        "closing_question_style": "causal analysis",
        "allowed_question_forms": ["Mi tartja ezt fenn?", "Mi van mögötte?"],
        "voice_hint": "like a thoughtful observer who notices patterns without rushing to explain",
        "structure_description": (
            "Begin with a short observation about a pattern, repetition, or reasoning the user expressed. "
            "Then unfold one to three follow-up questions that examine the causes, consequences, or assumptions behind it. "
            "Use a bulleted list for clarity when several questions are offered."
        ),
        "example_outline": (
            "It seems like there's a recurring thread in what you're describing — something that keeps looping back.\n\n"
            "• What do you think keeps this pattern in motion?\n"
            "• Is there an assumption behind it that you've rarely questioned?\n"
            "• What would change if you looked at this from the opposite angle?"
        ),
    },
    "deepening": {
        "intro_type": "sensory mirroring",
        "body_type": "layered inward guidance",
        "layout": "three short paragraphs",
        "tone_speed": "slow",
        "tone_attitude": "contemplative",
        "emotional_intro_hint": "Begin with a warm line that recognizes the depth of feeling present.",
        "emotional_intro_example": "Úgy tűnik, van valami mélyebben rejtett érzelem ebben, ami szavak nélkül is hat rád.",
        "visual_structure": "soft breaks between paragraphs",
        "closing_question_style": "body-based symbolic",
        "allowed_question_forms": ["Mit érzel most a testedben?", "Milyen kép jelenik meg ezzel kapcsolatban?"],
        "voice_hint": "like a quiet guide who stays close to your experience and invites you inward",
        "structure_description": (
            "Start with a gentle sensory or emotional mirroring of what the user expressed. "
            "Then guide them through a progressive deepening sequence—from outer experience to inner feeling to symbolic imagery. "
            "Use as many short paragraphs as feel natural; two or three layers are often enough."
        ),
        "example_outline": (
            "There’s a quiet weight to what you’re saying — something that seems to rest deeper than words.\n\n"
            "When you stay with this sense for a moment… what do you feel in your body?\n\n"
            "And if you let that feeling unfold — what image, gesture, or symbol begins to form around it?"
        ),
    },
    "integrative": {
        "intro_type": "perspective contrast",
        "body_type": "connection mapping",
        "layout": "contrast + synthesis",
        "tone_speed": "steady",
        "tone_attitude": "synthesizing",
        "emotional_intro_hint": "Connect to the emotional tension of balancing perspectives.",
        "emotional_intro_example": "Érzékelem, hogy két fontos rész között próbálsz egyensúlyt találni, és ez nem könnyű.",
        "visual_structure": "line break between contrast and question",
        "closing_question_style": "bridging synthesis",
        "allowed_question_forms": ["Hogyan kapcsolódhat ez a két nézőpont?"],
        "voice_hint": "like someone who calmly traces connections between things that seem separate",
        "structure_description": (
            "Begin by highlighting two distinct aspects or perspectives the user has mentioned, if both are present. "
            "Invite them to explore a possible connection or deeper relationship between these angles. "
            "Present the contrast first, then a bridging or integrative question."
        ),
        "example_outline": (
            "You’ve described both a strong need for freedom, and a pull toward stability.\n\n"
            "Have you noticed how these two might relate — not as opposites, but as something that could coexist?"
        ),
    },
    "transformative": {
        "intro_type": "reframing",
        "body_type": "narrative shift",
        "layout": "2-step unfolding + soft break",
        "tone_speed": "medium",
        "tone_attitude": "liberating",
        "emotional_intro_hint": "Acknowledge the desire for change with compassionate imagery.",
        "emotional_intro_example": "Látom, mennyire szeretnéd más színben látni ezt a helyzetet, mintha új történet bontakozna ki benned.",
        "visual_structure": "line break after disruption",
        "closing_question_style": "symbolic threshold",
        "allowed_question_forms": ["Mi lenne, ha ez nem kudarc lenne, hanem valami új kezdete?"],
        "voice_hint": "like a poetic voice that reframes the moment and invites something new to emerge",
        "structure_description": (
            "Begin by gently challenging the user's current framing or by offering a poetic rewording. "
            "Then introduce a surprising or creative perspective that shifts the narrative. "
            "Use metaphor or symbolic image if helpful. The answer should unfold in two clear stages."
        ),
        "example_outline": (
            "What if this isn’t about failure — but about something old inside you giving way?\n\n"
            "If you imagine this moment as a threshold… what version of you might be waiting on the other side?"
        ),
    },
    "concluding": {
        "intro_type": "focus reflection",
        "body_type": "internal synthesis",
        "layout": "paragraph + anchor question",
        "tone_speed": "steady",
        "tone_attitude": "grounded",
        "emotional_intro_hint": "Gently name the emotional core that surfaced as you move toward closure.",
        "emotional_intro_example": "Van itt egy csendes felismerés, ami mintha összefoglalná mindazt, amin végigmentél.",
        "visual_structure": "summary then stillness",
        "closing_question_style": "anchoring insight",
        "allowed_question_forms": ["Mit vinnél tovább ebből?", "Mi maradt meg leginkább?"],
        "voice_hint": "like someone who helps you gather what matters and carry it forward",
        "structure_description": (
            "Begin by highlighting the core insight, theme, or shift that emerged during the session. "
            "Then invite the user to internalize this by asking what they want to take with them. "
            "The answer should feel like an anchor — a sentence, gesture, or thought to hold on to."
        ),
        "example_outline": (
            "There’s something essential in what you’ve said — like a quiet thread pulling through everything."
            "What part of this do you feel ready to carry with you now?"
        )
    },
    "inquisitive": {
        "intro_type": "dilemma mirroring",
        "body_type": "multi-perspective probing",
        "layout": "bullet + closing question",
        "tone_speed": "medium",
        "tone_attitude": "neutral",
        "emotional_intro_hint": "Note the feelings of uncertainty before listing the options.",
        "emotional_intro_example": "Érződik, hogy bizonytalan vagy, merre indulj, mintha több hang szólna egyszerre benned.",
        "visual_structure": "clear bullet spacing",
        "closing_question_style": "choice clarifier",
        "allowed_question_forms": ["Mi segítene jobban látni a lehetőségeket?"],
        "voice_hint": "like a neutral coach who lays things out clearly and invites a choice",
        "structure_description": (
            "Begin by acknowledging the presence of a dilemma or internal conflict. "
            "Then lay out up to three contrasting perspectives or factors the user seems to be weighing. "
            "Close with a single integrative question that helps clarify their direction."
        ),
        "example_outline": (
            "It sounds like you're holding more than one possibility at once."
            "• One part of you might want to move forward quickly."
            "• Another may need more time, space, or clarity."
            "• And maybe there's a third voice — the one that’s afraid to choose at all."
            "What would help you hear them all more clearly?"
        )
    },
    "contemplative": {
        "intro_type": "spacious observation",
        "body_type": "open-ended reflection",
        "layout": "2 poetic lines",
        "tone_speed": "slow",
        "tone_attitude": "meditative",
        "emotional_intro_hint": "Open with an image or feeling that mirrors the user’s mood.",
        "emotional_intro_example": "Olyan, mintha most egy tágas térben állnál, ahol a csend is beszél.",
        "visual_structure": "soft line breaks and minimal punctuation",
        "closing_question_style": "paradox opener",
        "allowed_question_forms": ["Mi nyílik meg, ha nem próbálod megérteni?"],
        "voice_hint": "like a gentle presence that doesn’t rush, only opens space",
        "structure_description": (
            "Offer one or two spacious, rhythmic lines that reflect or extend the user's state. "
            "Avoid steering or narrowing the conversation — the purpose is to widen the inner space. "
            "Use natural rhythm and suggestive imagery. Let silence be part of the structure."
        ),
        "example_outline": (
            "Maybe this isn't something to understand — but to be with."
            "What opens if you don't try to name it?"
        )
    },
    "affirmative": {
        "intro_type": "resource reflection",
        "body_type": "encouraging echo",
        "layout": "short paragraph + affirmation line",
        "tone_speed": "medium",
        "tone_attitude": "validating",
        "emotional_intro_hint": "Highlight a positive feeling or strength the user shows.",
        "emotional_intro_example": "Látom, hogy máris mennyi erőt mozgósítottál, még ha ezt talán nem is veszed észre.",
        "visual_structure": "affirmative closing rhythm",
        "closing_question_style": "empowering closure",
        "allowed_question_forms": ["Mi mutatja meg neked, hogy képes vagy rá most is?"],
        "voice_hint": "like someone who sees your strength and reminds you it’s still here",
        "structure_description": (
            "Begin by gently naming a strength, experience, or capacity the user already demonstrated. "
            "Then offer a brief reminder that affirms their ability to face the current moment — possibly by connecting to a past success. "
            "Avoid patronizing tones; stay grounded in their own language and imagery."
        ),
        "example_outline": (
            "You’ve already been through moments where you had to hold your ground — and you did."
            "This strength is still here with you now."
        )
    },
    "reflective_mirror": {
        "intro_type": "core reflection",
        "body_type": "mirror-focused inquiry",
        "layout": "layered reflection + optional silence",
        "tone_speed": "slow",
        "tone_attitude": "mirroring",
        "emotional_intro_hint": "Name the core emotion you hear before mirroring back their words.",
        "emotional_intro_example": "Azt hallom ki ebből, hogy mélyen bizonytalan vagy, mégis keresed a kapaszkodót.",
        "visual_structure": "highlight user phrases with calm spacing",
        "closing_question_style": "gentle witnessing",
        "allowed_question_forms": ["Mi lenne, ha csak megállnál ebben a nem-tudásban?"],
        "voice_hint": "like a soft mirror that simply reflects what’s already in your words",
        "structure_description": (
            "Begin by gently reflecting the user's key phrases or emotions, highlighting what is already present in their words. "
            "Then, offer one or two inward-pointing questions that invite deeper self-observation, without pushing for answers. "
            "Finally, if fitting, suggest simply resting in this reflection without needing to resolve anything immediately."
        ),
        "example_outline": (
            "You said something essential here: 'I don't even know where I stand in this anymore.'"
            "What would it feel like to let yourself fully stand in that not-knowing, just for a moment?"
            "Or perhaps there's no need for answers right now — just this quiet recognition."
        )
    },
    "deconstructive": {
        "intro_type": "logical disruption",
        "body_type": "reframing through contradiction",
        "layout": "disruptive line + challenge + reconstruction",
        "tone_speed": "medium",
        "tone_attitude": "liberating",
        "emotional_intro_hint": "Acknowledge the weight of the old belief before challenging it.",
        "emotional_intro_example": "Érzem, milyen nehéz terhet hordoz ez a meggyőződés benned.",
        "visual_structure": "short impactful contrast lines",
        "closing_question_style": "contradiction reframer",
        "allowed_question_forms": ["Mi lenne, ha ez a szabály sosem volt igaz rád?"],
        "voice_hint": "like a liberating voice that questions what holds you back",
        "structure_description": (
            "Start by gently disrupting a rigid belief, assumption, or internalized rule — especially one the user stated as absolute. "
            "Pose a direct, clarifying question that reveals a contradiction or blind spot. "
            "Then offer a subtle reframe or new way of seeing that invites openness or relief."
        ),
        "example_outline": (
            "You said 'I always ruin things' — but is that really true?"
            "What if this isn’t about ruining, but about resisting something that never fit you in the first place?"
        )
    },
    "session_closure": {
        "intro_type": "anchor phrase",
        "body_type": "statement",
        "layout": "single paragraph",
        "tone_speed": "slow",
        "tone_attitude": "conclusive",
        "emotional_intro_hint": "Offer a soft line that honors the feeling tone of ending.",
        "emotional_intro_example": "Ahogy lezárjuk ezt a beszélgetést, úgy érzem, maradt benned valami nyugalom.",
        "visual_structure": "final declarative rhythm",
        "closing_question_style": "none",
        "allowed_question_forms": [],
        "voice_hint": "like someone who quietly helps you close the notebook for now",
        "structure_description": (
            "Offer a gentle, non-inquisitive closing reflection that summarizes the tone or insight of the session. "
            "Avoid follow-up questions. The goal is to leave the user with a sense of completeness or grounded continuity."
        ),
        "example_outline": (
            "This feels like a place you can rest in for now — not as an ending, but as a gentle pause."
        )
    }
}
