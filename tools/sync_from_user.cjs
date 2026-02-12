const fs = require('fs');
const path = require('path');

// Determine paths
// We assume we are running from the extension root or tools folder, but we know exact paths.
// Ideally, this should find the user data folder dynamically, but per user request, we hardcode to THEIR specific setup for reliability.

const USER_PRESET_PATH = 'c:/sillytavern/SillyTavern/data/default-user/OpenAI Settings/🍎 Yablochny Preset.json';
const REPO_PRESET_PATH = path.join(__dirname, '../🍎 Yablochny Preset.json');
const INDEX_JS_PATH = path.join(__dirname, '../index.js');

console.log('🔄 Starting Yablochny Preset Sync...');
console.log(`📂 User Preset: ${USER_PRESET_PATH}`);
console.log(`📂 Repo Preset: ${REPO_PRESET_PATH}`);
console.log(`📂 Index JS:   ${INDEX_JS_PATH}`);

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

    // 4. Update KNOWN_PRESET_IDS in index.js
    // We collect ALL IDs currently in the user preset.
    // We add them to the KNOWN_PRESET_IDS list in index.js if they aren't there.
    // We NEVER remove from KNOWN_PRESET_IDS.

    if (fs.existsSync(INDEX_JS_PATH) && userPreset.prompts) {
        let indexJsContent = fs.readFileSync(INDEX_JS_PATH, 'utf8');

        // Regex to find the array: const KNOWN_PRESET_IDS = [ ... ];
        // Use a simpler regex that captures the content between brackets
        const regex = /const KNOWN_PRESET_IDS\s*=\s*\[([\s\S]*?)\];/;
        const match = indexJsContent.match(regex);

        if (match) {
            const currentArrayContent = match[1];

            // Parse existing IDs (naive parsing: looking for quotes)
            const existingIds = new Set();
            const idRegex = /["']([0-9a-fA-F-]+)["']/g; // Match GUID-like strings or simple IDs
            let m;
            while ((m = idRegex.exec(currentArrayContent)) !== null) {
                existingIds.add(m[1]);
            }
            if (currentArrayContent.includes("main")) existingIds.add("main"); // Special case for main if string regex fails
            // Actually general string regex should catch "main" too if it's quoted.

            // Find NEW IDs from user preset
            const newIds = [];
            userPreset.prompts.forEach(p => {
                if (p.identifier && !existingIds.has(p.identifier)) {
                    newIds.push(p.identifier);
                    console.log(`➕ Registering new official ID: ${p.identifier} (${p.name})`);
                }
            });

            if (newIds.length > 0) {
                // Construct new array content
                // We append new IDs to the set of existing IDs (to keep order somewhat or just append)
                // Actually, let's just append to the string inside the bracket to preserve comments??
                // Replacing the whole array is cleaner code-wise.

                // Combine existing IDs (from regex match might be safer to source from file content execution, but that's hard)
                // Let's rely on our parsed existingIds set + newIds.

                // Wait, parsing existingIds with regex loses comments. 
                // Better approach: Insert new IDs before the closing bracket!

                const insertionPoint = match.index + match[0].lastIndexOf(']');
                const newLines = newIds.map(id => `        "${id}", // Synced from user preset`).join('\n');

                // Check if the list ends with a comma or newline
                const contentBeforeEnd = indexJsContent.substring(match.index, insertionPoint);
                const needsComma = !contentBeforeEnd.trim().endsWith(',') && !contentBeforeEnd.trim().endsWith('[');

                const insertionString = (needsComma ? ',' : '') + '\n' + newLines + '\n';

                const newIndexJsContent = indexJsContent.substring(0, insertionPoint) +
                    insertionString +
                    indexJsContent.substring(insertionPoint);

                fs.writeFileSync(INDEX_JS_PATH, newIndexJsContent, 'utf8');
                console.log(`✅ Registered ${newIds.length} new IDs in index.js history.`);
            } else {
                console.log('✅ No new IDs to register in history.');
            }
        } else {
            console.warn('⚠️ Could not find KNOWN_PRESET_IDS in index.js. Skipping history update.');
        }
    }

    // Write back to repo file
    fs.writeFileSync(REPO_PRESET_PATH, JSON.stringify(repoPreset, null, 4));
    console.log('🎉 Sync Complete! The repository file is updated.');

} catch (err) {
    console.error('❌ Error syncing preset:', err);
    process.exit(1);
}
