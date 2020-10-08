var gl;
var program;
var bufferId;
var vertices = [];
var funcLoc;
var vTimeSample;


function formVertex() {
    for (let i = 0.0; i < 9999.0; i = i + 1.0) {
        vertices.push(i);
    }
}
function computeFunction() {
    gl.uniform1i(funcLoc, document.getElementById("function").value);
}

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    formVertex();

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    vTimeSample = gl.getAttribLocation(program, "vTimeSample");
    funcLoc = gl.getUniformLocation(program, "func");

    render();
}

function render() {
    computeFunction();
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.vertexAttribPointer(vTimeSample, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTimeSample);


    gl.drawArrays(gl.LINE_STRIP, 0, 9999);
    requestAnimFrame(render);
}