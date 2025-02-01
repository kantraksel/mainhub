let logShutdown: () => void;
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV == null) {
    logShutdown = require('why-is-node-running');
}

// shutdown in debug environment
declare global {
    // eslint-disable-next-line no-var
    var shutdownDebug: () => void;
}

export default function(stop: (s: NodeJS.Signals) => void): void {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV == null) {
        global.shutdownDebug = () => {
            stop('SIGTERM');
            setTimeout(logShutdown, 3000);
        };
    }
}
