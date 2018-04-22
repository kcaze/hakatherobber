function generateLevel(width, height, level) {
  var arr;
  if (level == 4) {
    return"xxxx%xxxx\n"+
    "xxx...xxx\n"+
    "xxx.6.xxx\n"+
    "xg.g.g.gx\n"+
    "x.g.g.g.x\n"+
    "xg.g.g.gx\n"+
    "xx.xxx.xx\n"+
    "xg..@..gx\n"+
    "xxxxxxxxx";
  }

  if (level != 1) {
    while (true) {
      var room = generateFirstRoom(width, height);
      if (room.size >= 10 && room.size <= 30) {
        arr = room.arr;
        break;
      }
    }
  } else {
    arr = makeArr(width, height);
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        arr[y][x] = 'x';
      }
    }
    arr[0][0] = '&'; arr[0][1] = '&'; arr[0][2] = '&'; arr[0][3] = '&'; arr[0][4] = '&';
    arr[1][0] = '&'; arr[1][1] = '3'; arr[1][2] = '2'; arr[1][3] = '4'; arr[1][4] = '&';
    arr[2][0] = '&'; arr[2][1] = '&'; arr[2][2] = '@'; arr[2][3] = '&'; arr[2][4] = '&';
    arr[3][0] = '&'; arr[3][1] = '5'; arr[3][2] = '&'; arr[3][3] = '7'; arr[3][4] = '&';
    arr[4][0] = '&'; arr[4][1] = '&'; arr[4][2] = '&'; arr[4][3] = '&'; arr[4][4] = '&';
  }

  addShop(arr);
  while (addNewRoom(arr));
  addStairs(arr);

  addPassages(arr);
  
  // Add enclosing walls
  var finalArr = makeArr(width+4, height+4);
  for (var i = 0; i < height+4; i++) {
    for (var j = 0; j < width+4; j++) {
      finalArr[i][j] = 'x';
    }
  }
  for (var i = 0; i < height; i++) {
    for (var j = 0; j < width; j++) {
      finalArr[i+2][j+2] = arr[i][j];
    }
  }
  arr = finalArr;


  // Add objects
  addObjects(arr, level);


  // print out level
  var s = "";
  for (var i = 0; i < height+4; i++) {
    s += (i != 0 ? "\n" : "") + arr[i].join("");
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

  // plop the player in some random location in the room, weighted towards the middle using dice rolls to simulate bell curve
  if (regions[maxRegionI] > 0) {
    var playerLocations = [];
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (arr[y][x] == '.') playerLocations.push([x, y]);
      }
    }
    var loc = playerLocations[bellCurve(0, playerLocations.length - 1)];
    arr[loc[1]][loc[0]] = '@';
  }

  return {arr: arr, size: regions[maxRegionI]};
}

function addNewRoom(arr) {
  var MIN_ROOM_SIZE = 2;
  var MAX_ROOM_SIZE = 10;
  var rw = bellCurve(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
  var rh = bellCurve(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
  var room = fluffen(generateNewRoom(rw, rh), 2);
  rw = room[0].length;
  rh = room.length;

  var w = arr[0].length;
  var h = arr.length;

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var failed = false;
      for (var ry = 0; ry < rh; ry++) {
        for (var rx = 0; rx < rw; rx++) {
          if (room[ry][rx] == 'x') continue;
          if (room[ry][rx] == '.' && (y+ry >= h  || x+rx >= w)) { failed = true; continue;}
          if (y+ry >= h || x + rx >= w) continue;
          if (arr[y + ry][x + rx] != 'x') failed = true;
        }
      }
      if (!failed) {
        // success
        for (var ry = 0; ry < rh; ry++) {
          for (var rx = 0; rx < rw; rx++) {
            if (room[ry][rx] == '.') arr[y+ry][x+rx] = '.';
          }
        }
        return true;
      }
    }
  }

  return false;
}

// Fluffen room with '_' to add separation between rooms
function fluffen(room, amount) {
  var rw = room[0].length;
  var rh = room.length;
  var w = room[0].length + 2*amount;
  var h = room.length + 2*amount;
  var arr = makeArr(w, h);
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      arr[y][x] = 'x';
    }
  }
  for (var y = 0; y < rh; y++) {
    for (var x = 0; x < rw; x++) {
      arr[y+amount][x+amount] = room[y][x];
    }
  }
  for (var i = 0; i < amount; i++) {
    var newArr = makeArr(w,h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        newArr[y][x] = arr[y][x];
      }
    }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (arr[y][x] != 'x') {
          [[1,0],[-1,0],[0,1],[0,-1]].forEach(d => {
            var xx = x+d[0];
            var yy = y+d[1];
            if (xx < 0 || xx >= w || yy < 0 || yy >= h) return;
            if (arr[yy][xx] == 'x') newArr[yy][xx] = '_';
          });
        }
      }
    }
    arr = newArr;
  }
  return arr;
}

function generateNewRoom(width, height) {
  return Math.random() < 0.5 ? generateTriangularRoom(width, height) : generateRectangleRoom(width, height);
}

function generateTriangularRoom(width, height) {
  /****
   * quadrants are:  0 | 1
   *                 -----
   *                 2 | 3
   ****/
  if (width % 2 == 1) width += 1;
  if (height % 2 == 1) height += 1;
  var excludedQuadrant = randRange(0, 3);
  var points = [];
  var arr = makeArr(width, height);
  for (var i = 0; i < 4; i++) {
    if (i == excludedQuadrant) continue;
    var x = randRange(0, Math.floor(width/2)-1) + (i % 2 == 1 ? Math.floor(width/2) : 0);
    var y = randRange(0, Math.floor(height/2)-1) + (i > 1 ?  Math.floor(height/2) : 0);
    points.push([x,y]);
    arr[y][x] = '.';
  }
  // draw lines between points via bresenham's
  for (var i = 0; i < 3; i++) {
    var p1 = i != 0 ? points[0] : points[1];
    var p2 = i != 2 ? points[2] : points[1];
    var x = p1[0];
    var y = p1[1];
    var dx = Math.sign(p2[0] - x);
    var dy = Math.sign(p2[1] - y);
    while (x != p2[0] || y != p2[1]) {
      arr[y][x] = '.';
      var v1 = (x+dx-p1[0])*(p2[1]-p1[1]) - (y-p1[1])*(p2[0]-p1[0]);
      var v2 = (x-p1[0])*(p2[1]-p1[1]) - (y+dy-p1[1])*(p2[0]-p1[0]);
      if (Math.abs(v1) < Math.abs(v2)) {
        x += dx;
      } else if (Math.abs(v2) <  Math.abs(v1)) {
        y += dy;
      } else {
        x += dx;
        y += dy;
      }
    }
  }

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (arr[y][x] == null) arr[y][x] = 'x';
    }
  }

  return arr;
}

function generateRectangleRoom(width, height) {
  var numRectangles = bellCurve(1, 3);
  var arr = makeArr(width, height);
  for (var i = 0; i < numRectangles; i++) {
    var w = bellCurve(Math.floor(width/2), width-1);
    var h = bellCurve(Math.floor(height/2), height-1);
    var x = randRange(0, width-w);
    var y = randRange(0, height-h);
    for (var yy = y; yy < y+h; yy++) {
      for (var xx = x; xx < x+w; xx++) {
        arr[yy][xx] = '.';
      }
    }
  }
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (arr[y][x] == null) arr[y][x] = 'x';
    }
  }
  return arr;
}

function randRange(min, max) {
  return bellCurve(min,max,1);
}

function bellCurve(min, max, n = 6) {
  var x = 0;
  for (var i = 0 ; i < n; i++) x += Math.random();
  return min + Math.floor((max - min + 1) / n * x);
}

function makeArr(width, height) {
  var arr = [];
  for (var y = 0; y < height; y++) {
    arr.push([]);
    for (var x = 0; x < width; x++) {
      arr[y][x] = null;
    }
  }
  return arr;
}

function addPassages(arr) {
  // First flood fill passages with '*'
  var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  var w = arr[0].length;
  var h = arr.length;
  while (true) {
    var sx = null;
    var sy = null;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (arr[y][x] != 'x') continue;
        var cont = false;
        for (var i = 0 ; i < 4 ;i++) {
          var xx = x+dirs[i][0];
          var yy = y+dirs[i][1];
          if (isInvalid(xx,yy,w,h)) {continue;}
          if (arr[yy][xx] != 'x') cont = true;
        }
        if (cont == true) continue;
        if (sx == null) { sx = x; sy = y;}
      }
    }

    if (sx == null) break;
    arr[sy][sx] = '*';
    while (true) {
      var validDirs = [];
      dirs.forEach(d => {
        var x = sx + d[0];
        var y = sy + d[1];
        if (isInvalid(x,y,w,h)) return;
        if (arr[y][x] != 'x') return;
        var isValidSquare = true;
        dirs.forEach(dd => {
          var xx = x + dd[0];
          var yy = y + dd[1];
          if (isInvalid(xx,yy,w,h)) return;
          if (dd[0] == -d[0] && dd[1] == -d[1]) return;
          if (arr[yy][xx] != 'x') isValidSquare = false;
        });
        if (isValidSquare) validDirs.push(d);
      });

      if (validDirs.length == 0) break;
      var d = validDirs[Math.floor(validDirs.length*Math.random())];
      sx += d[0];
      sy += d[1];
      arr[sy][sx] = '*';
    }
  }

  var numRegions = 0;
  var rArr = makeArr(w,h);
  function dfs(x,y) {
    if (arr[y][x] == 'x' || rArr[y][x] != null) return;
    rArr[y][x] = numRegions;
    dirs.forEach(d => {
      var xx = x + d[0];
      var yy = y + d[1];
      if (isInvalid(xx,yy,w,h)) return;
      dfs(xx,yy);
    });
  }
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (arr[y][x] == 'x' || rArr[y][x] != null) continue;
      dfs(x,y);
      numRegions++;
    }
  }
  var edges = {};
  for (var i = 0; i < numRegions; i++) edges[i] = {};
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (arr[y][x] != 'x') continue;
      var neighbors = [];
      dirs.forEach(d => {
        var xx = x + d[0];
        var yy = y + d[1];
        if (isInvalid(xx,yy,w,h)) return;
        if (rArr[yy][xx] != null) neighbors.push(rArr[yy][xx]);
      });
      for (var i = 0; i < neighbors.length; i++) {
        for (var j = i+1; j < neighbors.length; j++) {
          var n1 = neighbors[i];
          var n2 = neighbors[j];
          if (n1 == n2) continue;
          if (edges[n1][n2] == null) edges[n1][n2] = [];
          if (edges[n2][n1] == null) edges[n2][n1] = [];
          edges[n1][n2].push([x,y]);
          edges[n2][n1].push([x,y]);
        }
      }
    }
  }

  // Make spanning tree
  var inTree = {};
  var startingRoom = Math.floor(Math.random()*numRegions);
  inTree[startingRoom] = true;
  while(Object.keys(inTree).length != numRegions) {
    for (r in inTree) {
      for (e in edges[r]) {
        if (e in inTree) continue;
        var pos = edges[r][e][Math.floor(Math.random()*edges[r][e].length)];
        arr[pos[1]][pos[0]] = '*';
        inTree[e] = true;
      }
    }
  }

  // Delete all useless dead-ends
  var found = true;
  while(found) {
    found = false;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (arr[y][x] != '*') continue;
        var numSpace = 0;
        dirs.forEach(d => {
          var xx = x+d[0];
          var yy = y+d[1];
          if (isInvalid(xx,yy,w,h)) return;
          if (arr[yy][xx] != 'x') numSpace++;
        });
        if (numSpace < 2) {
          arr[y][x] = 'x';
          found = true;
        }
      }
    }
  }

  // Finally, convert all '*' to '.'
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (arr[y][x] == '*') arr[y][x] = '.';
    }
  }

  return arr;
}

function isInvalid(x, y, w, h) {
  return x < 0 || x >= w || y < 0 || y >= h;
}

function addObjects(arr, level) {
  var width = arr[0].length;
  var height = arr.length;
  var dirs = [[0,1],[0,-1],[1,0],[-1,0]];

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (arr[y][x] != '.'  && arr[y][x] != '*') continue;
      var reverseDirMap = {
        '1,0': 'r',
        '-1,0': 'l',
        '0,1': 'd',
        '0,-1': 'u',
      };
      var n = {};
      dirs.forEach(d => {
        var xx = x + d[0];
        var yy = y + d[1];
        if (isInvalid(xx,yy,width,height)) return;
        if (arr[yy][xx] == '.') n[reverseDirMap[d[0]+','+d[1]]] = true;
      });
      if ('l' in n && 'r' in n && !('d' in n) && !('u' in n)) {
        if (Math.random() < 0.3) {
          arr[y][x] = Math.random() < 0.5 ? '<' : '>';
        }
      }
      if ('l' in n && 'r' in n && (!('d' in n) || !('u' in n))) {
        if (Math.random() < 0.15) {
          arr[y][x] = Math.random() < 0.5 ? '<' : '>';
        }
      }
      if ('d' in n && 'u' in n && !('l' in n) && !('r' in n)) {
        if (Math.random() < 0.3) {
          arr[y][x] = Math.random() < 0.5 ? '^' : 'v';
        }
      }
      if ('d' in n && 'u' in n && (!('l' in n) || !('r' in n))) {
        if (Math.random() < 0.15) {
          arr[y][x] = Math.random() < 0.5 ? '^' : 'v';
        }
      }
      if (Object.keys(n).length == 4) {
        var r = Math.random();
        if (r < 0.15 && level > 1) {
          arr[y][x] = ['l','u','r','d'][Math.floor(Math.random()*4)];
        } else if (r < 0.25) {
          arr[y][x] = 'g';
        }
      }
      if (Object.keys(n).length == 3) {
        var r = Math.random();
        if (r < 0.1 && level > 1) {
          arr[y][x] = ['l','u','r','d'][Math.floor(Math.random()*4)];
        }
      }
      if (Object.keys(n).length == 1) {
        if (Math.random() < 0.2) {
          arr[y][x] = 'g';
        }
      }
    }
  }
}

function addShop(arr) {
  var w = arr[0].length;
  var h = arr.length;
  while (true) {
    var x = Math.floor(Math.random()*w);
    var y = Math.floor(Math.random()*h);
    var canPutShop = true;
    for (var i = -4; i < 4; i++) {
      for (var j = -4; j < 4; j++) {
        var xx = x + i;
        var yy = y + i;
        if (isInvalid(xx,yy,w,h)) {
          canPutShop = false;
          continue;
        }
        if (arr[yy][xx] != 'x') {
          canPutShop = false;
        }
      }
    }
    if (!canPutShop) continue;
    arr[y-2][x-2] = '&'; arr[y-2][x-1] = '&'; arr[y-2][x] = '&'; arr[y-2][x+1] = '&';arr[y-2][x+2] = '&';
    arr[y-1][x-2] = '&'; arr[y-1][x-1] = '&'; arr[y-1][x] = '&'; arr[y-1][x+1] = '&';arr[y-1][x+2] = '&';
    arr[y][x-2] = '&'; arr[y][x-1] = 'b'; arr[y][x] = 'k'; arr[y][x+1] = 'p'; arr[y][x+2] = '&';
    arr[y+1][x-2] = '&'; arr[y+1][x-1] = '&'; arr[y+1][x] = '1'; arr[y+1][x+1] = '&'; arr[y+1][x+2] = '&';
    arr[y+2][x-2] = '&'; arr[y+2][x-1] = '&'; arr[y+2][x] = '&'; arr[y+2][x+1] = '&';arr[y+2][x+2] = '&';
    return;
  }
}

function addStairs(arr) {
  var w = arr[0].length;
  var h = arr.length;
  var player = null;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (arr[y][x] == '@') player = [x,y];
    }
  }
  function dist(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }
  var stairs = null;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (arr[y][x] != '.') continue;
      if (!stairs) stairs = [x,y];
      if (dist(stairs, player) < dist([x,y], player) && Math.random() < 0.2) stairs = [x,y];
    }
  }
  arr[stairs[1]][stairs[0]] = '$'
}
