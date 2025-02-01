import sodium from 'libsodium-wrappers';

function random(length: number): string {
    return sodium.randombytes_buf(length, 'base64');
}

function fromBase64(text: string): Uint8Array | null {
    try {
        return sodium.from_base64(text, sodium.base64_variants.URLSAFE_NO_PADDING);
    } catch {
        return null;
    }
}

function toBase64(array: Uint8Array): string | null {
    try {
        return sodium.to_base64(array, sodium.base64_variants.URLSAFE_NO_PADDING);
    } catch {
        return null;
    }
}

function compare(str1: string | undefined, str2: string | undefined): boolean {
    if (typeof(str1) !== 'string' || typeof(str2) !== 'string') {
        return false;
    }

    let success = true;

    const arr1 = sodium.from_string(str1);
    let arr2 = sodium.from_string(str2);

    if (arr1.length != arr2.length) {
        success = false;
        arr2 = arr1;
    }

    return sodium.memcmp(arr1, arr2) && success;
}

function createSecretKey(): string {
    return sodium.crypto_secretbox_keygen('base64');
}

function createNonce(): Uint8Array {
    return sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
}

function encrypt(text: string, key: Uint8Array, nonce: Uint8Array): string | null {
    try {
        return sodium.crypto_secretbox_easy(text, nonce, key, 'base64');
    } catch {
        return null;
    }
}

function decrypt(cipher: string, key: Uint8Array, nonce: Uint8Array): string | null {
    try {
        return sodium.crypto_secretbox_open_easy(sodium.from_base64(cipher), nonce, key, 'text');
    } catch {
        return null;
    }
}

export default sodium.ready;
export {
    createSecretKey,
    createNonce,
    encrypt,
    decrypt,

    random,
    fromBase64,
    toBase64,
    compare,
};
