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
    return run('a {}', 'a {}', {});
});

it('does nothing', () => {
    return run('a {}', 'a {}', {
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
    return run('a {} @media () {}', 'a {}', {});
});

it('removes @font-face', () => {
    return run('a {} @font-face {}', 'a {}', {});
});

it('removes @page', () => {
    return run('a {} @page {}', 'a {}', {});
});

it('removes @document', () => {
    return run('a {} @document {}', 'a {}', {});
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
