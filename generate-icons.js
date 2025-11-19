#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Generating PWA icons...\n');

// Read the SVG file
const svgPath = path.join(__dirname, 'public', 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('✅ SVG loaded');
console.log('\nFor å generere PNG-ikoner, bruk ett av disse alternativene:\n');

console.log('📌 Alternativ 1 - Online (raskest):');
console.log('   1. Gå til: https://www.pwabuilder.com/imageGenerator');
console.log('   2. Last opp filen: public/icon.svg');
console.log('   3. Last ned 192x192 og 512x512 ikonene');
console.log('   4. Lagre som icon-192.png og icon-512.png i public/\n');

console.log('📌 Alternativ 2 - CloudConvert:');
console.log('   1. Gå til: https://cloudconvert.com/svg-to-png');
console.log('   2. Last opp: public/icon.svg');
console.log('   3. Sett størrelse til 192x192, konverter');
console.log('   4. Gjenta for 512x512\n');

console.log('📌 Alternativ 3 - ImageMagick (hvis installert):');
console.log('   cd public');
console.log('   convert icon.svg -resize 192x192 icon-192.png');
console.log('   convert icon.svg -resize 512x512 icon-512.png\n');

console.log('📌 Alternativ 4 - Inkscape (hvis installert):');
console.log('   inkscape icon.svg -w 192 -h 192 -o icon-192.png');
console.log('   inkscape icon.svg -w 512 -h 512 -o icon-512.png\n');

// Save SVG to a data URL for easy upload
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
const htmlPreview = `
<!DOCTYPE html>
<html>
<head>
    <title>Icon Preview</title>
    <style>
        body {
            font-family: Arial;
            text-align: center;
            padding: 20px;
            background: #f0f0f0;
        }
        .icon {
            margin: 20px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
        }
        img {
            border: 1px solid #ddd;
            border-radius: 10px;
        }
        a {
            display: inline-block;
            margin: 10px;
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        a:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <h1>PWA Icon Preview</h1>
    <div class="icon">
        <img src="${dataUrl}" width="192" height="192">
        <p>192x192</p>
    </div>
    <div class="icon">
        <img src="${dataUrl}" width="512" height="512">
        <p>512x512</p>
    </div>

    <h2>Generer PNG-ikoner:</h2>
    <a href="https://www.pwabuilder.com/imageGenerator" target="_blank">PWA Builder</a>
    <a href="https://cloudconvert.com/svg-to-png" target="_blank">CloudConvert</a>

    <p style="margin-top: 40px; color: #666;">
        Last ned public/icon.svg og bruk ett av verktøyene over for å generere PNG-filer.
    </p>
</body>
</html>
`;

// Save preview HTML
const previewPath = path.join(__dirname, 'icon-preview.html');
fs.writeFileSync(previewPath, htmlPreview);

console.log(`✅ Forhåndsvisning lagret: ${previewPath}`);
console.log('\n🔍 Åpne icon-preview.html i nettleseren for å se ikonet');
console.log('📥 Høyreklikk på bildet og velg "Last ned" for å lagre SVG\n');
