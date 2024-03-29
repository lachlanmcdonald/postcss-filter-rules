const splitSelectors = require('./splitSelectors');

const DEFAULT_SAFE_AT_RULES = ['charset', 'import', 'keyframes'];
const REMOVE_AT_RULES = ['font-face', 'charset', 'import', 'keyframes'];

const plugin = options => {
	options = options || {};

	options.filter = options.filter || (() => {
		return true;
	});

	options.splitFunction = typeof options.splitFunction === 'function' ? options.splitFunction : splitSelectors;

	if (options.keepAtRules !== true && Array.isArray(options.keepAtRules) === false) {
		options.keepAtRules = DEFAULT_SAFE_AT_RULES;
	}

	return root => {
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
	};
};

plugin.postcss = true;

module.exports = plugin;
