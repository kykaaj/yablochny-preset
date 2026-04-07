const fs = require('fs');
const path = require('path');

const settingsPath = 'c:/sillytavern/SillyTavern/data/default-user/settings.json';
const oldEditsPath = path.join(__dirname, 'prompt-edits.json');

const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const cfg = s.extension_settings?.['yablochny-preset'] || {};
const currentEdits = cfg.promptEdits || {};

let oldEdits = {};
if (fs.existsSync(oldEditsPath)) {
    oldEdits = JSON.parse(fs.readFileSync(oldEditsPath, 'utf8'));
}

console.log('=== Current promptEdits from settings.json ===');
for (const [cat, variants] of Object.entries(currentEdits)) {
    if (typeof variants === 'object' && variants !== null) {
        for (const [key, val] of Object.entries(variants)) {
            const preview = String(val).substring(0, 100).replace(/\n/g, '\\n');
            const oldVal = oldEdits[cat]?.[key];
            const status = oldVal === val ? '(unchanged)' : oldVal ? '(CHANGED)' : '(NEW)';
            console.log(`  [${cat}][${key}] ${status}: ${preview}...`);
        }
    }
}

console.log('\n=== Keys in old prompt-edits.json but NOT in current ===');
for (const [cat, variants] of Object.entries(oldEdits)) {
    if (typeof variants === 'object' && variants !== null) {
        for (const key of Object.keys(variants)) {
            if (!currentEdits[cat]?.[key]) {
                console.log(`  REMOVED: [${cat}][${key}]`);
            }
        }
    }
}
