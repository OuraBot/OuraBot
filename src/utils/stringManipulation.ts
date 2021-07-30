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

export function obfuscateName(str: string): string {
    return [...str].join('\u{E0000}');
}
