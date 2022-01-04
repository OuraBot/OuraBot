import { ASCII_REGEX } from '..';

export function checkMessage(message: string): Boolean {
    console.log(message);
    let sanitizedMessage = message
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace('\u{E0000}', '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    console.log(sanitizedMessage);
    if (sanitizedMessage.match(/(im|i\sam|i'm)\s(1|2|3|4|5|6|7|8|9)(1|2)/gi)) {
        return false;
    }

    // check for racism
    if (sanitizedMessage.match(/((n|ñ|Ñ|ń|ņ|ň|ɲ|ŋ|ƞ|ǹ|ȵ|ɳ|ṉ|ṋ|ṅ|ṇ|\/\\\/|\|\\\|)[_\.\-\s]?[!1i|l][_\.\-\s]?[GgbB6934Q🅱qğĜƃ၅5]{2,3})(a|e|4)/gi)) {
        return false;
    }

    // check for c word
    if (sanitizedMessage.match(/\bcrackers?/gi)) {
        return false;
    }

    return true;
}

export function checkForAscii(message: string): Boolean {
    return message.match(ASCII_REGEX)?.length >= 5 ? true : false;
}
