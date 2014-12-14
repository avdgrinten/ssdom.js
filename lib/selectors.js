
var util = require('util');
var pc = require('parsecomb.js');

function evaluateSelector(selector, root, results) {
	if(selector.evaluate) {
		selector.evaluate(root, results);
		return;
	}

	function walk(node) {
		if(selector.filter(root, node))
			results.push(node);

		for(var i = 0; i < node.childNodes.length; i++)
			walk(node.childNodes[i]);
	}
	walk(root);
}
function filterSelector(selector, root, node) {
	if(selector.filter)
		return selector.filter(root, node);

	var results = [ ];
	selector.evaluate(root, results);
	return results.indexOf(node) != -1;
}

// --------------------------------------------------------
// Selector
// --------------------------------------------------------

function Selector() {
}

// --------------------------------------------------------
// TagSelector
// --------------------------------------------------------

function TagSelector(tag_name) {
	this._tagName = tag_name;
}
util.inherits(TagSelector, Selector);
TagSelector.prototype.filter = function(root, node) {
	if(node.nodeType != node.constructor.ELEMENT_NODE)
		return false;
	if(node.tagName != this._tagName)
		return false;
	return true;
};

// --------------------------------------------------------
// IdSelector
// --------------------------------------------------------

function IdSelector(id) {
	this._id = id;
}
util.inherits(IdSelector, Selector);
IdSelector.prototype.filter = function(root, node) {
	if(node.nodeType != node.constructor.ELEMENT_NODE)
		return false;
	if(node.id != this._id)
		return false;
	return true;
};

// --------------------------------------------------------
// ClassSelector
// --------------------------------------------------------

function ClassSelector(name) {
	this._name = name;
}
util.inherits(ClassSelector, Selector);
ClassSelector.prototype.filter = function(root, node) {
	if(node.nodeType != node.constructor.ELEMENT_NODE)
		return false;
	return node.classList.contains(this._name)
};

// --------------------------------------------------------
// DescendantSelector
// --------------------------------------------------------

function DescendantSelector(parent_selector, child_selector) {
	this._parentSelector = parent_selector;
	this._childSelector = child_selector;
}
util.inherits(DescendantSelector, Selector);
DescendantSelector.prototype.evaluate = function(root, results) {
	var parent_results = [ ];
	evaluateSelector(this._parentSelector, root, parent_results);

	for(var i = 0; i < parent_results.length; i++)
		for(var j = 0; j < parent_results[i].childNodes.length; j++)
			evaluateSelector(this._childSelector,
					parent_results[i].childNodes[j], results);
};

// --------------------------------------------------------
// ChildSelector
// --------------------------------------------------------

function ChildSelector(parent_selector, child_selector) {
	this._parentSelector = parent_selector;
	this._childSelector = child_selector;
}
util.inherits(ChildSelector, Selector);
ChildSelector.prototype.evaluate = function(root, results) {
	var parent_results = [ ];
	evaluateSelector(this._parentSelector, root, parent_results);

	for(var i = 0; i < parent_results.length; i++)
		for(var j = 0; j < parent_results[i].childNodes.length; j++)
			if(filterSelector(this._childSelector, root,
					parent_results[i].childNodes[j]))
				results.push(parent_results[i].childNodes[j]);
};

// --------------------------------------------------------
// SelectorIntersection
// --------------------------------------------------------

function SelectorIntersection(selectors) {
	this._selectors = selectors;
}
util.inherits(SelectorIntersection, Selector);
/*SelectorIntersection.prototype.evaluate = function(results) {
	if(this._selectors.length == 0)
		throw new Error("SelectorIntersection requires at least one selector");
	
	var first_results = this._selectors[0].evaluate(results)
	
	var self = this;
	var all_results = first_results.filter(function(node) {
			for(var i = 1; i < self._selectors.length; i++)
				if(!self._selectors[i].filter(node))
					return false;
			return true;
		});
	
	for(var i = 0; i < all_results.length; i++)
		results.push(all_results[i]);
};*/
SelectorIntersection.prototype.filter = function(root, node) {
	for(var i = 0; i < this._selectors.length; i++)
		if(!filterSelector(this._selectors[i], root, node))
			return false;
	return true;
};

// --------------------------------------------------------
// SelectorUnion
// --------------------------------------------------------

function SelectorUnion(selectors) {
	this._selectors = selectors;
}
util.inherits(SelectorUnion, Selector);
/*SelectorUnion.prototype.evaluate = function(results) {
	for(var i = 0; i < this._selectors.length; i++)
		this._selectors[i].evaluate(results);
};*/
SelectorUnion.prototype.filter = function(root, node) {
	for(var i = 0; i < this._selectors.length; i++)
		if(filterSelector(this._selectors[i], root, node))
			return true;
	return false;
};

// --------------------------------------------------------
// parseSelector and related variables
// --------------------------------------------------------

var tokenTypeSelector = pc.spaceBefore(
	pc.word(function(result) {
		return new TagSelector(result);
	})
);

var tokenSimpleSelectorTail = pc.lookahead([
	{ lookahead: pc.certainChar('#'),
		consume: true,
		parse:
			pc.word(
				function(result) {
					return new IdSelector(result);
				}
			),
		transform:
			function(result) {
				return result.parse;
			}
	},
	{ lookahead: pc.certainChar('.'),
		consume: true,
		parse:
			pc.word(
				function(result) {
					return new ClassSelector(result);
				}
			),
		transform:
			function(result) {
				return result.parse;
			}
	}
]);

var tokenSimpleSelectorSequence = pc.lookahead(
	[
		{ lookahead: tokenTypeSelector,
			consume: true,
			parse: pc.zeroPlus(tokenSimpleSelectorTail),
			transform:
				function(results) {
					return new SelectorIntersection([ results.lookahead ].concat(results.parse));
				}
		}
	], pc.onePlus(tokenSimpleSelectorTail,
		function(results) {
			return new SelectorIntersection(results);
		}
	)
);


var tokenSelector = pc.seq(
	[ tokenSimpleSelectorSequence,
		pc.zeroPlus(
			pc.seq([
				pc.alternative([
					pc.certainChar('>'),
					pc.singleChar(pc.isSpace)
				]),
				tokenSimpleSelectorSequence
			])
		)
	],
	function(results) {
		return results[1].reduce(function(previous, combinator) {
			if(combinator[0] == '>') {
				return new ChildSelector(previous, combinator[1]);
			}else if(pc.isSpace(combinator[0])) {
				return new DescendantSelector(previous, combinator[1]);
			}else throw new Error("Unexpected combinator");
		}, results[0]);
	}
);

var tokenSelectorsGroup = pc.seq(
	[ tokenSelector,
		pc.zeroPlus(
			pc.seq([
				pc.certainChar(','),
				pc.spaceBefore(tokenSelector)
			], function(results) {
				return results[1];
			}))
	],
	function(results) {
		if(results[1].length == 0)
			return results[0];
		return new SelectorUnion([ results[0] ].concat(results[1]));
	}
);

function parseSelector(input) {
	return pc.seq(
		[ tokenSelectorsGroup,
			pc.spaceBefore(pc.eof())
		],
		function(results) {
			return results[0];
		}
	)(input);
}

module.exports.parseSelector = parseSelector;
module.exports.evaluateSelector = evaluateSelector;
module.exports.filterSelector = filterSelector;

