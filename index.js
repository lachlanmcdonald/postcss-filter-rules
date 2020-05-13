const postcss = require('postcss');

const splitSelectors = require('./splitSelectors');

const defaultSafeAtRules = ['charset', 'import', 'keyframes'];
const removeAtRules = ['font-face', 'charset', 'import', 'keyframes'];

module.exports = postcss.plugin('postcss-filter-rules', options => {
	options = options || {};

	options.filter = options.filter || (() => {
		return true;
	});

	if (options.keepAtRules !== true && Array.isArray(options.keepAtRules) === false) {
		options.keepAtRules = defaultSafeAtRules;
	}

	return root => {
		root.walkRules(rule => {
			let selectors = rule.selectors.slice().filter(selector => {
				return options.filter(selector, splitSelectors(selector));
			});

			if (selectors.length === 0) {
				rule.parent.removeChild(rule);
			} else {
				rule.selectors = selectors;
			}
		});

		if (options.keepAtRules !== true) {
			root.walkAtRules(rule => {
				if (!options.keepAtRules.includes(rule.name)) {
					let isEmpty = Array.isArray(rule.nodes) && rule.nodes.length === 0;
					let removeByDefault = removeAtRules.includes(rule.name);

					if (isEmpty || removeByDefault) {
						rule.parent.removeChild(rule);
					}
				}
			});
		}
	};
});
