/**
 * @param {string} url
 * @param {RemoteSourceOptions & BlockedSourceOptions & { credentials?: RequestCredentials}} [param1]
 * @returns {BaseSource}
 */
export function makeFetchSource(url: string, { headers, credentials, maxRanges, allowFullFile, ...blockOptions }?: RemoteSourceOptions & BlockedSourceOptions & {
    credentials?: RequestCredentials;
}): BaseSource;
/**
 * @param {string} url
 * @param {RemoteSourceOptions & BlockedSourceOptions} [param1]
 * @returns {BaseSource}
 */
export function makeXHRSource(url: string, { headers, maxRanges, allowFullFile, ...blockOptions }?: RemoteSourceOptions & BlockedSourceOptions): BaseSource;
/**
 * @param {string} url
 * @param {RemoteSourceOptions & BlockedSourceOptions} [param1]
 * @returns {BaseSource}
 */
export function makeHttpSource(url: string, { headers, maxRanges, allowFullFile, ...blockOptions }?: RemoteSourceOptions & BlockedSourceOptions): BaseSource;
/**
 * @param {import("../geotiff.js").BaseClient} client
 * @param {RemoteSourceOptions & BlockedSourceOptions} [param1]
 * @returns {BaseSource}
 */
export function makeCustomSource(client: import("../geotiff.js").BaseClient, { headers, maxRanges, allowFullFile, ...blockOptions }?: RemoteSourceOptions & BlockedSourceOptions): BaseSource;
/**
 *
 * @param {string} url
 * @param {RemoteSourceOptions & BlockedSourceOptions} options
 */
export function makeRemoteSource(url: string, { forceXHR, ...clientOptions }?: RemoteSourceOptions & BlockedSourceOptions): BaseSource;
export type RemoteSourceOptions = {
    /**
     * Additional headers to add to each request
     */
    headers?: Record<string, string> | undefined;
    /**
     * Maximum number of ranges to request in a single HTTP request. 0 means no multi-range requests.
     */
    maxRanges?: number | undefined;
    /**
     * Whether to allow full file responses when requesting ranges
     */
    allowFullFile?: boolean | undefined;
    /**
     * When the Fetch API would be used, force using XMLHttpRequest instead.
     */
    forceXHR?: boolean | undefined;
};
export type BlockedSourceOptions = {
    /**
     * Block size for a BlockedSource. When not set, no blocking will be applied.
     */
    blockSize?: number | undefined;
    /**
     * The number of blocks to cache.
     */
    cacheSize?: number | undefined;
};
import { BaseSource } from './basesource.js';
//# sourceMappingURL=remote.d.ts.map