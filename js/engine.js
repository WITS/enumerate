CURRENT_EQUATION = null;
CURRENT_GOAL = 0;

document.addEventListener("DOMContentLoaded", () => {
	init();
	window.addEventListener("click", click);
});

function init() {
	var numbers = new Array();
	// Generate big numbers
	for (let i = 2; i --; ) {
		numbers.push(choose(10, 15, 20, 25, 50, 75, 100));
	}
	// Generate little numbers
	for (let i = 4; i --; ) {
		numbers.push(1 + irandom(9));
	}
	// Generate number elements
	var numbersWrapper = document.querySelector("#numbers");
	for (let n of numbers) {
		let a = document.createElement("a");
		a.className = "number";
		a.setAttribute("data-number", n);
		a.appendChild(document.createTextNode(n));
		numbersWrapper.appendChild(a);
	}
	// Calculate goal number
	var goal = 0.5;
	while (Math.floor(goal) !== goal || goal < 100 || goal > 999) {
		let temp = numbers.slice();
		goal = temp.splice(irandom(6), 1)[0];
		for (let i = 3 + irandom(3); i --; ) {
			let n = temp.splice(irandom(temp.length), 1)[0];
			switch (irandom(4)) {
				case 0: // Add
					goal += n; break;
				case 1: // Subtract
					goal -= n; break;
				case 2: // Multiply
					goal *= n; break;
				case 3: // Divide
					goal /= n; break;
				default: break;
			}
		}
	}
	var goalWrapper = document.querySelector("nav");
	goalWrapper.setAttribute("data-number", goal);
	goalWrapper.appendChild(document.createTextNode(goal));
	CURRENT_GOAL = goal;
}

function click(event) {
	var t = event.target;
	// Find useful targets
	for ( ; t && t.id !== "back" && t.id !== "calculated" &&
		!t.hasClass("number") && !t.hasClass("operation"); t = t.parentElement);
	// If nothing useful was clicked, stop here
	if (!t) return;
	if (t.id === "back" && CURRENT_EQUATION) {
		back();
	} else if (t.id === "calculated") {
		// Move the calculated value to a new equation
		let calculated = document.querySelector("#calculated");
		calculated.style.display = "inline-block";
		start = calculated.getBoundingClientRect();
		calculated.style.display = "";
		let a = document.createElement("a");
		a.className = "number calculated";
		a.setAttribute("data-number", CURRENT_EQUATION.result);
		a.appendText(CURRENT_EQUATION.result);
		a.equation = CURRENT_EQUATION;
		a.equationElements = document.createDocumentFragment();
		let main = document.querySelector("main");
		for (let i = main.children.length; i --; ) {
			a.equationElements.appendChild(main.children[0]);
		}
		// Move the number in the DOM
		CURRENT_EQUATION = new Equation();
		CURRENT_EQUATION.push(a, false);
		let end = a.getBoundingClientRect();
		a.style.transform = "translate(" + (start.left +
			start.width * 0.5 - end.left - end.width * 0.5) + "px, " + (
			start.top - end.top) + "px)";
		setTimeout(() => {
			a.style.transition = "transform 0.25s";
			a.style.transform = "";
		}, 10);
		setTimeout(() => {
			a.style.transition = "";
		}, 250);

	} else if (t.hasClass("number")) {
		// If this number is on the tray
		if (t.parentElement === document.querySelector("#numbers")) {
			// If there isn't already an equation
			if (!CURRENT_EQUATION) {
				CURRENT_EQUATION = new Equation();
			}
			// If the equation is ready to receive a number
			if (CURRENT_EQUATION.values.length % 2 === 0) {
				CURRENT_EQUATION.push(t);
			} else {
				// Clear out the current equation
				back();
				// Try this again
				click({ target: t });
			}
		} else {
			// If the number is the only number, and it is a calculated value
			if (CURRENT_EQUATION.values.length <= 2 && t.equation) {
				// Split the calculated value into its source
				CURRENT_EQUATION = t.equation;
				let start = t.getBoundingClientRect();
				let main = document.querySelector("main");
				main.empty();
				for (let i = t.equationElements.children.length; i --; ) {
					main.appendChild(t.equationElements.children[0]);
				}
				main.q("a.number").do(function() {
					this.style.animation = "operations-in 0.25s";
				});
				setTimeout(() => {
					main.q("a.number").do(function() {
						this.style.animation = "";
					});
				}, 250);
				let elem = document.querySelector("#calculated");
				elem.style.animation = "none";
				let end = elem.getBoundingClientRect();
				elem.style.transform = "translate(0px, " + (
					start.top - end.top) + "px)";
				setTimeout(() => {
					elem.style.transition = "transform 0.25s";
					elem.style.transform = "";
				}, 10);
				setTimeout(() => {
					elem.style.transition = "";
				}, 250);
			} else {
				let main = document.querySelector("main");
				// If this is the first line and it's a calculated value
				if (main.children[0] === t.parentElement && t.equation) {
					// Remove everything up to this line
					undo(t.parentElement, true);
					// Split this line into its source
					click({ target: t });
				} else {
					// Remove everything up to and including this number
					undo(t.parentElement);
				}
			}
		}
	} else if (t.hasClass("operation")) {
		// If no operation has been selected for this part
		// of the equation
		if (t.parentElement.hasClass("indeterminate")) {
			t.addClass("selected");
			t.parentElement.removeClass("indeterminate");
			CURRENT_EQUATION.push(t);
		} else {
			// Remove everything up to, but not including this line
			undo(t.parentElement.parentElement, true);
			// Make this operation indeterminate again
			CURRENT_EQUATION.values.splice(CURRENT_EQUATION.values.length - 1);
			t.removeClass("selected");
			t.parentElement.addClass("indeterminate");
		}
	}
}

// Place the current equation in the tray
function back() {
	// If the current equation only has one number
	var elem;
	var start;
	if (CURRENT_EQUATION.values.length <= 2) {
		// Place that number back in the tray
		elem = document.querySelector("main a.number");
		start = elem.getBoundingClientRect();
		elem.parentElement.removeChild(elem);
		document.querySelector("main").empty();
	} else {
		// Place the evaluated result of the equation in the tray
		let calculated = document.querySelector("#calculated");
		calculated.style.display = "inline-block";
		start = calculated.getBoundingClientRect();
		calculated.style.display = "";
		elem = document.createElement("a");
		elem.className = "number calculated";
		elem.setAttribute("data-number", CURRENT_EQUATION.result);
		elem.appendText(CURRENT_EQUATION.result);
		elem.equation = CURRENT_EQUATION;
		elem.equationElements = document.createDocumentFragment();
		let main = document.querySelector("main");
		for (let i = main.children.length; i --; ) {
			elem.equationElements.appendChild(main.children[0]);
		}
		CURRENT_EQUATION = null;
	}
	// Animate the element to the tray
	if (elem) {
		// Move the number in the DOM
		document.querySelector("#numbers").appendChild(elem);
		let end = elem.getBoundingClientRect();
		elem.style.transform = "scale(2) translate(" + (0.5 * (start.left +
			start.width * 0.5 - end.left - end.width * 0.5)) + "px, " + (
			0.5 * (start.top - end.top)) + "px)";
		setTimeout(() => {
			elem.style.transition = "transform 0.25s, font-size 0.25s";
			elem.style.transform = "";
		}, 10);
		setTimeout(() => {
			elem.style.transition = "";
		}, 250);
	}
	CURRENT_EQUATION = null;
}

// Undoes push operations up to (and including, if exclusive == false)
// the given line element
function undo(line, exclusive) {
	var main = document.querySelector("main");
	var lines = document.querySelectorAll("main > div.line");
	var isFound = false;
	// Work backwards until reaching the line indicated
	for (let i = lines.length; i -- && isFound === false; ) {
		let l = lines[i];
		// Is this the given line
		if (l === line) {
			// If this is an exclusive undo, stop here
			if (exclusive) break;
			isFound = true;
		}
		/// Remove the line
		// Move the number in the DOM
		let a = l.querySelector("a.number");
		let start = a.getBoundingClientRect();
		document.querySelector("#numbers").appendChild(a);
		let end = a.getBoundingClientRect();
		a.style.transform = "scale(2) translate(" + (0.5 * (start.left +
			start.width * 0.5 - end.left - end.width * 0.5)) + "px, " + (
			0.5 * (start.top - end.top)) + "px)";
		setTimeout(() => {
			a.style.transition = "transform 0.25s";
			a.style.transform = "";
		}, 10);
		setTimeout(() => {
			a.style.transition = "";
		}, 250);
		// If the operation was set, remove it from the equation values
		l.q(".operations-wrapper:not(.indeterminate)").do(function() {
			CURRENT_EQUATION.values.splice(CURRENT_EQUATION.values.length - 1, 1);
		});
		// Remove the line from the DOM
		l.remove();
		// Remove the number from the equation values
		CURRENT_EQUATION.values.splice(CURRENT_EQUATION.values.length - 1, 1);
	}
	// If there is now not enough lines for a calculation
	if (CURRENT_EQUATION.values.length <= 2) {
		// Remove the calculated section
		document.q("#calculated").do("remove");
		// If there are no options, remove the equation
		if (CURRENT_EQUATION.values.length === 0) CURRENT_EQUATION = null;
	} else {
		// Recalculate the euqation
		CURRENT_EQUATION.calc();
	}
}

function irandom(n) {
	return Math.floor(Math.random() * n);
}

function choose() {
	return arguments[Math.floor(Math.random() * arguments.length)];
}

Equation = function() {
	this.values = new Array();
}

Equation.prototype.push = function(elem, animate) {
	if (elem.hasClass("operation")) {
		this.values.push(elem.getAttribute("data-value"));
		
	} else {
		this.values.push(+elem.getAttribute("data-number"));
		// Move the number in the DOM
		let start = elem.getBoundingClientRect();
		let div = document.createElement("div");
		div.className = "line";
		div.appendChild(elem);
		// If there is a calculated value
		let calculated = document.querySelector("#calculated");
		if (calculated) {
			// Insert this before that
			calculated.parentElement.insertBefore(div, calculated);
		} else {
			// Append this to the end of main
			document.q("main").appendChild(div);
		}
		if (animate !== false) {
			let end = elem.getBoundingClientRect();
			elem.style.transform = "scale(0.5) translate(" + (2 * (start.left +
				start.width * 0.5 - end.left - end.width * 0.5)) + "px, " + (
				2 * (start.top - end.top)) + "px)";
			setTimeout(() => {
				elem.style.transition = "transform 0.25s";
				elem.style.transform = "";
			}, 10);
			setTimeout(() => {
				elem.style.transition = "";
			}, 250);
		}
		// Add the operation options
		let ops = document.createElement("span");
		ops.className = "operations-wrapper indeterminate";
		let opsText = ["&#247;", "&times;", "-", "+"];
		let opsValues = ["/", "*", "-", "+"];
		for (let i = 4; i --; ) {
			let op = document.createElement("a");
			op.className = "operation";
			op.setAttribute("data-value", opsValues[i]);
			op.innerHTML = opsText[i];
			ops.appendChild(op);
		}
		div.appendChild(ops);
		// Recalculate
		this.calc();
	}
}

// Calculates the result of this equation
Equation.prototype.calc = function() {
	// If there are not at least two numbers, stop here
	if (this.values.length <= 2) return;
	// Create a copy of the values
	var values = this.values.slice();
	// If the last value is an operation
	if (typeof values[values.length - 1] === 'string') {
		// Remove it from the copy
		values.splice(values.length - 1);
	}
	// Multiply and divide adjacent numbers
	for (let i = values.length - 2; i >= 1; i -= 2) {
		switch (values[i]) {
			case "*":
				values[i - 1] *= values[i + 1];
				values.splice(i, 2);
				break;
			case "/":
				values[i - 1] /= values[i + 1];
				values.splice(i, 2);
				break;
			default: break;
		}
	}
	// Add and subtract to get the result
	var result = values.splice(0, 1)[0];
	for (let x = 0, y = values.length; x < y; x += 2) {
		switch (values[x]) {
			case "+": result += values[x + 1]; break;
			case "-": result -= values[x + 1]; break;
			default: break;
		}
	}
	// Round the result
	result = Math.round(result * 1e3) / 1e3;
	// Try to locate the calculated wrapper
	let calculated = document.querySelector("#calculated");
	let lineCount = Math.ceil(this.values.length * 0.5);
	// If the calculated wrapper hasn't been created
	if (calculated == null) {
		calculated = document.createElement("div");
		calculated.id = "calculated";
		document.querySelector("main").appendChild(calculated);
	} else {
		calculated.style.transform = "translateY(" + (56 * (
			+calculated.getAttribute("data-lines") - lineCount)) + "px)";
		setTimeout(() => {
			calculated.style.transition = "transform 0.25s";
			calculated.style.transform = "";
		}, 10);
		setTimeout(() => {
			calculated.style.transition = "";
		}, 250);
	}
	calculated.empty();
	calculated.appendText(result);
	calculated.setAttribute("data-lines", lineCount);
	this.result = result;
	// Detect if they got the right answer
	if (result === CURRENT_GOAL) {
		alert("g'job");
	}
}