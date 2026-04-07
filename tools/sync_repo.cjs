const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====== 🍏 YABLOCHNY PRESET AUTO-SYNC & PUSH ======');

// Define paths
const REPO_ROOT = path.join(__dirname, '..');
const REPO_PRESET_PATH = path.join(REPO_ROOT, '🍎 Yablochny Preset.json');
const INDEX_JS_PATH = path.join(REPO_ROOT, 'index.js');
const PROMPT_EDITS_PATH = path.join(__dirname, 'prompt-edits.json');
const ST_DATA_ROOT = 'c:/sillytavern/SillyTavern/data/default-user';
const ST_LOCAL_PRESET = path.join(ST_DATA_ROOT, 'OpenAI Settings/🍎 Yablochny Preset.json');
const ST_LOCAL_SETTINGS = 'c:/sillytavern/SillyTavern/public/settings.json';

// Parse arguments
let snapshotPath = null;
const args = process.argv.slice(2);
if (args[0]) {
    snapshotPath = path.resolve(args[0]);
    if (!fs.existsSync(snapshotPath)) {
        console.error(`❌ Provided snapshot file not found: ${snapshotPath}`);
        process.exit(1);
    }
}

// 1. Gather Data payload (Either from file or local PC install)
let st_preset = null;
let extension_config = null;

if (snapshotPath) {
    console.log(`📦 Loading from Snapshot: ${snapshotPath}`);
    try {
        const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        st_preset = payload.st_preset;
        extension_config = payload.extension_config;
    } catch (e) {
        console.error('❌ Failed to parse snapshot json:', e.message);
        process.exit(1);
    }
} else {
    console.log(`💻 No snapshot provided. Extracting directly from local PC SillyTavern environment...`);
    try {
        st_preset = JSON.parse(fs.readFileSync(ST_LOCAL_PRESET, 'utf8'));
        console.log(`✅ Loaded PC ST Preset.`);
    } catch (e) {
         console.error(`❌ Failed to read PC ST Preset. Are you sure ST is on this PC? Error: ${e.message}`);
         process.exit(1);
    }

    try {
        const globalSettings = JSON.parse(fs.readFileSync(ST_LOCAL_SETTINGS, 'utf8'));
        extension_config = globalSettings['extension_settings'] ? globalSettings['extension_settings']['yablochny-preset'] : {};
        console.log(`✅ Loaded PC Extension config.`);
    } catch (e) {
        console.log(`⚠️ Could not read settings.json for extension config. Using empty config.`);
        extension_config = {};
    }
}

if (!st_preset) {
    console.error('❌ No ST preset payload found. Aborting.');
    process.exit(1);
}

// 2. Diff and Merge into Repository Preset JSON
console.log('\n🔄 Syncing Master Preset JSON...');
let repoPreset = {};
if (fs.existsSync(REPO_PRESET_PATH)) {
    repoPreset = JSON.parse(fs.readFileSync(REPO_PRESET_PATH, 'utf8'));
}

// Prompts & Order
if (st_preset.prompts) repoPreset.prompts = st_preset.prompts;
if (st_preset.prompt_order) repoPreset.prompt_order = st_preset.prompt_order;

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
    'skip_special_tokens', 'presetName', 'thingsSelected', 'imageMode',
    'lengthMode', 'POVMode', 'htmlTheme'
];

safeKeys.forEach(key => {
    if (st_preset[key] !== undefined) {
        repoPreset[key] = st_preset[key];
    }
});
fs.writeFileSync(REPO_PRESET_PATH, JSON.stringify(repoPreset, null, 4));
console.log(`✅ Repo JSON successfully overridden with master state.`);

// 3. Document Extension Prompt Edits
console.log('\n📝 Documenting Extension prompt variations...');
if (extension_config && extension_config.promptEdits) {
    fs.writeFileSync(PROMPT_EDITS_PATH, JSON.stringify(extension_config.promptEdits, null, 4));
    console.log(`✅ Wrote prompt modifications to tools/prompt-edits.json`);
} else {
    console.log(`❕ No custom promptEdits found in config payload.`);
}

// 4. Splice new IDs to index.js
console.log('\n🧬 Reconstructing KNOWN_PRESET_IDS in index.js...');
if (fs.existsSync(INDEX_JS_PATH) && st_preset.prompts) {
    let indexJsContent = fs.readFileSync(INDEX_JS_PATH, 'utf8');
    const regex = /const KNOWN_PRESET_IDS\s*=\s*\[([\s\S]*?)\];/;
    const match = indexJsContent.match(regex);

    if (match) {
        const currentArrayContent = match[1];
        const existingIds = new Set();
        const idRegex = /["']([0-9a-fA-F-]+)["']/g;
        let m;
        while ((m = idRegex.exec(currentArrayContent)) !== null) {
            existingIds.add(m[1]);
        }
        if (currentArrayContent.includes("main")) existingIds.add("main");

        const newIds = [];
        st_preset.prompts.forEach(p => {
            if (p.identifier && !existingIds.has(p.identifier)) {
                newIds.push(p.identifier);
                console.log(`➕ Added newly mapped identifier: ${p.identifier} (${p.name})`);
            }
        });

        if (newIds.length > 0) {
            const insertionPoint = match.index + match[0].lastIndexOf(']');
            const newLines = newIds.map(id => `        "${id}", // Synced from dev snapshot`).join('\n');
            const contentBeforeEnd = indexJsContent.substring(match.index, insertionPoint);
            const needsComma = !contentBeforeEnd.trim().endsWith(',') && !contentBeforeEnd.trim().endsWith('[');
            const insertionString = (needsComma ? ',' : '') + '\n' + newLines + '\n';

            const newIndexJsContent = indexJsContent.substring(0, insertionPoint) +
                insertionString +
                indexJsContent.substring(insertionPoint);

            fs.writeFileSync(INDEX_JS_PATH, newIndexJsContent, 'utf8');
            console.log(`✅ Injected ${newIds.length} new IDs to index.js history.`);
        } else {
            console.log(`✅ No unknown IDs found. Index.js remains clean.`);
        }
    } else {
        console.warn('⚠️ Could not locate KNOWN_PRESET_IDS array in index.js.');
    }
}

// 5. GitHub Pipeline
console.log('\n🚀 Initiating Git Sync & Push...');
try {
    const gitStatus = execSync('git status --porcelain', { cwd: REPO_ROOT }).toString();
    if (gitStatus.trim().length === 0) {
        console.log('✅ Git repository has no new changes. Everything is already up to date.');
    } else {
        console.log('🔄 Staging changes...');
        execSync('git add .', { cwd: REPO_ROOT });
        console.log('🔄 Committing...');
        execSync('git commit -m "chore(sync): automated dev snapshot push"', { cwd: REPO_ROOT });
        console.log('🔄 Pushing to GitHub...');
        const pushBuffer = execSync('git push', { cwd: REPO_ROOT });
        console.log(pushBuffer.toString());
        console.log('🎉 Push successful! System fully matched.');
    }
} catch (e) {
    console.error(`❌ Git pipeline failed. You may need to commit manually. Error: ${e.message}`);
    if (e.stdout) console.log(e.stdout.toString());
    if (e.stderr) console.error(e.stderr.toString());
}
