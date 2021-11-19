import { ASCII_REGEX } from '..';

export function checkMessage(message: string): Boolean {
    message = message.replace(/[\u200B-\u200D\uFEFF]/g, '').replace('\u{E0000}', '');
    if (message.match(/VoteNay\s*g{1,2}(?:a|er)/gi)) {
        return false;
    } else if (message.match(/N\sTriHard/gi)) {
        return false;
    } else if (
        message.match(/(?:(?:\b(?<![-=\.])(?<!\.com\/)|monka)(?:[Nn\x{00F1}]|[Ii7]V)|\/\\\/)[\s\.]*?[liI1y!j|\/]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/g)
    ) {
        return false;
    } else {
        return true;
    }
}

export function checkForAscii(message: string): Boolean {
    return message.match(ASCII_REGEX) ? true : false;
}
