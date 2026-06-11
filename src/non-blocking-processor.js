import log from "./log";

// Skribbl samples pointer input at ~60Hz and silently drops or corrupts strokes
// that arrive faster (measured via src/diagnostics.js; see analysis/README.md).
// One command per sampling frame makes every stroke register.
const commandIntervalMs = 16;

export default function (commands, shouldStop) {
    const process = function () {
        if (!commands.length)
            return log("Processing finished.");

        if (shouldStop && shouldStop())
            return log("Processing stopped.");

        const command = commands.shift();
        command();

        if (commands.length % 100 == 0 && commands.length > 0) {
            log(`${commands.length} commands remaining to process.`);
        }

        setTimeout(process, commandIntervalMs);
    };

    log(`Processing ${commands.length} commands...`);
    process();
};
