import { NextFunction, Request, Response } from 'express';
import GlobalScope from '../../Systems/global-scope';
import validators from '../../Systems/validators';
import IdentityProviderPortal from './identity-portal';
import ApplicationStore from '../Stores/ApplicationStore';
import RouteLimit from '../../Systems/Rate/route-limit';
import config from '../../config';

class ResourcePortal {
    private idProvider: IdentityProviderPortal;
    private store: ApplicationStore;
    private endpointLimit: RouteLimit;

    public constructor(global: GlobalScope) {
        const {apiRouter, idProviderPortal, database} = global;
        this.idProvider = idProviderPortal;
        this.store = new ApplicationStore(database);

        apiRouter.get('/user/:service', (req: Request, res: Response, next: NextFunction) => {
            this.onCurrentUser(req, res).catch(next);
        });

        this.endpointLimit = new RouteLimit(config.apiLimits.endpointLimiter);
        logger.info('Constructed ResourcePortal');
    }

    private async onCurrentUser(req: Request, res: Response): Promise<void> {
        if (!await this.endpointLimit.consumeAccess(req, res)) {
            return;
        }

        const accountId = await this.idProvider.getAccountId(req);
        if (accountId == null) {
            await res.rateLimit!.consumeError(req, res, 401);
            return;
        }

        let {service} = req.params;
        if (!validators.isServiceNameValid(service)) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }

        const connInfo = await this.store.getAppConnectionByUserId(accountId, service);
        if (connInfo == null) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }
        res.status(200).send(connInfo);
    }
}

export default ResourcePortal;
