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


function spr(name) {
  return document.getElementById('spr_' + name);
}

var level1 = 
"xxxxxxxxxxxxxxxxxxxx\n" +
"x.......xxx........x\n" +
"x..x.x..xxx........x\n" +
"x..xxxxxxxx..xx....x\n" +
"x............xx.xx.x\n" +
"x.....xxxxx..xxxxxxx\n" +
"x....@xxxxx..x.....x\n" +
"x.......xxx..x.....x\n" +
"x..xx.....x..x.....x\n" +
"x..xx..............x\n" +
"x..................x\n" +
"xxxxxxxxxxxxxxxxxxxx";
var level_width;
var level_height;
var entities = [];
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
        player = makeEntity(x,y,'player','leon');
        setup_camera();
        entities.push(player);
      }
      if (c == 'x') {
        entities.push(makeEntity(x,y,'wall','wall'));
      }
      x++;
    }
    level_width = s.length;
  });
  level_height = w.length;
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

function handleInteraction(e) {
  if (e.type == 'wall') {
    return [player.x, player.y];
  }
  return [player.x, player.y];
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
}

document.addEventListener('keydown', function(event) {
  var direction = {
    '37': [-1, 0],
    '38': [0, -1],
    '39': [1, 0],
    '40': [0, 1],
  };
  var k = event.keyCode;
  if (k in direction) {
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
    update_camera();
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
