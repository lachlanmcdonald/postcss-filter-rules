const splitSelectors = require('./splitSelectors');

const DEFAULT_SAFE_AT_RULES = ['charset', 'import', 'keyframes'];
const REMOVE_AT_RULES = ['font-face', 'charset', 'import', 'keyframes'];

const plugin = (options = {}) => {
	options = {
		filter: () => true,
		keepAtRules: DEFAULT_SAFE_AT_RULES,
		splitFunction: splitSelectors,
		...options,
	};

	return {
		Once(root) {
			root.walkRules(rule => {
				const selectors = rule.selectors.slice().filter(selector => {
					return options.filter(selector, options.splitFunction(selector));
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
						const isEmpty = Array.isArray(rule.nodes) && rule.nodes.length === 0;
						const removeByDefault = REMOVE_AT_RULES.includes(rule.name);

						if (isEmpty || removeByDefault) {
							rule.parent.removeChild(rule);
						}
					}
				});
			}
		},
		postcssPlugin: 'postcss-filter-rules',
	};
};

plugin.postcss = true;

module.exports = plugin;
