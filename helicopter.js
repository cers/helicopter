function Helicopter(e, settings) {
  if (!settings)
    settings = {};
  this.canvas = e;
  this.bgcanvas = document.createElement("canvas");
  this.scorecanvas = document.createElement("canvas");
  this.resize(settings.height, settings.width);
  //this.settings.sound = !!settings.sound;
  this.settings.fps = !!settings.fps;
  this.settings.keyboard = !!settings.keyboard;
  this.ctx.font = this.scorectx.font = "18px sans-serif";

  for (var i=12, idx=0; i<31; i++) {
    var img = new Image();
    img.src = "data/small-"+i+".png";
    img.height = 25;
    img.width = 52;
    this.helicopter[idx++] = img;
  }

  this.smoke = new Image();
  this.smoke.src = "data/small-smoke-01.png";
  this.smoke.height = this.smoke.width = 15;

  for (var i=0; i<17; i++) {
    var img = new Image();
    img.src = "data/fireball-"+i+".png";
    img.height = 100;
    img.width = 71;
    this.fireball[i] = img;
  }

  for (var i=0; i<6; i++) {
    var img = new Image();
    img.src = "data/crash-0"+i+".png";
    img.height = 25;
    img.width = 52;
    this.crash[i] = img;
  }

  /* Disable audio until web audio api becomes stable
  this.audio = new Audio();
  try {
    this.audio.mozSetup(1, this.audioSampleRate);
  } catch (e) {
    this.settings.sound = false;
  }

  this.audioData = new Float32Array(this.audioPreBufferSize*2);
  for (var o=0; o<this.audioPreBufferSize*2; o++) {
    var a =  Math.max(0, Math.sin(Math.PI*o/800));
    this.audioData[o] = a*Math.sin(10*Math.sin(7*o/this.audioPreBufferSize)+o/40);
  }
  */

  this.highscore = localStorage.getItem("highscore") || 0;

  this.init();

  this.drawPlayer();
  this.drawScore();
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
  mapData: [],
  highscore: 0,
  scorecanvas: null,
  scorectx: null,
  posCache: Array(8),
  smoke: null,
  crash: [],
  roofCollision: false,
  roofCollisionPosition: 0,
  fireball: [],
  fireballCnt: 0,
  /*
  audioWritePosition: 0,
  audioTailPosition: 0,
  audioTail: null,
  audioSampleRate: 24000,
  audioPreBufferSize: 24000,
  audioData: null,
  handleAudio: function H_handleAudio() {
    var written;
    // Check if some data was not written in previous attempts.
    if(this.audioTailPosition != 0) {
      written = this.audio.mozWriteAudio(this.audioData.subarray(this.audioTailPosition));
      this.audioWritePosition += written;
      this.audioTailPosition += written;
    }
    // Check if we need add some data to the audio output.
    var currentPosition = this.audio.mozCurrentSampleOffset();
    var available = currentPosition + this.audioPreBufferSize - this.audioWritePosition;
    if(available > 0) {
      // Writting the data.
      written = this.audio.mozWriteAudio(this.audioData);
      if(written < this.audioData.length) {
        // Not all the data was written, saving the tail.
        this.audioTailPosition = written;
      }
      this.audioWritePosition += written;
    }
  },
  */
  mouseDownHandler: function H_mouseDownHandler() {
    if (!this.runId)
      this.startGame();
    this.mouseDown = true;
  },
  mouseUpHandler: function H_mouseUpHandler() {
    this.mouseDown = false;
  },
  setupHandlers: function H_setupHandlers() {
    var target = this.canvas;
    if ("ontouchstart" in window) {
        var startEvent = "touchstart";
        var stopEvent  = "touchend";
    } else {
      if (this.settings.keyboard) {
        var startEvent = "keydown";
        var stopEvent  = "keyup";
        var target = window;
      } else {
        var startEvent = "mousedown";
        var stopEvent  = "mouseup";
      }
    }

    target.addEventListener(startEvent, this.mouseDownHandler.bind(this), false);
    target.addEventListener(stopEvent, this.mouseUpHandler.bind(this), false);
  },
  init: function H_init() {
    this.playerX = this.width/5;
    this.playerY = this.height/2;
    this.playerAcc = 0;
    this.offset = 0;
    this.step = 8;
    this.mouseDown = false;
    this.mouseDownCnt = 0;
    this.fireballCnt = 0;
    this.initBackground();
    this.ctx.drawImage(this.bgcanvas, 0, 0, this.width, this.height);
    this.drawPlayer();
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Click to start", this.width/2, this.height-20);
    this.posCache = Array(8);
    this.audioWritePosition = 0;
    this.audioTailPosition = 0;
    this.audioTail = null;
    this.roofCollision = false;
    this.roofCollisionPosition = 0;
    this.setupHandlers();
  },
  difficulty: function H_difficulty() {
    return Math.max(100, 4*this.height/5-this.offset/200-65);
  },
  initBackground: function H_initBackground() {
    this.mapData = [];
    var blocksize = 1;
    this.bgctx.fillStyle = "white";
    this.bgctx.fillRect(0, 0, this.width, this.height);
    this.bgctx.fillStyle = "black";
    for (var x = 0; x < this.width; x += blocksize) {
      this.mapData[x] = [this.height/5, 4*this.height/5];
      this.bgctx.fillRect(x, 0, blocksize, this.height/5);
      this.bgctx.fillRect(x, 4*this.height/5, blocksize, this.height/5);
    }
  },
  startGame: function H_startGame() {
    this.init();
    this.main();
  },
  stopGame: function H_stopGame() {
    this.runId = 0;
    var score = this.roofCollision ?
                this.roofCollisionPosition/10 :
                this.offset/10;

    if (this.highscore < score) {
      this.highscore = score;
      localStorage.setItem("highscore", score);
    }
    this.drawScore(true);
  },
  genNextMapFragment: function H_genMapFragment() {
    var fragmentSize = (2<<6)+1;
    var last = this.mapData.length-1;
    var tmp = Array(fragmentSize);
    tmp[0] = this.mapData[last];
    var difficulty = this.difficulty();
    var random = Math.floor(20+(this.height-this.difficulty()-40)*Math.random());
    tmp[fragmentSize-1] = [random, random+difficulty];
    for (var i = (fragmentSize-1)/2; i >= 1; i = i/2) {
      for (var o = i; o < fragmentSize-1; o += 2*i) {
        var val = Math.floor((tmp[o-i][0]+tmp[o+i][0])/2+(Math.random()*i-i/2));
        tmp[o] = [val, val+difficulty]
      }
    }
    this.mapData = this.mapData.concat(tmp.splice(0));
  },
  drawCourse: function H_drawCourse() {
    var blocksize = 1;
    this.ctx.drawImage(this.bgcanvas, -this.step, 0, this.width, this.height);
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.width-this.step, 20, this.step, this.height-20);
    this.ctx.fillStyle = "white";

    this.mapData.splice(0, this.step);
    if (this.mapData.length < this.width+1)
      this.genNextMapFragment();
    this.ctx.beginPath();
    for (var x = this.width-this.step-1; x <= this.width; x += blocksize) {
      this.ctx.lineTo(x, this.mapData[x][0]);
    }
    for (var x = this.width; x >= this.width-this.step-1; x -= blocksize) {
      this.ctx.lineTo(x, this.mapData[x][1]);
    }
    this.ctx.fill();
    this.bgctx.drawImage(this.canvas, 0, 0, this.width, this.height);
  },
  drawPlayer: function H_drawPlayer() {
    if (this.roofCollision) {
      var pos = [0,1,2,3,4,5,4,3,2,1][
        Math.floor((this.offset-this.roofCollisionPosition)/(this.step*2))%10
      ];
      var player = this.crash[pos];
    }
    else
      var player = this.helicopter[this.mouseDownCnt];
    this.ctx.drawImage(player,
                       this.playerX,
                       this.playerY, 52, 25);
  },
  drawScore: function H_drawScore(force) {
    if (force || this.offset%(this.step*10) == 0) {
      var score = this.roofCollisionPosition ?
                  this.roofCollisionPosition/10 :
                  this.offset/10;
      this.scorectx.fillStyle = "black";
      this.scorectx.fillRect(0, 0, this.width, this.scorecanvas.height);
      this.scorectx.fillStyle = "white";
      this.scorectx.textAlign = "left";
      this.scorectx.fillText("Distance: " + score, 10, 20);
      this.scorectx.textAlign = "right";
      this.scorectx.fillText("Highscore: " + this.highscore, this.width-10, 20);
    }
    this.ctx.drawImage(this.scorecanvas, 0, 0, this.width, this.scorecanvas.height);


  },
  drawFps: function H_drawFps() {
    this.ctx.textAlign = "right";
    this.ctx.fillText("FPS: " + this.fps, this.width-10, 50);
  },
  drawExplosion: function H_drawExplosion() {
    this.ctx.drawImage(this.bgcanvas, 0, 0, this.width, this.height);
    this.drawPlayer();
    this.drawScore(true);
    if (this.fireballCnt < this.fireball.length*2) {
      // make smoke rise
      for (var i=0; i<this.posCache.length; i++) {
        this.posCache[i] -= 4;
      }
      this.drawSmoke(true);
      var img = this.fireball[Math.floor(this.fireballCnt++/2)];
      this.ctx.drawImage(img, this.playerX, this.playerY-50, img.width, img.height);
      this.runId = window.requestAnimationFrame(this.drawExplosion.bind(this));
    } else {
      this.runId = null;
    }
  },
  clearSmoke: function H_clearSmoke() {
    this.bgctx.fillStyle = "white";
    var offset = (this.offset-this.step)%(this.step*4);
    for (var i=0; i<this.posCache.length; i++) {
      this.bgctx.fillRect(this.playerX-this.step*4*i-offset, this.posCache[i], this.smoke.width, this.smoke.height);
    }
    this.ctx.drawImage(this.bgcanvas, 0, 0, this.width, this.height);
    this.drawPlayer();
    this.drawScore(true);
  },
  main: function H_main() {
    if (this.settings.fps) {
      var now = Date.now();
      this.fps = Math.floor(1000/(now-this.lastDraw));
      this.lastDraw = now;
    }

    this.drawCourse();

    // draw the player
    this.drawPlayer();

    // draw score
    this.drawScore();
   
   if (this.settings.fps)
      this.drawFps();

    // only update posCache periodically
    if (this.offset%(this.step*4) == 0) {
      this.drawSmoke();
      this.posCache.pop();
      this.posCache.unshift(this.playerY);
    }

    this.offset += this.step;

    this.playerAcc += 0.2;
    this.mouseDownCnt = Math.max(0, this.mouseDownCnt-1);
    if (this.mouseDown && !this.roofCollision) {
      this.playerAcc -= 0.4;
      this.mouseDownCnt = Math.min(18, this.mouseDownCnt+2);
    }

    this.playerY += this.playerAcc;

    var colPoints = this.mapData[this.playerX+25];

    if (this.playerY < colPoints[0]-5) {
      if (!this.roofCollision) {
        this.roofCollision = true;
        this.roofCollisionPosition = this.offset;
      }
      this.playerAcc = Math.max(0, this.playerAcc);
      this.playerY = colPoints[0];
    }
    if (this.playerY > colPoints[1]-20) {
      this.roofCollision = false;
      // COLLISION!
      this.clearSmoke();
      this.stopGame();
      this.runId = window.requestAnimationFrame(this.drawExplosion.bind(this));
      //this.dieSplash(ctx, offset/10);
    } else {
      //if (this.settings.sound)
      //  this.handleAudio();
      this.runId = window.requestAnimationFrame(this.main.bind(this));
    }
  },
  drawSmoke: function H_drawSmoke(redraw) {
    if (redraw) {
      var rand = Math.random()*10;
      var posLength = this.posCache.length;
      for (var i = 0; i < posLength; i++) {
        if (typeof this.posCache[i] == "number") {
          this.ctx.drawImage(this.smoke, this.playerX-(i*this.step*4)-rand, this.posCache[i]+5, this.smoke.width, this.smoke.height);
        }
      }
    } else {
      this.bgctx.drawImage(this.smoke, this.playerX, this.playerY, this.smoke.width, this.smoke.height);
    }
  },
  resize: function H_resize(h, w) {
    if (!h) h = this.canvas.height;
    if (!w) w = this.canvas.width;
    this.height = this.canvas.height = this.bgcanvas.height = h;
    this.width = this.canvas.width = this.bgcanvas.width = this.scorecanvas.width = w;
    this.scorecanvas.height = 25;
    this.ctx = this.canvas.getContext("2d");
    this.bgctx = this.bgcanvas.getContext("2d");
    this.scorectx = this.scorecanvas.getContext("2d");
  },
  updateSetting: function H_updateSetting(name, value) {
    switch (name) {
      /*case "audio":
        this.settings.sound = value;
        break;*/
      case "keyboard":
        if (value) {
          if ("ontouchstart" in window) {
            this.canvas.removeEventListener("touchstart", this.mouseDownHandler, false);
            this.canvas.removeEventListener("touchend", this.mouseUpHandler, false);
          } else {
            this.canvas.removeEventListener("mousedown", this.mouseDownHandler, false);
            this.canvas.removeEventListener("mouseup", this.mouseUpHandler, false);
          }
        }
        window.removeEventListener("keydown", this.mouseDownHandler, false);
        window.removeEventListener("keyup", this.mouseUpHandler, false);

        this.settings.keyboard = value;
        this.setupHandlers();
        break;
      case "fps":
        this.settings.fps = value;
        break;
    }
  }
}
