const parser = require('postcss-selector-parser');

const processor = parser(root => {
	root.walkComments(x => x.remove());
});

module.exports = selector => {
	const result = [];
	const ast = processor.astSync(selector, {
		lossless: false,
	});
	let combineWithLast = false;

	ast.nodes[0].nodes.forEach(x => {
		const xs = x.toString();

		if (x.type === 'combinator') {
			combineWithLast = false;
		} else {
			if (combineWithLast) {
				result[result.length - 1] += xs;
			} else {
				result.push(xs);
			}
			combineWithLast = true;
		}
	});

	return result;
};
