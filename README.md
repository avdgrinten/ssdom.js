
# ssdom: server-side DOM implementation

## Overview

ssdom is a DOM implementation intended to be used on web servers.
The typical use case is the dynamic construction of some HTML document
in order to serialize it and send it to a web browser.

### Goals

- Provide an implementation of the basic DOM manipulation functions
	and properties
- Ability to use the same DOM manipulation methods on the server and
	client (i.e. a web browser)
- Optimize for fast DOM generation and serilization and low overhead

### Non-Goals

- Provide an implementation of the full DOM and HTML standards
- Simulate CSS stylesheets and other visual features
- Ability to run JavaScript inside a document

