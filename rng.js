function generateLevel(width, height) {
  var arr;
  while (true) {
    var room = generateFirstRoom(width, height);
    if (room.size >= 10 && room.size <= 30) {
      arr = room.arr;
      break;
    }
  }

  // plop the player in some random location in the room, weighted towards the middle using dice rolls to simulate bell curve
  var playerLocations = [];
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (arr[y][x] == '.') playerLocations.push([x, y]);
    }
  }
  var loc = playerLocations[Math.floor(playerLocations.length/4*(Math.random() + Math.random() + Math.random() + Math.random()))];
  arr[loc[1]][loc[0]] = '@';

  // print out level
  var s = "";
  for (var i = 0; i < height; i++) {
    s += "\n" + arr[i].join("");
  }
  return s;
}

function generateFirstRoom(width, height) {
  var arr = [];
  var INIT_FLOOR_PERCENT = 0.50;
  for (var i = 0; i < height; i++) {
    arr.push([]);
    for (var j = 0; j < width; j++) {
      arr[i].push(Math.random() < INIT_FLOOR_PERCENT ? '.' : 'x');
    }
  }
  var FLOOR_TO_WALL_THRESHOLD = 4;
  var WALL_TO_FLOOR_THRESHOLD = 5;
  // 5 rounds of smoothing
  for (var i = 0; i < 5; i++) {
    var nextArr = [];
    for (var y = 0; y < width; y++) {
      nextArr.push([]);
      for (var x = 0; x < height; x++) {
        var nFloor = 0;
        var nWall = 0;
        for (var j = -1; j <= 1; j++) {
          for (var k = -1; k <= 1; k++) {
            if (j == 0 && k == 0) continue;
            if (x+j < 0 || x+j >= width) continue;
            if (y+k < 0 || y+k >= height) continue;
            if (arr[y+k][x+j] == '.') nFloor++;
            else nWall++;
          }
        }
        if (arr[y][x] == '.') {
          nextArr[y].push(nWall >= FLOOR_TO_WALL_THRESHOLD ? 'x' : '.');
        } else {
          nextArr[y].push(nFloor >= (Math.floor(3/2*(Math.random() + Math.random())) + WALL_TO_FLOOR_THRESHOLD) ? '.' : 'x');
        }
      }
    }
    arr = nextArr;
  }
  // Add walls to border
  for (var i = 0; i < width; i++) {
    arr[0][i] = 'x';
    arr[height-1][i] = 'x';
  }
  for (var i = 0; i < height; i++) {
    arr[i][0] = 'x';
    arr[i][width-1] = 'x';
  }
  // DFS paint regions and get region sizes
  var dirs = [[0,-1],[0,1],[-1,0],[1,0]];
  var regions = [];
  var paintedArr = [];
  for (var y = 0; y < height; y++) {
    paintedArr.push([]);
    for (var x = 0; x < width; x++) {
      paintedArr[y].push(null);
    }
  }
  function dfsPaint(r, x, y) {
    if (arr[y][x] == 'x') return 0;
    if (paintedArr[y][x] != null) return 0;
    var sum = 1;
    paintedArr[y][x] = r;
    dirs.forEach(d => {
      sum += dfsPaint(r, x+d[0], y+d[1]);
    });
    return sum;
  }
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (arr[y][x] == 'x') continue;
      if (paintedArr[y][x] != null) continue;
      var r = regions.length;
      regions.push(dfsPaint(r, x, y));
    }
  }
  var maxRegionI = 0;
  for (var i = 0; i < regions.length; i++) {
    if (regions[i] > regions[maxRegionI]) maxRegionI = i;
  }
  // Only retain largest region
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (paintedArr[y][x] != maxRegionI) arr[y][x] = 'x';
    }
  }
  return {arr: arr, size: regions[maxRegionI]};
}
