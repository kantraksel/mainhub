import { NextFunction, Request, Response } from 'express';
import AccountStore from './account-store';
import GlobalScope from '../../Systems/global-scope';
import LoginError from './login-error';
import { random } from '../../Systems/crypto';
import validators from '../../Systems/validators';
import IdentityAuth from '../../Systems/Discord/IdentityAuth';
import RouteLimit from '../../Systems/Rate/route-limit';
import config from '../../config';

class LoginPortal {
    private discord: IdentityAuth;
    private accountStore: AccountStore;
    private authorizeLimit: RouteLimit;

    public constructor(global: GlobalScope) {
        const {app, database} = global;
        this.discord = new IdentityAuth(config.discordId, process.env.DISCORD_SECRET!, config.discordAuthCallback);
        this.accountStore = new AccountStore(database);

        app.get('/login', (req: Request, res: Response) => {
            this.onLogin(req, res);
        });
        app.get('/authorize', (req: Request, res: Response, next: NextFunction) => {
            this.onAuthorize(req, res).catch(next);
        });
        app.get('/logout', (req: Request, res: Response) => {
            this.onLogout(req, res);
        });

        this.authorizeLimit = new RouteLimit(config.authorizeLimit);
        logger.info('Constructed LoginPortal');
    }

    private onLogin(req: Request, res: Response): void {
        if (req.session.ACCOUNT != null) {
            res.redirect('/');
            return;
        }

        req.session.AUTH_ERROR = null;

        let id = random(22);
        req.session.AUTH_STATE = id;
        this.discord.request(id, res);
    }

    private async onAuthorize(req: Request, res: Response): Promise<void> {
        if (!await this.authorizeLimit.consumeAccess(req, res)) {
            return;
        }

        if (req.session.ACCOUNT != null || req.session.AUTH_ERROR != null) {
            res.redirect('/');
            return;
        }

        if (req.session.AUTH_STATE == null || !validators.isQueryValid(req.query)) {
            if (!await res.rateLimit!.consumeError(req, res)) {
                return;
            }
            req.session.AUTH_ERROR = new LoginError(null, false);
            res.redirect('/');
            return;
        }
        
        const result = await this.discord.response(req, req.session.AUTH_STATE);
        if (result?.object != null) {
            // for some reason snowflakes contain comma
            result.object.id = result.object.id.replace(/,/g, '');

            let account = await this.accountStore.getAccount(result.object.id);
            if (account != null) {
                req.session.ACCOUNT = account;
                logger.info(`[${req.sessionID}] ${account.discordId} authenticated successfully`);
            } else {
                req.session.AUTH_ERROR = new LoginError(null, true);
            }
        } else {
            req.session.AUTH_ERROR = new LoginError(result, false);
        }

        if (req.session.AUTH_ERROR != null && !req.session.AUTH_ERROR.cancelByUser) {
            if (!await res.rateLimit!.consumeError(req, res)) {
                return;
            }

            if (result != null) {
                let id;
                if (result.object != null) {
                    id = result.object.id;
                } else {
                    id = req.ip;
                }
                logger.warn(`${id} tried to authenticate: ${req.session.AUTH_ERROR.type} ${req.session.AUTH_ERROR.code} ${req.session.AUTH_ERROR.statusCode}`);
            }
        }
        res.redirect('/');
    }

    private onLogout(req: Request, res: Response): void {
        if (req.session.ACCOUNT != null) {
            logger.info(`[${req.sessionID}] ${req.session.ACCOUNT.discordId} logged out`);
        }

        req.session.ACCOUNT = null;
        req.session.AUTH_ERROR = null;
        res.redirect('/');
    }
}

export default LoginPortal;
