/**
 * Applies prompt edits from tools/prompt-edits.json to index.js constants
 * This script is run during the /push workflow to persist developer edits
 */

const fs = require('fs');
const path = require('path');

const EDITS_PATH = path.join(__dirname, 'prompt-edits.json');
const INDEX_PATH = path.join(__dirname, '..', 'index.js');

// Map of variant types to their constant names in index.js
const CONSTANT_MAP = {
    language: 'LANGUAGE_VARIANTS',
    length: 'LENGTH_VARIANTS',
    pov: 'POV_VARIANTS',
    tense: 'TENSE_VARIANTS',
    prose: 'PROSE_VARIANTS',
    speech: 'SPEECH_VARIANTS',
    theme: 'HTML_THEME',
    image: 'IMAGE_VARIANTS',
};

function escapeForRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeForReplacement(str) {
    return str.replace(/\$/g, '$$$$');
}

function applyEdits() {
    console.log('[Apply Edits] Starting...');
    
    // Check if edits file exists
    if (!fs.existsSync(EDITS_PATH)) {
        console.log('[Apply Edits] No prompt-edits.json found, nothing to apply');
        return;
    }
    
    // Load edits
    let edits;
    try {
        const content = fs.readFileSync(EDITS_PATH, 'utf8');
        edits = JSON.parse(content);
        console.log('[Apply Edits] Loaded edits file');
    } catch (err) {
        console.error('[Apply Edits] ERROR: Failed to parse prompt-edits.json');
        console.error(err.message);
        process.exit(1);
    }
    
    // Load index.js
    let indexContent;
    try {
        indexContent = fs.readFileSync(INDEX_PATH, 'utf8');
        console.log('[Apply Edits] Loaded index.js');
    } catch (err) {
        console.error('[Apply Edits] ERROR: Failed to read index.js');
        console.error(err.message);
        process.exit(1);
    }
    
    let modified = false;
    
    // Apply variant edits
    for (const [variantType, variants] of Object.entries(edits)) {
        if (variantType === 'things') continue; // Handle things separately
        
        const constantName = CONSTANT_MAP[variantType];
        if (!constantName) {
            console.warn(`[Apply Edits] Unknown variant type: ${variantType}, skipping`);
            continue;
        }
        
        console.log(`[Apply Edits] Processing ${variantType} (${constantName})...`);
        
        for (const [variantKey, newContent] of Object.entries(variants)) {
            console.log(`[Apply Edits]   - Updating ${variantKey}`);
            
            // Build regex to find the specific key in the constant object
            // Pattern: "key": `content`,
            const keyPattern = `"${escapeForRegex(variantKey)}":\\s*\`[\\s\\S]*?\`,`;
            const regex = new RegExp(keyPattern, 'g');
            
            // Escape backticks in content
            const escapedContent = newContent.replace(/`/g, '\\`');
            
            // Build replacement
            const replacement = `"${variantKey}": \`${escapedContent}\`,`;
            
            // Apply replacement
            const beforeLength = indexContent.length;
            indexContent = indexContent.replace(regex, escapeForReplacement(replacement));
            
            if (indexContent.length !== beforeLength) {
                modified = true;
                console.log(`[Apply Edits]     ✓ Applied`);
            } else {
                console.warn(`[Apply Edits]     ⚠ Pattern not found, skipping`);
            }
        }
    }
    
    // Apply Things edits
    if (edits.things) {
        console.log('[Apply Edits] Processing Things...');
        
        for (const [groupKey, things] of Object.entries(edits.things)) {
            for (const [thingId, newContent] of Object.entries(things)) {
                console.log(`[Apply Edits]   - Updating ${groupKey}/${thingId}`);
                
                // Pattern: id: "thingId", ... content: `...`,
                const idPattern = `id:\\s*"${escapeForRegex(thingId)}",[\\s\\S]*?content:\\s*\`[\\s\\S]*?\`,`;
                const regex = new RegExp(idPattern, 'g');
                
                // Find the match to preserve label
                const match = indexContent.match(regex);
                if (match) {
                    const oldBlock = match[0];
                    // Extract label
                    const labelMatch = oldBlock.match(/label:\s*"([^"]*)"/);
                    const label = labelMatch ? labelMatch[1] : '';
                    
                    // Escape backticks in content
                    const escapedContent = newContent.replace(/`/g, '\\`');
                    
                    // Build replacement preserving structure
                    const replacement = `id: "${thingId}",\n            label: "${label}",\n            content: \`${escapedContent}\`,`;
                    
                    const beforeLength = indexContent.length;
                    indexContent = indexContent.replace(regex, escapeForReplacement(replacement));
                    
                    if (indexContent.length !== beforeLength) {
                        modified = true;
                        console.log(`[Apply Edits]     ✓ Applied`);
                    } else {
                        console.warn(`[Apply Edits]     ⚠ Pattern not found, skipping`);
                    }
                } else {
                    console.warn(`[Apply Edits]     ⚠ Thing not found: ${groupKey}/${thingId}`);
                }
            }
        }
    }
    
    if (modified) {
        // Write back to index.js
        try {
            fs.writeFileSync(INDEX_PATH, indexContent, 'utf8');
            console.log('[Apply Edits] ✓ Changes written to index.js');
        } catch (err) {
            console.error('[Apply Edits] ERROR: Failed to write index.js');
            console.error(err.message);
            process.exit(1);
        }
    } else {
        console.log('[Apply Edits] No changes applied');
    }
    
    console.log('[Apply Edits] Done!');
}

// Run
try {
    applyEdits();
} catch (err) {
    console.error('[Apply Edits] Unexpected error:', err);
    process.exit(1);
}
