const postcss = require('postcss');
const splitSelectors = require('./split-selectors');

const defaultSafeAtRules = ['charset', 'import', 'keyframes'];
const removeAtRules = ['font-face', 'charset', 'import', 'keyframes'];

module.exports = postcss.plugin('postcss-filter-rules', options => {
	options = options || {};

	options.filter = options.filter || (() => true);

	if (options.keepAtRules !== true && Array.isArray(options.keepAtRules) === false) {
		options.keepAtRules = defaultSafeAtRules;
	}

	return root => {
		root.walkRules(rule => {
			const selectors = rule.selectors.slice().filter(selector => options.filter(selector, splitSelectors(selector)));

			if (selectors.length === 0) {
				rule.parent.removeChild(rule);
			} else {
				rule.selectors = selectors;
			}
		});

		if (options.keepAtRules !== true) {
			root.walkAtRules(rule => {
				if (options.keepAtRules.indexOf(rule.name) === -1) {
					const isEmpty = Array.isArray(rule.nodes) && rule.nodes.length === 0;
					const removeByDefault = removeAtRules.indexOf(rule.name) >= 0;

					if (isEmpty || removeByDefault) {
						rule.parent.removeChild(rule);
					}
				}
			});
		}
	};
});
