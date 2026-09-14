import * as zarr from "../src/index.js";
/** Read a chunk's values in logical (C) order, honoring its strides. */
export declare function toLogical<D extends zarr.DataType>(chunk: zarr.Chunk<D>): unknown[];
export declare function cStride(shape: number[]): number[];
/** A C-ordered chunk holding `0..n`, offset by `base`. */
export declare function chunk(shape: number[], base?: number): {
    data: Int32Array<ArrayBuffer>;
    shape: number[];
    stride: number[];
};
/** An int32 array holding `0..n`, optionally stored with a transpose `order`. */
export declare function filled(shape: number[], chunkShape: number[], order?: number[]): Promise<zarr.Array<"int32", Map<any, any>>>;
//# sourceMappingURL=helpers.d.ts.map