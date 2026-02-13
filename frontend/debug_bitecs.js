try {
    const bitecs = require('bitecs');
    console.log("BitECS Exports:", Object.keys(bitecs));
} catch (e) {
    console.error("Error loading bitecs:", e);
}
