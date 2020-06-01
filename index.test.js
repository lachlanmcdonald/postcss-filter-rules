const postcss = require('postcss');
const plugin = require('./');

function run (input, output, options) {
	return postcss([
		plugin(options)
	]).process(input, {
		from: null
	}).then(result => {
		expect(result.css).toEqual(output);
		expect(result.warnings()).toHaveLength(0);
	});
};

let sampleCharset = '@charset "UTF-8";';
let sampleImport = '@import "/css/sample.css";';
let sampleKeyframes;
let sampleFontFace;

sampleKeyframes = `@keyframes test {
	0% { color: red; }
	100% { color: blue; }
}`;

sampleFontFace = `@font-face {
	font-family: "Bitstream Vera Serif Bold";
	src: url("https://mdn.mozillademos.org/files/2468/VeraSeBd.ttf");
}`;

describe('defaults', () => {
	test('does what the readme says', () => {
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
				return parts.includes('.styleguide');
			}
		});
	});

	test('does nothing by default', () => {
		let input = 'a {}';
		return run(input, input, {});
	});

	test('keeps rules when filter returns true', () => {
		let input = 'a {}';
		return run(input, input, {
			filter: () => {
				return true;
			}
		});
	});

	test('removes rules when filter returns false', () => {
		return run('a {} .b {} #c {}', '', {
			filter: () => {
				return false;
			}
		});
	});
});

describe('@media', () => {
	test('removes empty @media', () => {
		return run('@media () {}', '', {});
	});

	test('does not remove @media', () => {
		let input = '@media screen {.b {}} .b {} .c {}';
		let output = '@media screen {.b {}} .b {}';

		return run(input, output, {
			filter: (selector, parts) => {
				return parts.includes('.b');
			}
		});
	});

	test('keeps @media when removing rules', () => {
		let input = '@media screen {.b {}} @media screen {.c {}}';
		let output = '@media screen {.b {}}';

		return run(input, output, {
			filter: (selector, parts) => {
				return parts.includes('.b');
			}
		});
	});

	test('keeps @media when removing rules with multiple selectors', () => {
		let input = '@media screen {.b strong {}} @media screen {.c {}}';
		let output = '@media screen {.b strong {}}';

		return run(input, output, {
			filter: (selector, parts) => {
				return parts.includes('.b');
			}
		});
	});
});

describe('at-rules', () => {
	test('keeps @charset by default', () => {
		return run(sampleCharset, sampleCharset, {});
	});

	test('keeps @import by default', () => {
		return run(sampleImport, sampleImport, {});
	});

	test('keeps @keyframes by default', () => {
		return run(sampleKeyframes, sampleKeyframes, {});
	});

	test('removes @font-face by default', () => {
		return run(sampleFontFace, '', {});
	});

	test('removes empty at-rules', () => {
		let input = '@font-face {} @media {} @page {}';
		return run(input, '', {});
	});

	test('removes all at-rules when keepAtRules is an empty array', () => {
		let input = [sampleCharset, sampleImport, sampleKeyframes].join('\n');
		return run(input, '', {
			keepAtRules: []
		});
	});

	test('keeps all at-rules when keepAtRules is true', () => {
		let input = [sampleCharset, sampleImport, sampleFontFace, sampleKeyframes].join('\n');

		return run(input, input, {
			keepAtRules: true
		});
	});
});

describe('filter', () => {
	test('removes all classes', () => {
		let input = '#a {} .b {} .c {} #d {}';
		let output = '#a {} #d {}';

		return run(input, output, {
			filter: selector => {
				return !/\.-?[A-Z_a-z]+[\w-]*/.test(selector);
			}
		});
	});

	test('removes a specific class', () => {
		let input = '#main .a strong {} #main .c strong {}';
		let output = '#main .a strong {}';

		return run(input, output, {
			filter: (selector, parts) => {
				return !parts.includes('.c');
			}
		});
	});

	test('removes a selector starting with an ID', () => {
		let input = '#main {} .c {}';
		let output = '.c {}';

		return run(input, output, {
			filter: selector => {
				return selector[0] !== '#';
			}
		});
	});

	test('removes a selector starting with an ID and whitespace', () => {
		let input = '   #main {}    .c {}';
		let output = '   .c {}';

		return run(input, output, {
			filter: selector => {
				return selector[0] !== '#';
			}
		});
	});

	test('removes a single selector', () => {
		let input = '.a, .b, .c {}';
		let output = '.b, .c {}';

		return run(input, output, {
			filter: (selector, parts) => {
				return !parts.includes('.a');
			}
		});
	});

	test('removes multiple selectors', () => {
		let input = '.a, .b, .c {}';
		let output = '.a {}';

		return run(input, output, {
			filter: (selector, parts) => {
				return !parts.includes('.b') && !parts.includes('.c');
			}
		});
	});

	test('removes adjacent sibling selectors', () => {
		let input = '.a, .b + .c {} .b+.c {}';
		let output = '.a {}';

		return run(input, output, {
			filter: selector => {
				return !selector.includes('+');
			}
		});
	});

	test('removes direct sibling selectors', () => {
		let input = '.a, .b ~ .c {} .b~.c {}';
		let output = '.a {}';

		return run(input, output, {
			filter: selector => {
				return !selector.includes('~');
			}
		});
	});
});
