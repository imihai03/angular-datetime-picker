/**
 * object.utils
 */


/**
 * Дополняет объект собственными перечисляемыми свойствами одного или нескольких исходных объектов,
 * аналогично Object.assign
 *
 * @param dest Объект, в который копируются свойства
 * @param sources Исходные объекты, из которых копируются свойства
 */
export function extendObject(dest: any, ...sources: any[]): any {
    if (dest == null) {
        throw TypeError('Cannot convert undefined or null to object');
    }

    for (const source of sources) {
        if (source != null) {
            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    dest[key] = source[key];
                }
            }
        }
    }

    return dest;
}
