import { OAuth2API, RESTPostOAuth2AccessTokenResult, RESTPostOAuth2AccessTokenURLEncodedData } from '@discordjs/core';
import { REST, makeURLSearchParams } from '@discordjs/rest';
import crypto from 'crypto';
import { Request, Response } from 'express';
import AuthorizationError from './AuthorizationError';

function compareSafe(object: unknown, other: unknown): boolean {
	if (typeof(object) !== 'string' || typeof(other) !== 'string') {
		return false;
	}

	if (object.length === 0 || other.length === 0) {
		return false;
	}

	let buff1 = Buffer.from(object);
	let buff2 = Buffer.from(other);

	let value = true;
	if (buff1.length != buff2.length) {
		value = false;
		buff2 = buff1;
	}

	let value2 = crypto.timingSafeEqual(buff1, buff2);
	return value && value2;
}

interface ClientInfoRequest {
    client_id: string;
    redirect_uri: string;
    response_type: 'code';
    scope: string;
}

interface ClientInfoExchange {
    client_id: string;
    client_secret: string;
    grant_type: 'authorization_code';
    redirect_uri: string;
}

interface ResponseQuery {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
}

interface DiscordUser {
    discriminator: string;
    id: string;
    username: string;
}

interface AuthInfo {
    object?: DiscordUser,
    error?: Error,
    cancelled: boolean
}

class IdentityAuth {
    private rest: REST;
    private oauth: OAuth2API;

    private infoRequest: ClientInfoRequest;
    private infoExchange: ClientInfoExchange;

	public constructor(id: string, secret: string, callback: string) {
        this.rest = new REST();
        this.oauth = new OAuth2API(this.rest);

        this.infoRequest = {
            client_id: id,
            redirect_uri: callback,
            response_type: 'code' as const,
            scope: 'identify',
        };

        this.infoExchange = {
            client_id: id,
            client_secret: secret,
            grant_type: 'authorization_code' as const,
            redirect_uri: callback,
        };
	}

	public request(requestId: string, res: Response): void {
		res.redirect(this.oauth.generateAuthorizationURL({
            state: requestId,
            ...this.infoRequest,
        }));
	}

	public async response(req: Request, requestId: string): Promise<AuthInfo | null> {
		const { code, state, error, error_description } = req.query as ResponseQuery;

		if (!compareSafe(requestId, state)) {
			return null;
		}

		const result: AuthInfo = {
			cancelled: false,
		};

		if (error != null) {
			result.error = new AuthorizationError(error, error_description);
			result.cancelled = error === 'access_denied';
		} else if (code != null) {
			try {
                let response = await this.tokenExchange({
                    code,
                    ...this.infoExchange,
                });
                if (response.scope !== this.infoRequest.scope) {
                    result.error = new AuthorizationError('access_denied', 'User granted access for different scopes than expected');
                } else {
                    result.object = await this.getUser(response.access_token);
                }
			} catch (error: unknown) {
				result.error = error as Error;
			}
		} else {
			return null;
		}
		
		return result;
	}

    private async tokenExchange(data: RESTPostOAuth2AccessTokenURLEncodedData): Promise<RESTPostOAuth2AccessTokenResult> {
        return this.rest.post('/oauth2/token', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: makeURLSearchParams(data),
            passThroughBody: true,
            auth: false,
        }) as Promise<RESTPostOAuth2AccessTokenResult>;
    }

    private async getUser(accessToken: string): Promise<DiscordUser> {
        return await this.rest.get('/users/@me', {
            auth: false,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }) as DiscordUser;
    }
}

export default IdentityAuth;