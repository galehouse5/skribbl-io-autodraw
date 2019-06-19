import log from "./log";

export default function (commands, delay) {
    let process = function () {
        if (!commands.length) { 
            log (`Processing finished.`);
            return;
        }

        let command = commands.shift();
        command();

        if (commands.length % 100 == 0 && commands.length > 0) {
            log(`${commands.length} commands remaining to process.`);
        }
        setTimeout(process, delay || 0);
    };

    log(`Processing ${commands.length} commands...`);
    process();
};
