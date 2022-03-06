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

function main() {

    fpslabel = document.getElementById("fpslabel");

    const canvas = document.querySelector("#glCanvas");
    canvas.width = window.innerWidth; //document.width is obsolete
    canvas.height = window.innerHeight; //document.height is obsolete
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");
  
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
    let u_volume = gl.getUniformLocation(pid, 'uVolume');
    
    var SIZE = 32;
    
    var perl = new Perlin(12);

    var data = new Uint8Array(SIZE * SIZE * SIZE);
    for (var k = 0; k < SIZE; ++k) {
        for (var j = 0; j < SIZE; ++j) {
            for (var i = 0; i < SIZE; ++i) {
                data[i + j * SIZE + k * SIZE * SIZE] = perl.noise(i/10, j/10, k/10) * 256;
            }
        }
    }

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(SIZE));
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage3D(
        gl.TEXTURE_3D,  // target
        0,              // level
        gl.R8,        // internalformat
        SIZE,           // width
        SIZE,           // height
        SIZE,           // depth
        0,              // border
        gl.RED,         // format
        gl.UNSIGNED_BYTE,       // type
        data            // pixel
      );

      gl.generateMipmap(gl.TEXTURE_3D);

    
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
      gl.uniform1f(u_time, t/1000);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if(animating && document.hasFocus()) {
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
  // window.onkeyup = function(e){
  //   if(e.keyCode == 32){
  //     if(animating) {
  //       animating = false;
  //     } else {
  //       requestAnimationFrame(fdraw);
  //       animating = true;
  //     }
  //   }
// }