var postcss = require('postcss');

module.exports = postcss.plugin('postcss-filter-selectors', function(options) {
    options = options || {};

    return function(root, result) {
    	// WIP
    };
});
