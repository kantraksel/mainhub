import { NextFunction, Request, Response } from 'express';
import GlobalScope from '../Systems/global-scope';
import RouteLimit from '../Systems/Rate/route-limit';
import config from '../config';
import ApplicationStore from './Stores/ApplicationStore';

interface UserInfoExt {
    // Account
    id: number;
    discordId: string;
    name: string;
    createTime: number;

    services: Array<{ name: string, link: string }>;
}

export default class ClientApiPortal {
    private appStore: ApplicationStore;
    private endpointLimit: RouteLimit;

    public constructor(global: GlobalScope) {
        const {apiRouter, database} = global;
        this.appStore = new ApplicationStore(database);

        apiRouter.get('/user', (req: Request, res: Response, next: NextFunction) => {
            this.onGetUser(req, res).catch(next);
        });

        this.endpointLimit = new RouteLimit(config.apiLimits.endpointLimiter);
        logger.info('Constructed ClientApiPortal');
    }

    private async onGetUser(req: Request, res: Response): Promise<void> {
        if (!await this.endpointLimit.consumeAccess(req, res)) {
            return;
        }

        const user = req.session.ACCOUNT as UserInfoExt | null;
        if (user == null) {
            await res.rateLimit!.consumeError(req, res, 401);
            return;
        }
        user.services = [];

        const conns = await this.appStore.getAppConnectionsByUserId(user.id);
        if (conns == null) {
            res.status(200).send(user);
            return;
        }

        const apps = await this.appStore.getApplications();
        if (apps == null) {
            await res.rateLimit!.consumeError(req, res, 500);
            return;
        }

        delete conns.id;
        for (const appId in conns) {
            const app = apps.find(app => app.id2 == appId);
            if (app != null) {
                user.services.push({ name: app.name, link: app.login_url });
            }
        }

        res.status(200).send(user);
    }
}
