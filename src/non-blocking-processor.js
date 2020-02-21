import log from "./log";

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

        setTimeout(process, 0);
    };

    log(`Processing ${commands.length} commands...`);
    process();
};
