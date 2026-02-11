const fs = require('fs');
const path = require('path');

const presetPath = path.resolve('🍎Yablochny Preset.json');
const defaultsPath = path.resolve('defaults.json');

try {
    const presetData = JSON.parse(fs.readFileSync(presetPath, 'utf8'));

    // Extract settings (root fields that are not prompts/extensions/prompt_order)
    const settings = {};
    const excludedKeys = ['prompts', 'prompt_order', 'extensions', 'version'];
    for (const key in presetData) {
        if (!excludedKeys.includes(key)) {
            settings[key] = presetData[key];
        }
    }

    // Process prompts
    const prompts = presetData.prompts.map(p => {
        const newP = { ...p };
        // Add a version if missing (default to 1)
        if (!newP.version) newP.version = 1;

        // Add default_enabled based on checking prompt_order or just default to false if not found?
        // Actually, we can check if it's enabled in the preset's prompt_order.
        // But for defaults, we want to set what the *default* state should be.
        // I'll assume the state in the preset file is the desired default.
        // We need to find this prompt in prompt_order to see if it's enabled.
        let isEnabled = false;
        if (presetData.prompt_order) {
            for (const group of presetData.prompt_order) {
                const item = group.order.find(o => o.identifier === newP.identifier);
                if (item) {
                    isEnabled = item.enabled;
                    break;
                }
            }
        }
        newP.default_enabled = isEnabled;

        // Special handling for 'language (change)' prompt to add variants
        if (newP.identifier === '28ec4454-b3c2-4c06-8fd0-52cb123b778f') {
            newP.variants = [
                {
                    name: 'Russian',
                    content: newP.content // Current content is Russian
                },
                {
                    name: 'English',
                    content: `{{setvar::extralang::English}}<language>
OUTPUT LANGUAGE: ENGLISH:
- ALL content in English: narration, dialogue, thoughts.
- Apply natural, informal English.
- Other languages forbidden — except in-character foreign speech if contextually appropriate.
</language>
{{setvar::lang_check::- LANGUAGE: Is entire output in English? Any accidental Russian/other?}}`
                },
                {
                    name: 'Ukrainian',
                    content: `{{setvar::extralang::Ukrainian}}<language>
OUTPUT LANGUAGE: UKRAINIAN:
- ALL content in Ukrainian: narration, dialogue, thoughts.
- Apply natural, informal Ukrainian.
- Other languages forbidden — except in-character foreign speech if contextually appropriate.
</language>
{{setvar::lang_check::- LANGUAGE: Is entire output in Ukrainian? Any accidental English/other?}}`
                }
            ];
            // Set English as default? No, the user seems to want Russian default.
        }

        return newP;
    });

    const output = {
        version: "2.0.0",
        settings: settings,
        prompts: prompts,
        prompt_order: presetData.prompt_order,
        extensions: presetData.extensions
    };

    fs.writeFileSync(defaultsPath, JSON.stringify(output, null, 4), 'utf8');
    console.log('Successfully created defaults.json');

} catch (err) {
    console.error('Error:', err);
}
