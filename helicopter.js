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
  this.resize(settings.height, settings.width);
  this.settings.sound = !!settings.sound;
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

  var self = this;
  e.addEventListener("mousedown", function H_mouseDown() {
    if (!self.runId)
      self.startGame();
    self.mouseDown = true;
    if (self.settings.sound && self.rev.paused && self.runId)
      self.rev.play();
  }, false);
  e.addEventListener("mouseup", function H_mouseUp() {
    self.mouseDown = false;
    self.rev.pause();
  }, false);

  this.drawCourse();
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
  settings: {
    sound: false
  },
  audio: null,
  rev: null,
  highscore: 0,
  posCache: Array(5),
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
  },
  smoke: [],
  startGame: function H_startGame() {
    this.init();
    if (this.settings.sound)
      this.audio.play();
    this.runId = setInterval_.call(this, this.draw, 1000/60);
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
    //this.drawScore();
  },
  drawCourse: function H_drawCourse() {
    var blocksize = 1;
    this.ctx.fillStyle = 'black';
    for (var x=0; x<this.width; x+=blocksize) {
      var points = this.course(x);
      this.ctx.fillRect(this.offset+x, 0, blocksize, points[0]);
      this.ctx.fillRect(this.offset+x, points[1], blocksize, this.height-points[1]);
    }
  },
  drawScore: function H_drawScore() {
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "left";
    this.ctx.fillText("Distance: "+this.offset/10, 10+this.offset, 20);
    this.ctx.textAlign = "right";
    this.ctx.fillText("Highscore: "+this.highscore, this.offset+this.width-10, 20);
  },
  draw: function H_draw() {
    this.ctx.save();
    this.ctx.translate(-this.offset, 0);
    // clear the viewport
    this.ctx.clearRect(this.offset, 0, this.width, this.height);
    this.drawCourse();

    // draw the player
    this.ctx.drawImage(this.helicopter[this.mouseDownCnt],
                       this.playerX+this.offset,
                       this.playerY, 52,25);

    // draw score
    this.drawScore();

    // only update posCache periodically
    if (this.offset%Math.floor(this.step*2) == 0) {
      this.posCache.pop();
      this.posCache.unshift([this.playerX+this.offset, this.playerY]);
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

    colPoints = this.course(this.playerX);
    if (this.playerY < colPoints[0]-5 || this.playerY > colPoints[1]-15) {
      // COLISSION!
      this.stopGame();
      //this.dieSplash(ctx, offset/10);
    }
  },
  drawSmoke: function H_drawSmoke() {
    var posLength = this.posCache.length;
    for (var i=0; i<posLength; i++) {
      if (typeof this.posCache[i] == 'object') {
        this.ctx.drawImage(this.smoke[i], this.posCache[i][0], this.posCache[i][1]+5, this.smoke[i].width, this.smoke[i].height);
      }
    }
  },
  resize: function H_resize(h, w) {
    if (!h) h = this.canvas.height;
    if (!w) w = this.canvas.width;
    this.height = this.canvas.height = h;
    this.width = this.canvas.width = w;
    this.ctx = this.canvas.getContext("2d");
  }
}
window.addEventListener("load", function D_onload() {
  new Helicopter(document.getElementById("game"), {sound: false});
}, false);
