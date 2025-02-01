function hasInvalidChars(value: string | undefined, regex: RegExp): boolean {
    return value == null || regex.test(value);
}

function hasOptionalInvalidChars(value: string | undefined, regex: RegExp): boolean {
    return value != null && regex.test(value);
}

// Discord Auth query
interface Query {
    code?: string;
    error?: string;
    error_description?: string;
}

function isQueryValid(query: Query): boolean {
    if (hasOptionalInvalidChars(query.code, /[^A-Za-z0-9]/)) {
        return false;
    }

    if (hasOptionalInvalidChars(query.error, /[^A-Za-z0-9_-]/)) {
        return false;
    }

    if (hasOptionalInvalidChars(query.error_description, /[^A-Za-z0-9_\-\s,.]/)) {
        return false;
    }

    return true;
}

// OAuth authorize request
interface AuthRequest {
    response_type?: string;
    client_id?: string;
    scope?: string;
    redirect_uri?: string;
}

function isAuthRequestValid(request: AuthRequest): boolean {
    if (hasInvalidChars(request.client_id, /[^0-9]/)) {
        return false;
    }

    if (request.scope !== 'identify') {
        return false;
    }

    if (request.response_type !== 'code') {
        return false;
    }

    if (request.redirect_uri == null) {
        return false;
    }

    return true;
}

// OAuth token request
interface TokenRequest {
    client_id?: string;
    client_secret?: string;
    grant_type?: string;
    code?: string;
    refresh_token?: string;
    redirect_uri?: string;
}

function isTokenRequestValid(request: TokenRequest): boolean {
    if (hasInvalidChars(request.client_id, /[^0-9]/)) {
        return false;
    }

    if (hasInvalidChars(request.client_secret, /[^A-Za-z0-9]/)) {
        return false;
    }
    
    if (request.grant_type === 'authorization_code') {
        if (hasInvalidChars(request.code, /[^A-Za-z0-9-_.]/)) {
            return false;
        }
    } else if (request.grant_type === 'refresh_token') {
        if (hasInvalidChars(request.refresh_token, /[^A-Za-z0-9-_.]/)) {
            return false;
        }
    } else {
        return false;
    }

    if (request.redirect_uri == null) {
        return false;
    }

    return true;
}

// OAuth token revoke request
interface TokenRevokeRequest {
    client_id?: string;
    client_secret?: string;
    token?: string;
    token_type_hint?: string;
}

function isTokenRevokeRequestValid(request: TokenRevokeRequest): boolean {
    if (hasInvalidChars(request.client_id, /[^0-9]/)) {
        return false;
    }

    if (hasInvalidChars(request.client_secret, /[^A-Za-z0-9]/)) {
        return false;
    }
    
    if (hasInvalidChars(request.token, /[^A-Za-z0-9-_.]/)) {
        return false;
    }

    if (hasInvalidChars(request.token_type_hint, /[^a-z_]/)) {
        return false;
    }

    return true;
}

// Resource access
interface HeaderToken {
    name: string;
    token: string;
}

function isHeaderTokenValid(token: HeaderToken): boolean {
    if (token.name !== 'Bearer') {
        return false;
    }

    if (hasInvalidChars(token.token, /[^A-Za-z0-9-_.]/)) {
        return false;
    }

    return true;
}

// other
function isServiceNameValid(name?: string): boolean {
    return !hasInvalidChars(name, /[^a-z_]/);
}

function isIdValid(id?: string): boolean {
    return !hasInvalidChars(id, /[^0-9]/);
}

// export
export default {
    isQueryValid,
    isAuthRequestValid,
    isTokenRequestValid,
    isTokenRevokeRequestValid,
    isHeaderTokenValid,
    isServiceNameValid,
    isIdValid,
};
