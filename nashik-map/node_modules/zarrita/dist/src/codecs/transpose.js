import { BoolArray, ByteStringArray, UnicodeStringArray, } from "../typedarray.js";
import { assert, getStrides } from "../util.js";
function proxy(arr) {
    if (arr instanceof BoolArray ||
        arr instanceof ByteStringArray ||
        arr instanceof UnicodeStringArray) {
        // @ts-expect-error - TS cannot infer arr is a TypedArrayProxy<D>
        const arrp = new Proxy(arr, {
            get(target, prop) {
                return target.get(Number(prop));
            },
            set(target, prop, value) {
                // @ts-expect-error - value is OK
                target.set(Number(prop), value);
                return true;
            },
        });
        return arrp;
    }
    // @ts-expect-error - TS cannot infer arr is a TypedArrayProxy<D>
    return arr;
}
function emptyLike(chunk, order) {
    let data;
    if (chunk.data instanceof ByteStringArray ||
        chunk.data instanceof UnicodeStringArray) {
        // These constructors take the character width before the length.
        data = new chunk.data.constructor(
        // @ts-expect-error - the two argument form is not on the shared type
        chunk.data.chars, chunk.data.length);
    }
    else {
        data = new chunk.data.constructor(chunk.data.length);
    }
    return {
        data,
        shape: chunk.shape,
        stride: getStrides(chunk.shape, order),
    };
}
function convertArrayOrder(src, target) {
    let out = emptyLike(src, target);
    let nDims = src.shape.length;
    // Calculate the number of elements from the shape. The backing store can be
    // longer than the chunk when `src` is a view.
    let size = src.shape.reduce((a, b) => a * b, 1);
    let index = Array(nDims).fill(0);
    let srcData = proxy(src.data);
    let outData = proxy(out.data);
    for (let n = 0; n < size; n++) {
        let srcIdx = 0;
        let outIdx = 0;
        for (let dim = 0; dim < nDims; dim++) {
            srcIdx += index[dim] * src.stride[dim];
            outIdx += index[dim] * out.stride[dim];
        }
        outData[outIdx] = srcData[srcIdx];
        index[0] += 1;
        for (let dim = 0; dim < nDims; dim++) {
            if (index[dim] === src.shape[dim]) {
                if (dim + 1 === nDims) {
                    break;
                }
                index[dim] = 0;
                index[dim + 1] += 1;
            }
        }
    }
    return out;
}
/** Determine the memory order (axis permutation) for a chunk */
function getOrder(chunk) {
    let rank = chunk.shape.length;
    assert(rank === chunk.stride.length, "Shape and stride must have the same length.");
    return chunk.stride
        .map((s, i) => ({ stride: s, index: i }))
        .sort((a, b) => b.stride - a.stride)
        .map((entry) => entry.index);
}
function matchesOrder(chunk, target) {
    let source = getOrder(chunk);
    assert(source.length === target.length, "Orders must match");
    return source.every((dim, i) => dim === target[i]);
}
export class TransposeCodec {
    kind = "array_to_array";
    #order;
    constructor(configuration, meta) {
        let value = configuration.order ?? "C";
        let rank = meta.shape.length;
        let order = new Array(rank);
        if (value === "C") {
            for (let i = 0; i < rank; ++i) {
                order[i] = i;
            }
        }
        else if (value === "F") {
            for (let i = 0; i < rank; ++i) {
                order[i] = rank - i - 1;
            }
        }
        else {
            order = value;
            // Each axis appears exactly once.
            let seen = new Array(rank);
            order.forEach((x) => {
                assert(!seen[x], `Invalid permutation: ${JSON.stringify(value)}`);
                seen[x] = true;
            });
        }
        this.#order = order;
    }
    static fromConfig(configuration, meta) {
        return new TransposeCodec(configuration, meta);
    }
    encode(arr) {
        // `decode` returns a chunk in `#order`. The stored bytes must use the
        // same order.
        if (matchesOrder(arr, this.#order)) {
            return arr;
        }
        return convertArrayOrder(arr, this.#order);
    }
    decode(arr) {
        return {
            data: arr.data,
            shape: arr.shape,
            stride: getStrides(arr.shape, this.#order),
        };
    }
}
//# sourceMappingURL=transpose.js.map