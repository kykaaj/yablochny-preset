const fs = require('fs');
const path = require('path');

const regexesDir = path.join(__dirname, '../regexes');
const outputDir = path.join(__dirname, '../regex-exports');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const files = fs.readdirSync(regexesDir).filter(f => f.endsWith('.json'));

let allScripts = [];

for (const file of files) {
    const filePath = path.join(regexesDir, file);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.scripts && Array.isArray(data.scripts)) {
            // Write individual file
            const outputPath = path.join(outputDir, file);
            fs.writeFileSync(outputPath, JSON.stringify(data.scripts, null, 2));
            console.log(`Exported: ${outputPath}`);
            
            // Add to all
            allScripts.push(...data.scripts);
        }
    } catch (e) {
        console.error(`Error processing ${file}:`, e.message);
    }
}

// Write combined file
const allOutputPath = path.join(outputDir, 'ALL-COMBINED.json');
fs.writeFileSync(allOutputPath, JSON.stringify(allScripts, null, 2));
console.log(`Exported ALL-COMBINED.json with ${allScripts.length} total regexes.`);
