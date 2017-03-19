/*
Q.js - a tiny jQuery-inspired library

The MIT License (MIT)

Copyright (c) 2016 Ian Jones

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


// Add some useful methods to all Elements

// Returns true if this element has class (name)
Element.prototype.hasClass = function(name) {
	return new RegExp("(?:^|\\s)" + name + "(?:\\s|$)").test(this.className);
}

// Removes class (name)
Element.prototype.removeClass = function(name) {
	this.className = this.className.replace(new RegExp(
		"(^|\\s)" + name + "(\\s|$)", "g"), " ").replace(
		/(^\s|\s{2,}|\s$)/g, "");
}

// Adds class (name)
Element.prototype.addClass = function(name) {
	if (this.hasClass(name)) return;
	this.className = (this.className + " " + name).replace(
		/(^\s|\s{2,}|\s$)/g, "");
}

// Toggle class (name)
Element.prototype.toggleClass = function(name) {
	if (this.hasClass(name)) {
		this.className = this.className.replace(new RegExp(
			"(^|\\s)" + name + "(\\s|$)", "g"), " ").replace(
			/(^\s|\s{2,}|\s$)/g, "");
		return false;
	} else {
		this.className = (this.className + " " + name).replace(
			/(^\s|\s{2,}|\s$)/g, "");
		return true;
	}
}

// Append elements or HTML strings
Element.prototype.append = function(node) {
	if (typeof node === 'string') { // HTML string
		var frag = document.createElement("div");
		frag.innerHTML = node;
		for (var x = 0, y = frag.children.length; x < y; ++ x) {
			this.appendChild(frag.children[x]);
		}
	} else { // Element(s)
		this.appendChild(node);
	}
}

// Append plaintext strings (sanitizes automatically)
Element.prototype.appendText = function(text) {
	this.appendChild(document.createTextNode(text));
}

// Provide a shorter alias for a built-in function
Document.prototype.q = function() {
	var result = Document.prototype.querySelectorAll.apply(this, arguments);
	if (result.length === 1) return result[0];
	return result;
}
DocumentFragment.prototype.q = function() {
	var result = DocumentFragment.prototype.querySelectorAll.apply(this, arguments);
	if (result.length === 1) return result[0];
	return result;
}
Element.prototype.q = function() {
	var result = Element.prototype.querySelectorAll.apply(this, arguments);
	if (result.length === 1) return result[0];
	return result;
}
// Make it so that checking the length of .q will always work
Element.prototype.length = 1;

// Make it possible to query a list of elements
HTMLCollection.prototype.q =
NodeList.prototype.q = function() {
	var result = new Array();
	for (var i = this.length; i --; ) {
		var i_result = this[i].querySelectorAll.apply(this[i], arguments);
		for (var x = 0, y = i_result.length; x < y; ++ x) {
			result.push(i_result[x]);
		}
	}
	if (result == 1) return result[0];
	result.q = this.q;
	result.do = this.do;
	return result;
}

// Makes it easy to perform an action on one or more elements
Element.prototype.do = function(method) {
	if (typeof method === 'string') { // Method
		this[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else { // Function
		method.apply(this, Array.prototype.slice.call(arguments, 1));
	}
}
HTMLCollection.prototype.do =
NodeList.prototype.do = function(method) {
	// Loop through elements and perform action on each one
	for (var i = this.length; i --; ) {
		this[i].do.apply(this[i], arguments);
	}
}

// Make it easy to scroll an element into view (polyfill + simplicity)
Element.prototype.scrollTo = function(x, y) {
	// (x, y)
	if (y != null && typeof x === 'number') {
		this.scrollLeft = x;
		this.scrollTop = y;
		return;
	}
	// (y)
	if (typeof x === 'number') {
		this.scrollTop = x;
		return;
	}
	// (Element)
	if (x instanceof Element) {
		var t_rect = this.getBoundingClientRect();
		var x_rect = x.getBoundingClientRect();
		if (x_rect.top > t_rect.top + t_rect.height - x_rect.height) {
			this.scrollTop += x_rect.bottom - t_rect.bottom;
		} else if (x_rect.top < t_rect.top) {
			this.scrollTop += x_rect.top - t_rect.top;
		}
	}
}

function EventListenerInfo(arg) {
	this.type = arg[0];
	this.func = arg[1];
	this.capture = arg[2] || false;
}

Element.prototype._addEventListener =
	Element.prototype.addEventListener;

Element.prototype.addEventListener = function(type,
	func, capture) {
	// If events hasn't been initialized, initialize it
	if (!this.events) this.events = new Array();
	// Store the event listener so it can be
	// removed later
	this.events.push(new EventListenerInfo(arguments));
	// Call the client's native method
	this._addEventListener(type, func, capture);
}

Element.prototype.unbindEventListeners = function(type) {
	if (!this.events) return;
	var type = type || "";
	var i = this.events.length;
	while (i --) {
		var e = this.events[i];
		if (type != "" && type != e.type) continue;
		this.removeEventListener(e.type,
			e.func, e.capture);
		this.events.splice(i, 1);
	}
}

Element.prototype.empty = function() { // Removes all children
	while (this.firstChild) {
		if (this.firstChild instanceof Element) {
			// Remove child's children
			this.firstChild.empty();
			// Remove events
			this.firstChild.unbindEventListeners();
		}
		// Remove child node
		this.removeChild(this.firstChild);
	}
}

Element.prototype.remove = function() {
	this.unbindEventListeners();
	if (this.parentElement != null) {
		this.parentElement.removeChild(this);
	}
}

Element.prototype.getStyle = function(name) {
	return this.currentStyle ? this.currentStyle[name] :
     getComputedStyle(this, null)[name];
}