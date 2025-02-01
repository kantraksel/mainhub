import express, { NextFunction, Request, Response } from 'express';
import GlobalScope from '../../Systems/global-scope';
import validators from '../../Systems/validators';
import TokenStore from './token-store';
import * as crypto from '../../Systems/crypto';
import RouteLimit from '../../Systems/Rate/route-limit';
import * as tokens from './tokens';
import config from '../../config';

interface AuthRequest {
    response_type?: string;
    client_id?: string;
    scope?: string;
    redirect_uri?: string;
    state?: string;
}

interface TokenRequest {
    client_id?: string;
    client_secret?: string;
    grant_type?: string;
    code?: string;
    refresh_token?: string;
    redirect_uri?: string;
}

interface TokenRevokeRequest {
    client_id?: string;
    client_secret?: string;
    token?: string;
    token_type_hint?: string;
}

class IdentityProviderPortal {
    private store: TokenStore;
    private accessKey: Uint8Array;
    private refreshKey: Uint8Array;
    private codeKey: Uint8Array;
    private authorizeLimit: RouteLimit;
    private tokenLimit: RouteLimit;
    private tokenRevokeLimit: RouteLimit;
    private cleanTask: NodeJS.Timeout;

    private codeExpiresIn: number;
    private tokenExpiresIn: number;

    public constructor(global: GlobalScope) {
        const {apiRouter, database} = global;
        this.store = new TokenStore(database);

        this.codeExpiresIn = config.identityAuthority.codeExpiresIn;
        this.tokenExpiresIn = config.identityAuthority.tokenExpiresIn;

        apiRouter.use(express.urlencoded({
            extended: false,
            limit: "1kb",
            parameterLimit: 10,
        }));

        apiRouter.get('/oauth/authorize', (req: Request, res: Response, next: NextFunction) => {
            this.onAuthorize(req, res).catch(next);
        });
        apiRouter.post('/oauth/token', (req: Request, res: Response, next: NextFunction) => {
            this.onToken(req, res).catch(next);
        });
        apiRouter.post('/oauth/token/revoke', (req: Request, res: Response, next: NextFunction) => {
            this.onTokenRevoke(req, res).catch(next);
        });

        this.accessKey = this.loadKey(process.env.IP_ACCESS_SECRET!);
        this.refreshKey = this.loadKey(process.env.IP_REFRESH_SECRET!);
        this.codeKey = this.loadKey(process.env.IP_CODE_SECRET!);
        this.authorizeLimit = new RouteLimit(config.apiLimits.endpointLimiter);
        this.tokenLimit = new RouteLimit(config.apiLimits.endpointLimiter);
        this.tokenRevokeLimit = new RouteLimit(config.apiLimits.endpointLimiter);

        this.cleanTask = setInterval(() => this.cleanStores(), config.identityAuthority.checkInterval);
        globalThis.shutdownPool.add(this);

        logger.info('Constructed IdentityProviderPortal');
    }

    public shutdown(): void {
        clearInterval(this.cleanTask);
        logger.info('Cancelled clean task (IdentityProviderPortal)');
    }

    private async onAuthorize(req: Request, res: Response): Promise<void> {
        if (!await this.authorizeLimit.consumeAccess(req, res)) {
            return;
        }

        if (req.session.ACCOUNT == null) {
            if (!await res.rateLimit!.consumeError(req, res)) {
                return;
            }
            res.redirect('/');
            return;
        }

        let request = req.query as AuthRequest;
        if (!validators.isAuthRequestValid(request)) {
            if (!await res.rateLimit!.consumeError(req, res)) {
                return;
            }
            res.redirect('/');
            return;
        }

        let app = await this.store.getApplication(request.client_id!);
        if (app == null) {
            if (!await res.rateLimit!.consumeError(req, res)) {
                return;
            }
            res.redirect('/');
            return;
        }

        if (!crypto.compare(app.redirect_uri, request.redirect_uri)) {
            if (!await res.rateLimit!.consumeError(req, res)) {
                return;
            }
            res.redirect('/');
            return;
        }

        const code = tokens.generateToken(this.codeKey, app.id);
        if (code == null) {
            //NOTE: its our fault, dont count error
            res.status(500).end();
            return;
        }

        let now = Math.ceil(Date.now() / 1000) + this.codeExpiresIn;
        const codeInfo = {
            id: app.id,
            uid: code.uid,
            scope: request.scope!,
            expires: now,
            accountId: req.session.ACCOUNT.id,
        };
        await this.store.addCode(codeInfo);

        let state = '';
        if (request.state != null) {
            state = `&state=${request.state}`;
        }
        res.redirect(`${request.redirect_uri}?code=${code.token}${state}`);
    }

    private async onToken(req: Request, res: Response): Promise<void> {
        if (!await this.tokenLimit.consumeAccess(req, res)) {
            return;
        }

        let validContent = req.is('application/x-www-form-urlencoded');
        if (validContent == false || validContent == null) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }

        let request = req.body as TokenRequest;
        if (!validators.isTokenRequestValid(request)) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }

        let app = await this.store.getApplication(request.client_id!);
        if (app == null) {
            await res.rateLimit!.consumeError(req, res, 401);
            return;
        }

        if (!crypto.compare(app.secret, request.client_secret)) {
            await res.rateLimit!.consumeError(req, res, 401);
            return;
        }

        if (!crypto.compare(app.redirect_uri, request.redirect_uri)) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }

        let authSource = null;
        if (request.grant_type === 'authorization_code') {
            const token = tokens.decryptToken(request.code!, this.codeKey);
            if (token == null || token.id != app.id) {
                await res.rateLimit!.consumeError(req, res, 400);
                return;
            }
            let code = await this.store.getCode(app.id, token.uid);
            if (code == null) {
                await res.rateLimit!.consumeError(req, res, 400);
                return;
            }
            await this.store.deleteCode(app.id, code.uid);

            authSource = code;
        } else if (request.grant_type == 'refresh_token') {
            const token = tokens.decryptToken(request.refresh_token!, this.refreshKey);
            if (token == null || token.id != app.id) {
                await res.rateLimit!.consumeError(req, res, 400);
                return;
            }
            let refreshInfo = await this.store.getRefreshToken(app.id, token.uid);
            if (refreshInfo == null) {
                await res.rateLimit!.consumeError(req, res, 400);
                return;
            }
            await this.store.deleteRefreshToken(app.id, refreshInfo.uid);

            authSource = refreshInfo;
        }
        authSource = authSource!;

        let now = Math.ceil(Date.now() / 1000);
        if (authSource.expires <= now) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }
        
        const pair = tokens.generateTokenPair(this.accessKey, this.refreshKey, app.id);
        if (pair == null) {
            //NOTE: its our fault, dont count error
            res.status(500).end();
            return;
        }

        now = Math.ceil(Date.now() / 1000) + this.tokenExpiresIn;
        let tokenInfo = {
            id: app.id,
            uid: pair.uid,
            accountId: authSource.accountId,
            scope: authSource.scope,
            expires: now,
        };
        await this.store.addAccessToken(tokenInfo);
        await this.store.addRefreshToken(tokenInfo);

        let response = {
            token_type: 'Bearer',
            access_token: pair.accessToken,
            refresh_token: pair.refreshToken,
            scope: tokenInfo.scope,
            expires_in: this.tokenExpiresIn,
        };
        res.status(200).send(response);
    }

    private async onTokenRevoke(req: Request, res: Response): Promise<void> {
        if (!await this.tokenRevokeLimit.consumeAccess(req, res)) {
            return;
        }

        let validContent = req.is('application/x-www-form-urlencoded');
        if (validContent == false || validContent == null) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }

        let request = req.body as TokenRevokeRequest;
        if (!validators.isTokenRevokeRequestValid(request)) {
            await res.rateLimit!.consumeError(req, res, 400);
            return;
        }

        let app = await this.store.getApplication(request.client_id!);
        if (app == null) {
            await res.rateLimit!.consumeError(req, res, 401);
            return;
        }

        if (!crypto.compare(app.secret, request.client_secret)) {
            await res.rateLimit!.consumeError(req, res, 401);
            return;
        }

        let token = tokens.decryptToken(request.token!, this.accessKey);
        if (token == null) {
            token = tokens.decryptToken(request.token!, this.refreshKey);
            if (token == null) {
                res.status(200).end();
                return;
            }
        }

        if (app.id != token.id) {
            res.status(200).end();
            return;
        }

        await this.deleteTokens(app.id, token.uid);
        res.status(200).end();
    }

    public async getAccountId(req: Request): Promise<number | null> {
        let auth = tokens.getTokenFromHeader(req.header('Authorization'));
        if (auth == null || !validators.isHeaderTokenValid(auth)) {
            return null;
        }

        let token = tokens.decryptToken(auth.token, this.accessKey);
        if (token == null) {
            return null;
        }
        
        let access = await this.store.getAccessToken(token.id, token.uid);
        if (access == null) {
            return null;
        }

        let now = Math.ceil(Date.now() / 1000);
        if (access.expires <= now) {
            await this.deleteTokens(token.id, token.uid);
            return null;
        }

        return access.accountId;
    }

    private async deleteTokens(id: string, uid: string): Promise<void> {
        try {
            await this.store.deleteAccessToken(id, uid);
        } catch {

        }

        try {
            await this.store.deleteRefreshToken(id, uid);
        } catch {
            
        }
    }

    private loadKey(key: string): Uint8Array {
        let array = crypto.fromBase64(key);
        if (array == null) {
            throw new Error('Could not load key!');
        }
        return array;
    }

    private async cleanStores(): Promise<void> {
        await this.store.deleteExpiredTokens();
    }
}

export default IdentityProviderPortal;
