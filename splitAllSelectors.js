const parser = require('postcss-selector-parser');

const processor = parser(root => {
	root.walkComments(x => x.remove());
});

module.exports = selector => {
	let astResult = processor.astSync(selector, {
		lossless: false
	});

	return astResult.nodes[0].nodes.reduce((temp, x) => {
		if (x.type !== 'combinator') {
			let xs = x.toString();
			temp.push(xs);
		}

		return temp;
	}, []);
};
