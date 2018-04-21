var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var WIDTH = 640;
var HEIGHT = 480;
var BORDER_H = 16;
var WINDOW_W = 10;
var WINDOW_H = 7;
var TILE_SIZE = 64;
var CAMERA_BOUNDARY_W = 1;
var CAMERA_BOUNDARY_H = 1;
var CAMERA_FOLLOW_FACTOR = 0.05;
var CAMERA_MIN_FOLLOW = 0.01;

function spr(name) {
  return document.getElementById('spr_' + name);
}

var level1 = 
"xxxxxxxxxxxxxxxxxxxx\n" +
"x.......xxx........x\n" +
"x..x.x..xxx........x\n" +
"x..xxxxxxxx..xx....x\n" +
"x............xx.xx.x\n" +
"x..$..xxxxx..xxxxxxx\n" +
"x....@xxxxx..x.....x\n" +
"x.......xxx..x.....x\n" +
"x..xx.....x..x.....x\n" +
"x..xx..............x\n" +
"x..................x\n" +
"xxxxxxxxxxxxxxxxxxxx";
var level_width;
var level_height;
var entities = [];
var grid = [];
var player;
var camera = {
  x: 0,
  y: 0,
  display_x: 0,
  display_y: 0,
};

function makeWorld(level) {
  var w = level.split("\n").map((s,y) => {
    var x = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c == '@') {
        player = makePlayer(x, y);
        setup_camera();
        entities.push(player);
      }
      if (c == 'x') {
        entities.push(makeEntity(x,y,'wall','wall'));
      }
      if (c == '$') {
        entities.push(makeEntity(x,y,'croc','croc'));
      }
      x++;
    }
    level_width = s.length;
  });
  level_height = w.length;
  recomputeGrid();
}

function setup_camera() {
  camera.x = Math.max(player.x - Math.floor(WINDOW_W/2), 0);
  camera.y = Math.max(player.y - Math.floor(WINDOW_H/2), 0);
  camera.display_x = camera.x;
  camera.display_y = camera.y;
}

function update_camera() {
  if (player.x - camera.x < WINDOW_W/2 - CAMERA_BOUNDARY_W) {
    camera.x -= 1;
  }
  if (player.x - camera.x > WINDOW_W/2 + CAMERA_BOUNDARY_W) {
    camera.x += 1;
  }
  if (player.y - camera.y < WINDOW_H/2 - CAMERA_BOUNDARY_H) {
    camera.y -= 1;
  }
  if (player.y - camera.y > WINDOW_H/2 + CAMERA_BOUNDARY_H) {
    camera.y += 1;
  }
}

function drawSpriteAt(spr_name, x, y) {
   var X = (x - camera.display_x)*TILE_SIZE;
   var Y = (y - camera.display_y)*TILE_SIZE + BORDER_H;
   var S = spr(spr_name);
   if (X + S.width < 0 || X > WIDTH) {
     return;
   }
   if (Y + S.height < 0 || Y > HEIGHT) {
     return;
   }
   context.drawImage(S, X, Y);
}

function makeEntity(x, y, type, spr_name) {
  var p;
  var draw = () => {
    drawSpriteAt(spr_name, p.x, p.y);
   };
  p = {
    x: x,
    y: y,
    draw: draw,
    type: type,
  };
  return p;
}

function canSeeCheck(x,y) {
  if (x < 0 || x >= level_width) return false;
  if (y < 0 || y >= level_height) return false;
  if (!grid[x] || !grid[x][y]) return true;
  if (grid[x][y].type == 'wall') return false;
  return true;
}

function lineOfSight(e, LOS) {
    var los = {};
    los[e.x+','+e.y] = true;
    for (var dx = -LOS; dx <= LOS; dx++) {
      for (var dy = -LOS; dy <= LOS; dy++) {
        // Bresenham's algorithm check.
        var canSee = true;
        var pos = [e.x,e.y];
        var w = dx == 0 ? 0 : dx/Math.abs(dx);
        var h = dy == 0 ? 0 : dy/Math.abs(dy);
        while (pos[0] != e.x+dx || pos[1] != e.y+dy) {
          if (!canSeeCheck(pos[0], pos[1])) {
            canSee = false;
            break;
          }
          var v1 = Math.abs((pos[0]+w-e.x)*dy - ((pos[1]-e.y)*dx));
          var v2 = Math.abs((pos[0]-e.x)*dy - ((pos[1]+h-e.y)*dx));
          if (v1 < v2) {
            pos[0] += w;
          } else if (v2 < v1) {
            pos[1] += h;
          } else {
            pos[0] += w;
            pos[1] += h;
          }
        }
        if (canSee) {
          los[(e.x+dx)+','+(e.y+dy)] = true;
        }
      }
    }
    return los;
}

function makePlayer(x, y) {
  var p = makeEntity(x,y,'player','leon');
  var LOS = 3;
  p.lineOfSight = () => {
    var los = lineOfSight(p, LOS);
    if (p.peeking) {
      for (pos in lineOfSight({x: p.x+p.peeking_direction[0], y:p.y+p.peeking_direction[1]}, LOS)) {
        los[pos] = true;
      }
    }
    return los;
  };
  p.peeking = false;
  p.peeking_direction = [0,0];
  p.hp = 3;
  return p;
}

function handleInteraction(e) {
  if (e.type == 'wall') {
    return [player.x, player.y];
  }
  if (e.type == 'croc') {
    player.hp -= 1;
  }
  return [player.x, player.y];
}

function recomputeGrid() {
  grid = [];
  entities.forEach(e => {
    if (!grid[e.x]) {
      grid[e.x] = [];
    }
    grid[e.x][e.y] = e;
  });
}

function drawBackground() {
  for (var y = 0; y < level_height; y++) {
    for (var x = 0; x < level_width; x++) {
      drawSpriteAt('bg1', x, y);
    }
  }
}

function drawEntities() {
  entities.forEach(e => {
    e.draw();
  });
}

function drawFogOfWar() {
  var los = player.lineOfSight();
  for (var i = -2; i < level_width+2; i++) {
    for (var j = -2; j < level_height+2; j++) {
      var x = camera.x + i;
      var y = camera.y + j;
      if (!((x+','+y) in los)) {
        drawSpriteAt('fog', x,y);
      }
    }
  }
}

function drawHUD() {
  drawSpriteAt("health"+player.hp, camera.display_x+0.125, camera.display_y-0.125);
}

function update(delta) {
  var cdx = camera.x - camera.display_x;
  var cdy = camera.y - camera.display_y;
  var dx = CAMERA_FOLLOW_FACTOR * cdx;
  var dy = CAMERA_FOLLOW_FACTOR * cdy;
  if (Math.abs(dx) != 0 && Math.abs(dx) < CAMERA_MIN_FOLLOW) {
    dx /= Math.abs(dx);
    dx *= CAMERA_MIN_FOLLOW;
  }
  if (Math.abs(dy) != 0 && Math.abs(dy) < CAMERA_MIN_FOLLOW) {
    dy /= Math.abs(dy);
    dy *= CAMERA_MIN_FOLLOW;
  }
  if (Math.abs(dx) > Math.abs(cdx)) {
    camera.display_x = camera.x;
  } else {
    camera.display_x += dx;
  }
  if (Math.abs(dy) > Math.abs(cdy)) {
    camera.display_y = camera.y;
  } else {
    camera.display_y += dy;
  }
}

function draw(delta) {
  context.fillRect(0,0,WIDTH,HEIGHT);
  drawBackground();
  drawEntities();
  drawFogOfWar();
  drawHUD();
}

var K_P = 80;
document.addEventListener('keydown', function(event) {
  var direction = {
    '37': [-1, 0],
    '38': [0, -1],
    '39': [1, 0],
    '40': [0, 1],
  };
  var k = event.keyCode;
  if (k in direction) {
    player.peeking_direction = direction[k];

    if (!player.peeking) {
      var new_x = player.x + direction[k][0];
      var new_y = player.y + direction[k][1];
      var pos_after_interaction = [new_x, new_y];
      entities.forEach(e => {
        if (e.x == new_x && e.y == new_y) {
          pos_after_interaction = handleInteraction(e);
        }
      });
      player.x = pos_after_interaction[0];
      player.y = pos_after_interaction[1];
    }
    update_camera();

    recomputeGrid();
  }
  if (k == K_P) {
    player.peeking = true;
  }
});
document.addEventListener('keyup', function(event) {
  var direction = {
    '37': [-1, 0],
    '38': [0, -1],
    '39': [1, 0],
    '40': [0, 1],
  };
  var K_P = 80;
  var k = event.keyCode;
  if (k in direction) {
    var d = direction[k];
    var pd = player.peeking_direction;
    if (pd[0] == d[0] && pd[1] == d[1]) {
      player.peeking_direction = [0, 0];
    }
  }
  if (k == K_P) {
    player.peeking = false;
  }
});

makeWorld(level1);

var prevTime = performance.now();
function loop(t) {
  var delta = t - prevTime;
  prevTime = t;
  update(delta);
  draw(delta);
  window.requestAnimationFrame(loop);
}
loop(prevTime);
