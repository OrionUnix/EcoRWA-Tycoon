
const fs = require('fs');

function getWebPSize(filePath) {
    const buffer = fs.readFileSync(filePath);
    if (buffer.toString('utf8', 0, 4) !== 'RIFF' || buffer.toString('utf8', 8, 12) !== 'WEBP') {
        throw new Error('Not a WebP file');
    }
    if (buffer.toString('utf8', 12, 16) === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3FFF;
        const height = buffer.readUInt16LE(28) & 0x3FFF;
        return { width, height };
    }
    if (buffer.toString('utf8', 12, 16) === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        const width = (bits & 0x3FFF) + 1;
        const height = ((bits >> 14) & 0x3FFF) + 1;
        return { width, height };
    }
    if (buffer.toString('utf8', 12, 16) === 'VP8X') {
        const width = (buffer.readUInt32LE(24) & 0xFFFFFF) + 1;
        const height = (buffer.readUInt32LE(27) & 0xFFFFFF) + 1;
        return { width, height };
    }
    return null;
}

const files = [
    'H:/travail/EcoRWA Tycoon/frontend/public/assets/models/house/animat01.webp',
    'H:/travail/EcoRWA Tycoon/frontend/public/assets/models/house/Stgermain_spritsheet.webp'
];

files.forEach(f => {
    try {
        console.log(f + ': ' + JSON.stringify(getWebPSize(f)));
    } catch (e) {
        console.error(f + ': ' + e.message);
    }
});
