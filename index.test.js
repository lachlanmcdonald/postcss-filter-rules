const postcss = require('postcss');
const splitSelectors = require('./split-selectors');
const plugin = require('./');

// eslint-disable-next-line arrow-body-style
const runner = (input, output, options) => {
	return postcss([
		plugin(options),
	]).process(input, {
		from: null,
	}).then(result => {
		expect(result.css).toEqual(output);
		expect(result.warnings()).toHaveLength(0);
	});
};

const sampleCharset = '@charset "UTF-8";';
const sampleImport = '@import "/css/sample.css";';

const sampleKeyframes = `@keyframes test {
	0% { color: red; }
	100% { color: blue; }
}`;

const sampleFontFace = `@font-face {
	font-family: "Bitstream Vera Serif Bold";
	src: url("https://mdn.mozillademos.org/files/2468/VeraSeBd.ttf");
}`;

describe('defaults', () => {
	it('does what the readme says', () => {
		const input = `.styleguide span,
	.button span {
		color: red;
	}
	.button {
		color: blue;
	}`;
		const output = `.styleguide span {
		color: red;
	}`;

		return runner(input, output, {
			filter: (selector, parts) => parts.indexOf('.styleguide') > -1,
		});
	});

	it('does nothing by default', () => {
		const input = 'a {}';

		return runner(input, input, {});
	});

	it('keeps rules when filter returns true', () => {
		const input = 'a {}';

		return runner(input, input, {
			filter: () => true,
		});
	});

	it('removes rules when filter returns false', () => runner('a {} .b {} #c {}', '', {
		filter: () => false,
	}));
});

describe('@media', () => {
	it('removes empty @media', () => runner('@media () {}', '', {}));

	it('does not remove @media', () => {
		const input = '@media screen {.b {}} .b {} .c {}';
		const output = '@media screen {.b {}} .b {}';

		return runner(input, output, {
			filter: (selector, parts) => parts.indexOf('.b') > -1,
		});
	});

	it('keeps @media when removing rules', () => {
		const input = '@media screen {.b {}} @media screen {.c {}}';
		const output = '@media screen {.b {}}';

		return runner(input, output, {
			filter: (selector, parts) => parts.indexOf('.b') > -1,
		});
	});

	it('keeps @media when removing rules with multiple selectors', () => {
		const input = '@media screen {.b strong {}} @media screen {.c {}}';
		const output = '@media screen {.b strong {}}';

		return runner(input, output, {
			filter: (selector, parts) => parts.indexOf('.b') > -1,
		});
	});
});

describe('at-rules', () => {
	it('keeps @charset by default', () => runner(sampleCharset, sampleCharset, {}));

	it('keeps @import by default', () => runner(sampleImport, sampleImport, {}));

	it('keeps @keyframes by default', () => runner(sampleKeyframes, sampleKeyframes, {}));

	it('removes @font-face by default', () => runner(sampleFontFace, '', {}));

	it('removes empty at-rules', () => {
		const input = '@font-face {} @media {} @page {}';

		return runner(input, '', {});
	});

	it('removes all at-rules when keepAtRules is an empty array', () => {
		const input = [sampleCharset, sampleImport, sampleKeyframes].join('\n');

		return runner(input, '', {
			keepAtRules: [],
		});
	});

	it('keeps all at-rules when keepAtRules is true', () => {
		const input = [sampleCharset, sampleImport, sampleFontFace, sampleKeyframes].join('\n');

		return runner(input, input, {
			keepAtRules: true,
		});
	});
});

describe('filter', () => {
	it('removes all classes', () => {
		const input = '#a {} .b {} .c {} #d {}';
		const output = '#a {} #d {}';

		return runner(input, output, {
			filter: selector => !/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/u.test(selector),
		});
	});

	it('removes a specific class', () => {
		const input = '#main .a strong {} #main .c strong {}';
		const output = '#main .a strong {}';

		return runner(input, output, {
			filter: (selector, parts) => parts.indexOf('.c') === -1,
		});
	});

	it('removes a selector starting with an ID', () => {
		const input = '#main {} .c {}';
		const output = '.c {}';

		return runner(input, output, {
			filter: selector => selector[0] !== '#',
		});
	});

	it('removes a selector starting with an ID and whitespace', () => {
		const input = '   #main {}    .c {}';
		const output = '   .c {}';

		return runner(input, output, {
			filter: selector => selector[0] !== '#',
		});
	});

	it('removes a single selector', () => {
		const input = '.a, .b, .c {}';
		const output = '.b, .c {}';

		return runner(input, output, {
			filter: (selector, parts) => parts.indexOf('.a') === -1,
		});
	});

	it('removes multiple selectors', () => {
		const input = '.a, .b, .c {}';
		const output = '.a {}';

		return runner(input, output, {
			filter: (selector, parts) => parts.indexOf('.b') === -1 && parts.indexOf('.c') === -1,
		});
	});

	it('removes adjacent sibling selectors', () => {
		const input = '.a, .b + .c {} .b+.c {}';
		const output = '.a {}';

		return runner(input, output, {
			filter: selector => selector.indexOf('+') === -1,
		});
	});

	it('removes direct sibling selectors', () => {
		const input = '.a, .b ~ .c {} .b~.c {}';
		const output = '.a {}';

		return runner(input, output, {
			filter: selector => selector.indexOf('~') === -1,
		});
	});
});

describe('parts selector', () => {
	const TABLE = [
		['*', true],
		['#a', true],
		['#a:not(.b)', true],
		['#a:not(  .b:not(.c  ))', ['#a:not(.b:not(.c))']],
		['#a:matches(.b,   .c)', ['#a:matches(.b,.c)']],
		['#a:matches(.b:not(.c), .d)', ['#a:matches(.b:not(.c),.d)']],
		['#a:has(.b, .c)', ['#a:has(.b,.c)']],
		['#a.b', true],
		['#a.b .c.d', ['#a.b', '.c.d']],
		['#a[foo]', true],
		['#a[foo="bar"]', true],
		['#a[foo="foo bar"]', true],
		['#a[foo~="bar"]', true],
		['#a[foo~="foo bar"]', true],
		['#a[foo^="bar"]', true],
		['#a[foo^="foo bar"]', true],
		['#a[foo$="bar"]', true],
		['#a[foo$="foo bar"]', true],
		['#a[foo*="bar"]', true],
		['#a[foo*="foo bar"]', true],
		['#a[foo|="fruit"]', true],
		['#a[foo|="foo bar"]', true],
		['#a:dir(ltr)', true],
		['#a:lang(zh)', true],
		['#a:any-link', true],
		['#a:link', true],
		['#a:visited', true],
		['#a:target', true],
		['#a:scope', true],
		['#a:current', true],
		['#a:current(.b)', true],
		['#a:past', true],
		['#a:future', true],
		['#a:active', true],
		['#a:hover', true],
		['#a:focus', true],
		['#a:drop', true],
		['#a:drop(active)', true],
		['#a:drop(valid)', true],
		['#a:drop(invalid)', true],
		['#a:enabled', true],
		['#a:disabled', true],
		['#a:read-write', true],
		['#a:read-only', true],
		['#a:placeholder-shown', true],
		['#a:default', true],
		['#a:checked', true],
		['#a:indeterminate', true],
		['#a:valid', true],
		['#a:invalid', true],
		['#a:in-range', true],
		['#a:out-of-range', true],
		['#a:required', true],
		['#a:optional', true],
		['#a:user-error', true],
		['#a:root', true],
		['#a:empty', true],
		['#a:blank', true],
		['#a:nth-child(odd)', true],
		['#a:nth-child(even)', true],
		['#a:nth-child(2n+1)', true],
		['#a:nth-last-child(even)', true],
		['#a:first-child', true],
		['#a:last-child', true],
		['#a:only-child', true],
		['#a::after', true],
		['#a::before', true],
		['#a:nth-of-type(1)', true],
		['#a:nth-last-of-type(1)', true],
		['#a:first-of-type', true],
		['#a:last-of-type', true],
		['#a:only-of-type', true],
		['#a .b', ['#a', '.b']],
		['#a div video', ['#a', 'div', 'video']],
		['#a > .b', ['#a', '.b']],
		['#a>.b', ['#a', '.b']],
		['#a + .b', ['#a', '.b']],
		['#a.b.c + .d .e', ['#a.b.c', '.d', '.e']],
		['#a+.b', ['#a', '.b']],
		['#a ~ .b', ['#a', '.b']],
		['#a~.b', ['#a', '.b']],
		['.b || #a', ['.b', '#a']],
		['.b||#a', ['.b', '#a']],
		['#a:nth-column(3)', true],
		['#a:nth-last-column(3)', true],
		['#a:playing', true],
		['#a:paused', true],
	];

	TABLE.forEach(x => {
		if (x[1] === true) {
			x[1] = [x[0]];
		}
	});

	test.each(TABLE)('\'%s\' splits to %j', (input, output) => {
		const result = splitSelectors(input);

		expect(result).toEqual(output);
	});
});
