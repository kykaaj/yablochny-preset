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
        thingsManagedLabel: "◦︎ manage 'things' from here (otherwise preserved)",
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
        thingsManagedLabel: "◦︎ управлять 'things' отсюда (иначе ручные правки сохраняются)",
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
            thingsManaged: true,
            devMode: false,
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
    cfg.thingsManaged ??= true;
    cfg.devMode ??= false;

    promptSyncMetaCache = cfg.promptSyncMeta;
    return cfg;
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

    const text = LANGUAGE_VARIANTS[targetName];
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
    const text = LENGTH_VARIANTS[cfg.lengthMode || "400-600"];
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
    const text = POV_VARIANTS[cfg.POVMode || "3rd"];
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
    const text = TENSE_VARIANTS[cfg.TENSEMode || "3rd"];
    if (text) {
        prompt.content = text;
    }
}

function applySpeechVariant(master, cfg, existingPreset) {
    const id = "eb4955d3-8fa0-4c27-ab87-a2fc938f9b6c";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;
    if (cfg.speechStyle === "none") {
        // we could potentially clear it, but maybe better to pull existing?
        // if mode is "none", usually we want it disabled/empty in our system.
        // but if user manually edited it while it was in "none" (unlikely but possible), 
        // we might want to adopt it.
        return;
    }
    const text = SPEECH_VARIANTS[cfg.speechStyle];
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
    const key = cfg.proseStyle || "ao3";
    const text = PROSE_VARIANTS[key];
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
    const themeKey = cfg.htmlTheme || "dark";
    const text = HTML_THEME[themeKey];
    if (text) {
        prompt.content = text;
    }
}

function applyThingsVariant(master, cfg, existingPreset) {
    const id = "6b235beb-7de9-4f84-9b09-6f20210eae6d";
    const prompt = master.prompts.find(p => p.identifier === id);
    if (!prompt) return;

    if (!cfg.thingsManaged) {
        const existingContent = getContentFromExisting(existingPreset, id);
        if (existingContent !== null) {
            prompt.content = existingContent;
        }
        return;
    }

    const sel = cfg.thingsSelected || {};
    const parts = [];

    for (const itemId of sel.mix || []) {
        const def = THINGS_DEFS.mix.find(x => x.id === itemId);
        if (def) parts.push(def.content);
    }

    for (const itemId of sel.hidden || []) {
        const def = THINGS_DEFS.hidden.find(x => x.id === itemId);
        if (def) parts.push(def.content);
    }

    if (sel.cyoa) {
        const def = THINGS_DEFS.cyoa.find(x => x.id === sel.cyoa);
        if (def) parts.push(def.content);
    }

    if (sel.fancy) {
        const def = THINGS_DEFS.fancy.find(x => x.id === sel.fancy);
        if (def) parts.push(def.content);
    }

    if (sel.comments) {
        const def = THINGS_DEFS.comments.find(x => x.id === sel.comments);
        if (def) parts.push(def.content);
    }

    prompt.content = parts.join("\n\n");
}

function applyImageVariant(preset, mode, existingPreset) {
    if (!mode) return;
    const id = "e12784ea-de67-48a7-99ef-3b0c1c45907c";
    const p = (preset.prompts || []).find(x => x.identifier === id);
    if (p) {
        if (mode === "custom") {
            const existingContent = getContentFromExisting(existingPreset, id);
            if (existingContent !== null) {
                p.content = existingContent;
            } else if (IMAGE_VARIANTS["custom"]) {
                p.content = IMAGE_VARIANTS["custom"];
            }
            return;
        }

        if (IMAGE_VARIANTS[mode]) {
            p.content = IMAGE_VARIANTS[mode];
        }
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

    const customPrompts = [];
    for (const p of existingPrompts) {
        if (!p.identifier || !masterById.has(p.identifier)) {
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
            window.toastr.success(dict.toastSyncSuccess);
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
    const sel = cfg.thingsSelected || { mix: [], fancy: null, comments: null };
    const lang = getUiLang();
    const dict = UI_TEXT[lang] || UI_TEXT.en;

    function renderGroup(containerSelector, defs, groupKey, isExclusive) {
        const container = jQuery(containerSelector);
        container.empty();

        for (const def of defs) {
            const inputId = `yp-thing-${groupKey}-${def.id}`;
            const checked =
                groupKey === "mix"
                    ? (sel[groupKey] || []).includes(def.id)
                    : sel[groupKey] === def.id;

            const html = `
        <div class="yablochny-thing-item">
          <label for="${inputId}">
            <input type="checkbox" id="${inputId}" data-things-group="${groupKey}" data-things-id="${def.id}" ${checked ? "checked" : ""}>
            <span>${def.label}</span>
            ${isExclusive ? `<span class="yablochny-thing-tag">${dict.exclusiveTag}</span>` : ""}
          </label>
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
    jQuery("#yp-auto-sync").prop("checked", !!cfg.autoSyncOnStart);
    jQuery("#yp-dev-mode").prop("checked", !!cfg.devMode);
    jQuery("#yp-things-managed").prop("checked", cfg.thingsManaged !== false);

    updateMetaUi();

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

    jQuery("#yp-things-managed").on("change", function () {
        const cfg = getConfig();
        cfg.thingsManaged = jQuery(this).is(":checked");
        saveSettingsDebounced();
        // если выключили управление штуками — не перетираем содержимое things при синке
    });

    jQuery("#yp-dev-mode").on("change", function () {
        const cfg = getConfig();
        cfg.devMode = jQuery(this).is(":checked");
        saveSettingsDebounced();
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

    jQuery("#yp-theme").on("change", function () {
        const value = String(jQuery(this).val());
        onPresetOptionChanged(() => {
            const cfg = getConfig();
            cfg.htmlTheme = value;
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

