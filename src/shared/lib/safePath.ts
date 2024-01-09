/**
 * NodeJS Prevent Local File Inclusion and NULL byte attack
 * https://gist.github.com/mykiimike/a162541761df6fd54f48
 */
export const safePath = (str: string) => {
    let s = str.toString().split('/'),
        r = [] as string[],
        r2 = '';
    for (var a in s) {
        if (s[a] != '..') r.push(s[a]);
    }
    r2 = r.join('/');
    var i = r2.indexOf('\0');
    if (i > 0) r2 = r2.substr(0, i);

    return r2;
};
