var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
function level() {
  var level = 4;
  var scene_running = true;
  var WIDTH = 640;
  var HEIGHT = 480;
  var BORDER_H = 16;
  var WINDOW_W = 10;
  var WINDOW_H = 7;
  var TILE_SIZE = 64;
  var CAMERA_BOUNDARY_W = 0;
  var CAMERA_BOUNDARY_H = 0;
  var CAMERA_FOLLOW_FACTOR = 0.05;
  var CAMERA_MIN_FOLLOW = 0.01;

  function spr(name) {
    return document.getElementById('spr_' + name);
  }

  var level_width;
  var level_height;
  var entities = [];
  var grid = [];
  var seen = {};
  var player;
  var camera = {
    x: 0,
    y: 0,
    display_x: 0,
    display_y: 0,
  };

  function makeWorld(level) {
    entities = [];
    grid = [];
    seen = {};
    camera = {
      x: 0,
      y: 0,
      display_x: 0,
      display_y: 0,
    };
    var w = level.split("\n").map((s,y) => {
      var x = 0;
      for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (c == '@') {
          if (!player) {
            player = makePlayer(x, y);
          } else {
            player.x = x;
            player.display_x = x;
            player.y = y;
            player.display_y = y;
          }
          setup_camera();
          entities.push(player);
        }
        if (c == 'x') {
          entities.push(makeWall(x,y));
        }
        if (c == '<') {
          entities.push(makeCroc(x, y, 'left'));
        }
        if (c == '>') {
          entities.push(makeCroc(x, y, 'right'));
        }
        if (c == 'v') {
          entities.push(makeVert(x, y, 'down'));
        }
        if (c == '^') {
          entities.push(makeVert(x, y, 'up'));
        }
        if (c == 'l') {
          entities.push(makeEye(x, y, 'left'));
        }
        if (c == 'r') {
          entities.push(makeEye(x, y, 'right'));
        }
        if (c == 'u') {
          entities.push(makeEye(x, y, 'up'));
        }
        if (c == 'd') {
          entities.push(makeEye(x, y, 'down'));
        }
        if (c == 'b') {
          entities.push(makeBomb(x, y));
        }
        if (c == 'p') {
          entities.push(makePotion(x, y));
        }
        if (c == 'k') {
          entities.push(makeShuriken(x, y));
        }
        if (c == '1') {
          entities.push(makeSign(x, y, 'Welcome to the SHOP.   The items are not FREE.'));
        }
        if (c == '2') {
          entities.push(makeSign(x, y, 'This is the GRAVE.   There is MONEY to be found.'));
        }
        if (c == '3') {
          entities.push(makeSign(x, y, 'Ghosts will move AFTER you, unless you CROUCH.'));
        }
        if (c == '4') {
          entities.push(makeSign(x, y, 'Don\'t get CAUGHT.   Maybe try PEEKING around the corner?'));
        }
        if (c == '5') {
          entities.push(makeSign(x, y, 'Surprise ghosts from BEHIND to EXPEL them.'));
        }
        if (c == '7') {
          entities.push(makeSign(x, y, 'Will you SURVIVE all 3 floors?'));
        }
        if (c == '6') {
          entities.push(makeSign(x, y, 'CONGRATULATIONS, but will you survive NEXT TIME?'));
        }
        if (c == '$') {
          entities.push(makeStairs(x,y));
        }
        if (c == 'g') {
          entities.push(makeGrave(x, y));
        }
        if (c == '%') {
          entities.push(makeEntity(x, y,'exit','exit'));
        }
        x++;
      }
      level_width = s.length;
    });
    level_height = w.length;
    recomputeGrid();
  }

  function setup_camera() {
    camera.screenshake = 0;
    camera.x = player.x - Math.floor(WINDOW_W/2);
    camera.y = player.y - Math.floor(WINDOW_H/2);
    camera.pre_display_x = camera.x;
    camera.pre_display_y = camera.y;
    camera.display_x = camera.x;
    camera.display_y = camera.y;
  }

  function update_camera() {
    while (player.x - camera.x < WINDOW_W/2 - CAMERA_BOUNDARY_W) {
      camera.x -= 1;
    }
    while (player.x - camera.x > WINDOW_W/2 + CAMERA_BOUNDARY_W) {
      camera.x += 1;
    }
    while (player.y - camera.y < WINDOW_H/2 - CAMERA_BOUNDARY_H) {
      camera.y -= 1;
    }
    while (player.y - camera.y > WINDOW_H/2 + CAMERA_BOUNDARY_H) {
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

  function makeSign(x, y, msg) {
    var p = makeEntity(x,y,'sign','sign');
    p.msg = msg;
    return p;
  }

  function makeStairs(x, y) {
    var p = makeEntity(x,y,'stairs','stairs');
    return p;
  }

  function makeWall(x, y) {
    var p = makeEntity(x, y, 'wall', 'wall');
    p.draw = () => {
      //bitmask l = 1, u = 2, r = 4, d = 8
      var neighbors = 0;
      if (p.x == 0 || (grid.get(p.x-1,p.y) && grid.get(p.x-1,p.y).type == 'wall')) {
        neighbors += 1;
      }
      if (p.y == 0 || (grid.get(p.x,p.y-1) && grid.get(p.x,p.y-1).type == 'wall')) {
        neighbors += 2;
      }
      if (p.x == level_width-1 || (grid.get(p.x+1,p.y) && grid.get(p.x+1,p.y).type == 'wall')) {
        neighbors += 4;
      }
      if (p.y == level_height-1 || (grid.get(p.x,p.y+1) && grid.get(p.x,p.y+1).type == 'wall')) {
        neighbors += 8;
      }
      var sprites = [
        'wall_nsew',
        'wall_nes',
        'wall_wse',
        'wall_se',
        'wall_nws',
        'wall_ns',
        'wall_sw',
        'wall_s',
        'wall_wne',
        'wall_ne',
        'wall_we',
        'wall_e',
        'wall_nw',
        'wall_n',
        'wall_w',
        'wall',
      ];
      drawSpriteAt(sprites[neighbors], p.x, p.y);
    };
    return p;
  }

  function makeBomb(x, y) {
    var p = makeEntity(x, y, 'bomb', 'bomb');
    p.draw = () => {
      drawSpriteAt('bomb', p.x, p.y);
      if (!p.sold) {
        var fx = TILE_SIZE*(p.x-camera.display_x+0.9);
        var fy = TILE_SIZE*(p.y-camera.display_y+0.95)+BORDER_H;
        context.textAlign = "center";
        context.font = '32px charm';
        context.lineWidth = 4;
        context.strokeStyle = 'black';
        context.strokeText(p.price, fx, fy);
        context.fillStyle = 'white';
        context.fillText(p.price, fx, fy);
      }
    };
    p.sold = false;
    p.price = bellCurve(10, 15);
    return p;
  }

  function makePotion(x, y) {
    var p = makeEntity(x, y, 'potion', 'potion');
    p.draw = () => {
      drawSpriteAt('potion', p.x, p.y);
      if (!p.sold) {
        var fx = TILE_SIZE*(p.x-camera.display_x+0.9);
        var fy = TILE_SIZE*(p.y-camera.display_y+0.95)+BORDER_H;
        context.textAlign = "center";
        context.font = '32px charm';
        context.lineWidth = 4;
        context.strokeStyle = 'black';
        context.strokeText(p.price, fx, fy);
        context.fillStyle = 'white';
        context.fillText(p.price, fx, fy);
      }
    };
    p.sold = false;
    p.price = bellCurve(20, 50);
    return p;
  }

  function makeShuriken(x, y) {
    var p = makeEntity(x, y, 'shuriken', 'shuriken');
    p.draw = () => {
      drawSpriteAt('shuriken', p.x, p.y);
      if (!p.sold) {
        var fx = TILE_SIZE*(p.x-camera.display_x+0.9);
        var fy = TILE_SIZE*(p.y-camera.display_y+0.95)+BORDER_H;
        context.textAlign = "center";
        context.font = '32px charm';
        context.lineWidth = 4;
        context.strokeStyle = 'black';
        context.strokeText(p.price, fx, fy);
        context.fillStyle = 'white';
        context.fillText(p.price, fx, fy);
      }
    };
    p.sold = false;
    p.price = bellCurve(15, 30);
    return p;
  }

  function makeVert(x, y, direction) {
    var p = makeEntity(x, y, 'vert', 'vert');
    var LOS = 3;
    p.direction = direction;
    p.angry = false;
    p.draw = () => {
      drawSpriteAt('vert_' + p.direction, p.display_x, p.display_y);
      drawSpriteAt('heart_small', p.display_x+0.85, p.display_y+0.85);
      var fx = (p.display_x - camera.display_x + 0.8)* TILE_SIZE;
      var fy = (p.display_y - camera.display_y + 1.0)* TILE_SIZE + BORDER_H;
      context.textAlign = "right";
      context.font = '24px charm';
      context.lineWidth = 3;
      context.strokeStyle = 'red';
      context.strokeText(p.hp, fx, fy);
      context.fillStyle = 'white';
      context.fillText(p.hp, fx, fy);
      if (p.angry) {
        drawSpriteAt('angry', p.display_x, p.display_y);
      }
    };
    p.drawLOS = () => {
      var len = 0;
      for (len = 1; len < LOS; len++) {
        var g = grid.get(p.x, p.y + len*(p.direction == 'down' ? 1 : -1));
        if (!g) continue;
        if (isLosBlocking(g)) break;
      }
      if (p.direction == 'down') {
        var X = (p.display_x - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_2_down'), 0, 0, 64, len*64, X, Y, 64, len*64);
      } else {
        var X = (p.display_x - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - (len-1) - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_2_up'), 0, (3-len)*64, 64, len*64, X, Y, 64, len*64);
      }
    };
    p.damage = (dmg) => {
      p.hp -= dmg;
      if (p.hp <= 0) {
        p.die();
      }
    };
    p.die = () => {
      entities = entities.filter(e => e != p);
      entities.push(makeMoney(p.x, p.y, Math.ceil(3*Math.random())));
    };
    p.patrolLength = 3;
    p.patrolCounter = 0;
    p.maxhp = 3;
    p.hp = 3;
    p.step = () => {
      function move() {
        var new_y = p.y + (p.direction == 'down' ? 1 : -1);
        var g = grid.get(p.x, new_y);
        if (!g || g.type == 'money') {
          entities = entities.filter(e => e != g);
          if (p.patrolCounter != p.patrolLength) {
            p.y = new_y;
            recomputeGrid();
          }
          return false;
        } else if (g.type == 'player') {
          player.damage(1);
          return true;
        } else {
          p.direction = p.direction == 'down' ? 'up' : 'down';
          p.patrolCounter = -1;
          return false;
        }
      }
      if (!move() && p.angry) {
        move();
      }
      p.angry = false;
      for (var i = 0; i < LOS; i++) {
        var g = grid.get(p.x, p.y + i*(p.direction == 'down' ? 1 : -1));
        if (!g) continue;
        if (g.type == 'wall' || g.type == 'grave') break;
        if (g.type == 'player' && g.ivsb == 0) {
          p.angry = true;
          p.patrolCounter = 0;
        }
      }
      p.patrolCounter++;
      if (p.patrolCounter > p.patrolLength) {
        p.direction = p.direction == 'down' ? 'up' : 'down';
        p.patrolCounter = 0;
        for (var i = 0; i < LOS; i++) {
          var g = grid.get(p.x, p.y + i*(p.direction == 'down' ? 1 : -1));
          if (!g) continue;
          if (g.type == 'wall' || g.type == 'grave') break;
          if (g.type == 'player') {
            p.angry = true;
            p.patrolCounter = 0;
          }
        }
      }
    };
    p.update = () => {
      p.display_x += lerp(p.display_x, p.x, 0.5, 0.01);
      p.display_y += lerp(p.display_y, p.y, 0.5, 0.01);
    };
    p.display_x = p.x;
    p.display_y = p.y;
    return p;
  }

  function makeMoney(x, y, amount) {
    var p = makeEntity(x, y, 'money', 'money');
    p.draw = () => {
      var fx = TILE_SIZE*(p.x-camera.display_x+0.5);
      var fy = TILE_SIZE*(p.y-camera.display_y+0.75);
      drawSpriteAt('money', x, y);
      context.textAlign = "center";
      context.font = '32px charm';
      context.lineWidth = 3;
      context.strokeStyle = 'black';
      context.strokeText(p.amount, fx, fy);
      context.fillStyle = 'white';
      context.fillText(p.amount, fx, fy);
    };
    p.amount = amount;
    return p;
  }

  function isLosBlocking(e) {
    return e.type == 'wall' || e.type == 'vert' || e.type == 'croc' || e.type == 'grave' || e.type == 'eye';
  }

  function makeGrave(x, y) {
    var p = makeEntity(x, y, 'grave', 'grave');
    p.entityInside = (() => {
      var r = Math.random();
      if (r < 0.8) {
        // roll three dice for a nice bell curve approximation
        var g = Math.ceil(10/3*(Math.random() + Math.random() + Math.random()));
        return () => makeMoney(p.x, p.y, g);
      } else if (r < 0.85) {
        return () => makeVert(x,y,Math.random() < 0.5 ? 'down' : 'up');
      } else {
        return () => makeCroc(x,y,Math.random() < 0.5 ? 'right' : 'left');
      }
    })();
    p.crack = () => {
      p.cracked = true;
    };
    p.update = () => {
      if (p.cracked) {
        var e = p.entityInside();
        console.log(e.type);
        if (e) entities.push(p.entityInside());
        entities = entities.filter(e => e != p);
      }
    };
    return p;
  }

  function makeCroc(x, y, direction) {
    var p = makeEntity(x, y, 'croc', 'croc');
    var LOS = 3;
    p.direction = direction
    p.angry = false
    p.draw = () => {
      drawSpriteAt('croc_' + p.direction, p.display_x, p.display_y);
      drawSpriteAt('heart_small', p.display_x+0.85, p.display_y+0.85);
      var fx = (p.display_x - camera.display_x + 0.8)* TILE_SIZE;
      var fy = (p.display_y - camera.display_y + 1.0)* TILE_SIZE + BORDER_H;
      context.textAlign = "right";
      context.font = '24px charm';
      context.lineWidth = 3;
      context.strokeStyle = 'red';
      context.strokeText(p.hp, fx, fy);
      context.fillStyle = 'white';
      context.fillText(p.hp, fx, fy);
      if (p.angry) {
        drawSpriteAt('angry', p.display_x, p.display_y);
      }
    };
    p.drawLOS = () => {
      var len = 0;
      for (len = 1; len < LOS; len++) {
        var g = grid.get(p.x + len*(p.direction == 'right' ? 1 : -1), p.y);
        if (!g) continue;
        if (isLosBlocking(g)) break;
      }
      if (p.direction == 'right') {
        var X = (p.display_x - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_2_right'), 0, 0, len*64, 64, X, Y, len*64, 64);
      } else {
        var X = (p.display_x - (len-1) - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_2_left'), (3-len)*64, 0, len*64, 64, X, Y, len*64, 64);
      }
    };
    p.patrolLength = 2;
    p.patrolCounter = 0;
    p.maxhp = 3;
    p.hp = 3;
    p.damage = (dmg) => {
      p.hp -= dmg;
      if (p.hp <= 0) {
        p.die();
      }
    };
    p.die = () => {
      entities = entities.filter(e => e != p);
      entities.push(makeMoney(p.x, p.y, Math.ceil(2*Math.random())));
    };
    p.display_x = p.x;
    p.display_y = p.y;
    p.step = () => {
      function move() {
        var new_x = p.x + (p.direction == 'right' ? 1 : -1);
        var g = grid.get(new_x, p.y);
        if (!g || g.type == 'money') {
          entities = entities.filter(e => e != g);
          if (p.patrolCounter != p.patrolLength) {
            p.x = new_x;
            recomputeGrid();
          }
          return false;
        } else if (g.type == 'player') {
          player.damage(1);
          return true;
        } else {
          p.direction = p.direction == 'right' ? 'left' : 'right';
          p.patrolCounter = -1;
          return true;
        }
      };
      // Move's twice if angry, but not if it already attacked the player
      if (!move() && p.angry) {
        move()
      }
      p.angry = false;
      for (var i = 1; i < LOS; i++) {
        var g = grid.get(p.x + i*(p.direction == 'right' ? 1 : -1), p.y);
        if (!g) continue;
        if (isLosBlocking(g)) break;
        if (g.type == 'player') {
          p.angry = true;
          p.patrolCounter = 0;
        }
      }
      p.patrolCounter++;
      if (p.patrolCounter > p.patrolLength) {
        p.direction = p.direction == 'right' ? 'left' : 'right';
        p.patrolCounter = 0;
        for (var i = 1; i < LOS; i++) {
          var g = grid.get(p.x + i*(p.direction == 'right' ? 1 : -1), p.y);
          if (!g) continue;
          if (isLosBlocking(g)) break;
          if (g.type == 'player' && g.ivsb == 0) {
            p.angry = true;
            p.patrolCounter = 0;
          }
        }
      }
    };
    p.update = () => {
      p.display_x += lerp(p.display_x, p.x, 0.5, 0.01);
      p.display_y += lerp(p.display_y, p.y, 0.5, 0.01);
    };
    return p;
  }

  function makeEye(x, y, direction) {
    var p = makeEntity(x, y, 'eye', 'eye');
    var LOS = 4;
    p.direction = direction
    p.angry = false
    p.draw = () => {
      drawSpriteAt('eye_' + p.direction, p.display_x, p.display_y);
      drawSpriteAt('heart_small', p.display_x+0.85, p.display_y+0.85);
      var fx = (p.display_x - camera.display_x + 0.8)* TILE_SIZE;
      var fy = (p.display_y - camera.display_y + 1.0)* TILE_SIZE + BORDER_H;
      context.textAlign = "right";
      context.font = '24px charm';
      context.lineWidth = 3;
      context.strokeStyle = 'red';
      context.strokeText(p.hp, fx, fy);
      context.fillStyle = 'white';
      context.fillText(p.hp, fx, fy);
      if (p.angry) {
        drawSpriteAt('angry', p.display_x, p.display_y);
      }
    };
    var dirs = {
      'left': [-1, 0],
      'right': [1, 0],
      'up': [0, -1],
      'down': [0, 1],
    };
    p.drawLOS = () => {
      var len = 0;
      for (len = 1; len < LOS; len++) {
        var dx = dirs[p.direction][0];
        var dy = dirs[p.direction][1];
        var g = grid.get(p.x + len*dx, p.y + len*dy);
        if (!g) continue;
        if (isLosBlocking(g)) break;
      }
      if (p.direction == 'down') {
        var X = (p.display_x - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_3_down'), 0, 0, 64, len*64, X, Y, 64, len*64);
      } else if (p.direction == 'up') {
        var X = (p.display_x - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - (len-1) - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_3_up'), 0, (LOS-len)*64, 64, len*64, X, Y, 64, len*64);
      } else if (p.direction == 'right') {
        var X = (p.display_x - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_3_right'), 0, 0, len*64, 64, X, Y, len*64, 64);
      } else {
        var X = (p.display_x - (len-1) - camera.display_x)*TILE_SIZE;
        var Y = (p.display_y - camera.display_y)*TILE_SIZE + BORDER_H;
        context.drawImage(spr('los_3_left'), (LOS-len)*64, 0, len*64, 64, X, Y, len*64, 64);
      }
    }
    p.step = () => {
      if (!p.angry) {
        var pdx = player.x - p.x;
        var pdy = player.y - p.y;
        if (pdx != 0 && pdy != 0) return;
        if (Math.abs(pdx) >= LOS || Math.abs(pdy) >= LOS) return;
        var dirMap = {
          '-1,0':'left',
          '1,0':'right',
          '0,-1':'up',
          '0,1':'down',
        }
        var dir = [Math.sign(pdx), Math.sign(pdy)];
        var canSeePlayer = player.ivsb == 0;
        for (var i = 1; i < (Math.abs(pdx)+Math.abs(pdy)); i++) {
          var g = grid.get(p.x+i*dir[0], p.y+i*dir[1]);
          if (g && isLosBlocking(g)) {
            canSeePlayer = false;
            break;
          }
          if (g && g.type == 'player' && g.ivsb == 0) {
            break;
          }
        }
        if (canSeePlayer) {
          p.direction = dirMap[dir[0]+','+dir[1]];
        }
      } else {
        var d = dirs[p.direction];
        while (true) {
          var g = grid.get(p.x+d[0], p.y+d[1]);
          if (g && g.type == 'player') {
            player.damage(1);
            break;
          }
          if (g && g.type != 'money') break;
          p.x += d[0];
          p.y += d[1];
          recomputeGrid();
        }
      }
      // recheck angry
      p.angry = false;
      for (var i = 1; i < LOS; i++) {
        var g = grid.get(p.x+i*dirs[p.direction][0], p.y+i*dirs[p.direction][1]);
        if (g && isLosBlocking(g)) {
          break;
        }
        if (g && g.type == 'player' && g.ivsb == 0) {
          p.angry = true;
          break;
        }
      }
    };
    p.maxhp = 4;
    p.hp = 4;
    p.damage = (dmg) => {
      p.hp -= dmg;
      if (p.hp <= 0) {
        p.die();
      }
    };
    p.die = () => {
      entities = entities.filter(e => e != p);
      entities.push(makeMoney(p.x, p.y, Math.ceil(3*Math.random()) + 2));
    };
    p.display_x = p.x;
    p.display_y = p.y;
    p.update = () => {
      p.display_x += lerp(p.display_x, p.x, 0.5, 0.01);
      p.display_y += lerp(p.display_y, p.y, 0.5, 0.01);
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
    p.ivsb = 0;
    p.draw = () => {
      var px = p.x + 0.25 * (p.peeking ? p.peeking_direction[0] : 0);
      var py = p.y + 0.25 * (p.peeking ? p.peeking_direction[1] : 0);
      p.display_x += lerp(p.display_x, px, 0.5, 0.01);
      p.display_y += lerp(p.display_y, py, 0.5, 0.01);
      if (p.ivsb > 0) {
        context.globalAlpha = 0.5;
      }
      drawSpriteAt('leon'+ (p.direction == 'right' ? '_right' : '_left') + (p.trailing ? "_trailing" : ""), p.display_x, p.display_y);
      context.globalAlpha = 1.0;
    };
    p.damage = (dmg) => {
      document.getElementById('hurt').play();
      p.hp -= dmg;
      camera.screenshake = 1;
      if (p.hp == 0) {
        gameOver();
      }
    };
    p.lineOfSight = () => {
      var los = lineOfSight(p, LOS);
      if (p.peeking) {
        for (pos in lineOfSight({x: p.x+p.peeking_direction[0], y:p.y+p.peeking_direction[1]}, LOS)) {
          los[pos] = true;
        }
      }
      return los;
    };
    p.useItem = () => {
      // random teleport
      if (p.item.type == 'bomb') {
        var validSquares = []
        for (var y = 0; y < level_height; y++) {
          for (var x = 0; x < level_width; x++) {
            if (!grid.get(x,y)) {
              validSquares.push([x,y]);
            }
          }
        }
        var pos = validSquares[Math.floor(Math.random()*validSquares.length)];
        p.display_x = player.x;
        p.x = pos[0];
        p.y = pos[1];
      }
      // 5 turns invisible
      if (p.item.type == 'potion') {
        p.ivsb = 5;
      }
      // throws in direction facing
      if (p.item.type == 'shuriken') {
        var dx = p.direction == 'right' ? 1 : -1;
        var x = p.x;
        var g = null;
        while (g == null || g.type == 'money') {
          x += dx;
          g = grid.get(x, p.y);
        }
        if (g.type == 'wall') {
          p.item.x = x - dx;
          p.item.y = p.y;
          entities.push(p.item);
        } else {
          if (g.die) {
            g.die();
          }
        }
      }
      p.item = null;
    };
    p.direction = 'right';
    p.trailing = false;
    p.peeking = false;
    p.peeking_direction = [0,0];
    p.hp = 3;
    p.gold = 0;
    p.item = null;
    p.display_x = p.x;
    p.display_y = p.y;
    return p;
  }

  function handleInteraction(e, direction) {
    if (e.type == 'wall') {
      return [player.x, player.y];
    }
    if (e.type == 'croc') {
      player.display_x += 2*direction[0];
      player.display_y += 2*direction[1];
      if ((e.direction == 'right' && direction[0] > 0) || (e.direction == 'left' && direction[0] < 0)) {
        document.getElementById('backattack').play();
        e.die();
      } else {
        document.getElementById('attack').play();
        e.damage(1);
      }
    }
    if (e.type == 'vert') {
      player.display_x += 2*direction[0];
      player.display_y += 2*direction[1];
      if ((e.direction == 'up' && direction[1] < 0) || (e.direction == 'down' && direction[1] > 0)) {
        document.getElementById('backattack').play();
        e.die();
      } else {
        document.getElementById('attack').play();
        e.damage(1);
      }
    }
    if (e.type == 'eye') {
      player.display_x += 2*direction[0];
      player.display_y += 2*direction[1];
      if ((e.direction == 'up' && direction[1] < 0) || (e.direction == 'down' && direction[1] > 0) || (e.direction == 'right' && direction[0] > 0) || (e.direction == 'left' && direction[0] < 0)) {
        document.getElementById('backattack').play();
        e.die();
      } else {
        document.getElementById('attack').play();
        e.damage(1);
      }
    }
    if (e.type == 'grave') {
      document.getElementById('graveattack').play();
      player.display_x += 2*direction[0];
      player.display_y += 2*direction[1];
      e.crack();
    }
    if (e.type == 'money') {
      document.getElementById('pickup').play();
      player.gold += e.amount;
      entities = entities.filter(ent => ent != e);
      return [player.x + direction[0], player.y + direction[1]];
    }
    if (e.type == 'shuriken' || e.type == 'bomb' || e.type == 'potion') {
      console.log(e);
      if (!e.sold && player.gold >= e.price) {
        document.getElementById('buy').play();
        e.sold = true;
        player.gold -= e.price;
      }
      if (e.sold) {
        if (player.item != null) {
          player.item.x = e.x;
          player.item.y = e.y;
          player.item.display_x = e.x;
          player.item.display_y = e.y;
          entities.push(player.item);
        }
        player.item = e;
        entities = entities.filter(ent => ent != e);
        return [player.x + direction[0], player.y + direction[1]];
      }
    } if (e.type == 'stairs') {
      level += 1;
      makeWorld(generateLevel(15 + level*bellCurve(4,6), 15 + level*bellCurve(4,6), level));
    } if (e.type == 'exit') {
      document.getElementById('win').play();
      setTimeout(() => {
        tearDown();
        playVictoryScene();
      }, 500);
      return [player.x + direction[0], player.y + direction[1]];
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
    grid.get = function(x,y) {
      return grid[x] && grid[x][y];
    }
  }

  function processEntities() {
    entities.forEach(e => {
      if (e.step) {
        e.step();
      }
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
    var los = player.lineOfSight();
    entities.forEach(e => {
      if (!((e.x+','+e.y) in los)) {
        if (e.type == 'croc' || e.type == 'vert' || e.type == 'eye') {
          return;
        }
      }
      e.draw();
    });
  }

  function drawLOS() {
    var los = player.lineOfSight();
    entities.forEach(e => {
      if ((e.x+','+e.y in los) && e.drawLOS) {
        e.drawLOS();
      }
    });
  }

  function drawFogOfWar() {
    var los = player.lineOfSight();
    for (pos in los) {
      seen[pos] = true;
    }
    for (var i = -2; i < level_width+2; i++) {
      for (var j = -2; j < level_height+2; j++) {
        var x = camera.x + i;
        var y = camera.y + j;
        if (!((x+','+y) in seen)) {
          drawSpriteAt('fog', x,y);
        } else if (!((x+','+y) in los)) {
          drawSpriteAt('fog_seen', x,y);
        }
      }
    }
  }

  function drawHUD() {
    for (var i = 0; i < player.hp; i++) {
      drawSpriteAt("heart", camera.display_x+0.125+i*0.25, camera.display_y-0.125);
    }
    context.textAlign = "left";
    var gold = "gold: " + player.gold;
    context.font = '32px charm';
    context.lineWidth = 5;
    context.strokeStyle = 'black';
    context.strokeText(gold, 8, 64);
    context.fillStyle = 'white';
    context.fillText(gold, 8, 64);
    var item = "item:";
    context.font = '32px charm';
    context.lineWidth = 5;
    context.strokeStyle = 'black';
    context.strokeText(item, 8, 128);
    context.fillStyle = 'white';
    context.fillText(item, 8, 128);
    if (player.item != null) {
      drawSpriteAt(player.item.type + "_small", camera.display_x + 0.7, camera.display_y + 1.25);
    }

    context.textAlign = "right";
    msg = "Hold shift to peek";
    context.font = '32px charm';
    context.lineWidth = 5;
    context.strokeStyle = 'black';
    context.strokeText(msg, 635, 36);
    context.fillStyle = 'white';
    context.fillText(msg, 635, 36);

    context.textAlign = "right";
    msg = "Hold space to crouch";
    context.font = '32px charm';
    context.lineWidth = 5;
    context.strokeStyle = 'black';
    context.strokeText(msg, 635, 76);
    context.fillStyle = 'white';
    context.fillText(msg, 635, 76);

    context.textAlign = "right";
    msg = "Press X to use item";
    context.font = '32px charm';
    context.lineWidth = 5;
    context.strokeStyle = 'black';
    context.strokeText(msg, 635, 116);
    context.fillStyle = 'white';
    context.fillText(msg, 635, 116);

    var g = grid.get(player.x, player.y-1);
    if (g && g.type == 'sign') {
      context.textAlign = "left";
      context.font = '32 charm';
      context.lineWidth = 5;
      context.strokeStyle = 'black';
      context.strokeText(g.msg, 8, 480 - 24);
      context.fillStyle = 'white';
      context.fillText(g.msg, 8, 480 - 24);
    }
  }

  function update(delta) {
    camera.screenshake = Math.max(0.0, camera.screenshake - 4*delta/1000.0);
    camera.pre_display_x += lerp(camera.pre_display_x, camera.x, CAMERA_FOLLOW_FACTOR, CAMERA_MIN_FOLLOW);
    camera.pre_display_y += lerp(camera.pre_display_y, camera.y, CAMERA_FOLLOW_FACTOR, CAMERA_MIN_FOLLOW);
    camera.display_x = camera.pre_display_x + (Math.random() - 0.5) * camera.screenshake * 0.5;
    camera.display_y = camera.pre_display_y + (Math.random() - 0.5) * camera.screenshake * 0.5;
    entities.forEach(e => {
      if (e.update) {
        e.update();
      }
    });
  }

  function lerp(a, b, factor, min) {
    var c = b - a;
    var d = factor*c;
    if (Math.abs(d) != 0 && Math.abs(d) < min) {
      d /= Math.abs(d);
      d *= min;
    }
    if (Math.abs(d) > Math.abs(c)) {
      return c;
    } else {
      return d;
    }
  }


  function draw(delta) {
    context.fillStyle = 'black';
    context.fillRect(0,0,WIDTH,HEIGHT);
    drawBackground();
    drawEntities();
    drawLOS();
    drawFogOfWar();
    drawHUD();
  }

  var K_P = 80;
  var K_SPACE = 32;
  var K_X = 88;
  var KEYS = {};

  function player_action(d) {
    if (d[0] > 0) {
      player.direction = 'right';
    } else if (d[0] < 0) {
      player.direction = 'left';
    }

    player.peeking_direction = d;

    if (!player.peeking) {
      var new_x = player.x + d[0];
      var new_y = player.y + d[1];
      var pos_after_interaction = [new_x, new_y];
      entities.forEach(e => {
        if (e.x == new_x && e.y == new_y) {
          pos_after_interaction = handleInteraction(e, d);
        }
      });
      player.x = pos_after_interaction[0];
      player.y = pos_after_interaction[1];
    }
    player.ivsb = Math.max(player.ivsb - 1, 0);
    recomputeGrid();
  }

  function keydown(event) {
    if (KEYS[event.keyCode]) return;
    KEYS[event.keyCode] = true;
    var direction = {
      '37': [-1, 0],
      '38': [0, -1],
      '39': [1, 0],
      '40': [0, 1],
    };
    var k = event.keyCode;
    if (k in direction) {
      if (event.shiftKey) {
        player.peeking = true;
      } else {
        player.peeking = false;
      }
      if (!player.trailing) {
        player_action(direction[k]);
      }
      processEntities();
      recomputeGrid();
      if (player.trailing) {
        player_action(direction[k]);
      }
      update_camera();
    }
    if (k == K_X) {
      if (player.item) {
        player.useItem();
      }
      recomputeGrid();
      update_camera();
    }
    if (k == K_SPACE) {
      player.trailing = true;
    }
  }

  function keyup(event) {
    KEYS[event.keyCode] = false;
    var direction = {
      '37': [-1, 0],
      '38': [0, -1],
      '39': [1, 0],
      '40': [0, 1],
    };
    var k = event.keyCode;
    if (k in direction) {
      var d = direction[k];
      var pd = player.peeking_direction;
      if (pd[0] == d[0] && pd[1] == d[1]) {
        player.peeking_direction = [0, 0];
      }
    }
    if (k == K_SPACE) {
      player.trailing = false;
    }
  }

  function tearDown() {
    scene_running = false;
    document.removeEventListener('keydown', keydown);
    document.removeEventListener('keyup', keyup);
  }

  makeWorld(generateLevel(15 + level*bellCurve(4,6), 15 + level*bellCurve(4,6), level));

  var prevTime = performance.now();
  function loop(t) {
    var delta = t - prevTime;
    prevTime = t;
    update(delta);
    draw(delta);
    if (scene_running) {
      window.requestAnimationFrame(loop);
    }
  }
  loop(prevTime);
  document.addEventListener('keydown', keydown);
  document.addEventListener('keyup', keyup);

  function gameOver() {
    tearDown();
    playGameOverScene();
  }
}

function playGameOverScene() {
  document.getElementById('gameover').play();
  var scene_running = true;
  var gameover = document.getElementById('spr_gameover');
  var prevTime = performance.now();
  var messageOpacity = 1.0;
  function keydown(event) {
    if (event.keyCode == 32) {
      restart();
    }
  }
  function restart() {
    scene_running = false;
    document.removeEventListener('keydown', keydown);
    level();
  }
  function loop(t) {
    var delta = t - prevTime;
    prevTime = t;
    context.drawImage(gameover, 0, 0);
    context.textAlign = 'center';
    context.font = '64px charm';
    context.lineWidth = 16;
    context.strokeStyle = 'black';
    context.strokeText("GAME OVER", 320-20, 128);
    context.fillStyle = 'white';
    context.fillText("GAME OVER", 320-20, 128);

    context.textAlign = 'center';
    context.font = '32px charm';
    context.lineWidth = 12;
    context.strokeStyle = 'rgba(0,0,0,' + messageOpacity+')';
    context.strokeText("Press Space to Restart", 320-20, 200);
    context.fillStyle = 'white';
    context.fillStyle = 'rgba(255,255,255,' + messageOpacity+')';
    context.fillText("Press Space to Restart", 320-20, 200);
    messageOpacity = 0.65 * (1.0 + Math.sin(t/250));
    if (scene_running) {
      window.requestAnimationFrame(loop);
    }
  }
  document.addEventListener('keydown', keydown);
  loop(prevTime);
}

function titleScreen() {
  var scene_running = true;
  var title = document.getElementById('spr_title');
  var prevTime = performance.now();
  var messageOpacity = 1.0;
  function keydown(event) {
    if (event.keyCode == 32) {
      restart();
    }
  }
  function restart() {
    scene_running = false;
    document.removeEventListener('keydown', keydown);
    level();
  }
  function loop(t) {
    var delta = t - prevTime;
    prevTime = t;
    context.drawImage(title, 0, 0);

    context.textAlign = 'center';
    context.font = '36px charm';
    context.lineWidth = 12;
    context.strokeStyle = 'rgba(0,0,0,' + messageOpacity+')';
    context.strokeText("Press Space", 320-15, 445);
    context.fillStyle = 'white';
    context.fillStyle = 'rgba(255,255,255,' + messageOpacity+')';
    context.fillText("Press Space", 320-15, 445);
    messageOpacity = 0.65 * (1.0 + Math.sin(t/250));
    if (scene_running) {
      window.requestAnimationFrame(loop);
    }
  }
  document.addEventListener('keydown', keydown);
  loop(prevTime);
}

function playVictoryScene() {
  var scene_running = true;
  var victory = document.getElementById('spr_victory');
  var prevTime = performance.now();
  var messageOpacity = 1.0;
  function keydown(event) {
    if (event.keyCode == 32) {
      restart();
    }
  }
  function restart() {
    scene_running = false;
    document.removeEventListener('keydown', keydown);
    titleScreen();
  }
  function loop(t) {
    var delta = t - prevTime;
    prevTime = t;
    context.drawImage(victory, 0, 0);
    context.textAlign = 'center';
    context.font = '32px charm';
    context.lineWidth = 12;
    context.strokeStyle = 'rgba(0,0,0,' + messageOpacity+')';
    context.strokeText("Press Space to return to title", 320-20, 440);
    context.fillStyle = 'white';
    context.fillStyle = 'rgba(255,255,255,' + messageOpacity+')';
    context.fillText("Press Space to return to title", 320-20, 440);
    messageOpacity = 0.65 * (1.0 + Math.sin(t/250));
    if (scene_running) {
      window.requestAnimationFrame(loop);
    }
  }
  document.addEventListener('keydown', keydown);
  loop(prevTime);
}

//level();
//playGameOverScene();
titleScreen();
