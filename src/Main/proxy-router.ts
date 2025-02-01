import { Application, NextFunction, Request, Response, Router } from 'express';
import config from '../config';

function proxyMiddleware(_req: Request, res: Response, next: NextFunction): void {
    let orig = res.redirect;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let redirectProxy = (param1: any, param2?: any): void => {
        let url: string;
        let status = 302;
        if (typeof(param1) == 'string') {
            url = param1;
            
            if (typeof(param2) == 'number') {
                status = param2;
            }
        } else if (typeof(param1) == 'number' && typeof(param2) == 'string') {
            url = param2;
            status = param1;
        }
        else {
            throw new TypeError('proxyRedirect: Invalid params');
        }

        if (!url.startsWith('/')) {
            orig.call(res, url, status);
        } else {
            orig.call(res, `${config.proxyPath}${url}`, status);
        }
    };

    res.redirect = redirectProxy;
    next();
}

function proxyRouter(app: Application): Router {
    // eslint-disable-next-line new-cap
    let r = Router();
    
    if (config.proxyEnable) {
        app.use(config.proxyPath, r);
        r.use(proxyMiddleware);
        logger.info(`Set proxy to ${config.proxyPath}`);
    } else {
        app.use(r);
        logger.info('Proxy is disabled');
    }
    return r;
}

export default proxyRouter;
