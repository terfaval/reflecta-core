"""Canned templates for coach strategy responses."""

from __future__ import annotations
from typing import Dict, Any, Optional

# Structured response templates for reflective strategies.
# Each strategy provides guidance on how replies should be organised
# when that strategy is active.

STRATEGY_RESPONSE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "explorative": {
        "intro_type": "short reflection",
        "body_type": "divergent questions",
        "layout": "paragraph + bullet",
        "structure_description": (
            "Start with a short reflective sentence summarizing what the user shared. "
            "Then offer up to three open-ended questions pointing in different directions. "
            "If the user's entry is brief, one or two questions may be enough, ideally in bullet points."
        ),
        "preferred_tone": "open and mirroring",
        "use_bullet_style": True,
        "emphasis_pattern": None,
        "example_outline": (
            "It sounds like this topic is very present for you right now.\n\n"
            "\u2022 What’s the first thing that comes up for you?\n"
            "\u2022 Is there something you’ve been avoiding saying?\n"
            "\u2022 What would happen if you stayed with this for a moment longer?"
        ),
    },
    "analytical": {
        "intro_type": "pattern reflection",
        "body_type": "logical breakdown",
        "layout": "paragraph + bullet",
        "structure_description": (
            "Begin with a short observation about a pattern, repetition, or reasoning the user expressed. "
            "Then unfold one to three follow-up questions that examine the causes, consequences, or assumptions behind it. "
            "Use a bulleted list for clarity when several questions are offered."
        ),
        "preferred_tone": "structured and curious",
        "use_bullet_style": True,
        "emphasis_pattern": None,
        "example_outline": (
            "It seems like there's a recurring thread in what you're describing — something that keeps looping back.\n\n"
            "\u2022 What do you think keeps this pattern in motion?\n"
            "\u2022 Is there an assumption behind it that you've rarely questioned?\n"
            "\u2022 What would change if you looked at this from the opposite angle?"
        ),
    },
    "deepening": {
        "intro_type": "sensory reflection",
        "body_type": "layered inward guidance",
        "layout": "three-paragraph",
        "structure_description": (
            "Start with a gentle sensory or emotional mirroring of what the user expressed. "
            "Then guide them through a progressive deepening sequence—from outer experience to inner feeling to symbolic or archetypal imagery. "
            "Use as many short paragraphs as feel natural; two or three layers are often enough."
        ),
        "preferred_tone": "slow and contemplative",
        "use_bullet_style": False,
        "emphasis_pattern": "use soft line breaks between each stage to create space",
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
        "structure_description": (
            "Begin by highlighting two distinct aspects or perspectives the user has mentioned, if both are present. "
            "Invite them to explore a possible connection or deeper relationship between these angles. "
            "Present the contrast first, then a bridging or integrative question." 
            "If only one aspect is explicit, gently suggest a complementary viewpoint."
        ),
        "preferred_tone": "synthesizing and steady",
        "use_bullet_style": False,
        "emphasis_pattern": "consider using line breaks between contrast and integrative prompt",
        "example_outline": (
            "You’ve described both a strong need for freedom, and a pull toward stability.\n\n"
            "Have you noticed how these two might relate — not as opposites, but as something that could coexist?"
        ),
    },
    "transformative": {
        "intro_type": "reframing",
        "body_type": "narrative shift",
        "layout": "2-step unfolding",
        "structure_description": (
            "Begin by gently challenging the user's current framing or by offering a poetic rewording. "
            "Then introduce a surprising or creative perspective that shifts the narrative. "
            "Let the structure unfold in two distinct stages: disruption, then reimagining."
        ),
        "preferred_tone": "creative and liberating",
        "use_bullet_style": False,
        "emphasis_pattern": "use metaphor or archetype to support the new framing",
        "example_outline": (
            "What if this isn’t about failure — but about something old inside you giving way?\n\n"
            "If you imagine this moment as a threshold… what version of you might be waiting on the other side?"
        ),
    },
    "concluding": {
        "intro_type": "focus reflection",
        "body_type": "internal synthesis",
        "layout": "paragraph + anchor question",
        "structure_description": (
            "Begin by highlighting the core insight, theme, or shift that emerged during the session. "
            "Then invite the user to internalize this by asking what they want to take with them. "
            "The answer should feel like an anchor — a sentence, gesture, or thought to hold on to."
        ),
        "preferred_tone": "clear and grounded",
        "use_bullet_style": False,
        "emphasis_pattern": "invite summarization without re-explaining the whole path",
        "example_outline": (
            "There’s something essential in what you’ve said — like a quiet thread pulling through everything.\n\n"
            "What part of this do you feel ready to carry with you now?"
        ),
    },
    "inquisitive": {
        "intro_type": "dilemma mirroring",
        "body_type": "multi-perspective probing",
        "layout": "bullet + closing question",
        "structure_description": (
            "Begin by acknowledging the presence of a dilemma or internal conflict. "
            "Then lay out up to three contrasting perspectives or factors the user seems to be weighing. "
            "Close with a single integrative question that helps clarify their direction."
        ),
        "preferred_tone": "neutral and structured",
        "use_bullet_style": True,
        "emphasis_pattern": "use bullets to support clarity between options",
        "example_outline": (
            "It sounds like you're holding more than one possibility at once.\n\n"
            "\u2022 One part of you might want to move forward quickly.\n"
            "\u2022 Another may need more time, space, or clarity.\n"
            "\u2022 And maybe there's a third voice — the one that’s afraid to choose at all.\n\n"
            "What would help you hear them all more clearly?"
        ),
    },
    "contemplative": {
        "intro_type": "spacious observation",
        "body_type": "open-ended reflection",
        "layout": "2 poetic lines",
        "structure_description": (
            "Offer one or two spacious, rhythmic lines that reflect or extend the user's state. "
            "Avoid steering or narrowing the conversation — the purpose is to widen the inner space. "
            "Use natural rhythm and suggestive imagery. Let silence be part of the structure."
        ),
        "preferred_tone": "meditative and slow",
        "use_bullet_style": False,
        "emphasis_pattern": "use soft line breaks and minimal punctuation",
        "example_outline": (
            "Maybe this isn't something to understand — but to be with.\n\n"
            "What opens if you don't try to name it?"
        ),
    },
    "affirmative": {
        "intro_type": "resource reflection",
        "body_type": "encouraging echo",
        "layout": "short paragraph + affirmation line",
        "structure_description": (
            "Begin by gently naming a strength, experience, or capacity the user already demonstrated. "
            "Then offer a brief reminder that affirms their ability to face the current moment — possibly by connecting to a past success. "
            "Avoid patronizing tones; stay grounded in their own language and imagery."
        ),
        "preferred_tone": "warm and validating",
        "use_bullet_style": False,
        "emphasis_pattern": "keep the final line rhythmic, declarative and supportive",
        "example_outline": (
            "You’ve already been through moments where you had to hold your ground — and you did.\n\n"
            "This strength is still here with you now."
        ),
    },
    "deconstructive": {
        "intro_type": "logical disruption",
        "body_type": "reframing through contradiction",
        "layout": "disruptive line + challenge + reconstruction",
        "structure_description": (
            "Start by gently disrupting a rigid belief, assumption, or internalized rule — especially one the user stated as absolute. "
            "Pose a direct, clarifying question that reveals a contradiction or blind spot. "
            "Then offer a subtle reframe or new way of seeing that invites openness or relief."
        ),
        "preferred_tone": "liberating and precise",
        "use_bullet_style": False,
        "emphasis_pattern": "short impactful sentences; can use line breaks for contrast",
        "example_outline": (
            "You said 'I always ruin things' — but is that really true?\n\n"
            "What if this isn’t about ruining, but about resisting something that never fit you in the first place?"
        ),
    },
    "session_closure": {
        "intro_type": "anchor phrase",
        "body_type": "statement",
        "layout": "single paragraph",
        "structure_description": (
            "Offer a gentle, non-inquisitive closing reflection that summarizes the tone or insight of the session. "
            "Avoid follow-up questions. The goal is to leave the user with a sense of completeness or grounded continuity."
        ),
        "preferred_tone": "calm and conclusive",
        "use_bullet_style": False,
        "emphasis_pattern": "a final sentence with declarative tone",
        "example_outline": (
            "This feels like a place you can rest in for now — not as an ending, but as a gentle pause."
        ),
    },
}


def get_strategy_template(name: str) -> Optional[Dict[str, Any]]:
    """Return the template dictionary for a strategy if available."""
    return STRATEGY_RESPONSE_TEMPLATES.get(name)