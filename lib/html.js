
var dom = require('./dom.js')

// --------------------------------------------------------
// HTMLElement
// --------------------------------------------------------

function HTMLElement(document, tag_name) {
	dom.Element.call(this, document, tag_name);
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

