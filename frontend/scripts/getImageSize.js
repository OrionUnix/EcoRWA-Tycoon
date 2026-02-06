
const fs = require('fs');

function getWebPSize(filePath) {
    const buffer = fs.readFileSync(filePath);
    // basic WebP header parsing
    if (buffer.toString('utf8', 0, 4) !== 'RIFF' || buffer.toString('utf8', 8, 12) !== 'WEBP') {
        throw new Error('Not a WebP file');
    }

    // VP8 (lossy)
    if (buffer.toString('utf8', 12, 16) === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3FFF;
        const height = buffer.readUInt16LE(28) & 0x3FFF;
        return { width, height };
    }

    // VP8L (lossless)
    if (buffer.toString('utf8', 12, 16) === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        const width = (bits & 0x3FFF) + 1;
        const height = ((bits >> 14) & 0x3FFF) + 1;
        return { width, height };
    }

    // VP8X (extended)
    if (buffer.toString('utf8', 12, 16) === 'VP8X') {
        const width = (buffer.readUInt32LE(24) & 0xFFFFFF) + 1;
        const height = (buffer.readUInt32LE(27) & 0xFFFFFF) + 1;
        return { width, height };
    }

    return null;
}

try {
    const size = getWebPSize('H:/travail/EcoRWA Tycoon/frontend/public/assets/models/house/animat01.webp');
    console.log(JSON.stringify(size));
} catch (e) {
    console.error(e.message);
}
