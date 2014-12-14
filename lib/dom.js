
var util = require('util');
var selectors = require('./selectors.js');
var parsecomb = require('parsecomb.js');

function ArrayBackedNodeList(array) {
	this._array = array;
	this._length = 0;
	this._update();
}
ArrayBackedNodeList.prototype._update = function() {
	if(this._array.length > this._length) {
		for(var i = this._length; i < this._array.length; i++) {
			var self = this;
			(function(i) { // we need a copy of i in the closure
				Object.defineProperty(self, i, { configurable: true,
						get: function() {
							return self._array[i];
						} });
			})(i);
		}
		this._length = this._array.length;
	}else if(this._array.length < this._length) {
		for(var i = this._array.length; i < this._length; i++)
			delete this[i];
		this._length = this._array.length;
	}
};
Object.defineProperty(ArrayBackedNodeList.prototype, 'length', {
		get: function() {
			return this._length;
		} });

// --------------------------------------------------------
// Node
// --------------------------------------------------------

function Node(document) {
	// --------------- defined in Node ---------------
	this.ownerDocument = document;
	this.parentNode = null;
}
// --------------- defined in Node ---------------
Node.ELEMENT_NODE = 1;
Node.TEXT_NODE = 3;
Node.DOCUMENT_NODE = 9;
Node.DOCUMENT_FRAGMENT_NODE = 11;
Object.defineProperty(Node.prototype, 'firstChild', {
		get: function() {
			if(this.childNodes.length == 0)
				return 0;
			return this.childNodes[0];
		} });
Object.defineProperty(Node.prototype, 'lastChild', {
		get: function() {
			if(this.childNodes.length == 0)
				return 0;
			return this.childNodes[this.childNodes.length - 1];
		} });
Object.defineProperty(Node.prototype, 'nextSibling', {
		get: function() {
			return this.parentNode._getNextSibling(this);
		} });
Object.defineProperty(Node.prototype, 'parentElement ', {
		get: function() {
			if(!(this.parentNode instanceof Element))
				return null;
			return this.parentNode;
		} });
Object.defineProperty(Node.prototype, 'previousSibling', {
		get: function() {
			return this.parentNode._getPreviousSibling(this);
		} });
Node.prototype.contains = function(other) {
	for(var i = 0; i < this.childNodes.length; i++) {
		if(this.childNodes[i] == other)
			return true;
		if(this.childNodes[i].contains(other))
			return true;
	}
	return false;
};
Node.prototype.hasChildNodes = function() {
	return this.childNodes.length > 0;
};

// --------------------------------------------------------
// Attr
// --------------------------------------------------------

function Attr(name, value) {
	this.name = name;
	this.value = value;
}

// --------------------------------------------------------
// ClassList
// --------------------------------------------------------

function ClassList(element) {
	this._element = element;
}
ClassList.prototype.add = function(name) {
	var list = this._element.className.split(/ /);
	if(list.indexOf(name) != -1)
		return;
	list.push(name);
	this._element.className = list.join(' ');
};
ClassList.prototype.contains = function(name) {
	var list = this._element.className.split(/ /);
	return list.indexOf(name) != -1;
};
ClassList.prototype.remove = function(name) {
	var list = this._element.className.split(/ /);
	this._element.className = list.filter(function(existing) {
		return existing != name;
	}).join(' ');
};

// --------------------------------------------------------
// Element
// --------------------------------------------------------

function Element(document, tag_name) {
	Node.call(this, document);
	// --------------- internal properties ---------------
	this._realChildren = [ ];
	this._realAttributes = [ ];
	// --------------- inherited from Node ---------------
	this.childNodes = new ArrayBackedNodeList(this._realChildren);
	// --------------- defined in Element ---------------
	this.classList = new ClassList(this);
	this.tagName = tag_name;
}
Element.prototype = Object.create(Node.prototype);
// --------------- internal properties ---------------
Element.prototype._getNextSibling = function(child) {
	var index = this._indexOf(child);
	if(this._realChildren.length == index + 1)
		return null;
	return this._realChildren[index + 1];
};
Element.prototype._getPreviousSibling = function(child) {
	var index = this._indexOf(child);
	if(index == 0)
		return null;
	return this._realChildren[index - 1];
};
Element.prototype._stringify = function(buffer) {
	buffer.push('<');
	buffer.push(this.tagName);
	for(var i = 0; i < this._realAttributes.length; i++) {
		buffer.push(' ');
		buffer.push(this._realAttributes[i].name);
		buffer.push('="');
		buffer.push(this._realAttributes[i].value);
		buffer.push('"');
	}
	buffer.push('>');
	for(var i = 0; i < this._realChildren.length; i++)
		this._realChildren[i]._stringify(buffer);
	buffer.push('</' + this.tagName + '>');
};
// --------------- inherited from Node ---------------
Element.prototype.nodeType = Node.ELEMENT_NODE;
Element.prototype.appendChild = function(child) {
	if(child.parentNode)
		child.parentNode.removeChild(child);
	this._realChildren.push(child);
	this.childNodes._update();
};
Element.prototype.insertBefore = function(child, reference) {
	if(!reference) {
		this.appendChild(child);
	}else{
		if(reference.parentNode != this)
			throw new Error("Node is not a child of this element");
		if(child.parentNode)
			child.parentNode.removeChild(child);
		var index = this._indexOf(reference);
		this._realChildren.splice(index, 0, child);
		this.childNodes._update();
	}
};
Element.prototype.removeChild = function(child) {
	if(child.parentNode != this)
		throw new Error("Node is not a child of this element");
	var index = this._indexOf(child);
	this._realChildren.splice(index, 1);
	this.childNodes._update();
};
// --------------- defined in Element ---------------
Element.prototype.getAttribute = function(name) {
	for(var i = 0; i < this._realAttributes.length; i++) {
		if(this._realAttributes[i].name == name)
			return this._realAttributes[i].value;
	}
	return null;
};
Element.prototype.setAttribute = function(name, value) {
	for(var i = 0; i < this._realAttributes.length; i++) {
		if(this._realAttributes[i].name == name) {
			this._realAttributes[i].value = value;
			return;
		}
	}
	this._realAttributes.push(new Attr(name, value));
};
Object.defineProperty(Element.prototype, 'className', {
		get: function() {
			var value = this.getAttribute('class');
			if(value)
				return value;
			return '';
		},
		set: function(value) {
			this.setAttribute('class', value);
		} });
Object.defineProperty(Element.prototype, 'id', {
		get: function() {
			return this.getAttribute('id');
		},
		set: function(value) {
			this.setAttribute('id', value);
		} });

// --------------------------------------------------------
// Text
// --------------------------------------------------------

function Text(document, data) {
	this.data = data;
}
Text.prototype = Object.create(Node.prototype);
Text.prototype._stringify = function(buffer) {
	buffer.push(this.data);
};
// --------------- inherited from Node ---------------
Text.prototype.childNodes = new ArrayBackedNodeList([ ]);
Object.defineProperty(Text.prototype, 'nodeValue', {
		get: function() {
			return this.data;
		},
		set: function(value) {
			this.data = value;
		} });
// --------------- inherited from CharacterData ---------------
Object.defineProperty(Text.prototype, 'length', {
		get: function() {
			return this.data.length;
		} });

// --------------------------------------------------------
// Document
// --------------------------------------------------------

function Document() {
	Node.call(this, null);
	// --------------- defined in Document ---------------
	this.documentElement = null;
}
Document.prototype = Object.create(Node.prototype);
// --------------- internal properties ---------------
Document.prototype._stringify = function(buffer) {
	this.documentElement._stringify(buffer);
};
// --------------- inherited from Node ---------------
Document.prototype.appendChild = function(child) {
	if(this.documentElement)
		throw new Error("Document already has a child");
	this.documentElement = child;
};
// --------------- defined in Document ---------------
Document.prototype.createElement = function(tag_name) {
	return new Element(this, tag_name);
};
Document.prototype.createTextNode = function(data) {
	return new Text(this, data);
};
Document.prototype.querySelectorAll = function(selector_string) {
	var selector = selectors.parseSelector(new parsecomb.StringInput(selector_string));
	if(selector instanceof parsecomb.ParseError)
		throw new Error("Parse error: " + selector.getMessage());
	
	var results = [ ];
	selectors.evaluateSelector(selector, this.documentElement, results);
	return results;
}

// --------------------------------------------------------
// stringify
// --------------------------------------------------------
function stringify(node) {
	var buffer = [ ];
	node._stringify(buffer);
	return buffer.join('');
}

module.exports.Node = Node;
module.exports.Element = Element;
module.exports.Text = Text;
module.exports.Document = Document;
module.exports.stringify = stringify;

