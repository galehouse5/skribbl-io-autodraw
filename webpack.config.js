module.exports = {
    // Prevents the following CSP-related exception for development build:
    //  Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an
    //  allowed source of script in the following Content Security Policy directive: "script-src 'self'
    //  blob: filesystem: chrome-extension-resource:".
    devtool: false
};
