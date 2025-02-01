type ServerMeta = Record<string, string | undefined>;

declare global {
    var serverMeta: ServerMeta;
}

function inject(name: string, prop: string, metaArray: HTMLMetaElement[]): string | null {
    const meta = metaArray.find((value) => value.name == name);
    if (meta == null) {
        console.warn(`Meta '${name}' not found`);
        return null;
    } else {
        globalThis.serverMeta[prop] = meta.content;
        return meta.content;
    }
}

export function initMetaDOM(keys: string[]): void {
    if (globalThis.serverMeta != null) {
        return;
    }
    globalThis.serverMeta = {} as ServerMeta;

    const metaArray = Array.from(document.head.getElementsByTagName('meta'));
    keys.forEach((value: string) => {
        inject(value, value, metaArray);
    });
}

export function getMetaValue(prop: string): string | null {
    if (globalThis.serverMeta == null) {
        return null;
    }
    const value = globalThis.serverMeta[prop];
    if (value != null) {
        return value;
    }
    return null;
}
