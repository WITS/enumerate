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
	var lengths = new Array();
	var isSimple = false;
	for (let i = 6; i --; ) {
		lengths[i] = 0;
	}
	var check = function(n, res, simple) {
		// Check if goal met
		if (res === goal) {
			++ count;
			var moves = numbers.length - n.length;
			min = Math.min(min, moves);
			max = Math.max(max, moves);
			++ lengths[moves - 1];
			if (simple) isSimple = true;
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
				check(nums, x, true);
			}
		} else {
			// Loop through and call each possible start
			for (let i = n.length; i --; ) {
				let nums = n.slice();
				let x = nums.splice(i, 1)[0];
				check(nums, res + x, simple);
				check(nums, res - x, simple);
				check(nums, res * x, false);
				check(nums, res / x, false);
			}
		}
	};
	check(numbers, null);
	// Normalize lengths
	var normal = new Array();
	var normalCount = 0;
	for (let i = 6; i --; ) {
		normalCount += (normal[i] = lengths[i] / (1 << i));
	}
	// Calculate lengths distribution
	var dist = new Array();
	var distStr = new Array();
	for (let i = 6; i --; ) {
		dist[i] = lengths[i] / count;
		// TEMP
		distStr[i] = Math.round(dist[i] * 100) + "%";
	}
	// Calculate normalized lengths distribution
	var normDist = new Array();
	var normDistStr = new Array();
	for (let i = 6; i --; ) {
		normDist[i] = normal[i] / normalCount;
		// TEMP
		normDistStr[i] = Math.round(normDist[i] * 100) + "%";
	}
	// TEMP
	console.group("Puzzle Stats");
	console.log("Count (%d) : Min: %d, Max: %d", count, min, max);
	console.log("Lengths      : %s", lengths.join(", "));
	console.log("Norm. Lengths: %s", normal.join(", "));
	console.log("Distribution : %s", distStr.join(", "));
	console.log("Norm. Dist.  : %s", normDistStr.join(", "));
	console.groupEnd();
	// Calculate the difficulty
	if (isSimple ||
		(count > 1000 && normDist[5] < 0.5) ||
		lengths[0] + lengths[1] + lengths[2] > 20 ||
		dist[0] + dist[1] + dist[2] > 0.85) {
		result = 0;
	} else if ((count > 720 && normDist[5] < 0.8) ||
		lengths[0] + lengths[1] + lengths[2] + lengths[3] > 40 ||
		dist[0] + dist[1] + dist[2] + dist[3] > 0.5) {
		result = 1;
	} else if (count - lengths[5] < 50 ||
		(count < 150 && normDist[0] + normDist[1] + normDist[2] < 0.25) ||
		normDist[4] + normDist[5] > 0.95) {
		result = 3;
	} else {
		result = 2;
	}
	// Send the result
	postMessage(result);
});