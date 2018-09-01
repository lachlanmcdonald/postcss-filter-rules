'use strict';

const postcss = require('postcss');
const splitSelectors = require('./split-selectors');

module.exports = postcss.plugin('postcss-filter-rules', (options) => {
    options = options || {};

    let defaultSafeAtRules = ['charset', 'import', 'keyframes'],
        removeAtRules = ['font-face', 'charset', 'import', 'keyframes'];

    options.filter = options.filter || (() => {
        return true;
    });

    if (options.keepAtRules !== true && Array.isArray(options.keepAtRules) === false) {
        options.keepAtRules = defaultSafeAtRules;
    }

    return (root) => {
        root.walkRules((rule) => {
            let selectors = rule.selectors.slice().filter((selector) => {
                return options.filter(selector, splitSelectors(selector));
            });

            if (selectors.length === 0) {
                rule.parent.removeChild(rule);
            } else {
                rule.selectors = selectors;
            }
        });

        if (options.keepAtRules !== true) {
            root.walkAtRules((rule) => {
                if (options.keepAtRules.indexOf(rule.name) === -1) {
                    let isEmpty = Array.isArray(rule.nodes) && rule.nodes.length === 0,
                        removeByDefault = removeAtRules.indexOf(rule.name) >= 0;

                    if (isEmpty || removeByDefault) {
                        rule.parent.removeChild(rule);
                    }
                }
            });
        }
    };
});
