
var dom = require('./dom.js')

function camelToHyphen(string) {
	return string.replace(/[A-Z]/, function(match) {
		return '-' + match.toLowerCase();
	});
}

var datasetHandler = {
	get: function(target, property) {
		return target._element.getAttribute('data-' + camelToHyphen(property));
	},
	set: function(target, property, value) {
		target._element.setAttribute('data-' + camelToHyphen(property), value);
	}
};

function makeDataset(element) {
	return new Proxy({ _element: element }, datasetHandler);
}

// --------------------------------------------------------
// HTMLElement
// --------------------------------------------------------

function HTMLElement(document, tag_name) {
	dom.Element.call(this, document, tag_name);

	this.dataset = makeDataset(this);
}
HTMLElement.prototype = Object.create(dom.Element.prototype);
HTMLBRElement.prototype._htmlDontClose = false;

// --------------------------------------------------------
// HTMLUnknownElement
// --------------------------------------------------------

function HTMLUnknownElement(document, tag_name) {
	HTMLElement.call(this, document, tag_name);
}
HTMLUnknownElement.prototype = Object.create(HTMLElement.prototype);

// --------------------------------------------------------
// HTMLBRElement
// --------------------------------------------------------

function HTMLBRElement(document) {
	HTMLElement.call(this, document, 'br');
}
HTMLBRElement.prototype = Object.create(HTMLElement.prototype);
HTMLBRElement.prototype._htmlDontClose = true;

module.exports.elementMap = {
	'br': HTMLBRElement
};
module.exports.HTMLUnknownElement = HTMLUnknownElement;

