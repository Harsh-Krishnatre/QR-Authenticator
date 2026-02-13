const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
    },

    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
    },
};

class ColorBuilder {
    constructor(text) {
        this.text = text;
        this.styles = [];
    }

    apply(code) {
        this.styles.push(code);
        return this;
    }

    black() { return this.apply(colors.fg.black); }

    red() { return this.apply(colors.fg.red); }

    green() { return this.apply(colors.fg.green); }

    yellow() { return this.apply(colors.fg.yellow); }

    blue() { return this.apply(colors.fg.blue); }

    magenta() { return this.apply(colors.fg.magenta); }

    cyan() { return this.apply(colors.fg.cyan); }

    white() { return this.apply(colors.fg.white); }

    bgBlack() { return this.apply(colors.bg.black); }

    bgRed() { return this.apply(colors.bg.red); }

    bgGreen() { return this.apply(colors.bg.green); }

    bgYellow() { return this.apply(colors.bg.yellow); }

    bgBlue() { return this.apply(colors.bg.blue); }

    bgMagenta() { return this.apply(colors.bg.magenta); }

    bgCyan() { return this.apply(colors.bg.cyan); }

    bgWhite() { return this.apply(colors.bg.white); }

    bold() { return this.apply(colors.bright); }

    dim() { return this.apply(colors.dim); }

    underline() { return this.apply(colors.underscore); }

    toString() {
        return `${this.styles.join('')}${this.text}${colors.reset}`;
    }
}

const paint = (text) => new ColorBuilder(text);

module.exports = { colors, paint };
