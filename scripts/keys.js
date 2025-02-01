const sodium = require('libsodium-wrappers');

function generateKey() {
    let key = sodium.crypto_secretbox_keygen('uint8array');
    return sodium.to_base64(key, sodium.base64_variants.URLSAFE_NO_PADDING); //sodium.base64_variants.URLSAFE_NO_PADDING is default
}

async function generate() {
    await sodium.ready;
    
    console.log(`Code Key: ${generateKey()}`);
    console.log(`Access Key: ${generateKey()}`);
    console.log(`Refresh Key: ${generateKey()}`);
}
generate();
