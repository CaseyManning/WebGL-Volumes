//ref: https://stackoverflow.com/questions/55197347/webgl-full-screen-quad-or-triangle-for-invoking-fragment-shader-for-every-pixel

var mouseX = 0;
var mouseY = 0;

function main() {
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
    
    requestAnimationFrame(draw);
  
    function draw(t) {
    //   let ev = e && e.touches ? e.touches[0] : e;
    //   let x = ev ? ev.clientX : 250;
    //   let y = ev ? h - ev.clientY: 111;
      console.log(mouseX / w, mouseY / h);
      gl.uniform2f(mouse, 0.5 - mouseX / w, 0.5 - mouseY / h);
      gl.uniform2f(u_resolution, w, h);
      gl.uniform1f(u_time, t/1000);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(draw);
    }
  
    function shader(name, type) {
        let src = [].slice.call(document.scripts).find(s => s.type === name).innerHTML;
        let sid = gl.createShader(type);
        gl.shaderSource(sid, src);
        gl.compileShader(sid);
        gl.attachShader(pid, sid);
    }
  }
  
  window.onload = main;

  window.onmousemove = function(e){
    mouseX = e.clientX;
    mouseY = e.clientY;
  }