
var dom = require('./dom.js');

var globalDocument;

function useGlobalDocument() {
	Object.defineProperty(global, 'document', {
		get: function() { return globalDocument; }
	});
}

function lockDocument(the_document) {
	if(globalDocument)
		throw new Error("There is already another locked document!");
	globalDocument = the_document;
}
function unlockDocument() {
	if(!globalDocument)
		throw new Error("No document locked!");
	globalDocument = null;
}

module.exports.Node = dom.Node;
module.exports.Element = dom.Element;
module.exports.Text = dom.Text;
module.exports.Document = dom.Document;
module.exports.newImplementation = dom.newImplementation;
module.exports.stringify = dom.stringify;
module.exports.streamUtf8 = dom.streamUtf8;
module.exports.useGlobalDocument = useGlobalDocument;
module.exports.lockDocument = lockDocument;
module.exports.unlockDocument = unlockDocument;

