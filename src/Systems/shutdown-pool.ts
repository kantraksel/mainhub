interface StopObject {
    shutdown: () => void;
}

class ShutdownPool {
    private pool: Set<StopObject>;

    public constructor() {
        this.pool = new Set<StopObject>();
    }

    public add(obj: StopObject): void {
        this.pool.add(obj);
    }

    public shutdown(): void {
        this.pool.forEach((value: StopObject): void => {
            value.shutdown();
        });
    }
}

declare global {
    // eslint-disable-next-line no-var
    var shutdownPool: ShutdownPool;
}
global.shutdownPool = new ShutdownPool();

// no imports, *this* marks this file as module
export default null;
