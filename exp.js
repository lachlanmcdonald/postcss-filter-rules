const parser = require('postcss-selector-parser');

const transform = root => {
  root.walkComments(x => x.remove());
};

const processor = parser(transform);

const ast = processor.astSync('.a ~ .b::before + .c:not(.d)');

const temp = [];
let combineWithLast = false;

ast.nodes[0].nodes.forEach(x => {
  const nodeString = x.toString();

  console.log(x.type)

  if (x.type === 'combinator') {
    combineWithLast = true;
  } else {
    if (combineWithLast) {
        temp[temp.length - 1] += nodeString;
    } else {
        temp.push(nodeString);
    }

    combineWithLast = false;
  }
})

console.log(temp);
