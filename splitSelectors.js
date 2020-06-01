const parser = require('postcss-selector-parser');

const processor = parser(root => {
	root.walkComments(x => x.remove());
});

module.exports = selector => {
	let result = [];
	let astResult = processor.astSync(selector, {
		lossless: false
	});

	let combineWithLast = false;
	astResult.nodes[0].nodes.forEach(x => {
		if (x.type !== 'combinator') {
			let xs = x.toString();

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
