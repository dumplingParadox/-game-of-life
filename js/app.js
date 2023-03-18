const alive = "alive"
const dead = "dead"

ticking = false
stop = false

const State = {
	alive: alive,
	dead: dead,
}

const Colours = {
	alive: "#00FF00",
	dead: "#000000",
}

function buildWorld(config) {
	cellColumnCount = Math.ceil(config["worldLength"]/config["cellSize"])
	cellRowCount = Math.ceil(config["worldBreadth"]/config["cellSize"])
	let cells = new Array(cellColumnCount)
	for (let i = 0; i < cells.length; i++) {
		cells[i] = new Array(cellRowCount)
		for(var j = 0; j < cells[i].length; j++) {
			cells[i][j] = State[dead]
		}
	}
	return cells
}

function updateWorldDisplay(world) {
	for (let i = 0; i < world.length; i++) {
  		for (let j = 0; j < world[i].length; j++) {
  			let cell = document.getElementById("cell-" + i + "-" + j)
  			cell.style.backgroundColor = Colours[State[world[i][j]]]
  		}
  	}
}

function createWorldDisplay(world, config) {
	container = document.getElementById("container");
	container.style.setProperty('--grid-rows', world.length)
  	container.style.setProperty('--grid-cols', world[0].length)
  	for (let i = 0; i < world.length; i++) {
  		let cellRow = document.createElement("div")
  		container.appendChild(cellRow).className = "grid-row"	
  		cellRow.style.height = config["cellSize"] + "px"
  		cellRow.style.width = config["worldBreadth"] + "px"
  		for (let j = 0; j < world[i].length; j++) {
  			let cell = document.createElement("div")
  			cell.id = "cell-" + i + "-" + j
  			cell.style.backgroundColor = Colours[State[world[i][j]]]
  			cell.style.height = config["cellSize"] + "px"
  			cell.style.width = config["cellSize"] + "px"
    		cellRow.appendChild(cell).className = "grid-item"	
  		}
  	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function updatedNeighbourCount(world) {
	var neighbours = new Array(world.length)
	for (let i = 0; i < world.length; i++) {
		neighbours[i] = new Array(world[i].length)
		for (let j = 0; j < world[i].length; j++) {
			count = 0
			if (i > 0 && j > 0 && world[i-1][j-1] == State[alive]) {
				count++
			}

			if (i > 0 && world[i-1][j] == State[alive]) {
				count++
			}

			if (i > 0 && j < world[0].length - 1 && world[i-1][j+1] == State[alive]) {
				count++
			}

			if (j > 0 && world[i][j-1] == State[alive]) {
				count++
			}

			if (j < world[0].length - 1 && world[i][j+1] == State[alive]) {
				count++
			}

			if (i < world.length - 1 && j > 0 && world[i+1][j-1] == State[alive]) {
				count++
			}

			if (i < world.length - 1 && world[i+1][j] == State[alive]) {
				count++
			}

			if (i < world.length - 1 && j < world[0].length - 1 && world[i+1][j+1] == State[alive]) {
				count++
			}
			neighbours[i][j] = count
		}
	}
	return neighbours
}

async function nextGeneration(world, config, generation) {
	// console.time('next gen')
	try {
		neighbours = updatedNeighbourCount(world)
		var nextWorld = new Array(world.length)
		for (let i = 0; i < world.length; i++) {
			nextWorld[i] = new Array(world[i].length)
			for (let j = 0; j < world[i].length; j++) {
				if ((i >= 0 && i < neighbours.length) && (j >= 0 && j < neighbours[i].length) && (neighbours[i][j] > 3 || neighbours[i][j] < 2)) {
					nextWorld[i][j] = State[dead]
				} else if ((i >= 0 && i < neighbours.length) && (j >= 0 && j < neighbours[i].length) && (neighbours[i][j] == 2)) {
					nextWorld[i][j] = world[i][j]
				} else if ((i >= 0 && i < neighbours.length) && (j >= 0 && j < neighbours[i].length) && (neighbours[i][j] == 3)) {
					nextWorld[i][j] = State[alive]
				}
			}
		}

		nextWorld = randomSpawn(nextWorld, config)
	} catch (e) {
		stop = true
		console.log("Error", e.stack);
    	console.log("Error", e.name);
    	console.log("Error", e.message);
	} finally {
		ticking = false
	}
	// console.timeEnd('next gen')
	return nextWorld
}

function randomSpawn(world, config) {
	for (let i = 0; i < config["patterns"].length; i++) {
		if (Math.random() *	100 <= config["spawnChance"]) {
			startY = Math.floor(Math.random() * world.length)
			startX = Math.floor(Math.random() * world[0].length)
			cells = config["patterns"][i](startX, startY)
			for (let j = 0; j < cells.length; j++) {
				if (cells[j]["y"] < 0 || cells[j]["y"] > world.length - 1 || cells[j]["x"] < 0 || cells[j]["x"] > world[0].length - 1){
					continue
				}
				// console.log("Cell " + JSON.stringify(cells))
				world[cells[j]["y"]][cells[j]["x"]] = State[alive]
			}
		}
	}
	return world
}

function analyseWorld(world, prefix) {
	count = 0
	for (let i = 0; i < world.length; i++) {
		for (let j = 0; j < world[i].length; j++) {
			if (world[i][j] == State[alive]) {
				count = count + 1
			}
		}
	}
	console.log(prefix + " | aliveCount : " + count)
}

function endgame(world) {
	for (let i = 0; i < world.length; i++) {
  		for (let j = 0; j < world[i].length; j++) {
  			let cell = document.getElementById("cell-" + i + "-" + j)
  			if (world[i][j] == State[alive]) {
  				cell.style.backgroundColor = "#FF0000"
  			}
  		}
  	}
}

async function tickWithDelay(world, config, generations) {
	if (generations == 0 || generations < -1) {
		endgame(world)
		return
	}
	ticking = true
	promise = nextGeneration(world, config, generations)
	await setTimeout(function() { 
    	promise.then(function(promisedWorld) {
    		while(ticking) {
    			sleep(10)
    		}
    		if (!stop) {
				updateWorldDisplay(promisedWorld)
				if (generations == -1) {
					generations = 0
				}
				tickWithDelay(promisedWorld, config, generations - 1)
			}
		})
    }, config["generationDelay"]);  
}

function updateWorldAndNeighbours(world, neighbours, cell, state) {
	y = cell["y"]
	x = cell["x"]
	world[y][x] = state
	neighbourChange = 1
	if (status == State[dead]) {
		neighbourChange = -1
	}

	if (y > 0 && x > 0) {
		neighbours[y-1][x-1] = neighbours[y-1][x-1] + neighbourChange
	}

	if (y > 0) {
		neighbours[y-1][x] = neighbours[y-1][x] + neighbourChange
	}

	if (y > 0 && x < world[0].length - 1) {
		neighbours[y-1][x+1] = neighbours[y-1][x+1] + neighbourChange
	}

	if (x > 0) {
		neighbours[y][x-1] = neighbours[y][x-1] + neighbourChange
	}

	if (x < world[0].length - 1) {
		neighbours[y][x+1] = neighbours[y][x+1] + neighbourChange
	}
	
	if (y < world.length - 1 && x > 0) {
		neighbours[y+1][x-1] = neighbours[y+1][x-1] + neighbourChange
	}

	if (y < world.length - 1) {
		neighbours[y+1][x] = neighbours[y+1][x] + neighbourChange
	}

	if (y < world.length - 1 && x < world[0].length - 1) {
		neighbours[y+1][x+1] = neighbours[y+1][x+1] + neighbourChange
	}

	return [world, neighbours]
}

function populateWorld(world, spawnPercent) {
	console.time("populateWorld")
	totalCells = world.length * world[0].length
	populationCount = Math.floor(totalCells * spawnPercent/100)
	var aliveCells = []
	for (let i = 0; i < populationCount; i++) {
		x = Math.floor(Math.random() * world[0].length),
		y = Math.floor(Math.random() * world.length),
		world[y][x] = State[alive]
	}
	console.timeEnd("populateWorld")
	return world
}

//TODO: Fix
function populateClusteredWorld(world, clusterSize, spawnClusterChance, spawnClusterDensity) {
	console.time("populateClusteredWorld")
	for (i = 0; i < world.length; i+=clusterSize) {
		for (j = 0; j < world[0].length; j+=clusterSize) {
			if (Math.random() * 100 < spawnClusterChance) {
				y = clusterSize
				if (i + clusterSize >= world.length) {
					y = i + clusterSize - world.length
				}
				x = clusterSize
				if (j + clusterSize >= world[0].length) {
					x = j + clusterSize - world[0].length
				}
				clusterCellCount = x * y
				spawnCount = clusterCellCount * spawnClusterDensity / 100
				for (let k = 0; k < spawnCount; k++) {
					coordX = Math.floor(Math.random() * x + j),
					coordY = Math.floor(Math.random() * y + i),
					world[coordY][coordX] = State[alive]
				}
			}
		}
	}
	console.timeEnd("populateClusteredWorld")
	return world
}

function customPopulateWorld(world, cells) {
	for (i = 0; i < cells.length; i++) {
		cell = cells[i]
		world[cell["y"]][cell["x"]] = State[alive]
	}
	return world
}

function start(config) {
	world = buildWorld(config)
	// world = customPopulateWorld(world, gliderGun(20, 20))
	world = populateWorld(world, config["spawnPercent"])
	// world = populateClusteredWorld(world, config["clusterSize"], config["spawnClusterChance"], config["spawnClusterDensity"])
	createWorldDisplay(world, config)
	tickWithDelay(world, config)
}

function getWorldBreadth() {
	return Math.min(
    document.documentElement["clientWidth"],
    document.body["scrollWidth"],
    document.documentElement["scrollWidth"],
    document.body["offsetWidth"],
    document.documentElement["offsetWidth"])
}

function getWorldLength() {
	return Math.min(
    document.documentElement["clientHeight"],
    document.body["scrollHeight"],
    document.documentElement["scrollHeight"],
    document.body["offsetHeight"],
    document.documentElement["offsetHeight"])
}

function GetWorldConfig(approxCellSize) {
	breadth = getWorldBreadth() 
	height = getWorldLength()

	bRemainder = breadth%approxCellSize
	hRemainder = height%approxCellSize

	let addCellSize = 0
	if (bRemainder > hRemainder) {
		addCellSize = hRemainder/approxCellSize
	} else {
		addCellSize = bRemainder/approxCellSize
	}
	cellSize = approxCellSize + addCellSize
	return {
		worldBreadth: breadth,
		worldLength: height,
    	cellSize: cellSize,
		generations: -1,
		generationDelay: 100,
		spawnPercent: 11.5,
		spawnClusterChance:25,
		spawnClusterDensity: 70,
		clusterSize:50,
		spawnChance: 0.5,
		patterns : [beehive, blinker, gliderGun, liveCell],
	}
}


/* Patterns */

function beehive(startX, startY) {
	return populateCells = [{
		x: startX,
		y: startY,
	}, {
		x: startX+1,
		y: startY,
	}, {
		x: startX-1,
		y: startY+1,
	}, {
		x: startX+2,
		y: startY+1,
	}, {
		x: startX,
		y: startY+2,
	}, {
		x: startX+1,
		y: startY+2,
	}]
	return populateCells
}

function blinker(startX, startY) {
	return populateCells = [{
		x: startX,
		y: startY,
	}, {
		x: startX+1,
		y: startY,
	}, {
		x: startX+2,
		y: startY,
	}]
	return populateCells
}

function gliderGun(startX, startY) {
	return populateCells = [{
		x: startX,
		y: startY,
	}, {
		x: startX,
		y: startY+1,
	}, {
		x: startX+1,
		y: startY,
	}, {
		x: startX+1,
		y: startY+1,
	}, {
		x: startX+10,
		y: startY
	}, {
		x: startX+10,
		y: startY+1,
	}, {
		x: startX+10,
		y: startY+2,
	}, {
		x: startX+11,
		y: startY-1,
	}, {
		x: startX+11,
		y: startY+3,
	}, {
		x: startX+12,
		y: startY-2,
	}, {
		x: startX+13,
		y: startY-2,
	}, {
		x: startX+12,
		y: startY+4,
	}, {
		x: startX+13,
		y: startY+4,
	}, {
		x: startX+14,
		y: startY+1,
	}, {
		x: startX+15,
		y: startY-1,
	}, {
		x: startX+15,
		y: startY+3,
	}, {
		x: startX+16,
		y: startY,
	}, {
		x: startX+16,
		y: startY+1,
	}, {
		x: startX+16,
		y: startY+2,
	}, {
		x: startX+17,
		y: startY+1,
	}, {
		x: startX+20,
		y: startY,
	}, {
		x: startX+20,
		y: startY-1,
	}, {
		x: startX+20,
		y: startY-2,
	}, {
		x: startX+21,
		y: startY,
	}, {
		x: startX+21,
		y: startY-1,
	}, {
		x: startX+21,
		y: startY-2,
	}, {
		x: startX+22,
		y: startY-3,
	}, {
		x: startX+22,
		y: startY+1,
	}, {
		x: startX+24,
		y: startY+1,
	}, {
		x: startX+24,
		y: startY+2,
	}, {
		x: startX+24,
		y: startY-3,
	}, {
		x: startX+24,
		y: startY-4,
	}, {
		x: startX+34,
		y: startY-1,
	}, {
		x: startX+34,
		y: startY-2,
	}, {
		x: startX+35,
		y: startY-1,
	}, {
		x: startX+35,
		y: startY-2,
	}]
	return populateCells
}

function liveCell(startX, startY) {
	return [
		{
			x: startX,
			y : startY,
		},
	]	
}

start(GetWorldConfig(5))
