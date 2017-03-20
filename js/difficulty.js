// Calculates the difficulty of a particular puzzle
self.addEventListener("message", (event) => {
	// Pull out the data
	var goal = event.data.goal;
	var numbers = event.data.numbers;
	// TEMP
	console.log("Goal: %d | Numbers: %s", goal, numbers.join(", "));
	var result;
	// Keep track of the shortest and longest ways to
	// get the result
	var min = Infinity;
	var max = -Infinity;
	// Recursively determine the number of ways to get the goal
	var count = 0;
	var check = function(n, res) {
		// Check if goal met
		if (res === goal) {
			++ count;
			var moves = numbers.length - n.length;
			min = Math.min(min, moves);
			max = Math.max(max, moves);
			return;
		}
		// Check if end
		if (n.length === 0) return;
		// Check if first
		if (res == null) {
			// Loop through and call each possible start
			for (let i = n.length; i --; ) {
				let nums = n.slice();
				let x = nums.splice(i, 1)[0];
				check(nums, x);
			}
		} else {
			// Loop through and call each possible start
			for (let i = n.length; i --; ) {
				let nums = n.slice();
				let x = nums.splice(i, 1)[0];
				check(nums, res + x);
				check(nums, res - x);
				check(nums, res * x);
				check(nums, res / x);
			}
		}
	};
	check(numbers, null);
	// TEMP
	console.log("Count: %d | Min: %d, Max: %d", count, min, max);
	// Calculate the difficulty
	if (min <= 2 || count > 800) {
		result = 1;
	} else if (min >= 5 || count < 200) {
		result = 3;
	} else {
		result = 2;
	}
	// Send the result
	postMessage(result);
});