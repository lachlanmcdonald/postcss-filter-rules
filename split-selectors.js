/* eslint max-len: 0 */
/* jshint esversion: 6 */
'use strict';

const parser = require('postcss-selector-parser');
const processor = parser();

module.exports = (selector) => {
    let temp = [],
        result;

    result = processor.process(selector, {
        lossless: false
    });

    let combineWithLast = false;
    result.res.nodes[0].nodes.forEach((x) => {
        let xs = x.toString();

        if (x.type !== 'combinator') {
            if (combineWithLast) {
                temp[temp.length - 1] += xs;
            } else {
                temp.push(xs);
            }
            combineWithLast = true;
        } else {
            combineWithLast = false;
        }
    });

    return temp.map((x) => {
        return x.trim();
    });
};
