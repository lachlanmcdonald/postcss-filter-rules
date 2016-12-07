/* eslint max-len: 0 */

var postcss = require('postcss');

module.exports = postcss.plugin('postcss-filter-rules', function (options) {
    options = options || {};

    var cssSeparator = /\s+|\s*[~+>]\s*/,
        defaultSafeAtRules = ['charset', 'import', 'keyframes'],
        removeAtRules = ['font-face', 'charset', 'import', 'keyframes'];

    options.filter = options.filter || function () {
        return true;
    };

    if (Array.isArray(options.keepAtRules) === false) {
        options.keepAtRules = defaultSafeAtRules;
    }

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

        root.walkAtRules(function (rule) {
            if (options.keepAtRules.indexOf(rule.name) === -1) {
                var isEmpty = Array.isArray(rule.nodes) && rule.nodes.length === 0,
                    removeByDefault = removeAtRules.indexOf(rule.name) >= 0;

                if (isEmpty || removeByDefault) {
                    rule.parent.removeChild(rule);
                }
            }
        });
    };
});
