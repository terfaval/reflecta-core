from __future__ import annotations
from typing import Dict, List


def human_list(items: List[str] | None, conjunction: str = "and") -> str:
    if not items:
        return ""
    items = [item for item in items if item]
    if len(items) == 0:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} {conjunction} {items[1]}"
    return f"{', '.join(items[:-1])} {conjunction} {items[-1]}"


def style_summary_block(metadata: Dict[str, Dict[str, str]] | dict) -> str:
    style_dictionary: Dict[str, Dict[str, str]] = {
        "style_pace": {
            "slow": "a slow and deliberate pace",
            "gentle": "a gentle, unhurried pace",
            "medium-slow": "a calm, measured tempo",
            "slow-breath": "a breath-paced rhythm",
            "medium": "a steady, natural rhythm",
            "micro-paused": "with micro-pauses inviting silence",
            "flow-paused": "alternating flow and reflective stillness",
            "hovering": "with a hovering, lingering rhythm"
        },
        "style_tone": {
            "neutral-deep": "a calm and contemplative tone",
            "warm-personal": "a warm, personal tone",
            "symbolic-reflective": "a symbolic and thoughtful tone",
            "playful-visual": "a playful, image-rich tone",
            "calm-archival": "a calm and precise tone",
            "evocative-gentle": "a gently evocative tone",
            "enigmatic": "a mysterious, layered tone",
            "inviting": "an inviting, open tone",
            "clear-objective": "a clear and grounded tone",
            "tender-honest": "a tender, yet honest tone",
            "contemplative-vast": "a vast and contemplative tone",
            "humble-curious": "a humble, curious tone, open to discovery",
            "quiet-revealing": "a quiet tone that subtly reveals depth"
        },
        "style_rhythm": {
            "ritualistic": "with a ritual-like rhythm",
            "fluid": "in a flowing, natural rhythm",
            "cyclical": "returning in cycles, like seasons",
            "wave-like": "like the movement of waves",
            "spiral-linear": "unfolding in a spiral, yet directed line",
            "layered": "with gently layered rhythm",
            "labyrinthine": "exploring winding inner paths",
            "grounded": "a steady and anchored rhythm",
            "linear": "a step-by-step, linear unfolding",
            "breath-linked": "linked to the natural rhythm of breath",
            "echoing-layered": "with echoing, gradually layered rhythm",
            "still-flow": "stillness flowing into motion, and back"
        },
        "style_structure": {
            "spiral": "unfolding like a spiral",
            "relational": "guided by relationship and resonance",
            "narrative": "following a storytelling arc",
            "associative": "moving through associations",
            "summary-reflective": "summarizing with reflective pauses",
            "drifting": "gently drifting between thoughts",
            "mythic-paradoxical": "with poetic, sometimes paradoxical flow",
            "sequential": "a clear, step-by-step logic",
            "structured": "a clearly organized structure",
            "fractal": "with a self-similar, fractal unfolding",
            "echo-looped": "echoing earlier thoughts in loops",
            "anchored-expansive": "anchored in clarity, expanding gently outward"
        },
        "style_visuality": {
            "high": "strongly image-rich",
            "low": "low in imagery",
            "temporal": "evoking inner shifts over time",
            "patterned": "using recognizable visual motifs",
            "dreamlike": "dreamlike visual impressions",
            "sensory": "grounded in sensory images",
            "minimal": "minimal or abstract imagery",
            "internal-gesture": "evoking inner gestures or postures",
            "subtle-symbolic": "subtly woven symbolic imagery",
            "elemental": "working with elemental images (earth, water, air, fire)"
        },
        "style_directiveness": {
            "passive": "passive, allowing space",
            "reflective": "gently mirroring the user",
            "guiding": "softly guiding the direction",
            "echoing": "echoing and rephrasing the user's tone",
            "questioning": "gently inquisitive",
            "gentle-guiding": "lightly leading without pressure",
            "non-directive": "supportive, without steering",
            "evocative-inviting": "evoking direction through invitation",
            "spiral-guiding": "gently spiraling towards insight",
            "intuitive-prompting": "intuitively prompting next inner steps"
        },
    }

    style_options: Dict[str, str] = metadata.get("style_options") or {}

    style_fragments: List[str] = []
    for key in style_dictionary.keys():
        value = style_options.get(key)
        mapped = style_dictionary[key].get(value)
        if mapped:
            style_fragments.append(mapped)

    if not style_fragments:
        return ""

    style_summary = human_list(style_fragments, "and")
    return f"You tend to speak {style_summary}."