var postcss = require('postcss');

module.exports = postcss.plugin('postcss-filter-rules', function (options) {
    options = options || {};

    var filterIfEmpty = ['media'],
        cssSeparator = /\s+|\s*[~+>]\s*/;

    options.filter = options.filter || function () {
        return true;
    };

    return function (root) {
        root.walkRules(function (rule) {
            var selectors = rule.selectors.slice().filter(function (selector) {
                return options.filter(selector, selector.split(cssSeparator));
            });

            if (selectors.length === 0) {
                rule.parent.removeChild(rule);
            } else {
                rule.selectors = selectors;
            }
        });

        root.walkAtRules(function (atRule) {
            var removeAtRule = filterIfEmpty.indexOf(atRule.name) === -1,
                emptyAtRule = atRule.nodes.length === 0;

            if (removeAtRule || emptyAtRule) {
                atRule.parent.removeChild(atRule);
            }
        });
    };
});
