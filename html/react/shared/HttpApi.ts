async function fetchObject<T>(url: string, fetchOpts: RequestInit): Promise<T> {
    const response = await fetch(url, fetchOpts);
    return await response.json() as Promise<T>;
}
  
export function httpGet<T>(url: string): [Promise<T>, AbortController] {
    const controller = new AbortController();
    const fetchOpts = { signal: controller.signal, cache: 'no-cache' } as RequestInit;
  
    const promise = fetchObject<T>(url, fetchOpts);
    return [promise, controller];
}
