import { get as get_with_setter } from "./get.js";
import { set as set_with_setter } from "./set.js";
/** A 1D view of an array. Use it to set values in the array. */
function objectArrayView(arr, offset = 0, size) {
    let length = size ?? arr.length - offset;
    return {
        length,
        subarray(from, to = length) {
            return objectArrayView(arr, offset + from, to - from);
        },
        set(data, start = 0) {
            for (let i = 0; i < data.length; i++) {
                arr[offset + start + i] = data.get(i);
            }
        },
        get(index) {
            return arr[offset + index];
        },
    };
}
/**
 * Convert a chunk to a `Uint8Array` for the binary set functions.
 *
 * The binary set functions need a contiguous block of memory. This conversion
 * also accepts data that is not a browser `TypedArray`.
 *
 * WARNING: This function is not type-safe. Do not call it directly. For an
 * `Array`, it returns an `objectArrayView` of the chunk data.
 */
function compatChunk(arr) {
    if (globalThis.Array.isArray(arr.data)) {
        return {
            // @ts-expect-error
            data: objectArrayView(arr.data),
            stride: arr.stride,
            bytesPerElement: 1,
        };
    }
    return {
        data: new Uint8Array(arr.data.buffer, arr.data.byteOffset, arr.data.byteLength),
        stride: arr.stride,
        bytesPerElement: arr.data.BYTES_PER_ELEMENT,
    };
}
/** Get the constructor of an existing `TypedArray`. */
function getTypedArrayConstructor(arr) {
    if ("chars" in arr) {
        // The string arrays take the character width as the first argument.
        return arr.constructor.bind(null, arr.chars);
    }
    return arr.constructor;
}
/**
 * Convert a scalar to a `Uint8Array` for the binary set functions.
 *
 * The binary set functions need a contiguous block of memory. This conversion
 * also accepts data that is not a browser `TypedArray`.
 *
 * WARNING: This function is not type-safe. Do not call it directly. For an
 * `Array`, it returns an `objectArrayView` of the scalar.
 */
function compatScalar(arr, value) {
    if (globalThis.Array.isArray(arr.data)) {
        // @ts-expect-error
        return objectArrayView([value]);
    }
    let TypedArray = getTypedArrayConstructor(arr.data);
    // @ts-expect-error - value is a scalar and matches
    let data = new TypedArray([value]);
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
export const setter = {
    prepare(data, shape, stride) {
        return { data, shape, stride };
    },
    setScalar(dest, sel, value) {
        let view = compatChunk(dest);
        setScalarBinary(view, sel, compatScalar(dest, value), view.bytesPerElement);
    },
    setFromChunk(dest, src, projections) {
        let view = compatChunk(dest);
        setFromChunkBinary(view, compatChunk(src), view.bytesPerElement, projections);
    },
};
/** @category Utility */
export async function get(arr, selection = null, opts = {}) {
    return get_with_setter(arr, selection, opts, setter);
}
/** @category Utility */
export async function set(arr, selection, value, opts = {}) {
    return set_with_setter(arr, selection, value, opts, setter);
}
function indicesLen(start, stop, step) {
    if (step < 0 && stop < start) {
        return Math.floor((start - stop - 1) / -step) + 1;
    }
    if (start < stop)
        return Math.floor((stop - start - 1) / step) + 1;
    return 0;
}
function setScalarBinary(out, outSelection, value, bytesPerElement) {
    if (outSelection.length === 0) {
        out.data.set(value, 0);
        return;
    }
    const [slice, ...slices] = outSelection;
    const [currStride, ...stride] = out.stride;
    if (typeof slice === "number") {
        const data = out.data.subarray(currStride * slice * bytesPerElement);
        setScalarBinary({ data, stride }, slices, value, bytesPerElement);
        return;
    }
    const [from, to, step] = slice;
    const len = indicesLen(from, to, step);
    if (slices.length === 0) {
        for (let i = 0; i < len; i++) {
            out.data.set(value, currStride * (from + step * i) * bytesPerElement);
        }
        return;
    }
    for (let i = 0; i < len; i++) {
        const data = out.data.subarray(currStride * (from + step * i) * bytesPerElement);
        setScalarBinary({ data, stride }, slices, value, bytesPerElement);
    }
}
/**
 * Find the selection that is one unbroken run of memory on both sides, which
 * the caller can copy with a single `set`.
 *
 * The run exists when each remaining dimension is a step-1 slice and each
 * stride is the product of the lengths inside it, checked from the innermost
 * dimension outward. The test is on the strides, so a transposed chunk fails
 * it and falls to the element-by-element path, which is always correct. The
 * limit to C-contiguous layouts is deliberate.
 *
 * Returns the size of the run and its start offset on each side, or `null`
 * when the caller must recurse.
 */
function contiguousSpan(projections, destStride, srcStride) {
    // A dropped dimension leaves the two sides at different ranks, so the
    // strides no longer agree with the projections. The recursion removes
    // them first.
    if (projections.length !== destStride.length ||
        projections.length !== srcStride.length) {
        return null;
    }
    let size = 1;
    let destOffset = 0;
    let srcOffset = 0;
    for (let i = projections.length - 1; i >= 0; i--) {
        const proj = projections[i];
        if (proj.from === null || proj.to === null)
            return null;
        if (destStride[i] !== size || srcStride[i] !== size)
            return null;
        const [from, to, step] = proj.to;
        const [sfrom, , sstep] = proj.from;
        if (step !== 1 || sstep !== 1)
            return null;
        destOffset += size * from;
        srcOffset += size * sfrom;
        size *= indicesLen(from, to, step);
    }
    return { size, destOffset, srcOffset };
}
function setFromChunkBinary(dest, src, bytesPerElement, projections) {
    const span = contiguousSpan(projections, dest.stride, src.stride);
    if (span !== null) {
        const offset = span.srcOffset * bytesPerElement;
        dest.data.set(src.data.subarray(offset, offset + span.size * bytesPerElement), span.destOffset * bytesPerElement);
        return;
    }
    const [proj, ...projs] = projections;
    const [dstride, ...dstrides] = dest.stride;
    const [sstride, ...sstrides] = src.stride;
    if (proj.from === null) {
        if (projs.length === 0) {
            // The last axis has stride 1 in a C-contiguous chunk only. A
            // transpose `order` can put a different axis there.
            dest.data.set(src.data.subarray(0, bytesPerElement), dstride * proj.to * bytesPerElement);
            return;
        }
        setFromChunkBinary({
            data: dest.data.subarray(dstride * proj.to * bytesPerElement),
            stride: dstrides,
        }, src, bytesPerElement, projs);
        return;
    }
    if (proj.to === null) {
        if (projs.length === 0) {
            let offset = sstride * proj.from * bytesPerElement;
            dest.data.set(src.data.subarray(offset, offset + bytesPerElement), 0);
            return;
        }
        setFromChunkBinary(dest, {
            data: src.data.subarray(sstride * proj.from * bytesPerElement),
            stride: sstrides,
        }, bytesPerElement, projs);
        return;
    }
    const [from, to, step] = proj.to;
    const [sfrom, _, sstep] = proj.from;
    const len = indicesLen(from, to, step);
    if (projs.length === 0) {
        // Not one run of memory, so copy each element.
        for (let i = 0; i < len; i++) {
            let offset = sstride * (sfrom + sstep * i) * bytesPerElement;
            dest.data.set(src.data.subarray(offset, offset + bytesPerElement), dstride * (from + step * i) * bytesPerElement);
        }
        return;
    }
    for (let i = 0; i < len; i++) {
        setFromChunkBinary({
            data: dest.data.subarray(dstride * (from + i * step) * bytesPerElement),
            stride: dstrides,
        }, {
            data: src.data.subarray(sstride * (sfrom + i * sstep) * bytesPerElement),
            stride: sstrides,
        }, bytesPerElement, projs);
    }
}
//# sourceMappingURL=ops.js.map