CURRENT_EQUATION = null;
CURRENT_GOAL = 0;
IS_WON = false;

document.addEventListener("DOMContentLoaded", () => {
	if (!location.hash) {
		init();
	} else {
		load();
	}
	window.addEventListener("click", click);
	window.addEventListener("hashchange", load);
});

function init() {
	var numbers = new Array();
	// Generate big numbers
	for (let i = 2; i --; ) {
		numbers.push(choose(10, 15, 20, 25, 50, 75, 100, 200));
	}
	// Generate little numbers
	for (let i = 4; i --; ) {
		numbers.push(1 + irandom(9));
	}
	// Calculate goal number
	var goal = 0.5;
	while (Math.floor(goal) !== goal || goal < 100 || goal > 999 ||
		numbers.indexOf(goal) !== -1) {
		let temp = numbers.slice();
		goal = temp.splice(irandom(6), 1)[0];
		for (let i = 4 + irandom(2) -
			Math.ceil(0.5 * Math.sqrt(irandom(17))); i --; ) {
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
	// Generate the unique puzzle id
	let id = pad(base62(goal));
	for (let i = 6; i --; ) {
		id += pad(base62(numbers[i]));
	}
	// Set the hash
	location.hash = "#=" + id;
}

// This function is just a Time Lord
function regenerate() {
	document.q("main,nav,#numbers").do("empty");
	init();
	if (IS_WON) {
		IS_WON = false;
		CURRENT_EQUATION = null;
		document.body.removeClass("success");
		let overlay = document.querySelector("#success");
		overlay.addClass("out");
		setTimeout(() => {
			overlay.remove();
		}, 250);
	}
}

function load() {
	try {
		document.querySelector("#share").href =
			"https://wits.run/enum" + location.hash;
		var id = location.hash.substr(2);
		var goal = CURRENT_GOAL = decodeBase62(id.substr(0, 2));
		var numbers = new Array();
		for (let i = 6; i --; ) {
			numbers.push(decodeBase62(id.substr(2 + 2 * i, 2)));
		}
		// Empty the main content
		CURRENT_EQUATION = null;
		document.querySelector("main").empty();
		// Generate number elements
		var numbersWrapper = document.querySelector("#numbers");
		numbersWrapper.empty();
		for (let n of numbers) {
			let a = document.createElement("a");
			a.className = "number";
			a.setAttribute("data-number", n);
			a.appendChild(document.createTextNode(n));
			numbersWrapper.appendChild(a);
		}
		var goalWrapper = document.querySelector("nav");
		goalWrapper.empty();
		goalWrapper.setAttribute("data-number", goal);
		goalWrapper.removeAttribute("data-difficulty");
		goalWrapper.appendChild(document.createTextNode(goal));
		CURRENT_GOAL = goal;
		// Attempt to calculate the difficulty of this puzzle
		difficulty();
	} catch (e) {
		init();
	}
}

function click(event) {
	// If the game is currently on the game over screen
	if (IS_WON) return;
	// Find useful targets
	var t = event.target;
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
		}, 18);
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
				}, 18);
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
		}, 18);
		setTimeout(() => {
			elem.style.transition = "";
		}, 250);
	}
	CURRENT_EQUATION = null;
}

// Calculates the diffculty of this puzzle
function difficulty() {
	// If the client doesn't support web workers, stop here
	if (!window.Worker) return;
	// Get the current goal
	var goal = CURRENT_GOAL;
	// Get the current numbers
	var numbers = new Array();
	document.q("a.number").do(function() {
		numbers.push(+this.getAttribute("data-number"));
	});
	// Create a worker
	var w = new Worker("js/difficulty.js");
	// Set up the event listener
	w.addEventListener("message", (event) => {
		console.group("Received data from worker");
		console.log(event.data);
		console.groupEnd();
		// Show the difficulty
		document.querySelector("nav").setAttribute(
			"data-difficulty", event.data);
		w.terminate();
	});
	// Send this information to the worker
	w.postMessage({
		goal: goal,
		numbers: numbers
	});
}

function success() {
	IS_WON = true;
	document.body.addClass("success");
	var overlay = document.createElement("div");
	overlay.id = "success";
	var title = document.createElement("header");
	title.appendText(choose("Superb!", "Perfect!", "Fantastic!",
		"Awesome!", "Well done!", "Great job!", "Magnificent!",
		"Wonderful!", "Stunning!", "Incredible!", "Flawless!",
		"Amazing!", "Impressive!", "Marvelous!", "Excellent!",
		"Extraordinary!", "Spectacular!", "Splendid!",
		"Brilliant!", "Dazzling!", "Phenomenal!", "Outstanding!"));
	overlay.appendChild(title);
	var newButton = document.createElement("a");
	newButton.id = "new-button";
	newButton.appendText("New Puzzle");
	newButton.addEventListener("click", () => {
		document.q("main,nav,#numbers").do("empty");
		init();
		IS_WON = false;
		CURRENT_EQUATION = null;
		document.body.removeClass("success");
		overlay.addClass("out");
		setTimeout(() => {
			overlay.remove();
		}, 250);
	});
	overlay.appendChild(newButton);
	document.body.appendChild(overlay);
	setTimeout(() => {
		document.querySelector("nav").removeAttribute(
			"data-difficulty");
	}, 200);
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
		}, 18);
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

// Sets the numbers for the puzzle
function setNumbers() {
	// Set the goal?
	if (arguments.length === 7) {
		CURRENT_GOAL = arguments[6];
		document.querySelector("nav").do(function() {
			this.setAttribute("data-number", CURRENT_GOAL);
			this.empty();
			this.appendText(CURRENT_GOAL);
		});
	}
	// Set the other six
	let numbers = document.querySelector("#numbers");
	for (let i = 6; i --; ) {
		let n = arguments[i];
		numbers.children[i].do(function() {
			this.setAttribute("data-number", n);
			this.empty();
			this.appendText(n);
		});
	}
}

function irandom(n) {
	return Math.floor(Math.random() * n);
}

function choose() {
	return arguments[Math.floor(Math.random() * arguments.length)];
}

function base62(n) {
	var s = "";
	while (n) {
		let d = n % 62;
		if (d < 10) {

		} else if (d < 36) {
			d = String.fromCharCode(55 + d);
		} else {
			d = String.fromCharCode(61 + d);
		}
		s = d + s;
		n = Math.floor(n / 62);
	}
	return s || "0";
}

function decodeBase62(s) {
	var n = 0;
	for (let i = s.length; i --; ) {
		let c = s[i];
		let d;
		if (c >= '0' && c <= '9') {
			d = +c;
		} else if (c >= 'A' && c <= 'Z') {
			d = c.charCodeAt(0) - 55;
		} else {
			d = c.charCodeAt(0) - 61;
		}
		n += d * Math.pow(62, s.length - i - 1);
	}
	return n;
}

// Left pads a string (s) with zeros until
// it is at least (w) characters wide
function pad(s, w) {
	var w = w || 2;
	for ( ; s.length < w; s = "0" + s);
	return s;
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
			}, 18);
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
	if (this.values.length <= 2) {
		result = this.values[0];
		if (result === CURRENT_GOAL) success();
		return;
	}
	// Create a copy of the values
	var values = this.values.slice();
	// If the last value is an operation
	if (typeof values[values.length - 1] === 'string') {
		// Remove it from the copy
		values.splice(values.length - 1);
	}
	// Multiply and divide adjacent numbers
	for (let x = 1, y = values.length; x < y; x += 2) {
		switch (values[x]) {
			case "*":
				values[x - 1] *= values[x + 1];
				values.splice(x, 2);
				x -= 2;
				y -= 2;
				break;
			case "/":
				values[x - 1] /= values[x + 1];
				values.splice(x, 2);
				x -= 2;
				y -= 2;
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
		}, 18);
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
		success();
	}
}