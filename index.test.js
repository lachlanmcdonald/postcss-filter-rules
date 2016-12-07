/* jshint esversion: 6 */
const postcss = require('postcss');
const plugin = require('./');

function run(input, output, options) {
    return postcss([plugin(options)]).process(input).then(result => {
        expect(result.css).toEqual(output);
        expect(result.warnings().length).toBe(0);
    });
}

it('does what the readme says', () => {
    'use strict';

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
    'use strict';

    let input = 'a {}';
    return run(input, input, {});
});

it('does nothing', () => {
    'use strict';

    let input = 'a {}';
    return run(input, input, {
        filter: function () {
            return true;
        }
    });
});

it('removes everything', () => {
    'use strict';

    return run('a {} .b {} #c {}', '', {
        filter: () => {
            return false;
        }
    });
});

it('removes empty @media', () => {
    'use strict';

    let input = 'a {} @media () {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes @font-face', () => {
    'use strict';

    let input = 'a {} @font-face {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes @page', () => {
    'use strict';

    let input = 'a {} @page {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes @document', () => {
    'use strict';

    let input = 'a {} @document {}',
        output = 'a {}';
    return run(input, output, {});
});

it('removes all classes', () => {
    'use strict';

    let input = '#a {} .b {} .c {} #d {}',
        output = '#a {} #d {}';

    return run(input, output, {
        filter: (selector) => {
            return !/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/.test(selector);
        }
    });
});

it('removes a specific class', () => {
    'use strict';

    let input = '#main .a strong {} #main .c strong {}',
        output = '#main .a strong {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.c') === -1;
        }
    });
});

it('removes a selector starting with an ID', () => {
    'use strict';

    let input = '#main {} .c {}',
        output = '.c {}';
    return run(input, output, {
        filter: (selector) => {
            return selector[0] !== '#';
        }
    });
});

it('removes a selector starting with an ID and whitespace', () => {
    'use strict';

    let input = '   #main {}    .c {}',
        output = '   .c {}';
    return run(input, output, {
        filter: (selector) => {
            return selector[0] !== '#';
        }
    });
});

it('removes a single selector', () => {
    'use strict';

    let input = '.a, .b, .c {}',
        output = '.b, .c {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.a') === -1;
        }
    });
});

it('removes multiple selectors', () => {
    'use strict';

    let input = '.a, .b, .c {}',
        output = '.a {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') === -1 && parts.indexOf('.c') === -1;
        }
    });
});

it('does not remove @media', () => {
    'use strict';

    let input = '@media screen {.b {}} .b {} .c {}',
        output = '@media screen {.b {}} .b {}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') > -1;
        }
    });
});

it('keeps @media when removing rules', () => {
    'use strict';

    let input = '@media screen {.b {}} @media screen {.c {}}',
        output = '@media screen {.b {}}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') > -1;
        }
    });
});

it('keeps @media when removing rules with multiple selectors', () => {
    'use strict';

    let input = '@media screen {.b strong {}} @media screen {.c {}}',
        output = '@media screen {.b strong {}}';
    return run(input, output, {
        filter: (selector, parts) => {
            return parts.indexOf('.b') > -1;
        }
    });
});

it('removes adjacent sibling selectors', () => {
    'use strict';

    let input = '.a, .b + .c {} .b+.c {}',
        output = '.a {}';
    return run(input, output, {
        filter: (selector) => {
            return selector.indexOf('+') === -1;
        }
    });
});

it('removes direct sibling selectors', () => {
    'use strict';

    let input = '.a, .b ~ .c {} .b~.c {}',
        output = '.a {}';
    return run(input, output, {
        filter: (selector) => {
            return selector.indexOf('~') === -1;
        }
    });
});
