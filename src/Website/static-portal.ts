import express from 'express';
import GlobalScope from '../Systems/global-scope';
import config from '../config';

function staticPortal(global: GlobalScope): void {
    const {app} = global;

    if (config.staticFiles.enabled) {
        app.use(express.static(config.staticFiles.path, {
            dotfiles: 'ignore',
            extensions: false,
            fallthrough: true,
            index: 'index.html',
            redirect: true,
        }));

        logger.info('Added StaticPortal');
    } else {
        logger.info('StaticPortal is disabled');
    }
}

export default staticPortal;
