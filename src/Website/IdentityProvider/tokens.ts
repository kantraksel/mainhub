import * as crypto from '../../Systems/crypto';

interface Token {
    uid: string;
    token: string;
}

interface TokenPair {
    uid: string;
    accessToken: string;
    refreshToken: string;
}

function generateToken(key: Uint8Array, id: string): Token | null {
    let uid = crypto.random(8);
    let nonce = crypto.createNonce();
    let itoken = `${id}.${uid}`;

    let token = crypto.encrypt(itoken, key, nonce);
    if (token == null) {
        return null;
    }
    token = `${token}.${crypto.toBase64(nonce)}`;

    return {uid, token};
}

function generateTokenPair(accessKey: Uint8Array, refreshKey: Uint8Array, id: string): TokenPair | null {
    let uid = crypto.random(8);
    let nonce = crypto.createNonce();
    let bnonce = crypto.toBase64(nonce);
    let itoken = `${id}.${uid}`;

    let access = crypto.encrypt(itoken, accessKey, nonce);
    if (access == null) {
        return null;
    }
    access = `${access}.${bnonce}`;

    nonce = crypto.createNonce();
    let refresh = crypto.encrypt(itoken, refreshKey, nonce);
    if (refresh == null) {
        return null;
    }
    refresh = `${refresh}.${bnonce}`;

    return {uid, accessToken: access, refreshToken: refresh};
}

interface PlainToken {
    id: string;
    uid: string;
}

function decryptToken(token: string, key: Uint8Array): PlainToken | null {
    let parts = token.split('.', 2);
    if (parts.length != 2 || parts[0].length == 0 || parts[1].length == 0) {
        return null;
    }
    let nonce = crypto.fromBase64(parts[1]);
    if (nonce == null) {
        return null;
    }
    let info = crypto.decrypt(parts[0], key, nonce);
    if (info == null) {
        return null;
    }
    parts = info.split('.');
    if (parts.length != 2 || parts[0].length == 0 || parts[1].length == 0) {
        return null;
    }
    return {id: parts[0], uid: parts[1]};
}

interface HeaderToken {
    name: string;
    token: string;
}

function getTokenFromHeader(header?: string): HeaderToken | null {
    if (header == null) {
        return null;
    }

    let parts = header.split(' ');
    if (parts.length != 2) {
        return null;
    }

    if (parts[0].length == 0 || parts[1].length == 0) {
        return null;
    }

    return {name: parts[0], token: parts[1]};
}

export {
    generateToken,
    generateTokenPair,
    decryptToken,
    getTokenFromHeader,
}
