export default function (message) {
    if (!loggingEnabled) return;

    console.log(`skribbl.io AutoDraw: ${message}`);
};

let loggingEnabled = true;
