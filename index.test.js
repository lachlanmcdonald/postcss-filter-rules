const postcss = require('postcss');

const plugin = require('./');

const run = (input, output, options) => {
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

		return run(input, output, {
			filter: (_selector, parts) => {
				return parts.includes('.styleguide');
			},
		});
	});

	it('does nothing by default', () => {
		const input = 'a {}';

		return run(input, input, {});
	});

	it('keeps rules when filter returns true', () => {
		const input = 'a {}';

		return run(input, input, {
			filter: () => {
				return true;
			},
		});
	});

	it('removes rules when filter returns false', () => {
		return run('a {} .b {} #c {}', '', {
			filter: () => {
				return false;
			},
		});
	});
});

describe('@media', () => {
	it('removes empty @media', () => {
		return run('@media () {}', '', {});
	});

	it('does not remove @media', () => {
		const input = '@media screen {.b {}} .b {} .c {}';
		const output = '@media screen {.b {}} .b {}';

		return run(input, output, {
			filter: (_selector, parts) => {
				return parts.includes('.b');
			},
		});
	});

	it('keeps @media when removing rules', () => {
		const input = '@media screen {.b {}} @media screen {.c {}}';
		const output = '@media screen {.b {}}';

		return run(input, output, {
			filter: (_selector, parts) => {
				return parts.includes('.b');
			},
		});
	});

	it('keeps @media when removing rules with multiple selectors', () => {
		const input = '@media screen {.b strong {}} @media screen {.c {}}';
		const output = '@media screen {.b strong {}}';

		return run(input, output, {
			filter: (_selector, parts) => {
				return parts.includes('.b');
			},
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
		const input = '@font-face {} @media {} @page {}';

		return run(input, '', {});
	});

	it('removes all at-rules when keepAtRules is an empty array', () => {
		const input = [sampleCharset, sampleImport, sampleKeyframes].join('\n');

		return run(input, '', {
			keepAtRules: [],
		});
	});

	it('keeps all at-rules when keepAtRules is true', () => {
		const input = [sampleCharset, sampleImport, sampleFontFace, sampleKeyframes].join('\n');

		return run(input, input, {
			keepAtRules: true,
		});
	});
});

describe('filter', () => {
	it('removes all classes', () => {
		const input = '#a {} .b {} .c {} #d {}';
		const output = '#a {} #d {}';

		return run(input, output, {
			filter: selector => {
				return !/\.-?[A-Z_a-z]+[\w-]*/.test(selector);
			},
		});
	});

	it('removes a specific class', () => {
		const input = '#main .a strong {} #main .c strong {}';
		const output = '#main .a strong {}';

		return run(input, output, {
			filter: (_selector, parts) => {
				return !parts.includes('.c');
			},
		});
	});

	it('removes a selector starting with an ID', () => {
		const input = '#main {} .c {}';
		const output = '.c {}';

		return run(input, output, {
			filter: selector => {
				return selector[0] !== '#';
			},
		});
	});

	it('removes a selector starting with an ID and whitespace', () => {
		const input = '   #main {}    .c {}';
		const output = '   .c {}';

		return run(input, output, {
			filter: selector => {
				return selector[0] !== '#';
			},
		});
	});

	it('removes a single selector', () => {
		const input = '.a, .b, .c {}';
		const output = '.b, .c {}';

		return run(input, output, {
			filter: (_selector, parts) => {
				return !parts.includes('.a');
			},
		});
	});

	it('removes multiple selectors', () => {
		const input = '.a, .b, .c {}';
		const output = '.a {}';

		return run(input, output, {
			filter: (_selector, parts) => {
				return !parts.includes('.b') && !parts.includes('.c');
			},
		});
	});

	it('removes adjacent sibling selectors', () => {
		const input = '.a, .b + .c {} .b+.c {}';
		const output = '.a {}';

		return run(input, output, {
			filter: selector => {
				return !selector.includes('+');
			},
		});
	});

	it('removes direct sibling selectors', () => {
		const input = '.a, .b ~ .c {} .b~.c {}';
		const output = '.a {}';

		return run(input, output, {
			filter: selector => {
				return !selector.includes('~');
			},
		});
	});
});

describe('options', () => {
	it('allows overriding the splitFunction callback', () => {
		const input = '.a {}';
		const output = '.a {}';

		return run(input, output, {
			filter: (selector, parts) => {
				expect(parts).toBe(selector);
				return true;
			},
			splitFunction: selector => selector,
		});
	});
});
