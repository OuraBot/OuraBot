export function chunkArr(arr: string[], len: number, joiner?: string): string[] {
    let _joiner = joiner || '; ';
    return arr.reduce((acc, word, i) => {
        if (!i || acc[acc.length - 1].length + word.length >= len) {
            acc.push(word);
        } else {
            acc[acc.length - 1] += _joiner + word;
        }
        return acc;
    }, []);
}
/**
 * Obfuscates a string to prevent pings
 *
 * @export
 * @param {string} str
 * @return {*}  {string}
 */
export function obfuscateName(str: string): string {
    return [...str].join('\u{E0000}');
}
/**
 * Returns a sanitized message that prevents any unwanted command injection
 *
 * @export
 * @param {string} str
 * @return {*}  {string}
 */
export function sanitizeMessage(str: string): string {
    return str.replace(
        /^[.\/](help|w|disconnect|mods|vips|color|user|commercial|mod|unmod|vip|unvip|slow|slowoff|r9kbeta|r9kbetaoff|emoteonly|emoteonlyoff|clear|subscribers|subscribersoff|followers|followersoff|host|unhost|raid|unraid|marker)/,
        ''
    );
}
