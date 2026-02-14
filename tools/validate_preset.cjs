/**
 * Validates the Yablochny Preset JSON file
 * Checks for valid JSON syntax, required fields, and structure
 */

const fs = require('fs');
const path = require('path');

const PRESET_PATH = path.join(__dirname, '..', '🍎 Yablochny Preset.json');

function validatePreset() {
    console.log('[Validation] Checking preset file...');

    // Check if file exists
    if (!fs.existsSync(PRESET_PATH)) {
        console.error('[Validation] ERROR: Preset file not found at:', PRESET_PATH);
        process.exit(1);
    }

    // Read and parse JSON
    let preset;
    try {
        const content = fs.readFileSync(PRESET_PATH, 'utf8');
        preset = JSON.parse(content);
        console.log('[Validation] ✓ Valid JSON syntax');
    } catch (err) {
        console.error('[Validation] ERROR: Invalid JSON syntax');
        console.error(err.message);
        process.exit(1);
    }

    // Check required fields
    const requiredFields = ['prompts'];
    for (const field of requiredFields) {
        if (!preset[field]) {
            console.error(`[Validation] ERROR: Missing required field: ${field}`);
            process.exit(1);
        }
    }
    console.log('[Validation] ✓ Required fields present');

    // Check prompts structure
    if (!Array.isArray(preset.prompts)) {
        console.error('[Validation] ERROR: "prompts" must be an array');
        process.exit(1);
    }

    // Validate each prompt
    for (let i = 0; i < preset.prompts.length; i++) {
        const prompt = preset.prompts[i];
        if (!prompt.identifier) {
            console.error(`[Validation] ERROR: Prompt at index ${i} missing "identifier"`);
            process.exit(1);
        }
        if (prompt.name === undefined) {
            console.error(`[Validation] ERROR: Prompt at index ${i} missing "name"`);
            process.exit(1);
        }
        if (prompt.content === undefined && !prompt.marker) {
            console.error(`[Validation] ERROR: Prompt at index ${i} missing "content"`);
            process.exit(1);
        }
    }
    console.log(`[Validation] ✓ All ${preset.prompts.length} prompts valid`);

    console.log('[Validation] ✓ Preset validation passed!');
    return true;
}

// Run validation
try {
    validatePreset();
} catch (err) {
    console.error('[Validation] Unexpected error:', err);
    process.exit(1);
}
