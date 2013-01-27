function Helicopter(e, settings) {
  if (!settings)
    settings = {};
  this.canvas = e;
  this.bgcanvas = document.createElement("canvas");
  this.scorecanvas = document.createElement("canvas");
  this.resize(settings.height, settings.width);
  this.settings.sound = !!settings.sound;
  this.settings.fps = !!settings.fps;
  this.ctx.font = this.scorectx.font = "18px sans-serif";

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

  for (var i=0; i<17; i++) {
    var img = new Image();
    img.src = "data/fireball-"+i+".png";
    img.height = 100;
    img.width = 71;
    this.fireball[i] = img;
  }


  this.highscore = localStorage.getItem("highscore") || 0;

  var target = e;
  if ("ontouchstart" in window) {
      var startEvent = "touchstart";
      var stopEvent  = "touchend";
  } else {
    if (settings.keyboard) {
      var startEvent = "keydown";
      var stopEvent  = "keyup";
      var target = window;
    } else {
      var startEvent = "mousedown";
      var stopEvent  = "mouseup";
    }
  }

  var self = this;
  target.addEventListener(startEvent, function H_mouseDown() {
    if (!self.runId)
      self.startGame();
    self.mouseDown = true;
  }, false);
  target.addEventListener(stopEvent, function H_mouseUp() {
    self.mouseDown = false;
  }, false);

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
  smoke: [],
  fireball: [],
  fireballCnt: 0,
  audio: null,
  audioWritePosition: 0,
  audioTailPosition: 0,
  audioTail: null,
  audioSampleRate: 24000,
  audioPreBufferSize: 2165,
  audioData: [-0.09094767272472382,  -0.2526524104177952,  -0.43981466442346573, -0.5683957412838936,  -0.6685325503349304,  -0.7610641233623028,
              -0.8337558433413506,   -0.9083685278892517,  -0.9457360580563545,  -0.9965807944536209,  -1.023292914032936,   -0.9815550595521927,
              -1.03635773062706,     -1.070520356297493,   -1.0548019409179688,  -1.0660066455602646,  -1.0139277577400208,  -1.0234511643648148,
              -1.0528356581926346,   -1.1173677071928978,  -1.2371886894106865,  -1.304195076227188,   -1.4315441250801086,  -1.5686699375510216,
              -1.7009016126394272,   -1.8144557252526283,  -1.8877371400594711,  -2.0182478427886963,  -2.1724480390548706,  -2.313513904809952,
              -2.407410442829132,    -2.469414174556732,   -2.5162379443645477,  -2.5239667296409607,  -2.5158382952213287,  -2.4929867684841156,
              -2.424892634153366,    -2.3242785036563873,  -2.1730680763721466,  -1.925196647644043,   -1.6867701709270477,  -1.5479131042957306,
              -1.397036835551262,    -1.2590369582176208,  -1.1687033995985985,  -0.9599556773900986,  -0.7865398563444614,  -0.7191794738173485,
              -0.5652515217661858,   -0.40363356471061707, -0.2950473502278328,  -0.15537556260824203, -0.04554618266411126,  0.005254739080555737,
               0.09829435497522354,   0.13388743624091148,  0.1481253281235695,   0.198993980884552,    0.165505763143301,    0.1737920567393303,
               0.23418329190462828,   0.20897026173770428,  0.26167692616581917,  0.45426436699926853,  0.5520237050950527,   0.6647061556577682,
               0.8007090166211128,    0.8031865954399109,   0.8712762035429478,   0.916176326572895,    0.8830716647207737,   0.938393622636795,
               0.9455873072147369,    0.9044785425066948,   0.9467797726392746,   0.9554203972220421,   0.9054944291710854,   0.9261629730463028,
               0.920693501830101,     0.8621784299612045,   0.8885195106267929,   0.8676645532250404,   0.8237006887793541,   0.8529844880104065,
               0.8028267323970795,    0.7733338885009289,   0.786685086786747,    0.7433289662003517,   0.7523776218295097,   0.7665916532278061,
               0.7151978462934494,    0.7276155799627304,   0.737028568983078,    0.6831571832299232,   0.7123416289687157,   0.7181349769234657,
               0.6593722477555275,    0.7010294124484062,   0.7306433469057083,   0.6620519980788231,   0.6828459352254868,   0.6920991092920303,
               0.652933157980442,     0.6998000666499138,   0.6612315773963928,   0.6313015334308147,   0.6524486280977726,   0.5917346477508545,
               0.6127200834453106,    0.6734062358736992,   0.6164751201868057,   0.611715205013752,    0.6467445194721222,   0.5786931328475475,
               0.585954375565052,     0.6068623065948486,   0.557165052741766,    0.5865903943777084,   0.5936172790825367,   0.5323352292180061,
               0.5593478679656982,    0.570390522480011,    0.5139668472111225,   0.5469214729964733,   0.528421550989151,    0.48812907189130783,
               0.5256107077002525,    0.4865284636616707,   0.46506134793162346,  0.49725528806447983,  0.4604901373386383,   0.4553905874490738,
               0.4918215796351433,    0.4472533240914345,   0.451140683144331,    0.4121099039912224,   0.19445814192295074,  0.0701064895838499,
              -0.038083100225776434, -0.18951355945318937, -0.21401728503406048, -0.27909770607948303, -0.34035226330161095, -0.30652941204607487,
              -0.3428588155657053,   -0.35870625637471676, -0.3065003827214241,  -0.353024136275053,   -0.35746296867728233, -0.3164553176611662,
              -0.3850987181067467,   -0.3479635063558817,  -0.30901065096259117, -0.3495414834469557,  -0.29775258153676987, -0.2996205724775791,
              -0.3083164896816015,   -0.2521904557943344,  -0.27333028614521027, -0.28864307329058647, -0.2239586552605033,  -0.18037700559943914,
              -0.08798559196293354,   0.010952996090054512, 0.004114396870136261],
  handleAudio: function H_handleAudio() {
    var written;
    // Check if some data was not written in previous attempts.
    if(this.audioTail) {
      written = this.audio.mozWriteAudio(this.audioTail.subarray(this.audioTailPosition));
      this.audioWritePosition += written;
      this.audioTailPosition += written;
      if(this.audioTailPosition < this.audioTail.length) {
        // Not all the data was written, saving the tail...
        return; // ... and exit the function.
      }
      this.audioTail = null;
    }
    // Check if we need add some data to the audio output.
    var currentPosition = this.audio.mozCurrentSampleOffset();
    var available = currentPosition + this.audioPreBufferSize - this.audioWritePosition;
    if(available > 0) {
      // Request some sound data from the callback function.
      var soundData = new Float32Array(2165);
      for (var o=0; o<this.audioData.length; o++) {
        soundData[o] = this.audioData[o];
      }
      for (var o=165; o<soundData.length; o++) {
        soundData[o] = 0;
      }

      // Writting the data.
      written = this.audio.mozWriteAudio(soundData);
      if(written < soundData.length) {
        // Not all the data was written, saving the tail.
        this.audioTail = soundData;
        this.audioTailPosition = written;
      }
      this.audioWritePosition += written;
    }
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
    this.audio = new Audio();
    this.audio.mozSetup(1, this.audioSampleRate);
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

    if (this.highscore < this.offset/10) {
      this.highscore = this.offset/10;
      localStorage.setItem("highscore", this.offset/10);
    }
    this.drawScore(true);
  },
  genNextMapFragment: function H_genMapFragment() {
    var fragmentSize = (2<<6)+1;
    var last = this.mapData.length-1;
    var tmp = Array(fragmentSize);
    tmp[0] = this.mapData[last][0];
    tmp[fragmentSize-1] = Math.floor(20+(this.height-this.difficulty()-40)*Math.random());
    for (var i = (fragmentSize-1)/2; i >= 1; i = i/2) {
      for (var o = i; o < fragmentSize-1; o += 2*i) {
        tmp[o] = Math.floor((tmp[o-i]+tmp[o+i])/2+(Math.random()*i-i/2));
      }
    }
    this.mapData = this.mapData.concat(tmp.splice(0).map(function gNMF_map(x) {return [x, x+this.difficulty()]}, this));
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
    this.ctx.drawImage(this.helicopter[this.mouseDownCnt],
                       this.playerX,
                       this.playerY, 52, 25);
  },
  drawScore: function H_drawScore(force) {
    if (force || this.offset%(this.step*10) == 0) {
      this.scorectx.fillStyle = "black";
      this.scorectx.fillRect(0, 0, this.width, this.scorecanvas.height);
      this.scorectx.fillStyle = "white";
      this.scorectx.textAlign = "left";
      this.scorectx.fillText("Distance: " + this.offset/10, 10, 20);
      this.scorectx.textAlign = "right";
      this.scorectx.fillText("Highscore: " + this.highscore, this.width-10, 20);
    }
    this.ctx.drawImage(this.scorecanvas, 0, 0, this.width, this.scorecanvas.height);


  },
  drawFps: function H_drawFps() {
    if (this.settings.fps)
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
      this.drawSmoke();
      var img = this.fireball[Math.floor(this.fireballCnt++/2)];
      this.ctx.drawImage(img, this.playerX, this.playerY-50, img.width, img.height);
      this.runId = window.requestAnimationFrame(this.drawExplosion.bind(this));
    } else {
      this.runId = null;
    }
  },
  main: function H_main() {
    if (this.settings.fps) {
      var now = Date.now();
      this.fps = Math.floor(1000/(now-this.lastDraw));
      this.lastDraw = now;
    }

    if(this.settings.sound)
      this.handleAudio();
    this.drawCourse();

    // draw the player
    this.drawPlayer();

    // draw score
    this.drawScore();

    this.drawFps();

    // only update posCache periodically
    if (this.offset%Math.floor(this.step*2) == 0) {
      this.posCache.pop();
      this.posCache.unshift(this.playerY);
    }

    this.drawSmoke();

    this.offset += this.step;

    this.playerAcc += 0.2;
    this.mouseDownCnt = Math.max(0, this.mouseDownCnt-1);
    if (this.mouseDown) {
      this.playerAcc -= 0.4;
      this.mouseDownCnt = Math.min(18, this.mouseDownCnt+2);
    }

    this.playerY += this.playerAcc;

    colPoints = this.mapData[this.playerX+25];
    if (this.playerY < colPoints[0]-5 || this.playerY > colPoints[1]-20) {
      // COLISSION!
      this.stopGame();
      this.runId = window.requestAnimationFrame(this.drawExplosion.bind(this));
      //this.dieSplash(ctx, offset/10);
    } else {
      this.runId = window.requestAnimationFrame(this.main.bind(this));
    }
  },
  drawSmoke: function H_drawSmoke() {
    var rand = Math.random()*10;
    var posLength = this.posCache.length;
    for (var i = 0; i < posLength; i++) {
      if (typeof this.posCache[i] == "number") {
        this.ctx.drawImage(this.smoke[i], this.playerX-(i*this.step*2)-rand, this.posCache[i]+5, this.smoke[i].width, this.smoke[i].height);
      }
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
  }
}
