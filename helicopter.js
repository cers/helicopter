var setInterval_ = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
  var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
  return window.setInterval(vCallback instanceof Function ? function () {
    vCallback.apply(oThis, aArgs);
  } : vCallback, nDelay);
};

function Helicopter(e, settings) {
  if (!settings)
    settings = {};
  this.canvas = e;
  this.bgcanvas = document.createElement("canvas");
  this.resize(settings.height, settings.width);
  this.settings.sound = !!settings.sound;
  this.settings.fps = !!settings.fps;
  this.ctx.font = "18px sans-serif";

  for (var i=12, idx=0; i<31; i++) {
    var img = new Image();
    img.src = "data/small-"+i+".png";
    img.height = 25;
    img.width = 52;
    this.helicopter[idx++] = img;
  }

  for (var i=0; i<8; i++) {
    var img = new Image();
    img.src = "data/small-smoke-0"+(i+1)+".png";
    img.height = 15;
    img.width = 15;
    this.smoke[i] = img;
  }

  this.audio = new Audio();
  this.audio.src="data/helicopter.ogg";
  this.audio.loop = true;
  this.audio.controls = false;

  this.rev = new Audio();
  this.rev.src="data/rev.ogg";
  this.rev.loop = false;
  this.rev.controls = false;

  this.highscore = localStorage.getItem("highscore") || 0;

  if (!!('ontouchstart' in window)) {
      var startEvent = "touchstart";
      var stopEvent  = "touchend";
  } else {
      var startEvent = "mousedown";
      var stopEvent  = "mouseup";
  }

  var self = this;
  e.addEventListener(startEvent, function H_mouseDown() {
    if (!self.runId)
      self.startGame();
    self.mouseDown = true;
    if (self.settings.sound && self.rev.paused && self.runId)
      self.rev.play();
  }, false);
  e.addEventListener(stopEvent, function H_mouseUp() {
    self.mouseDown = false;
    self.rev.pause();
  }, false);

  this.init();
  this.main();
}

Helicopter.prototype = {
  runId: null,
  height: 0,
  width: 0,
  playerX: 0,
  playerY: 0,
  playerAcc: 0,
  offset: 0,
  step: 0,
  mouseDown: false,
  mouseDownCnt: 0,
  helicopter: [],
  canvas: null,
  ctx: null,
  bgcanvas: null,
  bgctx: null,
  lastDraw: null,
  fps: [],
  settings: {
    sound: false
  },
  audio: null,
  rev: null,
  highscore: 0,
  posCache: Array(8),
  course: function H_course(x) {
    var x = x + this.offset;
    var tmp = Math.sin(x/this.width)*this.height/4;
    return [this.height/2-tmp, this.height-this.height/4-tmp];
  },
  init: function H_init() {
    this.playerX = this.width/5;
    this.playerY = this.height/2;
    this.playerAcc = 0;
    this.offset = 0;
    this.step = 8;
    this.mouseDown = false;
    this.mouseDownCnt = 0;
    this.initBackground();
  },
  initBackground: function H_initBackground() {
    var blocksize = 1;
    this.bgctx.fillStyle = "white";
    this.bgctx.fillRect(0, 0, this.width, this.height);
    this.bgctx.fillStyle = 'black';
    for (var x=0; x<this.width; x+=blocksize) {
      var points = this.course(x);
      this.bgctx.fillRect(x, 0, blocksize, points[0]);
      this.bgctx.fillRect(x, points[1], blocksize, this.height-points[1]);
    }
  },
  smoke: [],
  startGame: function H_startGame() {
    this.init();
    if (this.settings.sound)
      this.audio.play();
    this.runId = setInterval_.call(this, this.main, 1000/60);
  },
  stopGame: function H_stopGame() {
    clearInterval(this.runId);
    this.audio.pause();
    this.rev.pause();
    this.runId = 0;
    if (this.highscore < this.offset/10) {
      this.highscore = this.offset/10;
      localStorage.setItem("highscore", this.offset/10);
    }
  },
  drawCourse: function H_drawCourse() {
    var blocksize = 1;
    this.ctx.translate(-this.step, 0);
    this.ctx.drawImage(this.bgcanvas, 0, 0, this.width, this.height);
    this.ctx.translate(this.step, 0);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(this.width-this.step, 0, this.step, this.height);
    this.ctx.fillStyle = 'black ';
    for (var x=this.width-this.step; x<this.width; x+=blocksize) {
      var points = this.course(x);
      this.ctx.fillRect(x, 0, blocksize, points[0]);
      this.ctx.fillRect(x, points[1], blocksize, this.height-points[1]);
    }
    this.bgctx.save();
    this.bgctx.drawImage(this.canvas, 0, 0, this.width, this.height);
    this.bgctx.restore();
  },
  drawScore: function H_drawScore() {
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "left";
    this.ctx.fillText("Distance: "+this.offset/10, 10, 20);
    this.ctx.textAlign = "right";
    this.ctx.fillText("Highscore: "+this.highscore, this.width-10, 20);

  },
  drawFps: function H_drawFps() {
    if (this.settings.fps)
      this.ctx.fillText("FPS: "+this.fps, this.width-10, 50);
  },
  main: function H_main() {
    if (this.settings.fps) {
      var now = Date.now();
      this.fps = Math.floor(1000/(now-this.lastDraw));
      this.lastDraw = now;
    }
    this.ctx.save();
    // clear the viewport
    this.drawCourse();

    // draw the player
    this.ctx.drawImage(this.helicopter[this.mouseDownCnt],
                       this.playerX,
                       this.playerY, 52, 25);

    // draw score
    this.drawScore();

    this.drawFps();

    // only update posCache periodically
    if (this.offset%Math.floor(this.step*2) == 0) {
      this.posCache.pop();
      this.posCache.unshift(this.playerY);
    }

    this.drawSmoke();

    this.ctx.restore();
    this.offset += this.step;

    this.playerAcc += 0.2;
    this.mouseDownCnt = Math.max(0, this.mouseDownCnt-1);
    if (this.mouseDown) {
      this.playerAcc -= 0.4;
      this.mouseDownCnt = Math.min(18, this.mouseDownCnt+2);
    }

    this.playerY += this.playerAcc;

    colPoints = this.course(this.playerX+25);
    if (this.playerY < colPoints[0]-5 || this.playerY > colPoints[1]-20) {
      // COLISSION!
      this.stopGame();
      //this.dieSplash(ctx, offset/10);
    }
  },
  drawSmoke: function H_drawSmoke() {
    var rand = Math.floor(Math.random()*10);
    var posLength = this.posCache.length;
    for (var i=0; i<posLength; i++) {
      if (typeof this.posCache[i] == 'number') {
        this.ctx.drawImage(this.smoke[i], this.playerX-(i*this.step*2)-rand, this.posCache[i]+5, this.smoke[i].width, this.smoke[i].height);
      }
    }
  },
  resize: function H_resize(h, w) {
    if (!h) h = this.canvas.height;
    if (!w) w = this.canvas.width;
    this.height = this.canvas.height = this.bgcanvas.height = h;
    this.width = this.canvas.width = this.bgcanvas.width = w;
    this.ctx = this.canvas.getContext("2d");
    this.bgctx = this.bgcanvas.getContext("2d");
  }
}
window.addEventListener("load", function D_onload() {
  new Helicopter(document.getElementById("game"), {sound: false, fps: false, width: 480, height: 320 });
}, false);
