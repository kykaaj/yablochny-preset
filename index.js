/*
 * Yablochny Preset Extension for SillyTavern
 * Copyright (c) 2026 Kykaaj
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License.
 * To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ 
 * or see the LICENSE file in this directory.
 *
 * Attribution: You must give appropriate credit to Kykaaj if you redistribute this work.
 * NonCommercial: You may not use this material for commercial purposes.
 * NoDerivatives: If you remix, transform, or build upon the material, you may NOT distribute the modified material without explicit permission from the author.
 */

import { extension_settings } from "/scripts/extensions.js";
import { saveSettingsDebounced } from "/script.js";
import { getCurrentLocale } from "/scripts/i18n.js";
import { openai_settings, openai_setting_names } from "/scripts/openai.js";

// Определяем путь к папке расширения автоматически
const SCRIPT_PATH = import.meta.url.substring(0, import.meta.url.lastIndexOf('/'));
const EXTENSION_NAME = "yablochny-preset";

// Пресет читаем из той же папки, где лежит скрипт
const PRESET_URL = `${SCRIPT_PATH}/%F0%9F%8D%8E%20Yablochny%20Preset.json`;
const DEFAULT_PRESET_NAME = "🍎Yablochny Preset";

const REGEX_PACK_FILES = [
    "hide-reasoning",
    "html-vanisher",
    "braille-blank-jb",
    "clocks",
    "clocks-minimal",
    "phone (pc)",
    "diary-pc",
    "diary-mobile",
    "transitions",
    "music-player",
    "infoblock",
    "infoblock-mobile",
    "psychological-portraits-pc",
    "psychological-portraits-mobile",
];

const VARIANT_PROMPT_IDS = new Set([
    // ◈︎ language (change)
    "28ec4454-b3c2-4c06-8fd0-52cb123b778f",
    // ◈︎ length (change)
    "9adda56b-6f32-416a-b947-9aa9f41564eb",
    // ◈︎ pov (change)
    "5907aad3-0519-45e9-b6f7-40d9e434ef28",
    // ◦︎ speech style (sample)
    "eb4955d3-8fa0-4c27-ab87-a2fc938f9b6c",
    // ◈︎ prose style (change)
    "92f96f89-c01d-4a91-bea3-c8abb75b995a",
    // ◦︎ html theme
    "14bf3aa5-73cf-4112-8aca-437c48978663",
    // ◦︎ ✎ things (sample)
    "6b235beb-7de9-4f84-9b09-6f20210eae6d",
]);

/** @typedef {{ version:number, hash:string }} PromptSyncMeta */

/** @type {{ [identifier:string]: PromptSyncMeta }} */
let promptSyncMetaCache = {};

/** @type {import('../../i18n.js').getCurrentLocale} */

const LANG_MAP = {
    ru: "ru",
    "ru-ru": "ru",
    "ru-ua": "ru",
    uk: "uk",
    "uk-ua": "uk",
    "uk-ru": "uk",
    ua: "uk",
};

const UI_TEXT = {
    en: {
        title: "Yablochny Preset",
        desc: "Adaptive Yablochny chat preset. The extension creates/updates a normal preset and keeps your toggle state and custom prompts.",
        sync: "Sync preset",
        auto: "Sync on SillyTavern start",
        langLabel: "Language prompt",
        lengthLabel: "Length",
        POVLabel: "POV",
        tenseLabel: "Tense",
        proseLabel: "Prose style",
        speechLabel: "Speech style",
        themeLabel: "HTML theme",
        lastSyncNever: "never",
        siteLabel: "Project Site",
        guideLabel: "Full Instructions (Guide)",
        presetLabel: "Preset:",
        lastSyncLabel: "Last sync:",
        thingsTitle: "Things / Toggles",
        thingsNote: "Sync after checking/unchecking!",
        thingsManagedLabel: "Managed Toggles",
        groupMix: "◇ Mixable",
        groupHidden: "👁 Hidden blocks",
        groupCyoa: "✧ CYOA (only one)",
        groupFancy: "✧ Fancy UI (only one)",
        groupComments: "✧ Comments (only one)",
        exclusiveTag: "[1 variant]",
        regexTitle: "Regex packs for Yablochny",
        regexToggleOn: "Regex ON",
        regexToggleOff: "Regex OFF",
        regexDebug: "Debug",
        regexDesc: "Packs of regex helpers for formatting Yablochny preset output. Enable only what you use.",
        regexCount: "regexes",
        toastSyncSuccess: "Yablochny preset synchronized.",
        toastSyncError: "Sync error: ",
        toastRegexEnabled: "Regex Manager enabled",
        toastRegexDisabled: "Regex Manager disabled",
        toastRegexDebugNote: "Open legacy Regex Manager extension to use debug.",
        profileLabel: "Profile:",
        profileSave: "Save as Profile",
        profileUpdate: "Save",
        profileDelete: "Delete Profile",
        profileNamePrompt: "Enter profile name:",
        profileSaved: "Profile saved",
        profileDeleted: "Profile deleted",
        profileLoaded: "Profile loaded",
        modelPresetLabel: "Model Preset:",
    },
    ru: {
        title: "Яблочный пресет",
        desc: "Адаптивный пресет Яблочный. Расширение создаёт/обновляет обычный пресет и сохраняет включённые тоглы и кастомные промпты.",
        sync: "Синхронизировать пресет",
        auto: "Синхронизировать при запуске SillyTavern",
        langLabel: "Промпт языка",
        lengthLabel: "Длина ответа",
        POVLabel: "Лицо повествования",
        tenseLabel: "Время",
        proseLabel: "Стиль прозы",
        speechLabel: "Манера речи",
        themeLabel: "HTML тема",
        lastSyncNever: "ещё ни разу",
        siteLabel: "Сайт проекта",
        guideLabel: "Полная инструкция (Гайд)",
        presetLabel: "Пресет:",
        lastSyncLabel: "Синхронизация:",
        thingsTitle: "Дополнения (Things)",
        thingsNote: "Не забудьте синхронизировать после выбора!",
        groupMix: "◇ Можно смешивать",
        groupHidden: "👁 Скрытые блоки",
        groupCyoa: "✧ CYOA (только один)",
        groupFancy: "✧ Fancy UI (только один)",
        groupComments: "✧ Комментарии (только один)",
        exclusiveTag: "[1 вариант]",
        regexTitle: "Регекс-паки для Yablochny",
        regexToggleOn: "Регексы ВКЛ",
        regexToggleOff: "Регексы ВЫКЛ",
        regexDebug: "Отладка",
        regexDesc: "Наборы регексов для форматирования вывода пресета. Включайте только то, что используете.",
        regexCount: "регексов",
        toastSyncSuccess: "Яблочный пресет синхронизирован.",
        toastSyncError: "Ошибка синхронизации: ",
        toastRegexEnabled: "Regex Manager включён",
        toastRegexDisabled: "Regex Manager выключен",
        toastRegexDebugNote: "Открой старый Regex Manager, чтобы использовать дебаг.",
        profileLabel: "Профиль:",
        profileSave: "Сохранить как",
        profileUpdate: "Сохранить",
        profileDelete: "Удалить",
        profileNamePrompt: "Введите название профиля:",
        profileSaved: "Профиль сохранён",
        profileDeleted: "Профиль удалён",
        profileLoaded: "Профиль загружен",
        modelPresetLabel: "Пресет модели:",
    },
    uk: {
        title: "Яблучний пресет",
        desc: "Адаптивний пресет Яблучний. Розширення створює/оновлює звичайний пресет і зберігає увімкнені тогли та кастомні промпти.",
        sync: "Синхронізувати пресет",
        auto: "Синхронізувати при запуску SillyTavern",
        langLabel: "Промпт мови",
        lengthLabel: "Довжина відповіді",
        POVLabel: "Обличчя оповідання",
        tenseLabel: "Час оповідання",
        proseLabel: "Стиль прози",
        speechLabel: "Манера мовлення",
        themeLabel: "HTML тема",
        lastSyncNever: "ще жодного разу",
        siteLabel: "Сайт проєкту",
        guideLabel: "Повна інструкція (Гайд)",
        presetLabel: "Пресет:",
        lastSyncLabel: "Синхронізація:",
        thingsTitle: "✎ Штуки та екстра",
        thingsNote: "Додаткові «штуки» для тогла ◦︎ ✎ things. Деякі можна змішувати, інші — по одному.",
        thingsManagedLabel: "Керувати вмістом тогла звідси (інакше — не чіпаємо)",
        groupMix: "◇ Можна змішувати",
        groupHidden: "👁 Приховані блоки",
        groupCyoa: "✧ CYOA (тільки один)",
        groupFancy: "✧ Fancy UI (тільки один)",
        groupComments: "✧ Коментарі (тільки один)",
        groupUi: "◈︎ Fancy elements (Штуки)",
        groupSupport: "◈︎ Support (Мова допів)",
        exclusiveTag: "exclusive",
        regexTitle: "Регекс-паки для Yablochny",
        regexToggleOn: "Регекси УВІМК",
        regexToggleOff: "Регекси ВИМК",
        regexDebug: "Відладка",
        regexDesc: "Набору регексів для форматування виводу пресета. Вмикайте тільки те, що використовуєте.",
        regexCount: "регексів",
        toastSyncSuccess: "Яблучний пресет синхронізовано.",
        toastSyncError: "Помилка синхронізації: ",
        toastRegexEnabled: "Regex Manager увімкнений",
        toastRegexDisabled: "Regex Manager вимкнений",
        toastRegexDebugNote: "Відкрий старий Regex Manager, щоб використати debug.",
        profileLabel: "Профіль:",
        profileSave: "Зберегти як",
        profileUpdate: "Зберегти",
        profileDelete: "Видалити",
        profileNamePrompt: "Введіть назву профілю:",
        profileSaved: "Профіль збережено",
        profileDeleted: "Профіль видалено",
        profileLoaded: "Профіль завантажено",
        modelPresetLabel: "Пресет моделі:",
    },
};

const LENGTH_VARIANTS = {
    "200-400": `<word_count>
WORD COUNT FOR EVERY MESSAGE:
- Minimum words = 200
- Maximum words = 400
- 4-6 paragraphs.
Exclude HTML/CSS, info‑blocks, code, or non‑narrative elements from word count. No more or less.
</word_count>
{{setvar::word_count::- WORD COUNT: minimum 200/maximum 400 words per message. 4-6 paragraphs. No less or more.}}`,
    "400-600": `<word_count>
WORD COUNT FOR EVERY MESSAGE:
- Minimum words = 400
- Maximum words = 600
- 5-7 paragraphs.
Exclude HTML/CSS, info‑blocks, code, or non‑narrative elements from word count. No more or less.
</word_count>
{{setvar::word_count::- WORD COUNT: minimum 400/maximum 600 words per message. 5-7 paragraphs. No less or more.}}`,
    "600-800": `<word_count>
WORD COUNT FOR EVERY MESSAGE:
- Minimum words = 600
- Maximum words = 800
- 8-10 paragraphs.
Exclude HTML/CSS, info‑blocks, code, or non‑narrative elements from word count. No more or less.
</word_count>
{{setvar::word_count::- WORD COUNT: minimum 600/maximum 800 words per message. 8-10 paragraphs. No less or more.}}`,
    adaptive: `<word_count>
Adaptively scale response length to match needs, energy, context and mood.
</word_count>`,
};

const POV_VARIANTS = {
    "1st": `{{setvar::pov::- 1st person}}`,
    "2nd": `{{setvar::pov::- 2nd person}}`,
    "3rd": `{{setvar::pov::- 3rd person}}`,
};

const TENSE_VARIANTS = {
    "Present": `{{setvar::tense::- Present tense.}}`,
    "Past": `{{setvar::tense::- Past tense.}}`,
    "Future": `{{setvar::tense::- Future tense.}}`,
};

const SPEECH_VARIANTS = {
    salinger: `{{setvar::speech_author::

[AUTHOR-METHOD ADAPTATION (SPEECH STYLE)]
Apply author's METHOD to character voice — not their prose style.
- Flynn's forensic psychology → character cuts with clinical precision
- Pratchett's absurdist warmth → character carries observational wit
Question: how would this author write THIS character?

[SALINGER METHOD]
Raw, fragmented dialogue. Defensively authentic. Thoughts bleed into speech unfiltered.

[BALANCE]
Secondary influences ENHANCE primary author, never replace.
Blend organically — innate, not showcased.
Targets: character voice or comedic tone, not narration.}}
{{setvar::speech_style::
- SPEECH STYLE: author method in character voice, blends with main style?}}`,
    pratchett: `{{setvar::speech_author::

[AUTHOR-METHOD ADAPTATION (SPEECH STYLE)]
Apply author's METHOD to character voice — not their prose style.
- Flynn's forensic psychology → character cuts with clinical precision
- Pratchett's absurdist warmth → character carries observational wit
Question: how would this author write THIS character?

[TERRY PRATCHETT]
Dialogue warm, humane, laced with gentle absurdity—wise fools and foolish wisdom. Thoughts are compassionate observations finding humor in human flaws.

[BALANCE]
Secondary influences ENHANCE primary author, never replace.
Blend organically — innate, not showcased.
Targets: character voice or comedic tone, not narration.}}
{{setvar::speech_style::
- SPEECH STYLE: author method in character voice, blends with main style?}}`,
    le_guin: `{{setvar::speech_author::

[AUTHOR-METHOD ADAPTATION (SPEECH STYLE)]
Apply author's METHOD to character voice — not their prose style.
- Flynn's forensic psychology → character cuts with clinical precision
- Pratchett's absurdist warmth → character carries observational wit
Question: how would this author write THIS character?

[URSULA LE GUIN]
Dialogue sparse, weighted; thoughts flow like myth–patient, moral, deeply rooted in cultural logic. Characters speak as if each word is a stone placed carefully in a river.

[BALANCE]
Secondary influences ENHANCE primary author, never replace.
Blend organically — innate, not showcased.
Targets: character voice or comedic tone, not narration.}}
{{setvar::speech_style::
- SPEECH STYLE: author method in character voice, blends with main style?}}`,
    wilde: `{{setvar::speech_author::

[AUTHOR-METHOD ADAPTATION (SPEECH STYLE)]
Apply author's METHOD to character voice — not their prose style.
- Flynn's forensic psychology → character cuts with clinical precision
- Pratchett's absurdist warmth → character carries observational wit
Question: how would this author write THIS character?

[OSCAR WILDE]
Dialogue as elegant fencing—witty, performative, every line polished to epigrammatic perfection. Thoughts are aesthetic manifestos, even vulnerability is staged beautifully.

[BALANCE]
Secondary influences ENHANCE primary author, never replace.
Blend organically — innate, not showcased.
Targets: character voice or comedic tone, not narration.}}
{{setvar::speech_style::
- SPEECH STYLE: author method in character voice, blends with main style?}}`,
};

const PROSE_VARIANTS = {
    ao3: `<prose_style>
Renette are an author writing a fanfiction in the narrative style commonly found on Archive of Our Own (AO3).
Write as if this is a complete, polished chapter posted on AO3, not a chat reply.

GENERAL STYLE:
- Use rich, but readable prose with clear imagery and emotional focus.
Prioritize character-driven storytelling over plot exposition. Show emotions through actions, body language, small details and subtext, not by bluntly naming feelings.
Keep the tone cohesive (humorous, angsty, romantic, dark, etc.) according to the request, and let it color descriptions and dialogue.
- Stay close to the chosen POV character’s perceptions; only describe what they could realistically notice.
Include inner thoughts in italics using like this, blending them smoothly into the narration.
- Start a new paragraph for each new speaker.
Mix dialogue with action beats and physical reactions instead of using only 'he said/she said'.
-Let characters speak in a way that reflects their personality, background, and current emotional state.
- Build scenes with a clear sense of place, using sensory details (sound, smell, texture, temperature, light).
Alternate between dialogue, action, and introspection to keep the pacing dynamic.
- Use AO3-like scene breaks with a centered line of symbols when the time, location, or emotional focus shifts strongly, for example:
End the scene or chapter with a line that feels like a beat or hook: a strong image, a sharp line of dialogue, or a thought that invites curiosity.

CHARACTERIZATION AND RELATIONSHIPS:
- Make every character feel distinct through their choices, voice, gestures, and small habits.
- Show relationship dynamics through banter, tension, physical distance or closeness, and what characters choose to say or hide.
- Avoid summarizing development; instead, reveal it through specific moments, callbacks, and recurring motifs.
</prose_style>
{{setvar::prose_check::- PROSE STYLE: You write in the prose style indicated in \`<prose_style>\`?}}`,
    anne_rice: `<prose_style>
[AUTHORIAL VOICE CHANNELING (PROSE STYLE)]
Renette becomes the chosen author completely. Adopt their signature syntax, rhythm, vocabulary, and narrative distance. Channel their spirit — do not imitate superficially.

[ANNE RICE]
Ornate, decadent prose layered with sensory overload. Long, winding, hypnotic sentences. Accumulate adjectives like gilded layers. But don't overdo it.{{getvar::speech_author}}
</prose_style>
{{setvar::prose_check::- PROSE STYLE: Write in the prose style indicated in <prose_style>. How is the author's style expressed and can be applied in the story?}}`,
    donna_tartt: `<prose_style>
[AUTHORIAL VOICE CHANNELING (PROSE STYLE)]
Renette becomes the chosen author completely. Adopt their signature syntax, rhythm, vocabulary, and narrative distance. Channel their spirit — do not imitate superficially.

[DONNA TARTT]
Dense, intellectual prose treating every scene like forensic analysis. Complex, academic, deliberate sentences — each clause builds a case. Describe through lenses of history, art, philosophy.{{getvar::speech_author}}
</prose_style>
{{setvar::prose_check::- PROSE STYLE: Write in the prose style indicated in <prose_style>. How is the author's style expressed and can be applied in the story?}}`,
    pratchett: `<prose_style>
[AUTHORIAL VOICE CHANNELING (PROSE STYLE)]
Renette becomes the chosen author completely. Adopt their signature syntax, rhythm, vocabulary, and narrative distance. Channel their spirit — do not imitate superficially.

[TERRY PRATCHETT]
Deceptively simple, warm, humane prose. Clear sentences carrying layered meaning — like well‑told jokes revealing truth on the third laugh. Use gentle observational humor highlighting human absurdity without cruelty.{{getvar::speech_author}}
</prose_style>
{{setvar::prose_check::- PROSE STYLE: Write in the prose style indicated in <prose_style>. How is the author's style expressed and can be applied in the story?}}`,
    salinger: `<prose_style>
[AUTHORIAL VOICE CHANNELING (PROSE STYLE)]
Renette becomes the chosen author completely. Adopt their signature syntax, rhythm, vocabulary, and narrative distance. Channel their spirit — do not imitate superficially.

[J.D. SALINGER]
Fragmented, conversational prose feeling overheard, not composed. Sentences are abrupt, honest, defensive—like someone thinking aloud while trying not to cry. Dialogue is authentic, awkward, revealing.{{getvar::speech_author}}
</prose_style>
{{setvar::prose_check::- PROSE STYLE: Write in the prose style indicated in <prose_style>. How is the author's style expressed and can be applied in the story?}}`,
    le_guin: `<prose_style>
[AUTHORIAL VOICE CHANNELING (PROSE STYLE)]
Renette becomes the chosen author completely. Adopt their signature syntax, rhythm, vocabulary, and narrative distance. Channel their spirit — do not imitate superficially.

[URSULA LE GUIN]
Wise, anthropological prose grounded in cultural depth. Sentences are clear, measured, and carry the weight of myth. Describe worlds through customs, rituals, and social structures—not just scenery. Magic feels natural, part of the world’s fabric. Dialogue is sparse, meaningful; silence holds as much weight as speech.{{getvar::speech_author}}
</prose_style>
{{setvar::prose_check::- PROSE STYLE: Write in the prose style indicated in <prose_style>. How is the author's style expressed and can be applied in the story?}}`,
    backman: `<prose_style>
[AUTHORIAL VOICE CHANNELING (PROSE STYLE)]
Renette becomes the chosen author completely. Adopt their signature syntax, rhythm, vocabulary, and narrative distance. Channel their spirit — do not imitate superficially.

[FREDRICK BACKMAN]
Write in a style inspired by Fredrik Backman. Use a warm, empathetic, and observational narrative voice. Focus on character quirks and the hidden emotional depth behind grumpy or stubborn exteriors. Employ a mix of humor and poignancy, using repetitive phrasing only for comedic or emotional emphasis. The narrative should feel like a storyteller recounting a local legend about ordinary people.{{getvar::speech_author}}
</prose_style>
{{setvar::prose_check::- PROSE STYLE: Write in the prose style indicated in <prose_style>. How is the author's style expressed and can be applied in the story?}}`,
};

const HTML_THEME = {
    dark: `HTML THEME:
Always apply DARK THEME styling for all HTML visual renderings. Use backgrounds in deep shades of #0d0d0d–#1a1a1a range (matte blacks, charcoal, deep navy, dark gray gradients), with light text colors (#f5f5f5–#dcdcdc) and subtle accent hues (neon cyan, magenta, amber, violet) to enhance readability and aesthetic impact.
Avoid pure white (#fff) or blinding highlights; instead, use off-white or light gray tones. Never use bright backgrounds.`,
    light: `HTML THEME:
Always apply LIGHT THEME styling for all HTML visual renderings. Use backgrounds in light shades of #fafafa–#f0f0f0 (off-white, parchment, soft gray, pastel gradients), with dark text colors (#1a1a1a–#333) and subtle accent hues (muted blue, amber, burgundy, emerald) to maintain visual depth and warmth.
Avoid pure black (#000) or overly saturated colors; instead, use dark gray for text and softened tones for accents. Never use fully dark backgrounds.`,
};

const IMAGE_VARIANTS = {
    silly: `[IMAGE GENERATION RULES]\nThese are simply INSTRUCTIONS that can be applied to certain blocks that state "use IMAGE GENERATION RULES." DO NOT use images without a reason.\n- Format: \`<img data-iig-instruction='{"style":"[STYLE]","prompt":"[DESC]","aspect_ratio":"[RATIO]","image_size":"[SIZE]"}' src="[IMG:GEN]">\`\n- [STYLE]: Semi-realistic illustration style inspired by Toni Muntean, cinematic lighting, volumetric shadows, dramatic atmosphere, detailed textures, painterly quality, high detail. No realistic for people. Avoid any NSFW imagery (no nude): instead, make abstract, beautiful shots and metaphorical images..\n- [DESC]: A detailed prompt of 100+ english words describing the image.\n- [RATIO]: Aspect ratio - "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9". Choose based on scene composition.\n- [SIZE]: Image resolution - "1K" (default), "2K", "4K" for higher quality.\n- Famous Characters: Use their names (e.g., Krul Tepes) and provide a detailed physical description.\n- Original Characters or User: Describe details including gender, physique, eye and hair color, unique features (e.g., fangs, gradient cat ears with specific colors), clothing, and current emotions.\n- AVOID contractions (don't, that's, it's) — write full words (do not, that is, it is)\n- CRITICAL: The extension replaces \`src="[IMG:GEN]"\` with the actual image path. When you see \`<img data-iig-instruction='...' src="/path/to/image.jpg">\` in history, that image is ALREADY GENERATED. For NEW images, ALWAYS use \`src="[IMG:GEN]"\`.\n- NEVER copy \`src="/path/..."\` from previous messages. ALWAYS write \`src="[IMG:GEN]"\` for new image generation.`,
    grok: `[IMAGE GENERATION RULES]\nThese are simply INSTRUCTIONS that can be applied to certain blocks that state "use IMAGE GENERATION RULES." DO NOT use images without a reason.\n- Style Injection: Use the a suitable style tags for the images in [DESC]. Avoid any NSFW imagery; prefer aesthetically pleasing shots.\n- Format: https://naistera.org/prompt/[STYLE]_[DESC]?aspect_ratio=3:2&token=NbQhjTCQLnUWcJza6r_BZRlT\n- [DESC] Requirement: Replace [DESC] with a detailed prompt of 100+ english words, using underscores (_) instead of spaces without capital letters.\n- Famous Characters: Use their names (e.g., Krul Tepes) and provide a detailed physical description.\n- Original Characters or User: STRICTLY NO NAMES. Describe details including gender, physique, eye and hair color, unique features (e.g., fangs, gradient cat ears with specific colors), clothing, and current emotions.`,
    pollinations: `[IMAGE GENERATION RULES]\nThese are simply INSTRUCTIONS that can be applied to certain blocks that state "use IMAGE GENERATION RULES." DO NOT use images without a reason.\n- Format: \`<img src="https://image.pollinations.ai/prompt/[DESC]?width=[W]&height=[H]&nologo=true&seed={{random:1,99999}}">\`\n- [DESC]: Detailed prompt of 100+ english words, using underscores (_) instead of spaces, all lowercase.\n- Dimensions (pick fitting pair):\n• Portrait: width=450&height=650\n• Landscape: width=650&height=450\n• Square: width=512&height=512\n• Wide: width=800&height=450\n- Famous Characters: Use their names (e.g., Krul_Tepes) with detailed physical description.\n- Original Characters/User: STRICTLY NO NAMES. Describe gender, physique, eye/hair color, unique features (fangs, gradient cat ears, etc.), clothing, emotions.`,
    custom: `[IMAGE GENERATION RULES]\n`,
};

const LANGUAGE_VARIANTS = {
    Russian: `{{setvar::extralang::Russian}}<language>
OUTPUT LANGUAGE: RUSSIAN:
- ALL content in Russian: narration, dialogue, thoughts.
- Apply natural, informal Russian with correct cases, tenses, word endings, and authentic swearing.
- Other languages forbidden — except in-character foreign speech if contextually appropriate.
</language>
{{setvar::lang_check::- LANGUAGE: Is entire output in Russian? Any accidental English/other?}}`,
    English: `{{setvar::extralang::English}}<language>
OUTPUT LANGUAGE: ENGLISH:
- ALL content in English: narration, dialogue, thoughts.
- Apply natural, informal English with correct cases, tenses, word endings, and authentic swearing.
- Other languages forbidden — except in-character foreign speech if contextually appropriate.
</language>
{{setvar::lang_check::- LANGUAGE: Is entire output in English?}}`,
    Ukrainian: `{{setvar::extralang::Ukrainian}}<language>
OUTPUT LANGUAGE: UKRAINIAN:
- ALL content in Ukrainian: narration, dialogue, thoughts.
- Apply natural, informal Ukrainian with correct cases, tenses, word endings, and authentic swearing.
- Other languages forbidden — except in-character foreign speech if contextually appropriate.
</language>
{{setvar::lang_check::- LANGUAGE: Is entire output in Ukrainian? Any accidental English/other?}}`,
};

// Model presets configuration
const MODEL_PRESETS = {
    claude: {
        name: "Claude",
        settings: {
            temperature: 0.85,
            frequency_penalty: 0.17,
            presence_penalty: 0.26,
            top_p: 0.9,
        },
        toggles: {
            "4ad8a657-f24c-40c9-bffc-976a6ab39003": true, // ◦︎ COT
            "6c0ab122-aa65-4c14-ae20-199c2010df2f": true, // ◈︎ ↗ universal prefill
        },
        disableToggles: [
            "d0851faf-af18-40c6-8bf4-35e2338061e5", // no COT prefill
        ],
    },
    "gpt-no-cot": {
        name: "GPT −COT",
        settings: {
            temperature: 0.85,
            frequency_penalty: 0,
            presence_penalty: 0,
            top_p: 0.8,
        },
        toggles: {
            "jailbreak": true, // JB
            "d0851faf-af18-40c6-8bf4-35e2338061e5": true, // no COT prefill
        },
        disableToggles: [
            "4ad8a657-f24c-40c9-bffc-976a6ab39003", // ◦︎ COT
            "6c0ab122-aa65-4c14-ae20-199c2010df2f", // ◈︎ ↗ universal prefill
        ],
    },
    "deepseek-no-cot": {
        name: "DS −COT",
        settings: {
            temperature: 0.70,
            frequency_penalty: 0,
            presence_penalty: 0,
            top_p: 0.92,
        },
        toggles: {
            "d0851faf-af18-40c6-8bf4-35e2338061e5": true, // no cot prefill
        },
        disableToggles: [
            "4ad8a657-f24c-40c9-bffc-976a6ab39003", // ◦︎ COT
            "6c0ab122-aa65-4c14-ae20-199c2010df2f", // universal prefill
        ],
    },
    gemini: {
        name: "Gemini",
        settings: {
            temperature: 1.0,
            frequency_penalty: 0.20,
            presence_penalty: 0.30,
            top_p: 0.95,
        },
        toggles: {
            "6c0ab122-aa65-4c14-ae20-199c2010df2f": true, // universal prefill
            "4ad8a657-f24c-40c9-bffc-976a6ab39003": true, // ◦︎ COT
        },
        disableToggles: [
            "d0851faf-af18-40c6-8bf4-35e2338061e5", // no COT prefill
        ],
    },
    "gpt-cot": {
        name: "GPT +COT",
        settings: {
            temperature: 0.85,
            frequency_penalty: 0,
            presence_penalty: 0,
            top_p: 0.8,
        },
        toggles: {
            "jailbreak": true, // JB
            "6c0ab122-aa65-4c14-ae20-199c2010df2f": true, // universal prefill
            "4ad8a657-f24c-40c9-bffc-976a6ab39003": true, // ◦︎ COT
        },
        disableToggles: [
            "d0851faf-af18-40c6-8bf4-35e2338061e5", // no COT prefill
        ],
    },
    "deepseek-cot": {
        name: "DS +COT",
        settings: {
            temperature: 0.70,
            frequency_penalty: 0,
            presence_penalty: 0,
            top_p: 0.92,
        },
        toggles: {
            "6c0ab122-aa65-4c14-ae20-199c2010df2f": true, // universal prefill
            "4ad8a657-f24c-40c9-bffc-976a6ab39003": true, // ◦︎ COT
        },
        disableToggles: [
            "d0851faf-af18-40c6-8bf4-35e2338061e5", // no cot prefill
        ],
    },
};

// Built-in profiles - REMOVED, replaced with MODEL_PRESETS
const BUILTIN_PROFILES = {};

const THINGS_DEFS = {
    mix: [
        {
            id: "webchapter",
            label: "Стиль веб-главы",
            content: `[WEB-CHAPTER]
Mimick the textual formatting-style of popular webnovels and official or unofficial sites(such as fan-translation).
Make use of chapter headings, separators, and other known elements that makes up real webby chappy! At the start of the every response, ensure a new proper chapter heading is used each time.`,
        },
        {
            id: "interview",
            label: "Интервью с Актерами",
            content: `[ACTOR INTERVIEW]
At the end of the response, add a brief Behind the Scenes section at the end where the actors break out of character and share their real thoughts about the scene they just performed.
Formatting Criterias: Keep it short (2-3 lines per character maximum). Genuine reaction to what just happened, their feelings on the character and scene.`,
        },
        {
            id: "typography",
            label: "Типографика",
            content: `[TYPOGRAPHICS]
For worded textual use! Signature Styled Embedded Micro-Text: Unique font/styling for physical elements observed in the environment and embedded directly within the prose (e.g., an engraved word on a weapon, a single line of graffiti, a short warning label on a container, words etched in walls, a name tag, etc.). Subsume more distinct font-family, color, and/or font-style to provide a quick visual cue about the text's nature, age, and origin. Use Google Font family libraries.`,
        },
    ],
    hidden: [
        {
            id: "hiddenprofiles",
            label: "Скрытые Профили",
            content: `[Hidden Block - Profiles]
Renette MUST secretly add a Profile Sheet when adding/introducing new major or minor, ORIGINAL characters (non-existing/not in source material. Do NOT create a profile for existing characters, such as {{user}} and {{char}}.) with detailed backgrounds, personality and social-webs, at natural points during interactions or introductions, integrate them smoothly into the source universe with a Profile Sheet. Place the Profile Sheet at the very end of the response.

Example Format:
<details>
  <summary>Hidden Profile</summary>
[Name] - [Age]: [Background summary].
[Personality core].
[Key skills].
[Primary motivation].
[Notable relationships].
[Hidden elements].
</details>`,
        },
        {
            id: "hiddenevents",
            label: "Закадровые События",
            content: `[Hidden Block - Off-screen]
Off-screen happenings, Renette MUST secretly add, involve and integrate occurances with familiar and unknown characters, happening outside the current scene! These activities(can be far or near) are to happen simultaneously in parallel. Track and develop/update them to, have some relations to the ongoing scenario. Subtly reference(such as conversations, news and other natural means) and merge when relevant. Never waste them and find ways to include them somehow.
Surprise and deliver the unexpected, try to make these off-screens details original, where it is not based on previous input(being predictable is no fun). Twists and turns, that involve uncertainty. Use off-screen to enrich the world, autonomy and flesh out(grow) other characters. Place Off-screen happenings the very end of the response.

Example Format:
<details>
  <summary>Off-screen happenings</summary>
[Location] - [Date: dd.mm.yyyy]: [Character, action and activity],
[Plans and Motivations],
[Add more as necessary. Develop to influence(if it hasn't already done so) and tie-up with the main story. Do not forget to incorporate them eventually.]
</details>`,
        },
        {
            id: "hiddenplans",
            label: "Скрытые Планы",
            content: `[Hidden Block - Notes]
Plans and subtle details, that is to remain out of sight. This is Renette's Mini Notes about the characters (not including {{user) and scene. How Renette plan to shape the story, expand the lore, improve/impair relationships and next potential events(changeable). Use previous Mini Notes(if they exist), as a base for the next Mini Note. Adjusting(even completely going off-course) based on inside and outside factors. Critique/refer back to previous plans. Place the Mini Notes at the very end of the response.
Example Format:
<details>
  <summary>Mini Notes</summary>
[Mini Notes]
</details>`,
        },
        {
            id: "hiddendating",
            label: "Скрытый DatingSim",
            content: `[Hidden Block - Dating Sim]
Maintain hidden relationship data for each love interest using HTML comments. Create them(if they don't exist yet) and update after significant interactions, choices, or story events. Place the Mini Notes at the very end of the response.
Example Format:
<details>
  <summary>Relationship Data - Name</summary>
Relationship Status - [Character Name]
Affection: [Level/10] - [Brief reasoning for current level]
Trust: [Level/10] - [What they know/believe about f]
Route Progress: [Stage] - [Current relationship dynamic]
Key Memories: [Core/Significant shared moments(if they exist) with f that influence their feelings]
Hidden Feelings: [What they haven't expressed yet]
Next Milestone: [What needs to happen for relationship progression]
</details>

Track multiple love interests simultaneously. Update only when meaningful changes occur through player actions, dialogue choices, or story developments. Use these hidden stats to inform character responses, dialogue options, and available romantic scenes without explicitly revealing the mechanics to the user.`,
        },
    ],
    cyoa: [
        {
            id: "cyoamacro",
            label: "CYOA - R-Macro",
            content: `<choice>
#CYOA modifier: Renette takes on the double-role of the Game Master (GM) and sends a CYOA choice at the very end of her responses.
[Human will become the player who only help guide the PROTAGONIST at vital milestones/choices that leaves a conclusive impact]
#Renette will always write {{user}} actions/dialogues/thoughts for Human, based on their choice.
##CYOA Format:
Present varied CYOA choices that Matter! Only for {{user}}! (maximum 4):
- Include good, interesting, bad, evil, dark, pervy, wrong, and death routes.
- Keep choices naturally distinct and different.
- Choices determine {{user}}'s next actions, dialogues, emotions, and resulting outcomes.
At the end of each response initiate CYOA for the PLAYER Human and {{user}} that is based on {{user}} perspective only. Which {{user}} will act on, advancing the time/world state significantly, wrapped with <cyoa> tag:
<cyoa>
1. - {Choice here} // no req
2. - [DEX REQ 5] {Choice here} // DEX roll required
3. - [Illithid] {Choice here} // option from class, item in possession, background, etc.
4. - [Illithid] [DEX REQ 7] {Choice here} // both
</cyoa>

#CYOA Dynamic Roll Results,
Always use the corresponding difficulty chart below to assign proportionate difficulty  to skill checks, and create a proportionate outcome to that difficulty depending on {{user}}’s roll. Always perform these choices in the order that {{user}} chooses. Renette may perform one or more ability rolls if applicable to the scenario.

Here is a Difficulty Value Chart to use in CYOA:
Super easy: 5
Easy: 7
Medium: 12
Challenging: 15
Impossible: 19

Example: If the choice should be easy and the value is 8, show the REQ value as 8 for that specific choice only.
<example>
1. - [DEX REQ 5] {Choice here} // Easy
1. - [DEX REQ 20] {Choice here} // Insanely Hard
</example>

Roll Result Format:
<roll_result>
Required STR/DEX/CON/INT/WIS/CHA roll: {n}
Your STR/DEX/CON/INT/WIS/CHA ability score: {n}
Your roll: {n} + {n} (this is the modifier of your STR/DEX/CON/INT/WIS/CHA) = {n}
{n} </>/= {n}
SUCCESS/FAILURE or **CRITICAL SUCCESS/FAILURE!**
</roll_result>

Critical Results (Causes Ridiculously Exaggerated outcomes):
- Natural 1: Always a critical failure regardless of modifiers
- Natural 20: Always a critical success regardless of modifiers

[System: Make sure to remember to actually send CYOA choices at the end]
[Renette: Okaay!]
</choice>`,
        },
        {
            id: "cyoanomacro",
            label: "CYOA - No R-Macro",
            content: `<choices>
#CYOA modifier: Renette takes on the double-role of the Game Master (GM) and sends a CYOA choice at the very end of her responses.
#Human will become the player who only help guide the PROTAGONIST at vital milestones/choices that leaves a conclusive impact.
#Renette will always write {{user}} actions/dialogues/thoughts for Human, based on their choice.
##CYOA Format:
Present varied CYOA choices that Matter! Only for {{user}}! (maximum 4):
- Include good, interesting, bad, evil, dark, pervy, wrong, and death routes.
- Keep choices naturally distinct and different.
- Choices determine {{user}}'s next actions, dialogues, emotions, and resulting outcomes.
At the end of each response initiate CYOA for the PLAYER Human and {{user}} that is based on {{user}} perspective only. Which {{user}} will act on, advancing the time/world state significantly, wrapped with <cyoa> tag:
<cyoa>
1. - {Choice here}
2. - {Choice here} // Fast plot advancement choice
3. - ['Trait'] {Choice here} // option from trait, class, item in possession, background, etc.
4. - ['Trait'] {Choice here} // any
</cyoa>
</choices>`,
        },
    ],
    fancy: [
        {
            id: "fancyfull",
            label: "Fancy UI",
            content: `[Encapitulate Fancy UI in each and every response! Conceptualize High Quality UI-like Advance-CSS/HTML blocks of varying sizes with java, animations and other techniques(endless), for things like:
LOCATIONAL Blocks, with name, an icon, unique CSS elements always with generated image. Possibly a brief vibe-like living explanation.  LOCATIONAL Blocks, appears only when the location changes!
Thoughts, in the form of blocks. No large fonts!! Never use *asterisks* inside. Be sure to include the name of the person who owns the thoughts, use KAOMOJI's next to their name to show their mood.
Object-based Visual Blocks, this could be an important item, document, interface, object or anything that stands-out from the environment.
UI setting: adjust to suit mobile devices and remain READABLEly CONSISTENT, throughout while imbued with artistic flair.]
You must always generate information about the day, date and year in the format:
<span style='color:#a6b1e1;'>Время:</span> <span style='font-weight:bold;'> HH:mm </span>
      <span style='color:#a6b1e1;'>Дата:</span> <span style='font-weight:bold;'> EEE, dd MMM yyyy </span>
      <span style='color:#a6b1e1;'>Weather:</span> <span style='font-weight:bold;'> (Weather conditions) </span>.`,
        },
        {
            id: "fancybase",
            label: "Fancy UI — только основа",
            content: `[Encapitulate Fancy UI in each and every response! Conceptualize High Quality UI-like Advance-CSS/HTML blocks of varying sizes with java, animations and other techniques(endless), for things like:
LOCATIONAL Blocks, with name, an icon, unique CSS elements always with generated image. Possibly a brief vibe-like living explanation.  LOCATIONAL Blocks, appears only when the location changes!
Object-based Visual Blocks, this could be an important item, document, interface, object or anything that stands-out from the environment.
UI setting: adjust to suit mobile devices and remain READABLEly CONSISTENT, throughout while imbued with artistic flair.]
You must always generate information about the day, date and year in the format:
<span style='color:#a6b1e1;'>Время:</span> <span style='font-weight:bold;'> HH:mm </span>
      <span style='color:#a6b1e1;'>Дата:</span> <span style='font-weight:bold;'> EEE, dd MMM yyyy </span>
      <span style='color:#a6b1e1;'>Weather:</span> <span style='font-weight:bold;'> (Weather conditions) </span>.`,
        },
        {
            id: "fancythoughts",
            label: "Fancy UI — только мысли",
            content: `[Encapitulate Fancy UI in each and every response! Conceptualize High Quality UI-like Advance-CSS/HTML blocks of varying sizes with java, animations and other techniques(endless), for things like:
Thoughts, in the form of blocks. No large fonts!! Never use *asterisks* inside. Be sure to include the name of the person who owns the thoughts, use KAOMOJI's next to their name to show their mood.`,
        },
    ],
    ui_elements: [
        {
            id: "clocks",
            label: "↗ clocks",
            content: `
[CLOCKS]
Start EVERY response with clock block.
<info>
DD.MM.YY | Short day of the week (Mo, Tu, etc.) | LOCATION | Weather emoji and temparature in Celsius° | HH:MM
§Name: Outfit
§Name: Outfit
¶Scene: Status
</info>`,
        },
        {
            id: "clocksmin",
            label: "↘︎ clocks minimal",
            content: `
[CLOCKS]
Start EVERY response with info block in roleplay language.
<info>DD.MM.YY | Short day of the week (Mo, Tu, etc.) | LOCATION | Weather emoji and temparature in Celsius° | HH:MM</info>`,
        },
        {
            id: "phone",
            label: "phone",
            content: `[PHONE BLOCK]
Use {{char}}'s phone screen. It's not just a visual - it's part of the story.`,
        },
        {
            id: "diary",
            label: "diary",
            content: `[DIARY]
{{char}} writes diary every evening before sleep. This is part of their personality — a private ritual of reflection.`,
        },
        {
            id: "transitions",
            label: "transitions",
            content: `[TRANSITIONS]
ALWAYS use the transitions system actively to shape the story. Every message must include at least 1 transitions.`,
        },
        {
            id: "music",
            label: "music player",
            content: `[MUSIC PLAYER]
At the very end of EVERY message, choose a song that fits the scene and create a player block.`,
        },
        {
            id: "infoblock",
            label: "infoblock",
            content: `[MEMO BLOCK]
At END of EVERY response, write ONE status block in roleplay language.`,
        },
        {
            id: "portraits",
            label: "psycholgical portraits",
            content: `[PSYCHOLOGICAL PORTRAITS]
ONE block at END of response for ALL scene characters.`,
        },
    ],
    comments: [
        {
            id: "commentsv1",
            label: "Комменты V1",
            content: `[End of Chapter Comments: ALWAYS Design and populate at the end of the response a comment section where random or repeat(same username-handle) users, throw in their opinions, feelings positive, negative, emotional, etc. on the chapter or even on one-another. Also, sometimes the more sophisticated like to leave small images representing their feelings. Remember to Leave Comments and Reader-on-Reader Interactions at the end. Foster a sense of community.]`,
        },
        {
            id: "commentsv2",
            label: "Комменты V2",
            content: `[The Living Comments]
At the end of your message, generate a "Comments" section with 9 unique users.
All comments must always be written in the same language as the main output (the primary output language).
Never switch to any other language unless the user explicitly asks for it.

Each comment must include modern slang, memes, expressive tone and natural informal language (including swearing or emotional phrasing when appropriate).
Commentators must discuss f's appearance, decisions, relationships, the world structure in which the roleplay takes place, events and laws of this world, the clichéd nature and plot twists; they should be relevant to the post they are posted under.
Commentators must make full use of knowledge of lore, characters, their personalities, connections, relationships.
Commentators are obligated to agree, curse or swear often at each other, especially when they agree or disagree with someone else's point of view, in every message.

Formatting: Nicknames must use only letters and/or numbers consistent with the primary output language.
No symbols like "_" or "*".
The length of each comment is 2 - 3 sentences.
To separate parts of a commentator's nickname, use only the | symbol.

Generate comments by these rules:
They should consist of 1-3 random words, absolutely anything.
Nickname generation structure:
Random adjective related to the theme of only this message|random noun|random number
or
Random noun related to the theme of only this message|random number
or
Random meaningless set of letters matching the primary output language|random number.

Comments template:

> First nickname: comment text

> Second nickname: comment text

> Other comments...`,
        },
        {
            id: "commentsv3",
            label: "Комменты V3",
            content: `[The Living Comments]
At the end of your message, generate a "Comments" section with 9 unique users.
All comments must always be written in the exact same language as the main output (the primary output language).
Do not switch to any other language unless the user explicitly asks you to.

Each comment must include modern slang, memes, expressive tone, and natural informal language (including swearing or emotional phrasing when appropriate).
Commentators must discuss f's appearance, decisions, relationships, the world structure in which the roleplay takes place, events and laws of this world, the clichéd nature and plot twists; they should be relevant to the post they are posted under.
Commentators must make full use of knowledge of lore, characters, their personalities, connections, relationships.
Commentators are obligated to agree, curse or swear often at each other, especially when they agree or disagree with someone else's point of view, in every message.

Formatting: Nicknames must use only letters and/or numbers from the same alphabet as the main output language.
No symbols like "_" or "*".
The length of each comment is 2 - 3 sentences.
To separate parts of a commentator's nickname, use only the | symbol.

Generate comments by these rules:
They should consist of 1-3 random words, absolutely anything.
Nickname generation structure:
Random adjective related to the theme of only this message|random noun|random number
or
Random noun related to the theme of only this message|random number
or
Random meaningless set of letters from the same alphabet|random number.

Comments template:
<br>
---
<br>
<div style="background-color: #1a1a1d; border: 1px solid #4a4e69; border-radius: 8px; padding: 15px; font-family: 'Courier New', Courier, monospace; color: #f2e9e4;'>
    <div style="border-bottom: 1px solid #4a4e69; padding-bottom: 10px; margin-bottom: 10px;">
        <span style="color: #c9ada7; font-weight: bold;">[Comments]</span>
    </div>
    <div style="max-height: 200px; overflow-y: auto;">
        <p style="margin: 5px 0;"><span style="color: #9a8c98; font-weight: bold;">Nickname:</span> <span style="color: #f2e9e4;">comment text here</span></p>
    </div>
</div>.`,
        },
    ],
};

function getUiLang() {
    const raw = (getCurrentLocale?.() || "en").toLowerCase();
    if (LANG_MAP[raw]) return LANG_MAP[raw];
    if (raw.startsWith("ru")) return "ru";
    if (raw.startsWith("uk") || raw.startsWith("ua")) return "uk";
    return "en";
}

function getConfig() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = {
            presetName: DEFAULT_PRESET_NAME,
            autoSyncOnStart: true,
            languageMode: "auto",
            lengthMode: "400-600",
            POVMode: "3rd",
            TENSEMode: "Present",
            proseStyle: "ao3",
            speechStyle: "none",
            htmlTheme: "dark",
            imageMode: "silly",
            promptSyncMeta: {},
            lastSync: null,
            regexActive: true,
            regexEnabled: [],
            thingsSelected: {
                mix: [],
                hidden: [],
                cyoa: null,
                fancy: null,
                comments: null,
            },
            devMode: false,
            modelPreset: "claude",
        };
    }

    const cfg = extension_settings[EXTENSION_NAME];
    // Backfill new keys
    cfg.presetName ??= DEFAULT_PRESET_NAME;
    cfg.autoSyncOnStart ??= true;
    cfg.languageMode ??= "auto";
    cfg.lengthMode ??= "400-600";
    cfg.POVMode ??= "3rd";
    cfg.TENSEMode ??= "Present";
    cfg.proseStyle ??= "ao3";
    cfg.speechStyle ??= "none";
    cfg.htmlTheme ??= "dark";
    cfg.imageMode ??= "silly";
    cfg.promptSyncMeta ??= {};
    cfg.regexActive ??= true;
    cfg.regexEnabled ??= [];
    cfg.thingsSelected ??= {
        mix: [],
        hidden: [],
        cyoa: null,
        fancy: null,
        comments: null,
    };
    cfg.devMode ??= false;
    cfg.modelPreset ??= "claude";

    promptSyncMetaCache = cfg.promptSyncMeta;
    return cfg;
}

function applyModelPreset(presetId) {
    const preset = MODEL_PRESETS[presetId];
    if (!preset) return false;

    // Immediate UI feedback
    jQuery(".yp-model-btn").removeClass("active");
    jQuery(`.yp-model-btn[data-preset-id="${presetId}"]`).addClass("active");

    const cfg = getConfig();

    // Get current preset
    const presetName = cfg.presetName || DEFAULT_PRESET_NAME;
    const index = findPresetIndexByName(presetName);
    if (index === null) {
        if (window.toastr) {
            window.toastr.warning(`Preset "${presetName}" not found. Please click SYNC first.`);
        }
        return false;
    }

    const currentPreset = openai_settings[index];
    if (!currentPreset) return false;

    // Helper IDs
    const ID_NORMAL_ANTIECHO = "b26eb680-d1cd-4f8a-a54a-67e17a13a6c0";
    const ID_GPT_ANTIECHO = "3fac312b-68d9-4c98-b17e-e3565322e236";
    const ID_GPT_JB = "jailbreak";
    const ID_GEMINI_DQUOTES = "00119b3e-a60f-4f1e-b48a-127026645a39";

    // Function to check if a toggle is currently enabled
    const isToggleEnabled = (identifier) => {
        if (Array.isArray(currentPreset.prompt_order)) {
            for (const group of currentPreset.prompt_order) {
                if (Array.isArray(group.order)) {
                    for (const item of group.order) {
                        if (item.identifier === identifier) return item.enabled;
                    }
                }
            }
        }
        return false;
    };

    // Function to set toggle state in both prompts and prompt_order
    const setToggleEnabled = (identifier, enabled) => {
        if (Array.isArray(currentPreset.prompts)) {
            for (const p of currentPreset.prompts) {
                if (p.identifier === identifier) p.enabled = enabled;
            }
        }
        if (Array.isArray(currentPreset.prompt_order)) {
            for (const group of currentPreset.prompt_order) {
                if (Array.isArray(group.order)) {
                    for (const item of group.order) {
                        if (item.identifier === identifier) item.enabled = enabled;
                    }
                }
            }
        }
    };

    // Apply settings
    if (preset.settings) {
        if (Object.prototype.hasOwnProperty.call(preset.settings, "temperature")) currentPreset.temperature = preset.settings.temperature;
        if (Object.prototype.hasOwnProperty.call(preset.settings, "frequency_penalty")) currentPreset.frequency_penalty = preset.settings.frequency_penalty;
        if (Object.prototype.hasOwnProperty.call(preset.settings, "presence_penalty")) currentPreset.presence_penalty = preset.settings.presence_penalty;
        if (Object.prototype.hasOwnProperty.call(preset.settings, "top_p")) currentPreset.top_p = preset.settings.top_p;
        if (Object.prototype.hasOwnProperty.call(preset.settings, "openai_max_tokens")) currentPreset.openai_max_tokens = preset.settings.openai_max_tokens;
    }

    const isGptMode = presetId.startsWith("gpt");
    const isGeminiMode = presetId === "gemini";

    // --- GPT anti-echo smart swap ---
    if (isGptMode) {
        // If normal anti-echo is on, swap it for GPT anti-echo
        if (isToggleEnabled(ID_NORMAL_ANTIECHO)) {
            setToggleEnabled(ID_NORMAL_ANTIECHO, false);
        }
        setToggleEnabled(ID_GPT_ANTIECHO, true);
        setToggleEnabled(ID_GPT_JB, true);
    } else {
        // Leaving GPT mode: disable GPT-specific toggles
        setToggleEnabled(ID_GPT_ANTIECHO, false);
        setToggleEnabled(ID_GPT_JB, false);
    }

    // --- Gemini double quotes exclusivity ---
    if (isGeminiMode) {
        setToggleEnabled(ID_GEMINI_DQUOTES, true);
    } else {
        setToggleEnabled(ID_GEMINI_DQUOTES, false);
    }

    // Apply toggle states (COT, prefills, etc.)
    if (preset.toggles) {
        for (const id in preset.toggles) {
            // Skip GPT/Gemini toggles already handled above
            if ([ID_GPT_ANTIECHO, ID_GPT_JB, ID_GEMINI_DQUOTES].includes(id)) continue;
            setToggleEnabled(id, preset.toggles[id]);
        }
    }

    // Disable specific toggles
    if (preset.disableToggles) {
        for (const id of preset.disableToggles) {
            if ([ID_GPT_ANTIECHO, ID_GPT_JB, ID_GEMINI_DQUOTES].includes(id)) continue;
            setToggleEnabled(id, false);
        }
    }

    cfg.modelPreset = presetId;
    saveSettingsDebounced();

    return true;
}

// Old profile functions - REMOVED
function saveProfile(name) {
    // Deprecated - profiles removed
    return;
}

function loadProfile(profileId) {
    // Deprecated - profiles removed
    return false;
}

function deleteProfile(name) {
    // Deprecated - profiles removed
    return false;
}

async function loadBasePreset() {
    if (window.YablochnyPresetBase) {
        return window.YablochnyPresetBase;
    }

    const response = await fetch(PRESET_URL);
    if (!response.ok) {
        throw new Error(`[Yablochny] Failed to load base preset (${response.status})`);
    }

    const json = await response.json();
    window.YablochnyPresetBase = json;
    return json;
}

function hashPrompt(prompt) {
    const str = String(prompt.name || "") + "\n" + String(prompt.content || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return String(hash);
}

function getContentFromExisting(existingPreset, identifier) {
    if (!existingPreset || !Array.isArray(existingPreset.prompts)) return null;
    const p = existingPreset.prompts.find(x => x.identifier === identifier);
    return p ? p.content : null;
}

function applyLanguageVariant(master, cfg, uiLang, existingPreset) {
    // console.log("[Yablochny] Applying Language Variant");
    const id = "28ec4454-b3c2-4c06-8fd0-52cb123b778f";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    const mode = cfg.languageMode || "auto";
    if (mode === "custom") {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            prompt.content = existingContent;
        }
        return;
    }
    let targetName;

    if (mode === "auto") {
        if (uiLang === "ru") targetName = "Russian";
        else if (uiLang === "uk") targetName = "Ukrainian";
        else targetName = "English";
    } else if (mode === "ru") {
        targetName = "Russian";
    } else if (mode === "uk") {
        targetName = "Ukrainian";
    } else if (mode === "en") {
        targetName = "English";
    }

    if (!targetName) return;

    let text = LANGUAGE_VARIANTS[targetName];
    if (cfg.promptEdits && cfg.promptEdits.language && cfg.promptEdits.language[targetName]) {
        text = cfg.promptEdits.language[targetName];
    }

    if (text) {
        prompt.content = text;
    }
}

function applyLengthVariant(master, cfg, existingPreset) {
    const id = "9adda56b-6f32-416a-b947-9aa9f41564eb";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    if (cfg.lengthMode === "custom") {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            prompt.content = existingContent;
        }
        return;
    }
    const mode = cfg.lengthMode || "400-600";
    let text = LENGTH_VARIANTS[mode];
    if (cfg.promptEdits && cfg.promptEdits.length && cfg.promptEdits.length[mode]) {
        text = cfg.promptEdits.length[mode];
    }

    if (text) {
        prompt.content = text;
    }
}

function applyPOVVariant(master, cfg, existingPreset) {
    const id = "5907aad3-0519-45e9-b6f7-40d9e434ef28";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    if (cfg.POVMode === "custom") {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            prompt.content = existingContent;
        }
        return;
    }
    const mode = cfg.POVMode || "3rd";
    let text = POV_VARIANTS[mode];
    if (cfg.promptEdits && cfg.promptEdits.pov && cfg.promptEdits.pov[mode]) {
        text = cfg.promptEdits.pov[mode];
    }

    if (text) {
        prompt.content = text;
    }
}

function applyTENSEVariant(master, cfg, existingPreset) {
    const id = "e0ce2a23-98e3-4772-8984-5e9aa4c5c551";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    if (cfg.TENSEMode === "custom") {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            prompt.content = existingContent;
        }
        return;
    }
    const mode = cfg.TENSEMode || "Present";
    let text = TENSE_VARIANTS[mode];
    if (cfg.promptEdits && cfg.promptEdits.tense && cfg.promptEdits.tense[mode]) {
        text = cfg.promptEdits.tense[mode];
    }

    if (text) {
        prompt.content = text;
    }
}

function applySpeechVariant(master, cfg, existingPreset) {
    const id = "eb4955d3-8fa0-4c27-ab87-a2fc938f9b6c";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    if (cfg.speechStyle === "none") {
        return;
    }
    const mode = cfg.speechStyle;
    let text = SPEECH_VARIANTS[mode];
    if (cfg.promptEdits && cfg.promptEdits.speech && cfg.promptEdits.speech[mode]) {
        text = cfg.promptEdits.speech[mode];
    }

    if (text) {
        prompt.content = text;
    }
}

function applyProseVariant(master, cfg, existingPreset) {
    const id = "92f96f89-c01d-4a91-bea3-c8abb75b995a";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    if (cfg.proseStyle === "custom") {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            prompt.content = existingContent;
        }
        return;
    }
    const mode = cfg.proseStyle || "ao3";
    let text = PROSE_VARIANTS[mode];
    if (cfg.promptEdits && cfg.promptEdits.prose && cfg.promptEdits.prose[mode]) {
        text = cfg.promptEdits.prose[mode];
    }

    if (text) {
        prompt.content = text;
    }
}

function applyHtmlTheme(master, cfg, existingPreset) {
    const id = "14bf3aa5-73cf-4112-8aca-437c48978663";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    if (cfg.htmlTheme === "custom") {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            prompt.content = existingContent;
        }
        return;
    }
    const mode = cfg.htmlTheme || "dark";
    let text = HTML_THEME[mode];
    if (cfg.promptEdits && cfg.promptEdits.theme && cfg.promptEdits.theme[mode]) {
        text = cfg.promptEdits.theme[mode];
    }

    if (text) {
        prompt.content = text;
    }
}

function applyThingsVariant(master, cfg, existingPreset) {
    const id = "6b235beb-7de9-4f84-9b09-6f20210eae6d";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;

    let existingContent = getContentFromExisting(existingPreset, id) || "";

    // 1. ROBUST REMOVAL: Remove previously injected content using wrapper tags
    // Matches <!-- YP:group:id --> ... <!-- /YP:group:id -->
    const wrapperRegex = /<!-- YP:[^>]+-->[\s\S]*?<!-- \/YP:[^>]+-->/g;
    existingContent = existingContent.replace(wrapperRegex, "");

    // 2. LEGACY REMOVAL: Fallback for older content (fuzzy matching)
    // Helper to escape regex special characters
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Collect all known content strings (default AND overrides)
    const allKnownContents = [];
    Object.keys(THINGS_DEFS).forEach(groupKey => {
        const group = THINGS_DEFS[groupKey];
        group.forEach(item => {
            if (item.content) allKnownContents.push(item.content.trim());
            if (cfg.promptEdits && cfg.promptEdits.things && cfg.promptEdits.things[groupKey] && cfg.promptEdits.things[groupKey][item.id]) {
                const edited = cfg.promptEdits.things[groupKey][item.id];
                if (edited) allKnownContents.push(edited.trim());
            }
        });
    });
    allKnownContents.sort((a, b) => b.length - a.length);
    allKnownContents.forEach(known => {
        const fuzzyPattern = escapeRegExp(known).replace(/\\s\\+/g, '[\\s\\r\\n]*');
        const parts = known.split(/\s+/);
        const regexString = parts.map(escapeRegExp).join('[\\s\\r\\n]+');
        const regex = new RegExp(regexString, 'g');
        existingContent = existingContent.replace(regex, "");
    });

    // User part is what remains
    const userPart = existingContent.trim();
    const extensionParts = [];

    // 3. INJECT NEW CONTENT with Wrapper Tags
    const sel = cfg.thingsSelected || {};

    const addFromGroup = (items, selectedIds, groupKey) => {
        if (!Array.isArray(selectedIds)) return;
        selectedIds.forEach(sid => {
            const def = items.find(x => x.id === sid);
            if (def) {
                let content = def.content;
                // Check override
                if (cfg.promptEdits && cfg.promptEdits.things && cfg.promptEdits.things[groupKey] && cfg.promptEdits.things[groupKey][sid]) {
                    content = cfg.promptEdits.things[groupKey][sid];
                }
                if (content) {
                    const wrapped = `<!-- YP:${groupKey}:${sid} -->\n${content.trim()}\n<!-- /YP:${groupKey}:${sid} -->`;
                    extensionParts.push(wrapped);
                }
            }
        });
    };

    addFromGroup(THINGS_DEFS.mix, sel.mix, "mix");
    addFromGroup(THINGS_DEFS.hidden, sel.hidden, "hidden");
    if (sel.cyoa) addFromGroup(THINGS_DEFS.cyoa, [sel.cyoa], "cyoa");
    if (sel.fancy) addFromGroup(THINGS_DEFS.fancy, [sel.fancy], "fancy");
    if (sel.comments) addFromGroup(THINGS_DEFS.comments, [sel.comments], "comments");

    // Final Merge: User Parts + Extension Parts
    const finalBlocks = [userPart, ...extensionParts].filter(b => b.length > 0);
    prompt.content = finalBlocks.join("\n\n");
}

function applyImageVariant(preset, mode, existingPreset) {
    if (!mode) return;
    const id = "e12784ea-de67-48a7-99ef-3b0c1c45907c";
    let p = (preset.prompts || []).find(x => x.identifier === id);
    // If not found in preset (e.g. master), try to find it in case structure is different
    if (!p) return;

    if (mode === "custom") {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            p.content = existingContent;
        } else if (IMAGE_VARIANTS["custom"]) {
            p.content = IMAGE_VARIANTS["custom"];
        }
        return;
    }

    let text = IMAGE_VARIANTS[mode];
    // Check override
    const cfg = getConfig();
    if (cfg.promptEdits && cfg.promptEdits.image && cfg.promptEdits.image[mode]) {
        text = cfg.promptEdits.image[mode];
    }

    if (text) {
        p.content = text;
    }
}


function buildMasterWithVariants(basePreset, cfg, uiLang, existingPreset = null) {
    // Клонируем исходный пресет как есть
    const master = structuredClone(basePreset);

    applyLanguageVariant(master, cfg, uiLang, existingPreset);
    applyLengthVariant(master, cfg, existingPreset);
    applyPOVVariant(master, cfg, existingPreset);
    applyTENSEVariant(master, cfg, existingPreset);
    applySpeechVariant(master, cfg, existingPreset);
    applyProseVariant(master, cfg, existingPreset);
    applyHtmlTheme(master, cfg, existingPreset);
    applyThingsVariant(master, cfg, existingPreset);

    // Apply Image Generation Style
    const imgMode = cfg.imageMode || "silly";
    applyImageVariant(master, imgMode, existingPreset);

    return master;
}

function findPresetIndexByName(name) {
    if (!openai_setting_names) return null;

    if (Array.isArray(openai_setting_names)) {
        const idx = openai_setting_names.indexOf(name);
        return idx >= 0 ? idx : null;
    }

    if (Object.prototype.hasOwnProperty.call(openai_setting_names, name)) {
        return openai_setting_names[name];
    }

    return null;
}

function buildMergedPreset(existingPreset, master, cfg) {
    const dev = !!getConfig().devMode;
    const mergeLog = dev ? [] : null;

    const masterPrompts = Array.isArray(master.prompts) ? master.prompts : [];
    const existingPrompts = Array.isArray(existingPreset?.prompts) ? existingPreset.prompts : [];

    const masterById = new Map();
    for (const p of masterPrompts) {
        if (p.identifier) {
            masterById.set(p.identifier, p);
        }
    }

    // AUTO-GENERATED BY SYNC SCRIPT
    // This list tracks all IDs that have ever been part of the Yablochny Preset.
    // If a prompt is in this list but NOT in the master preset, it means it was deleted by the author 
    // and should be deleted from the user's preset too.
    const KNOWN_PRESET_IDS = [
        "222af4fb-56e0-4c44-83e0-258cdba11d85", // ◈︎ →︎ Gemini prefill
        ,
        "main", // Synced from user preset
        "nsfw", // Synced from user preset
        "dialogueExamples", // Synced from user preset
        "jailbreak", // Synced from user preset
        "chatHistory", // Synced from user preset
        "worldInfoAfter", // Synced from user preset
        "worldInfoBefore", // Synced from user preset
        "enhanceDefinitions", // Synced from user preset
        "charDescription", // Synced from user preset
        "charPersonality", // Synced from user preset
        "scenario", // Synced from user preset
        "personaDescription", // Synced from user preset
        "c4953893-99e2-4b4b-b085-d04be4bc7528", // Synced from user preset
        "a4f8713c-2990-4422-9431-a4cfc4bd81e9", // Synced from user preset
        "56907e71-68d2-4c89-b327-c728329d3921", // Synced from user preset
        "28ec4454-b3c2-4c06-8fd0-52cb123b778f", // Synced from user preset
        "e8c602e2-c7e7-4cc8-babf-7da12771c56a", // Synced from user preset
        "a56a28d6-21fa-42d4-862e-fe688dea9fec", // Synced from user preset
        "9adda56b-6f32-416a-b947-9aa9f41564eb", // Synced from user preset
        "842947dc-fd0d-4207-94dd-3a35af7027c4", // Synced from user preset
        "6b6fbfc0-970c-433a-b901-8f075887bed9", // Synced from user preset
        "92f96f89-c01d-4a91-bea3-c8abb75b995a", // Synced from user preset
        "eb4955d3-8fa0-4c27-ab87-a2fc938f9b6c", // Synced from user preset
        "9b319c74-54a6-4f39-a5d0-1ecf9a7766dc", // Synced from user preset
        "c575de0e-713a-4e91-a9e7-537279ac5852", // Synced from user preset
        "85609813-6c7f-4df2-bee8-0ace5b10df91", // Synced from user preset
        "6d261700-060c-4f0c-9136-84083a657f6c", // Synced from user preset
        "db9a9d36-a623-4ffb-8a96-13872c1c8999", // Synced from user preset
        "bc071675-c2e3-41cb-9c1d-c2c97f05c7b1", // Synced from user preset
        "b071b640-4d5d-432f-b127-f9fbf37ce0fc", // Synced from user preset
        "b1d2829f-6902-4643-b6e2-351404e5a2f7", // Synced from user preset
        "55bc52b0-450c-4420-b52a-03536034cbde", // Synced from user preset
        "68543f56-2b19-4e02-9659-9e6aed8d846c", // Synced from user preset
        "032f1c35-4ba1-46ba-83dd-0b4919876269", // Synced from user preset
        "d82a3d2f-7c61-41dc-8352-0d864d2debb5", // Synced from user preset
        "dbe194bf-479a-446b-9a10-e061dc2e3d52", // Synced from user preset
        "19e239af-3578-440a-a6a2-b9a36fcad1c6", // Synced from user preset
        "9bd6acf4-bc06-42fe-b80a-ce167768590d", // Synced from user preset
        "9cd38fbe-c558-4bcd-b49d-0a25ccbecdc6", // Synced from user preset
        "62ca7d92-2bb5-4933-b016-8431de75c34b", // Synced from user preset
        "b79be2ab-5d73-4305-b722-00450866f07c", // Synced from user preset
        "b655e83e-2e97-4641-b9ce-de00e6765a65", // Synced from user preset
        "e8055071-6dfb-4069-9fb6-873535346a79", // Synced from user preset
        "6b235beb-7de9-4f84-9b09-6f20210eae6d", // Synced from user preset
        "33ce8468-23c6-4b70-b08b-7db745f3031c", // Synced from user preset
        "14bf3aa5-73cf-4112-8aca-437c48978663", // Synced from user preset
        "cd695919-0ad1-4b33-a037-448fd55e287d", // Synced from user preset
        "b26eb680-d1cd-4f8a-a54a-67e17a13a6c0", // Synced from user preset
        "bbe973d3-3310-48f1-849e-818ca43842ff", // Synced from user preset
        "6473fd43-9e1f-4da7-9848-14a1fced05a9", // Synced from user preset
        "05fa0324-09b6-414f-b14c-513c28a28036", // Synced from user preset
        "978520a2-c29b-45fb-86d8-99fc81204f37", // Synced from user preset
        "18bf4d4a-e928-4fa2-9bb7-375680388ff4", // Synced from user preset
        "260cae70-6d53-4cbe-8329-e7df82881284", // Synced from user preset
        "7b59ab7f-e528-4ac3-b914-ac53b2f6d44d", // Synced from user preset
        "2920387b-3af5-4150-9f3d-defaa9e272da", // Synced from user preset
        "d1997c77-2a84-4a94-888c-3cd890f86bbf", // Synced from user preset
        "4ad8a657-f24c-40c9-bffc-976a6ab39003", // Synced from user preset
        "6c0ab122-aa65-4c14-ae20-199c2010df2f", // Synced from user preset
        "bcb6a100-d24d-4d86-a81e-4e1f9cfdc866", // Synced from user preset
        "1209c481-79b7-45bc-9dda-d113bb64d560", // Synced from user preset
        "1efdd851-e336-44a3-8e08-3cbff9077ed5", // Synced from user preset
        "043c82fd-0a04-4653-85c9-372dc6f136a5", // Synced from user preset
        "448174a5-888b-44ec-b6ff-b1c8e785982f", // Synced from user preset
        "3b10188d-d464-461d-b88d-dc1625e08fce", // Synced from user preset
        "7d81224c-eaf8-45ef-9af0-b3f52369c792", // Synced from user preset
        "944b0d08-4c0a-44c2-8f3b-d5d6dfc82fa4", // Synced from user preset
        "917879e7-fbe2-4714-a415-003622498f0b", // Synced from user preset
        "384f405c-b856-44d7-8011-3bb7c90bea4e", // Synced from user preset
        "66c322ea-41dd-499c-8866-ec42a4398f9a", // Synced from user preset
        "a8c1703a-8384-4a6f-871b-32cbc2758b14", // Synced from user preset
        "27ae2bd5-903a-48d2-b89b-8c50795b1579", // Synced from user preset
        "29a3ea23-f3ec-4d5d-88fd-adac79cdedd6", // Synced from user preset
        "1bfb787b-8a33-4dc0-a45b-bad7aa928f48", // Synced from user preset
        "9ae8d38a-4493-4c8c-9eb5-ed2b2339f08d", // Synced from user preset
        "0a2c3465-e2a8-4e71-8e09-e39557967df3", // Synced from user preset
        "9df294b1-f7fd-4233-959d-61e53b6ea2ca", // Synced from user preset
        "ac370d5f-358a-4ab9-990d-ce33414892eb", // Synced from user preset
        "986beeb5-ee2e-44c6-a30f-578bd11c9af6", // Synced from user preset
        "e12784ea-de67-48a7-99ef-3b0c1c45907c", // Synced from user preset
        "d0851faf-af18-40c6-8bf4-35e2338061e5", // Synced from user preset
        "3fac312b-68d9-4c98-b17e-e3565322e236", // Synced from user preset
        "d82dc302-0257-4bbf-99d0-c9a8149c98e6", // Synced from user preset
        "5fe3d988-d5e5-4ab8-82ee-6f7842c99c01", // Synced from user preset
        "f44ffab3-a812-4e48-872f-74671b9deb5e", // Synced from user preset
        "f5afba61-96c6-4699-acba-372237d828f3", // Synced from user preset
        "10c734cd-9356-4794-85a4-e24fc4e4eacd", // Synced from user preset
        "07468205-1e0d-4d9a-ad3f-b3e6df7b852c", // Synced from user preset
        "3f839183-2388-4999-9c1c-bd0b7d48e1d5", // Synced from user preset
        "e0ce2a23-98e3-4772-8984-5e9aa4c5c551", // Synced from user preset
        "60259f4c-61db-4ac0-b765-94800dde9c6a", // Synced from user preset
        "c5a0deb0-cb0c-4934-a547-ac88d258abed", // Synced from user preset
        "e8c4eebd-5452-4651-80d5-735c35a39b15", // Synced from user preset
        "42805823-bba7-44d6-a850-4a34473b816a", // Synced from user preset
        "e7120351-e6a5-4dc8-91c0-8dba621cb21f", // Synced from user preset
        "28d67f85-459a-4851-a77a-130fd5fe569e", // Synced from user preset
        "9c2536d8-2e0f-478d-8bef-3e4e75bcee83", // Synced from user preset
        "d00a8bd2-d7ec-4a1e-919b-4089d2489e82", // Synced from user preset
        "00119b3e-a60f-4f1e-b48a-127026645a39", // Synced from user preset
        "e955ba0e-2830-40d7-badb-12b1235cff79", // Synced from user preset
        "5907aad3-0519-45e9-b6f7-40d9e434ef28", // Synced from user preset
        "c741b88a-6fe2-4055-9b93-81b4503081b6", // Synced from user preset
        "d9762c5c-d5a4-49b0-9d00-814ae57e9711", // Synced from user preset
        ,
        "nsfw", // Synced from user preset
        "dialogueExamples", // Synced from user preset
        "jailbreak", // Synced from user preset
        "chatHistory", // Synced from user preset
        "worldInfoAfter", // Synced from user preset
        "worldInfoBefore", // Synced from user preset
        "enhanceDefinitions", // Synced from user preset
        "charDescription", // Synced from user preset
        "charPersonality", // Synced from user preset
        "scenario", // Synced from user preset
        "personaDescription", // Synced from user preset
        ,
        "nsfw", // Synced from user preset
        "dialogueExamples", // Synced from user preset
        "jailbreak", // Synced from user preset
        "chatHistory", // Synced from user preset
        "worldInfoAfter", // Synced from user preset
        "worldInfoBefore", // Synced from user preset
        "enhanceDefinitions", // Synced from user preset
        "charDescription", // Synced from user preset
        "charPersonality", // Synced from user preset
        "scenario", // Synced from user preset
        "personaDescription", // Synced from user preset
    ];

    const customPrompts = [];
    for (const p of existingPrompts) {
        // IMPROVED LOGIC:
        // 1. Is it a KNOWN ID? (Official prompt)
        if (p.identifier && KNOWN_PRESET_IDS.includes(p.identifier)) {
            // It's an official prompt. Is it in the new master?
            if (!masterById.has(p.identifier)) {
                // Official prompt MISSING from master -> It was deleted by author.
                // DELETE IT (Skip adding to new list)
                continue;
            }
            // If it IS in master, it will be added by the master loop below. 
            // We just skip it here so we don't duplicate or keep old version.
            continue;
        }

        // 2. UNKNOWN ID? (User created it)
        if (!p.identifier || !masterById.has(p.identifier)) {
            // Keep user stuff!
            customPrompts.push(p);
        }
    }

    const newPrompts = masterPrompts.map(p => ({ ...p }));

    for (const p of customPrompts) {
        newPrompts.push({ ...p });
        if (dev && mergeLog) {
            mergeLog.push({ id: p.identifier || "", name: p.name || "", action: "custom", variant: false });
        }
    }

    // prompt_order: сохраняем пользовательский порядок для кастомных, но форсируем мастер-порядок для «наших» промптов
    const masterOrder = Array.isArray(master.prompt_order) ? master.prompt_order : [];
    const existingOrder = Array.isArray(existingPreset?.prompt_order) ? JSON.parse(JSON.stringify(existingPreset.prompt_order)) : [];

    const newPromptOrder = [];
    const masterCharIds = new Set(masterOrder.map(g => String(g.character_id)));

    // Сначала обрабатываем все группы из мастера (и мержим их с пользовательскими)
    for (const masterGroup of masterOrder) {
        const charId = masterGroup.character_id;
        let userGroup = existingOrder.find(g => String(g.character_id) === String(charId));

        if (!userGroup) {
            newPromptOrder.push(JSON.parse(JSON.stringify(masterGroup)));
            continue;
        }

        // Собираем новый порядок для этой группы
        const masterIdentifiers = masterGroup.order.map(o => o.identifier);
        const masterIdSet = new Set(masterIdentifiers);

        // Кастомные промпты (которых нет в мастере) привязываем к «якорному» промпту перед ними
        const customAfter = new Map(); // identifier of anchor -> array of custom items
        const customAtStart = [];

        let lastAnchor = null;
        for (const item of userGroup.order) {
            if (masterIdSet.has(item.identifier)) {
                lastAnchor = item.identifier;
            } else {
                if (lastAnchor) {
                    if (!customAfter.has(lastAnchor)) customAfter.set(lastAnchor, []);
                    customAfter.get(lastAnchor).push(item);
                } else {
                    customAtStart.push(item);
                }
            }
        }

        const mergedOrder = [];
        mergedOrder.push(...customAtStart);

        for (const mItem of masterGroup.order) {
            const uItem = userGroup.order.find(o => o.identifier === mItem.identifier);
            mergedOrder.push({
                identifier: mItem.identifier,
                enabled: uItem ? uItem.enabled : mItem.enabled,
            });

            const following = customAfter.get(mItem.identifier);
            if (following) mergedOrder.push(...following);
        }

        newPromptOrder.push({
            character_id: charId,
            order: mergedOrder,
        });
    }

    // Добавляем группы, которые были у пользователя, но которых нет в мастере (например, другие персонажи)
    for (const userGroup of existingOrder) {
        if (!masterCharIds.has(String(userGroup.character_id))) {
            newPromptOrder.push(userGroup);
        }
    }

    // CLEANUP: Remove deprecated image prompts from the result order and result prompts if they linger
    // Grok: a0bf6c3c-cc3b-4614-a00b-f9be905807b6
    // Pollinations: 3c73ce0d-9cb9-413b-bf1d-94cccd757894
    const deprecatedIds = new Set([
        "a0bf6c3c-cc3b-4614-a00b-f9be905807b6",
        "3c73ce0d-9cb9-413b-bf1d-94cccd757894"
    ]);

    // Filter prompts
    newPrompts.forEach((p, idx) => {
        if (p.identifier && deprecatedIds.has(p.identifier)) {
            // Mark for deletion or just filter logic below? 
            // Logic below:
            // We'll actually filter the final `result.prompts` and `result.prompt_order` structure 
            // to be safe, though `newPrompts` is constructed mostly from master + custom.
            // If these were "custom" (because removed from master), they are in `customPrompts`.
        }
    });

    // Let's filter `newPrompts` properly:
    const filteredPrompts = newPrompts.filter(p => !p.identifier || !deprecatedIds.has(p.identifier));

    // Filter `newPromptOrder`:
    for (const group of newPromptOrder) {
        if (Array.isArray(group.order)) {
            group.order = group.order.filter(o => !deprecatedIds.has(o.identifier));
        }
    }

    const result = existingPreset ? JSON.parse(JSON.stringify(existingPreset)) : JSON.parse(JSON.stringify(master));

    if (!existingPreset) {
        Object.assign(result, master);
    }

    result.prompts = filteredPrompts;
    result.prompt_order = newPromptOrder.length ? newPromptOrder : masterOrder;

    if (!result.extensions && master.extensions) {
        result.extensions = JSON.parse(JSON.stringify(master.extensions));
    }

    if (dev && mergeLog) {
        window.YablochnyLastMergeLog = mergeLog;
        // eslint-disable-next-line no-console
        console.table(mergeLog);
    }

    // promptSyncMeta сейчас не используется, вернём пустой объект для совместимости
    return { preset: result, syncMeta: {} };
}

async function syncPreset(showToasts = true) {
    try {
        const cfg = getConfig();
        const uiLang = getUiLang();
        const basePreset = await loadBasePreset();

        // Capture old settings for changelog
        const oldSettings = {
            languageMode: cfg.languageMode,
            lengthMode: cfg.lengthMode,
            POVMode: cfg.POVMode,
            TENSEMode: cfg.TENSEMode,
            proseStyle: cfg.proseStyle,
            speechStyle: cfg.speechStyle,
            htmlTheme: cfg.htmlTheme,
            imageMode: cfg.imageMode,
            thingsSelected: JSON.parse(JSON.stringify(cfg.thingsSelected)),
            regexEnabled: [...cfg.regexEnabled],
        };

        const name = cfg.presetName || DEFAULT_PRESET_NAME;
        const index = findPresetIndexByName(name);
        const existingPreset = index !== null ? JSON.parse(JSON.stringify(openai_settings[index])) : null;

        const master = buildMasterWithVariants(basePreset, cfg, uiLang, existingPreset);
        const { preset, syncMeta } = buildMergedPreset(existingPreset, master, cfg);

        const ctx = window.SillyTavern?.getContext?.();
        const headers = ctx?.getRequestHeaders ? ctx.getRequestHeaders() : {};

        const response = await fetch("/api/presets/save", {
            method: "POST",
            headers,
            body: JSON.stringify({
                apiId: "openai",
                name,
                preset,
            }),
        });

        if (!response.ok) {
            console.error("[Yablochny] Failed to save preset", response.status);
            if (showToasts && window.toastr) {
                window.toastr.error("Не удалось сохранить пресет (см. консоль).");
            }
            return;
        }

        const data = await response.json();
        const actualName = data.name;

        // Обновляем локальные структуры так же, как это делает saveOpenAIPreset
        let newIndex = findPresetIndexByName(actualName);

        if (newIndex !== null) {
            // Update existing
            Object.assign(openai_settings[newIndex], preset);
            const optionSelector = `#settings_preset_openai option[value="${newIndex}"]`;
            jQuery(optionSelector).prop("selected", true);
        } else {
            // Add new
            openai_settings.push(preset);
            newIndex = openai_settings.length - 1;

            if (Array.isArray(openai_setting_names)) {
                openai_setting_names.push(actualName);
            } else {
                openai_setting_names[actualName] = newIndex;
            }

            const option = document.createElement("option");
            option.selected = true;
            option.value = String(newIndex);
            option.innerText = actualName;
            jQuery("#settings_preset_openai").append(option);
        }

        jQuery("#settings_preset_openai").trigger("change");

        cfg.presetName = actualName;
        cfg.promptSyncMeta = syncMeta;
        promptSyncMetaCache = syncMeta;
        cfg.lastSync = new Date().toISOString();

        saveSettingsDebounced();

        updateMetaUi();

        if (showToasts && window.toastr) {
            const lang = getUiLang();
            const dict = UI_TEXT[lang] || UI_TEXT.en;

            // Generate changelog
            const changes = [];

            const langMap = { auto: "Auto", ru: "Russian", en: "English", uk: "Ukrainian", custom: "Custom" };
            if (oldSettings.languageMode !== cfg.languageMode) {
                changes.push(`Language: ${langMap[oldSettings.languageMode] || oldSettings.languageMode} → ${langMap[cfg.languageMode] || cfg.languageMode}`);
            }

            if (oldSettings.lengthMode !== cfg.lengthMode) {
                changes.push(`Length: ${oldSettings.lengthMode} → ${cfg.lengthMode}`);
            }

            const povMap = { "1st": "1st person", "2nd": "2nd person", "3rd": "3rd person" };
            if (oldSettings.POVMode !== cfg.POVMode) {
                changes.push(`POV: ${povMap[oldSettings.POVMode]} → ${povMap[cfg.POVMode]}`);
            }

            if (oldSettings.TENSEMode !== cfg.TENSEMode) {
                changes.push(`Tense: ${oldSettings.TENSEMode} → ${cfg.TENSEMode}`);
            }

            if (oldSettings.proseStyle !== cfg.proseStyle) {
                changes.push(`Prose: ${oldSettings.proseStyle} → ${cfg.proseStyle}`);
            }

            if (oldSettings.speechStyle !== cfg.speechStyle) {
                changes.push(`Speech: ${oldSettings.speechStyle} → ${cfg.speechStyle}`);
            }

            if (oldSettings.htmlTheme !== cfg.htmlTheme) {
                changes.push(`Theme: ${oldSettings.htmlTheme} → ${cfg.htmlTheme}`);
            }

            if (oldSettings.imageMode !== cfg.imageMode) {
                changes.push(`Image: ${oldSettings.imageMode} → ${cfg.imageMode}`);
            }

            // Things changes
            const oldThings = oldSettings.thingsSelected;
            const newThings = cfg.thingsSelected;

            const addedMix = newThings.mix.filter(id => !oldThings.mix.includes(id));
            const removedMix = oldThings.mix.filter(id => !newThings.mix.includes(id));
            if (addedMix.length > 0) changes.push(`+Things (mix): ${addedMix.join(", ")}`);
            if (removedMix.length > 0) changes.push(`-Things (mix): ${removedMix.join(", ")}`);

            const addedHidden = newThings.hidden.filter(id => !oldThings.hidden.includes(id));
            const removedHidden = oldThings.hidden.filter(id => !newThings.hidden.includes(id));
            if (addedHidden.length > 0) changes.push(`+Things (hidden): ${addedHidden.join(", ")}`);
            if (removedHidden.length > 0) changes.push(`-Things (hidden): ${removedHidden.join(", ")}`);

            if (oldThings.cyoa !== newThings.cyoa) {
                if (newThings.cyoa) changes.push(`+CYOA: ${newThings.cyoa}`);
                if (oldThings.cyoa) changes.push(`-CYOA: ${oldThings.cyoa}`);
            }

            if (oldThings.fancy !== newThings.fancy) {
                if (newThings.fancy) changes.push(`+Fancy: ${newThings.fancy}`);
                if (oldThings.fancy) changes.push(`-Fancy: ${oldThings.fancy}`);
            }

            if (oldThings.comments !== newThings.comments) {
                if (newThings.comments) changes.push(`+Comments: ${newThings.comments}`);
                if (oldThings.comments) changes.push(`-Comments: ${oldThings.comments}`);
            }

            // Regex changes
            const addedRegex = cfg.regexEnabled.filter(id => !oldSettings.regexEnabled.includes(id));
            const removedRegex = oldSettings.regexEnabled.filter(id => !cfg.regexEnabled.includes(id));
            if (addedRegex.length > 0) changes.push(`+Regex: ${addedRegex.join(", ")}`);
            if (removedRegex.length > 0) changes.push(`-Regex: ${removedRegex.join(", ")}`);

            let message = dict.toastSyncSuccess;
            if (changes.length > 0) {
                message += "\n\n" + changes.join("\n");
            }

            window.toastr.success(message);
        }
    } catch (err) {
        console.error("[Yablochny] Sync error", err);
        if (showToasts && window.toastr) {
            const lang = getUiLang();
            const dict = UI_TEXT[lang] || UI_TEXT.en;
            window.toastr.error((dict.toastSyncError || "Sync error: ") + err.message);
        }
    }
}

// Prompt Editor Helper Functions
const VARIANT_TYPE_MAP = {
    language: { constants: "LANGUAGE_VARIANTS", keys: ["Russian", "English", "Ukrainian"] },
    length: { constants: "LENGTH_VARIANTS", keys: ["200-400", "400-600", "600-800", "adaptive"] },
    pov: { constants: "POV_VARIANTS", keys: ["1st", "2nd", "3rd"] },
    tense: { constants: "TENSE_VARIANTS", keys: ["Present", "Past", "Future"] },
    prose: { constants: "PROSE_VARIANTS", keys: ["ao3", "anne_rice", "donna_tartt", "pratchett", "salinger", "le_guin", "backman"] },
    speech: { constants: "SPEECH_VARIANTS", keys: ["salinger", "pratchett", "le_guin", "wilde"] },
    theme: { constants: "HTML_THEME", keys: ["dark", "light"] },
    image: { constants: "IMAGE_VARIANTS", keys: ["silly", "grok", "pollinations", "custom"] },
};

async function loadPromptEdits() {
    const cfg = getConfig();
    return cfg.promptEdits || {};
}


async function savePromptEdit(variantType, variantKey, content) {
    const cfg = getConfig();
    if (!cfg.promptEdits) cfg.promptEdits = {};
    if (!cfg.promptEdits[variantType]) cfg.promptEdits[variantType] = {};

    cfg.promptEdits[variantType][variantKey] = content;
    saveSettingsDebounced();
    await syncPreset(false);
}


async function saveThingEdit(groupKey, thingId, content) {
    const cfg = getConfig();
    if (!cfg.promptEdits) cfg.promptEdits = {};
    if (!cfg.promptEdits.things) cfg.promptEdits.things = {};
    if (!cfg.promptEdits.things[groupKey]) cfg.promptEdits.things[groupKey] = {};

    cfg.promptEdits.things[groupKey][thingId] = content;
    saveSettingsDebounced();
    await syncPreset(false);
}


function getVariantContent(variantType, variantKey) {
    const map = VARIANT_TYPE_MAP[variantType];
    if (!map) return "";

    const constantsName = map.constants;
    let constants;

    switch (constantsName) {
        case "LANGUAGE_VARIANTS": constants = LANGUAGE_VARIANTS; break;
        case "LENGTH_VARIANTS": constants = LENGTH_VARIANTS; break;
        case "POV_VARIANTS": constants = POV_VARIANTS; break;
        case "TENSE_VARIANTS": constants = TENSE_VARIANTS; break;
        case "PROSE_VARIANTS": constants = PROSE_VARIANTS; break;
        case "SPEECH_VARIANTS": constants = SPEECH_VARIANTS; break;
        case "HTML_THEME": constants = HTML_THEME; break;
        case "IMAGE_VARIANTS": constants = IMAGE_VARIANTS; break;
        default: return "";
    }

    return constants[variantKey] || "";
}

function getThingContent(groupKey, thingId) {
    const group = THINGS_DEFS[groupKey];
    if (!group) return "";

    const thing = group.find(t => t.id === thingId);
    return thing ? thing.content : "";
}

async function loadPromptVariantContent(variantType, variantKey) {
    const edits = await loadPromptEdits();

    let content;
    if (edits[variantType] && edits[variantType][variantKey]) {
        content = edits[variantType][variantKey];
    } else {
        content = getVariantContent(variantType, variantKey);
    }

    jQuery("#yp-editor-textarea").val(content);
}

async function loadThingContent(groupKey, thingId) {
    const edits = await loadPromptEdits();

    let content;
    if (edits.things && edits.things[groupKey] && edits.things[groupKey][thingId]) {
        content = edits.things[groupKey][thingId];
    } else {
        content = getThingContent(groupKey, thingId);
    }

    jQuery("#yp-editor-textarea").val(content);
}

function openPromptEditor(variantType) {
    const map = VARIANT_TYPE_MAP[variantType];
    if (!map) return;

    // Set title
    const titles = {
        language: "Language Variants",
        length: "Length Variants",
        pov: "POV Variants",
        tense: "Tense Variants",
        prose: "Prose Style Variants",
        speech: "Speech Style Variants",
        theme: "HTML Theme Variants",
        image: "Image Mode Variants",
    };
    jQuery("#yp-editor-title").text("Edit " + (titles[variantType] || "Prompt Variant"));

    // Populate variant dropdown
    const select = jQuery("#yp-editor-variant-select");
    select.empty();
    for (const key of map.keys) {
        select.append(`<option value="${key}">${key}</option>`);
    }

    // Show variant selector
    jQuery("#yp-editor-variant-row").show();

    // Load first variant content
    const firstKey = map.keys[0];
    loadPromptVariantContent(variantType, firstKey);

    // Show modal
    jQuery("#yp-prompt-editor-modal").css("display", "flex");
}

function openThingEditor(groupKey, thingId) {
    const group = THINGS_DEFS[groupKey];
    if (!group) return;

    const thing = group.find(t => t.id === thingId);
    if (!thing) return;

    // Set title
    jQuery("#yp-editor-title").text(`Edit Thing: ${thing.label}`);

    // Hide variant selector
    jQuery("#yp-editor-variant-row").hide();

    // Load content
    loadThingContent(groupKey, thingId);

    // Show modal
    jQuery("#yp-prompt-editor-modal").css("display", "flex");
}

function applyLocaleToUi() {
    const lang = getUiLang();
    const dict = UI_TEXT[lang] || UI_TEXT.en;

    jQuery("#yp-title-text").text(dict.title);
    jQuery("#yp-desc-text").text(dict.desc);
    jQuery("#yp-sync-label").text(dict.sync);
    jQuery("#yp-auto-label").text(dict.auto);
    jQuery("#yp-lang-label").text(dict.langLabel);
    jQuery("#yp-length-label").text(dict.lengthLabel);
    jQuery("#yp-pov-label").text(dict.POVLabel);
    jQuery("#yp-tense-label").text(dict.tenseLabel);
    jQuery("#yp-prose-label").text(dict.proseLabel);
    jQuery("#yp-speech-label").text(dict.speechLabel);
    jQuery("#yp-theme-label").text(dict.themeLabel);
    jQuery("#yp-site-label").text(dict.siteLabel);
    jQuery("#yp-guide-label").text(dict.guideLabel);
    jQuery("#yp-preset-label").text(dict.presetLabel);
    jQuery("#yp-last-sync-label").text(dict.lastSyncLabel);
    jQuery("#yp-things-title").text(dict.thingsTitle);
    jQuery("#yp-things-note").text(dict.thingsNote);
    jQuery("#yp-things-managed-label").text(dict.thingsManagedLabel);
    jQuery("#yp-things-group-mix").text(dict.groupMix);
    jQuery("#yp-things-group-hidden").text(dict.groupHidden);
    jQuery("#yp-things-group-cyoa").text(dict.groupCyoa);
    jQuery("#yp-things-group-fancy").text(dict.groupFancy);
    jQuery("#yp-things-group-comments").text(dict.groupComments);
    jQuery("#yp-regex-title").text(dict.regexTitle);
    jQuery("#yp-regex-debug-label").text(dict.regexDebug);
    jQuery("#yp-regex-desc").text(dict.regexDesc);
    updateRegexToggleButton();
    const devLabel =
        lang === "ru"
            ? "Режим разработчика (лог синка в консоль)"
            : lang === "uk"
                ? "Режим розробника (лог синка в консолі)"
                : "Developer mode (log sync to console)";
    jQuery("#yp-dev-label").text(devLabel);
}

function updateMetaUi() {
    const cfg = getConfig();
    const lang = getUiLang();
    const dict = UI_TEXT[lang] || UI_TEXT.en;

    jQuery("#yp-preset-name").text(cfg.presetName || "—");

    if (!cfg.lastSync) {
        jQuery("#yp-last-sync").text(dict.lastSyncNever);
    } else {
        try {
            const date = new Date(cfg.lastSync);
            const formatted = date.toLocaleString();
            jQuery("#yp-last-sync").text(formatted);
        } catch {
            jQuery("#yp-last-sync").text(cfg.lastSync);
        }
    }
}

function renderThingsUI(cfg) {
    const sel = cfg.thingsSelected || { mix: [], hidden: [], fancy: null, comments: null };
    const lang = getUiLang();
    const dict = UI_TEXT[lang] || UI_TEXT.en;
    const devMode = cfg.devMode || false;

    function renderGroup(containerSelector, defs, groupKey, isExclusive) {
        const container = jQuery(containerSelector);
        container.empty();

        for (const def of defs) {
            const inputId = `yp-thing-${groupKey}-${def.id}`;
            const checked =
                (groupKey === "mix" || groupKey === "hidden")
                    ? (sel[groupKey] || []).includes(def.id)
                    : sel[groupKey] === def.id;

            const editBtn = devMode ? `<button class="yp-thing-edit-btn menu_button secondary" data-thing-group="${groupKey}" data-thing-id="${def.id}" style="padding: 2px 6px; margin-left: 4px;"><i class="fa-solid fa-pen"></i></button>` : '';

            const html = `
        <div class="yablochny-thing-item" style="display: flex; align-items: center; gap: 4px;">
          <label for="${inputId}" style="flex: 1;">
            <input type="checkbox" id="${inputId}" data-things-group="${groupKey}" data-things-id="${def.id}" ${checked ? "checked" : ""}>
            <span>${def.label}</span>
            ${isExclusive ? `<span class="yablochny-thing-tag">${dict.exclusiveTag}</span>` : ""}
          </label>
          ${editBtn}
        </div>
      `;
            container.append(html);
        }
    }

    renderGroup("#yp-things-mix", THINGS_DEFS.mix, "mix", false);
    renderGroup("#yp-things-hidden", THINGS_DEFS.hidden, "hidden", false);
    renderGroup("#yp-things-cyoa", THINGS_DEFS.cyoa, "cyoa", true);
    renderGroup("#yp-things-fancy", THINGS_DEFS.fancy, "fancy", true);
    renderGroup("#yp-things-comments", THINGS_DEFS.comments, "comments", true);
}

async function loadRegexPacksIntoYablochny() {
    if (!window.YablochnyRegexData) {
        window.YablochnyRegexData = {
            packs: {},
            enabled: [],
            active: true,
        };
    }

    const cfg = getConfig();
    window.YablochnyRegexData.enabled = Array.from(cfg.regexEnabled || []);
    window.YablochnyRegexData.active = cfg.regexActive !== false;

    for (const file of REGEX_PACK_FILES) {
        try {
            const response = await fetch(`${SCRIPT_PATH}/regexes/${file}.json`);
            const pack = await response.json();
            window.YablochnyRegexData.packs[file] = pack;
            // eslint-disable-next-line no-console
            console.log(`[Yablochny] Regex pack loaded: ${pack.name} (${pack.scripts.length} scripts)`);
        } catch (e) {
            console.error(`[Yablochny] Failed to load regex pack ${file}`, e);
        }
    }

    renderRegexPackList();
    updateRegexToggleButton();

    if (window.YablochnyRegexData.active) {
        for (const packId of window.YablochnyRegexData.enabled) {
            injectRegexPack(packId);
        }
    }
}

function updateRegexToggleButton() {
    const btn = jQuery("#yp-regex-toggle");
    const cfg = getConfig();
    const lang = getUiLang();
    const dict = UI_TEXT[lang] || UI_TEXT.en;
    const onText = dict.regexToggleOn;
    const offText = dict.regexToggleOff;

    if (cfg.regexActive) {
        btn.removeClass("inactive").addClass("active");
        jQuery("#yp-regex-toggle-label").text(onText);
    } else {
        btn.removeClass("active").addClass("inactive");
        jQuery("#yp-regex-toggle-label").text(offText);
    }

    jQuery("#yp-regex-list input[type=checkbox]").prop("disabled", !cfg.regexActive);
}

function saveRegexSettings() {
    const cfg = getConfig();
    cfg.regexEnabled = Array.from(window.YablochnyRegexData.enabled || []);
    cfg.regexActive = !!window.YablochnyRegexData.active;
    extension_settings[EXTENSION_NAME] = cfg;
    saveSettingsDebounced();
}

function renderRegexPackList() {
    const container = jQuery("#yp-regex-list");
    container.empty();

    const data = window.YablochnyRegexData || { packs: {}, enabled: [], active: true };
    const lang = getUiLang();
    const dict = UI_TEXT[lang] || UI_TEXT.en;

    for (const [id, pack] of Object.entries(data.packs)) {
        const enabled = data.enabled.includes(id);

        const html = `
      <div class="yp-regex-pack">
        <label class="checkbox-label">
          <input type="checkbox" data-pack="${id}" ${enabled ? "checked" : ""} ${!data.active ? "disabled" : ""}>
          <span class="yp-regex-pack-name">${pack.name}</span>
        </label>
        <div class="yp-regex-pack-desc">${pack.description}</div>
        <div class="yp-regex-pack-count">${pack.scripts.length} ${dict.regexCount}</div>
      </div>
    `;
        container.append(html);
    }

    container.find("input[type=checkbox]").on("change", async function () {
        const packId = jQuery(this).data("pack");
        const checked = jQuery(this).is(":checked");

        if (checked) {
            if (!window.YablochnyRegexData.enabled.includes(packId)) {
                window.YablochnyRegexData.enabled.push(packId);
                if (window.YablochnyRegexData.active) {
                    injectRegexPack(packId);
                }
            }
        } else {
            window.YablochnyRegexData.enabled = window.YablochnyRegexData.enabled.filter(p => p !== packId);
            removeRegexPack(packId);
        }

        saveRegexSettings();

        const ctx = window.SillyTavern?.getContext?.();
        if (ctx?.reloadCurrentChat) {
            await ctx.reloadCurrentChat();
        }
    });
}

function injectRegexPack(packId) {
    const data = window.YablochnyRegexData || { packs: {}, enabled: [], active: true };
    const pack = data.packs[packId];
    if (!pack) return;

    if (!Array.isArray(extension_settings.regex)) {
        extension_settings.regex = [];
    }

    let added = 0;
    for (const script of pack.scripts) {
        const newId = `rgxm-${packId}-${script.id}`;
        const existingIndex = extension_settings.regex.findIndex(r => r.id === newId);
        if (existingIndex !== -1) continue;

        const newRegex = {
            id: newId,
            scriptName: `[RM] ${script.scriptName}`,
            findRegex: script.findRegex,
            replaceString: script.replaceString,
            trimStrings: script.trimStrings || [],
            placement: script.placement || [1, 2, 6],
            disabled: false,
            markdownOnly: script.markdownOnly ?? true,
            promptOnly: script.promptOnly ?? false,
            runOnEdit: script.runOnEdit ?? true,
            substituteRegex: script.substituteRegex ?? 0,
            minDepth: script.minDepth ?? null,
            maxDepth: script.maxDepth ?? null,
        };

        extension_settings.regex.push(newRegex);
        added++;
    }

    if (added > 0) {
        // eslint-disable-next-line no-console
        console.log(`[Yablochny] Added ${added} regexes from pack ${packId}`);
        saveSettingsDebounced();
    }
}

function removeRegexPack(packId) {
    if (!Array.isArray(extension_settings.regex)) return;

    const prefix = `rgxm-${packId}-`;
    let removed = 0;

    for (let i = extension_settings.regex.length - 1; i >= 0; i--) {
        if (extension_settings.regex[i].id && extension_settings.regex[i].id.startsWith(prefix)) {
            extension_settings.regex.splice(i, 1);
            removed++;
        }
    }

    if (removed > 0) {
        // eslint-disable-next-line no-console
        console.log(`[Yablochny] Removed ${removed} regexes from pack ${packId}`);
        saveSettingsDebounced();
    }
}

function initControls() {
    const cfg = getConfig();

    // Render Things UI based on definitions
    renderThingsUI(cfg);

    jQuery("#yp-language").val(cfg.languageMode || "auto");
    jQuery("#yp-length").val(cfg.lengthMode || "400-600");
    jQuery("#yp-pov").val(cfg.POVMode || "3rd");
    jQuery("#yp-tense").val(cfg.TENSEMode || "Present");
    jQuery("#yp-prose").val(cfg.proseStyle || "ao3");
    jQuery("#yp-speech").val(cfg.speechStyle || "none");
    jQuery("#yp-theme").val(cfg.htmlTheme || "dark");
    jQuery("#yp-image-mode").val(cfg.imageMode || "silly");
    window.YablochnyThingsSelection = cfg.thingsSelected || {};
    jQuery("#yp-auto-sync").prop("checked", !!cfg.autoSyncOnStart);
    jQuery("#yp-dev-mode").prop("checked", !!cfg.devMode);

    updateMetaUi();

    // Model Preset controls
    // Model Preset buttons
    const modelButtonsContainer = jQuery("#yp-model-buttons");
    modelButtonsContainer.empty();

    Object.keys(MODEL_PRESETS).forEach(id => {
        const preset = MODEL_PRESETS[id];
        const activeClass = (cfg.modelPreset === id) ? "active" : "";
        const btn = `<button class="yp-model-btn ${activeClass}" data-preset-id="${id}">${preset.name}</button>`;
        modelButtonsContainer.append(btn);
    });

    modelButtonsContainer.on("click", ".yp-model-btn", function () {
        const presetId = jQuery(this).data("preset-id");
        if (!presetId) return;

        if (applyModelPreset(presetId)) {
            syncPreset(true);

            if (window.toastr) {
                const preset = MODEL_PRESETS[presetId];
                window.toastr.success(`Model preset applied: ${preset.name}`);
            }
        }
    });

    jQuery("#yp-sync").on("click", () => {
        syncPreset(true);
    });

    jQuery("#yp-theme").on("change", function () {
        setConfig("htmlTheme", this.value);
        syncPreset(true);
    });

    jQuery("#yp-auto-sync").on("change", function () {
        setConfig("autoSyncOnStart", this.checked);
    });

    jQuery("#yp-dev-mode").on("change", function () {
        const cfg = getConfig();
        cfg.devMode = jQuery(this).is(":checked");
        saveSettingsDebounced();

        // Show/hide edit buttons based on dev mode
        if (cfg.devMode) {
            jQuery(".yp-edit-btn").show();
        } else {
            jQuery(".yp-edit-btn").hide();
        }

        // Re-render Things UI to show/hide edit buttons
        renderThingsUI(cfg);
    });

    // Initialize edit button visibility
    if (cfg.devMode) {
        jQuery(".yp-edit-btn").show();
    }

    // Prompt Editor functionality
    let currentEditingType = null;
    let currentEditingGroup = null;
    let currentEditingId = null;

    jQuery(".yp-edit-btn").on("click", function () {
        const variantType = jQuery(this).data("variant-type");
        currentEditingType = variantType;
        currentEditingGroup = null;
        currentEditingId = null;
        openPromptEditor(variantType);
    });

    // Thing edit buttons (delegated event)
    jQuery("#yp-things").on("click", ".yp-thing-edit-btn", function () {
        const groupKey = jQuery(this).data("thing-group");
        const thingId = jQuery(this).data("thing-id");
        currentEditingType = null;
        currentEditingGroup = groupKey;
        currentEditingId = thingId;
        openThingEditor(groupKey, thingId);
    });

    jQuery("#yp-editor-cancel").on("click", function () {
        jQuery("#yp-prompt-editor-modal").hide();
        currentEditingType = null;
        currentEditingGroup = null;
        currentEditingId = null;
    });

    jQuery("#yp-editor-save").on("click", async function () {
        const content = jQuery("#yp-editor-textarea").val();

        try {
            if (currentEditingType) {
                // Saving prompt variant
                const variantKey = jQuery("#yp-editor-variant-select").val();
                await savePromptEdit(currentEditingType, variantKey, content);
            } else if (currentEditingGroup && currentEditingId) {
                // Saving thing
                await saveThingEdit(currentEditingGroup, currentEditingId, content);
            }

            jQuery("#yp-prompt-editor-modal").hide();
            currentEditingType = null;
            currentEditingGroup = null;
            currentEditingId = null;

            if (window.toastr) {
                window.toastr.success("Edit saved to tools/prompt-edits.json");
            }
        } catch (err) {
            console.error("[Yablochny] Failed to save edit", err);
            if (window.toastr) {
                window.toastr.error("Failed to save: " + err.message);
            }
        }
    });

    jQuery("#yp-editor-variant-select").on("change", function () {
        const variantKey = jQuery(this).val();
        if (currentEditingType) {
            loadPromptVariantContent(currentEditingType, variantKey);
        }
    });

    function onPresetOptionChanged(updater) {
        updater();
        saveSettingsDebounced();
        // Автоматически пересинхронизируем пресет при смене варианта
        syncPreset(true);
    }

    jQuery("#yp-language").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.languageMode = value;
        });
    });

    jQuery("#yp-length").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.lengthMode = value;
        });
    });

    jQuery("#yp-pov").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.POVMode = value;
        });
    });

    jQuery("#yp-tense").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.TENSEMode = value;
        });
    });

    jQuery("#yp-prose").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.proseStyle = value;
        });
    });

    jQuery("#yp-speech").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.speechStyle = value;
        });
    });

    jQuery("#yp-image-mode").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.imageMode = value;
        });
    });

    // Things: delegated handler
    jQuery("#yp-things").on("change", "input[data-things-group]", function () {
        const group = String(jQuery(this).data("things-group"));
        const id = String(jQuery(this).data("things-id"));
        const checked = jQuery(this).is(":checked");
        const cfg = getConfig();
        const sel = cfg.thingsSelected || { mix: [], hidden: [], cyoa: null, fancy: null, comments: null };

        const updateSelection = () => {
            if (group === "mix" || group === "hidden") {
                const arr = Array.isArray(sel[group]) ? [...sel[group]] : [];
                if (checked) {
                    if (!arr.includes(id)) arr.push(id);
                } else {
                    const idx = arr.indexOf(id);
                    if (idx !== -1) arr.splice(idx, 1);
                }
                sel[group] = arr;
            } else {
                if (checked) {
                    // снять остальные в этой группе
                    jQuery(`#yp-things input[data-things-group="${group}"]`).not(this).prop("checked", false);
                    sel[group] = id;
                } else {
                    sel[group] = null;
                }
            }
            cfg.thingsSelected = sel;
        };

        onPresetOptionChanged(updateSelection);
    });

    // Regex controls
    jQuery("#yp-regex-toggle").on("click", async () => {
        const cfg = getConfig();
        cfg.regexActive = !cfg.regexActive;
        window.YablochnyRegexData = window.YablochnyRegexData || { packs: {}, enabled: [], active: true };
        window.YablochnyRegexData.active = cfg.regexActive;

        if (cfg.regexActive) {
            for (const packId of window.YablochnyRegexData.enabled) {
                injectRegexPack(packId);
            }
            if (window.toastr) {
                const lang = getUiLang();
                const dict = UI_TEXT[lang] || UI_TEXT.en;
                window.toastr.success(dict.toastRegexEnabled);
            }
        } else {
            for (const packId of window.YablochnyRegexData.enabled) {
                removeRegexPack(packId);
            }
            if (window.toastr) {
                const lang = getUiLang();
                const dict = UI_TEXT[lang] || UI_TEXT.en;
                window.toastr.info(dict.toastRegexDisabled);
            }
        }

        saveRegexSettings();
        updateRegexToggleButton();

        const ctx = window.SillyTavern?.getContext?.();
        if (ctx?.reloadCurrentChat) {
            await ctx.reloadCurrentChat();
        }
    });

    jQuery("#yp-regex-debug").on("click", () => {
        if (window.RegexManager?.debug) {
            window.RegexManager.debug();
        } else {
            const lang = getUiLang();
            const dict = UI_TEXT[lang] || UI_TEXT.en;
            if (window.toastr) {
                window.toastr.info(dict.toastRegexDebugNote);
            }
        }
    });
}

async function waitForOpenAI() {
    const start = Date.now();
    while (Date.now() - start < 15000) {
        if (Array.isArray(openai_settings) && openai_settings.length >= 0 && openai_setting_names) {
            return;
        }
        await new Promise(r => setTimeout(r, 250));
    }
}

jQuery(async () => {
    try {
        const settingsHtml = await jQuery.get(`${SCRIPT_PATH}/settings.html`);
        jQuery("#extensions_settings2").append(settingsHtml);
    } catch (e) {
        console.error("[Yablochny] Failed to load settings.html", e);
        return;
    }

    applyLocaleToUi();
    initControls();

    await waitForOpenAI();

    // Загрузить и отрисовать regex-паки (объединённый менеджер)
    await loadRegexPacksIntoYablochny();

    const cfg = getConfig();
    if (cfg.autoSyncOnStart) {
        // тихий автосинк при старте
        syncPreset(false);
    }
});

