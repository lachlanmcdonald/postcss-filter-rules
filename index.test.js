/* jshint esversion: 6 */
const postcss = require('postcss');
const plugin = require('./');

function run(input, output, options) {
    return postcss([plugin(options)]).process(input).then(result => {
        expect(result.css).toEqual(output);
        expect(result.warnings().length).toBe(0);
    });
}

it('does nothing by default', () => {
    var input = 'a {}';
    return run(input, input, {});
});

it('does nothing', () => {
    var input = 'a {}';
    return run(input, input, {
        filter: function () {
            return true;
        }
    });
});

it('removes everything', () => {
    return run('a {} .b {} #c {}', '', {
        filter: () => {
            return false;
        }
    });
});

it('removes empty @media', () => {
    var input = 'a {} @media () {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes @font-face', () => {
    var input = 'a {} @font-face {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes @page', () => {
    var input = 'a {} @page {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes @document', () => {
    var input = 'a {} @document {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes all classes', () => {
    var input = '#a {} .b {} .c {} #d {}',
        output = '#a {} #d {}';

    return run(input, output, {
        filter: (selector) => {
            return !/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/.test(selector);
        }
    });
});

it('removes a specific class', () => {
    var input = '#main .a strong {} #main .c strong {}',
        output = '#main .a strong {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.c') === -1;
        }
    });
});

it('removes a selector starting with an ID', () => {
    var input = '#main {} .c {}',
        output = '.c {}';
    return run(input, output, {
        filter: (selector) => {
            return selector[0] !== '#';
        }
    });
});

it('removes a selector starting with an ID and whitespace', () => {
    var input = '   #main {}    .c {}',
        output = '   .c {}';
    return run(input, output, {
        filter: (selector) => {
            return selector[0] !== '#';
        }
    });
});

it('removes a single selector', () => {
    var input = '.a, .b, .c {}',
        output = '.b, .c {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.a') === -1;
        }
    });
});

it('removes multiple selectors', () => {
    var input = '.a, .b, .c {}',
        output = '.a {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') === -1 && parts.indexOf('.c') === -1;
        }
    });
});

it('does not remove @media', () => {
    var input = '@media screen {.b {}} .b {} .c {}',
        output = '@media screen {.b {}} .b {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') > -1;
        }
    });
});

it('keeps @media when removing rules', () => {
    var input = '@media screen {.b {}} @media screen {.c {}}',
        output = '@media screen {.b {}}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') > -1;
        }
    });
});

it('keeps @media when removing rules with multiple selectors', () => {
    var input = '@media screen {.b strong {}} @media screen {.c {}}',
        output = '@media screen {.b strong {}}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') > -1;
        }
    });
});

it('removes adjacent sibling selectors', () => {
    var input = '.a, .b + .c {} .b+.c {}',
        output = '.a {}';
    return run(input, output, {
        filter: (selector) => {
            return selector.indexOf('+') === -1;
        }
    });
});

it('removes direct sibling selectors', () => {
    var input = '.a, .b ~ .c {} .b~.c {}',
        output = '.a {}';
    return run(input, output, {
        filter: (selector) => {
            return selector.indexOf('~') === -1;
        }
    });
});
