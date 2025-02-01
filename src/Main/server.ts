import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import http from 'http';
import * as session from 'express-session';
import config from '../config';
import morgan from 'morgan';
import AppDatabase from '../Systems/database';
const rfs = require('rotating-file-stream');
import {rateLimitMiddleware} from '../Systems/Rate/rate-limit';
import RateLimitGlobal from '../Systems/Rate/rate-limit-global';
import proxyRouter from './proxy-router';
import HybridStore from './hybrid-store';
import ejs from 'ejs';

// configure app
const app: Application = express();
app.disable('x-powered-by');
app.set('trust proxy', config.proxyEnable);
app.engine('html', ejs.renderFile);
app.set('views', config.staticFiles.ejs);
app.set('view engine', 'html'); //add .html extension in render()

// add middlewares: logging, header setup, rate limit, session
const database = new AppDatabase();
const sessionStore = new HybridStore(database);

morgan.token('sessionId', (req) => {
    let express = req as Request;
    return express.sessionID;
});

app.use(morgan(config.logFormat, {
    stream: rfs.createStream(config.accessLogFile, {
        interval: config.logFileRotateInterval,
        compress: 'gzip',
    }),
}));
app.use(morgan(config.logFormat, {
    skip: (_, res) => { return res.statusCode < 400 || res.statusCode == 404; },
    stream: rfs.createStream(config.errorLogFile, {
        interval: config.logFileRotateInterval,
        compress: 'gzip',
    }),
}));

app.use(helmet());
app.use(rateLimitMiddleware(new RateLimitGlobal()));

app.use(session.default({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET!,
    name: config.sessionCookie,
    store: sessionStore,
    cookie: {
        secure: config.sessionSecure,
        httpOnly: true,
        maxAge: config.sessionMaxClientAge,
    },
}));

const router = proxyRouter(app);
const server = http.createServer(app);

/* eslint-disable @typescript-eslint/no-unused-vars */
async function listen(): Promise<void> {
    //override errors, must be set up at very least point
    router.use((req: Request, res: Response, next: NextFunction) => {
        res.status(404).send("404 Not Found");
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
        res.status(502).send("502 Bad Gateway Config");
    });

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        logger.logError(err, req.ip);
        res.status(500).send('500 Internal Error');
    });
    
    await database.init();
    server.listen(config.server.port, config.server.ip);
    logger.info(`Listening on ${config.server.ip}:${config.server.port}`);
}
/* eslint-enable @typescript-eslint/no-unused-vars */

async function stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((err) => {
            if (err != null) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

    await new Promise<void>((resolve, reject) => {
        try {
            sessionStore.close(resolve);
        } catch (err: unknown) {
            reject(err);
        }
    });

    await database.shutdown();
}

export default { listen, app: router, stop };
