export default function deepClone(obj: any, hash = new WeakMap()) {
    const _toString = Object.prototype.toString;
    // null, undefined, non-object, function
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    // Handle circular reference
    if (hash.has(obj)) {
        return hash.get(obj);
    }
    // DOM Node
    if (obj.nodeType && 'cloneNode' in obj) {
        return obj.cloneNode(true);
    }
    // Date
    if (_toString.call(obj) === '[object Date]') {
        return new Date(obj.getTime());
    }
    // RegExp
    if (_toString.call(obj) === '[object RegExp]') {
        let flags = [];
        if (obj.global) {
            flags.push('g');
        }
        if (obj.multiline) {
            flags.push('m');
        }
        if (obj.ignoreCase) {
            flags.push('i');
        }
        return new RegExp(obj.source, flags.join(''));
    }
    let result = Array.isArray(obj) ? [] :
        obj.constructor ? new obj.constructor() : {};

    hash.set(obj, result);
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = deepClone(obj[key], hash);
        }
    }
    return result;
}
