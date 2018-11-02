'use strict';

const postcss = require('postcss');
const splitSelectors = require('./split-selectors');
const plugin = require('./');

function run(input, output, options) {
    return postcss([plugin(options)]).process(input).then(result => {
        expect(result.css).toEqual(output);
        expect(result.warnings().length).toBe(0);
    });
}

var sampleCharset = '@charset "UTF-8";',
    sampleImport = '@import "/css/sample.css";',
    sampleKeyframes,
    sampleFontFace;

sampleKeyframes = `@keyframes test {
    0% { color: red; }
    100% { color: blue; }
}`;

sampleFontFace = `@font-face {
    font-family: "Bitstream Vera Serif Bold";
    src: url("https://mdn.mozillademos.org/files/2468/VeraSeBd.ttf");
}`;

describe('defaults', () => {
    it('does what the readme says', () => {
        let input = `.styleguide span,
    .button span {
        color: red;
    }
    .button {
        color: blue;
    }`;
        let output = `.styleguide span {
        color: red;
    }`;
        return run(input, output, {
            filter: (selector, parts) => {
                return parts.indexOf('.styleguide') > -1;
            }
        });
    });

    it('does nothing by default', () => {
        let input = 'a {}';
        return run(input, input, {});
    });

    it('keeps rules when filter returns true', () => {
        let input = 'a {}';
        return run(input, input, {
            filter: function () {
                return true;
            }
        });
    });

    it('removes rules when filter returns false', () => {
        return run('a {} .b {} #c {}', '', {
            filter: () => {
                return false;
            }
        });
    });
});

describe('@media', () => {
    it('removes empty @media', () => {
        return run('@media () {}', '', {});
    });

    it('does not remove @media', () => {
        let input = '@media screen {.b {}} .b {} .c {}',
            output = '@media screen {.b {}} .b {}';
        return run(input, output, {
            filter: (selector, parts) => {
                return parts.indexOf('.b') > -1;
            }
        });
    });

    it('keeps @media when removing rules', () => {
        let input = '@media screen {.b {}} @media screen {.c {}}',
            output = '@media screen {.b {}}';
        return run(input, output, {
            filter: (selector, parts) => {
                return parts.indexOf('.b') > -1;
            }
        });
    });

    it('keeps @media when removing rules with multiple selectors', () => {
        let input = '@media screen {.b strong {}} @media screen {.c {}}',
            output = '@media screen {.b strong {}}';
        return run(input, output, {
            filter: (selector, parts) => {
                return parts.indexOf('.b') > -1;
            }
        });
    });
});

describe('at-rules', () => {
    it('keeps @charset by default', () => {
        return run(sampleCharset, sampleCharset, {});
    });

    it('keeps @import by default', () => {
        return run(sampleImport, sampleImport, {});
    });

    it('keeps @keyframes by default', () => {
        return run(sampleKeyframes, sampleKeyframes, {});
    });

    it('removes @font-face by default', () => {
        return run(sampleFontFace, '', {});
    });

    it('removes empty at-rules', () => {
        let input = '@font-face {} @media {} @page {}';
        return run(input, '', {});
    });

    it('removes all at-rules when keepAtRules is an empty array', () => {
        let input = [sampleCharset, sampleImport, sampleKeyframes].join('\n');
        return run(input, '', {
            keepAtRules: []
        });
    });

    it('keeps all at-rules when keepAtRules is true', () => {
        let input = [sampleCharset, sampleImport, sampleFontFace, sampleKeyframes].join('\n');

        return run(input, input, {
            keepAtRules: true
        });
    });
});

describe('filter', () => {
    it('removes all classes', () => {
        let input = '#a {} .b {} .c {} #d {}',
            output = '#a {} #d {}';

        return run(input, output, {
            filter: (selector) => {
                return !/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/.test(selector);
            }
        });
    });

    it('removes a specific class', () => {
        let input = '#main .a strong {} #main .c strong {}',
            output = '#main .a strong {}';
        return run(input, output, {
            filter: (selector, parts) => {
                return parts.indexOf('.c') === -1;
            }
        });
    });

    it('removes a selector starting with an ID', () => {
        let input = '#main {} .c {}',
            output = '.c {}';
        return run(input, output, {
            filter: (selector) => {
                return selector[0] !== '#';
            }
        });
    });

    it('removes a selector starting with an ID and whitespace', () => {
        let input = '   #main {}    .c {}',
            output = '   .c {}';
        return run(input, output, {
            filter: (selector) => {
                return selector[0] !== '#';
            }
        });
    });

    it('removes a single selector', () => {
        let input = '.a, .b, .c {}',
            output = '.b, .c {}';
        return run(input, output, {
            filter: (selector, parts) => {
                return parts.indexOf('.a') === -1;
            }
        });
    });

    it('removes multiple selectors', () => {
        let input = '.a, .b, .c {}',
            output = '.a {}';
        return run(input, output, {
            filter: (selector, parts) => {
                return parts.indexOf('.b') === -1 && parts.indexOf('.c') === -1;
            }
        });
    });

    it('removes adjacent sibling selectors', () => {
        let input = '.a, .b + .c {} .b+.c {}',
            output = '.a {}';
        return run(input, output, {
            filter: (selector) => {
                return selector.indexOf('+') === -1;
            }
        });
    });

    it('removes direct sibling selectors', () => {
        let input = '.a, .b ~ .c {} .b~.c {}',
            output = '.a {}';
        return run(input, output, {
            filter: (selector) => {
                return selector.indexOf('~') === -1;
            }
        });
    });
});

describe('parts selector', () => {
    const TESTS = {
        '*':                          true,
        '#a':                         true,
        '#a:not(.b)':                 true,
        '#a:not(  .b:not(.c  ))':     ['#a:not(.b:not(.c))'],
        '#a:matches(.b,   .c)':       ['#a:matches(.b,.c)'],
        '#a:matches(.b:not(.c), .d)': ['#a:matches(.b:not(.c),.d)'],
        '#a:has(.b, .c)':             ['#a:has(.b,.c)'],
        '#a.b':                       true,
        '#a.b .c.d':                  ['#a.b', '.c.d'],
        '#a[foo]':                    true,
        '#a[foo="bar"]':              true,
        '#a[foo="foo bar"]':          true,
        '#a[foo~="bar"]':             true,
        '#a[foo~="foo bar"]':         true,
        '#a[foo^="bar"]':             true,
        '#a[foo^="foo bar"]':         true,
        '#a[foo$="bar"]':             true,
        '#a[foo$="foo bar"]':         true,
        '#a[foo*="bar"]':             true,
        '#a[foo*="foo bar"]':         true,
        '#a[foo|="fruit"]':           true,
        '#a[foo|="foo bar"]':         true,
        '#a:dir(ltr)':                true,
        '#a:lang(zh)':                true,
        '#a:any-link':                true,
        '#a:link':                    true,
        '#a:visited':                 true,
        '#a:target':                  true,
        '#a:scope':                   true,
        '#a:current':                 true,
        '#a:current(.b)':             true,
        '#a:past':                    true,
        '#a:future':                  true,
        '#a:active':                  true,
        '#a:hover':                   true,
        '#a:focus':                   true,
        '#a:drop':                    true,
        '#a:drop(active)':            true,
        '#a:drop(valid)':             true,
        '#a:drop(invalid)':           true,
        '#a:enabled':                 true,
        '#a:disabled':                true,
        '#a:read-write':              true,
        '#a:read-only':               true,
        '#a:placeholder-shown':       true,
        '#a:default':                 true,
        '#a:checked':                 true,
        '#a:indeterminate':           true,
        '#a:valid':                   true,
        '#a:invalid':                 true,
        '#a:in-range':                true,
        '#a:out-of-range':            true,
        '#a:required':                true,
        '#a:optional':                true,
        '#a:user-error':              true,
        '#a:root':                    true,
        '#a:empty':                   true,
        '#a:blank':                   true,
        '#a:nth-child(odd)':          true,
        '#a:nth-child(even)':         true,
        '#a:nth-child(2n+1)':         true,
        '#a:nth-last-child(even)':    true,
        '#a:first-child':             true,
        '#a:last-child':              true,
        '#a:only-child':              true,
        '#a::after':                  true,
        '#a::before':                 true,
        '#a:nth-of-type(1)':          true,
        '#a:nth-last-of-type(1)':     true,
        '#a:first-of-type':           true,
        '#a:last-of-type':            true,
        '#a:only-of-type':            true,
        '#a .b':                      ['#a', '.b'],
        '#a div video':               ['#a', 'div', 'video'],
        '#a > .b':                    ['#a', '.b'],
        '#a>.b':                      ['#a', '.b'],
        '#a + .b':                    ['#a', '.b'],
        '#a.b.c + .d .e':             ['#a.b.c', '.d', '.e'],
        '#a+.b':                      ['#a', '.b'],
        '#a ~ .b':                    ['#a', '.b'],
        '#a~.b':                      ['#a', '.b'],
        '.b || #a':                   ['.b', '#a'],
        '.b||#a':                     ['.b', '#a'],
        '#a:nth-column(3)':           true,
        '#a:nth-last-column(3)':      true,
        '#a:playing':                 true,
        '#a:paused':                  true
    };

    for (let input in TESTS) {
        it('splits: ' + input, () => {
            let output = TESTS[input],
                result = splitSelectors(input);
            expect(result).toEqual(output === true ? [input] : output);
        });
    }
});
