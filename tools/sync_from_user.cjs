const fs = require('fs');
const path = require('path');

// Determine paths
// We assume we are running from the extension root or tools folder, but we know exact paths.
// Ideally, this should find the user data folder dynamically, but per user request, we hardcode to THEIR specific setup for reliability.

const USER_PRESET_PATH = 'c:/sillytavern/SillyTavern/data/default-user/OpenAI Settings/🍎 Yablochny Preset.json';
const REPO_PRESET_PATH = path.join(__dirname, '../🍎 Yablochny Preset.json');

console.log('🔄 Starting Yablochny Preset Sync...');
console.log(`📂 User Preset: ${USER_PRESET_PATH}`);
console.log(`📂 Repo Preset: ${REPO_PRESET_PATH}`);

if (!fs.existsSync(USER_PRESET_PATH)) {
    console.error('❌ Error: User preset file not found at expected path!');
    console.error('   Please ensure you have "🍎 Yablochny Preset" selected and saved in SillyTavern.');
    process.exit(1);
}

try {
    const userPreset = JSON.parse(fs.readFileSync(USER_PRESET_PATH, 'utf8'));
    let repoPreset = {};

    if (fs.existsSync(REPO_PRESET_PATH)) {
        repoPreset = JSON.parse(fs.readFileSync(REPO_PRESET_PATH, 'utf8'));
    } else {
        console.warn('⚠️ Repo preset not found, creating new one based on user preset.');
    }

    // 1. Sync PROMPTS (The content of what the AI is told)
    if (userPreset.prompts) {
        repoPreset.prompts = userPreset.prompts;
        console.log(`✅ Synced ${userPreset.prompts.length} prompts.`);
    }

    // 2. Sync PROMPT ORDER (Crucial for UI list order)
    if (userPreset.prompt_order) {
        repoPreset.prompt_order = userPreset.prompt_order;
        console.log('✅ Synced prompt display order.');
    }

    // 3. Sync SAFE Settings (Generation params, context size, etc.)
    // We explicitly exclude keys that might contain API keys (like 'openai_key', 'proxy_url', etc.) just in case.
    const safeKeys = [
        'is_public_domain', 'disable_output_sequence', 'active_character',
        'temperature', 'frequency_penalty', 'presence_penalty',
        'top_p', 'top_k', 'top_a', 'min_p', 'repetition_penalty',
        'max_context_unlocked', 'names_behavior', 'send_if_empty',
        'impersonation_prompt', 'continue_nudge_prompt',
        'wi_format', 'scenario_format', 'personality_format', 'group_nudge_prompt',
        'system_prompt_prefix', 'system_prompt_suffix',
        'input_sequence', 'output_sequence', 'first_output_sequence',
        'wrap_in_quotes', 'include_newline', 'add_bos_token', 'ban_eos_token',
        'skip_special_tokens',
        'presetName', // Extension specific
        'thingsSelected', // Extension specific
        'imageMode', // Extension specific
        'lengthMode', // Extension specific
        'POVMode', // Extension specific
        'htmlTheme' // Extension specific
    ];

    let settingsCount = 0;
    safeKeys.forEach(key => {
        if (userPreset[key] !== undefined) {
            repoPreset[key] = userPreset[key];
            settingsCount++;
        }
    });
    console.log(`✅ Synced ${settingsCount} safe settings.`);

    // Write back to repo file
    fs.writeFileSync(REPO_PRESET_PATH, JSON.stringify(repoPreset, null, 4));
    console.log('🎉 Sync Complete! The repository file is updated.');

} catch (err) {
    console.error('❌ Error syncing preset:', err);
    process.exit(1);
}
