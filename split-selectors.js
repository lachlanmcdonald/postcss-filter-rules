const parser = require('postcss-selector-parser');
const processor = parser((root) => {
  root.walkComments(x => x.remove());
});

module.exports = (selector) => {
    const result = [];
    const astResult = processor.astSync(selector, {
        lossless: false
    });

    let combineWithLast = false;
    astResult.nodes[0].nodes.forEach((x) => {
        let xs = x.toString();

        if (x.type !== 'combinator') {
            if (combineWithLast) {
                result[result.length - 1] += xs;
            } else {
                result.push(xs);
            }
            combineWithLast = true;
        } else {
            combineWithLast = false;
        }
    });

    return result;
};
