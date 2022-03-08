//ref: https://stackoverflow.com/questions/55197347/webgl-full-screen-quad-or-triangle-for-invoking-fragment-shader-for-every-pixel

var mouseX = 0;
var mouseY = 0;

var fdraw;

var animating = true;

var fpslabel;

// var gl;

var oldTime;

var lastCount = 0;
var frames = 0;

var gl;
var texture;

var spin = true;
var animate = false;
var contiguous = true;


var TEX_SIZE = 128;

function main() {

    fpslabel = document.getElementById("fpslabel");

    const canvas = document.querySelector("#glCanvas");
    canvas.width = Math.min(window.innerWidth, window.innerHeight);
    canvas.height = Math.min(window.innerWidth, window.innerHeight);
    // Initialize the GL context
    gl = canvas.getContext("webgl2");
  
    // Only continue if WebGL is available and working
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }

    var h = gl.drawingBufferHeight;
    var w = gl.drawingBufferWidth;

    function shader(name, type) {
      let src = [].slice.call(document.scripts).find(s => s.type === name).innerHTML;
      let sid = gl.createShader(type);
      gl.shaderSource(sid, src);
      gl.compileShader(sid);
      gl.attachShader(pid, sid);
    }
    
    let pid = gl.createProgram();
    shader('glsl/vertex', gl.VERTEX_SHADER);
    shader('glsl/fragment', gl.FRAGMENT_SHADER);
    gl.linkProgram(pid);
    gl.useProgram(pid);
  
    let array = new Float32Array([-1,  3, -1, -1, 3, -1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
  
    let al = gl.getAttribLocation(pid, "coords");
    gl.vertexAttribPointer(al, 2 /*components per vertex */, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(al);
    
    let mouse = gl.getUniformLocation(pid, 'mouse');
    let u_resolution = gl.getUniformLocation(pid, 'u_resolution');
    let u_time = gl.getUniformLocation(pid, 'u_time');
    let u_density = gl.getUniformLocation(pid, 'u_density');
    let u_shadowfactor = gl.getUniformLocation(pid, 'u_shadowfactor');
    let u_volume = gl.getUniformLocation(pid, 'uVolume');
    let u_light = gl.getUniformLocation(pid, 'u_light');
    let u_ambient = gl.getUniformLocation(pid, 'u_ambient');
    let u_occlusion = gl.getUniformLocation(pid, 'u_occlusion');
    let u_quality = gl.getUniformLocation(pid, 'u_quality');
    let u_jitter = gl.getUniformLocation(pid, 'u_jitter');
    let u_contiguous = gl.getUniformLocation(pid, 'u_contiguous');
    
    
    var perl = new Perlin(Math.random() * 10);

    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(TEX_SIZE));
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    regenerateCloud();
    
      gl.uniform1i(u_volume, 0);

      gl.uniform2f(u_resolution, w, h);

    function draw(t) {
      frames += 1;
      if(t - lastCount > 1000) {
        fpslabel.innerHTML = "fps: " + frames;
        frames = 0;
        lastCount = t;
      }

      // fpslabel.innerHTML = "fps: " + Math.floor(1 / ((t - oldTime)/1000));
    //   let ev = e && e.touches ? e.touches[0] : e;
    //   let x = ev ? ev.clientX : 250;
    //   let y = ev ? h - ev.clientY: 111;
      gl.uniform2f(mouse, 0.5 - mouseX / w, 0.5 - mouseY / h);
      if(spin) {
        gl.uniform1f(u_time, t/1000);
      }
      gl.uniform1f(u_density, document.getElementById("densityslider").value);
      gl.uniform1f(u_shadowfactor, 8);
      gl.uniform1f(u_light, document.getElementById("lightslider").value/ 100.0) ;
      gl.uniform1f(u_ambient, document.getElementById("ambientslider").value/ 100.0) ;
      gl.uniform1f(u_occlusion, document.getElementById("occlusionslider").value) ;
      gl.uniform1i(u_quality, document.getElementById("qualityslider").value) ;
      gl.uniform1f(u_jitter, document.getElementById("jitterslider").value / 100.0) ;
      gl.uniform1i(u_contiguous, contiguous ? 1 : 0) ;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if(animating) {
        requestAnimationFrame(draw);
      }
    oldTime = t;

    }
    fdraw = draw;

    requestAnimationFrame(fdraw);

    // window.onfocus = function() {requestAnimationFrame(draw)}

  }
  
  window.onload = main;

  window.onmousemove = function(e){
    
    mouseX = e.clientX;
    mouseY = e.clientY;
    // if(e.buttons != 0) {
    //   requestAnimationFrame(fdraw);
    // }

  }
  window.onkeyup = function(e){
    if(e.keyCode == 32){
      regenerateCloud();
      // if(animating) {
      //   animating = false;
      // } else {
      //   requestAnimationFrame(fdraw);
      //   animating = true;
      // }
    }
  }
  var firstTIme = true;
  function regenerateCloud() {
    var perl;
    if(firstTIme) {
      perl = new Perlin(12);
      firstTIme = false;
    } else {
      perl = new Perlin(Math.random()*100);
    }

    var data = new Uint8Array(TEX_SIZE * TEX_SIZE * TEX_SIZE);

    var div = 5;
    var div2 = 15;
    var div3 = 50;

    for (var k = 0; k < TEX_SIZE; ++k) {
        for (var j = 0; j < TEX_SIZE; ++j) {
            for (var i = 0; i < TEX_SIZE; ++i) {  
              data[i + j * TEX_SIZE + k * TEX_SIZE * TEX_SIZE] = perl.noise((k*div)/TEX_SIZE, (j*div)/TEX_SIZE, (i*div)/TEX_SIZE) * 158 + perl.noise((k*div2)/TEX_SIZE, (j*div2)/TEX_SIZE, (i*div2)/TEX_SIZE) *64 + perl.noise((k*div3)/TEX_SIZE, (j*div3)/TEX_SIZE, (i*div3)/TEX_SIZE) *22;
            }
        }
        
    }

    gl.texImage3D(
        gl.TEXTURE_3D,  // target
        0,              // level
        gl.R8,        // internalformat
        TEX_SIZE,           // width
        TEX_SIZE,           // height
        TEX_SIZE,           // depth
        0,              // border
        gl.RED,         // format
        gl.UNSIGNED_BYTE,       // type
        data            // pixel
      );

      gl.generateMipmap(gl.TEXTURE_3D);

  }

  function toggleSpin() {
    if(spin) {
      document.getElementById("spinbutton").innerHTML = "spin: off";
      spin = false;
    } else {
      document.getElementById("spinbutton").innerHTML = "spin: on";
      spin = true;
    }
  }
  function toggleAnimate() {
    if(animate) {
      document.getElementById("animatebutton").innerHTML = "animate: off";
      animate = false;
    } else {
      document.getElementById("animatebutton").innerHTML = "animate: on";
      animate = true;
    }
  }

  function toggleContiguous() {
    if(contiguous) {
      document.getElementById("contiguousbutton").innerHTML = "assume contiguous: off";
      contiguous = false;
    } else {
      document.getElementById("contiguousbutton").innerHTML = "assume contiguous: on";
      contiguous = true;
    }
  }