import dotnev from 'dotenv';
dotnev.config({ path: process.env.KEYS_FILE });

import installDevShutdown from './Main/dev-shutdown';
require('./Systems/shutdown-pool');
require('./Main/global-logger');

console.log("Initializing app");
import server from './Main/server';
import cryptoInit from './Systems/crypto';
import GlobalScope from './Systems/global-scope';
console.log("Imported modules");

let globalScope: GlobalScope | null = null;

async function start(): Promise<void> {
    await cryptoInit;
    globalScope = new GlobalScope(server.app);
    await globalScope.init();

    logger.info('Starting server');
    await server.listen();
}
void start();

async function stop(signal: NodeJS.Signals): Promise<void> {
    logger.info(`${signal} received, closing server`);

    await server.stop();
    global.shutdownPool.shutdown();

    logger.info('Server closed. Systems may still be closing');
    logger.info('Next signal will crash process');
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
installDevShutdown(stop);
