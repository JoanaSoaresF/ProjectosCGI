var gl;
var gridProgram;
var program;
var gridBufferId;
var bufferId;
var grid = [];
var vertices = [];
var funcLoc;
var vTimeSample;
var colorLoc;
var vPosition;

const NUM_COLS = 8;
const NUM_LINES = 12;

function grid_vertices(){
    for (let i = 0; i < NUM_COLS - 1; i++) {
        grid.push(vec2(i * 2 / (NUM_COLS - 1) - 1, -1));
        grid.push(vec2(i * 2 / (NUM_COLS - 1) - 1, 1));
    }
    for (let i = 0; i < NUM_LINES - 1; i++) {
        grid.push(vec2(-1, i * 2 / (NUM_LINES - 1) - 1));
        grid.push(vec2(1, i * 2 / (NUM_LINES - 1) - 1));
    }
}

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

    grid_vertices();
    formVertex();

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Load shaders and initialize attribute buffers
    gridProgram = initShaders(gl, "gridVertex-shader", "gridFragment-shader");
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    //gl.useProgram(program);

    // Load the data into the GPU
    gridBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(grid), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(gridProgram, "vPosition");

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    vTimeSample = gl.getAttribLocation(program, "vTimeSample");
    funcLoc = gl.getUniformLocation(program, "func");

    render();
}

function render() {

    //gl.useProgram(program);
    computeFunction();
    gl.clear(gl.COLOR_BUFFER_BIT);


    gl.useProgram(gridProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    for(let i = 0; i < NUM_COLS-1; i++){
        gl.drawArrays(gl.LINES, 2*i, 2);
    } 
    for (let i = 0; i < NUM_LINES - 1; i++) {
        gl.drawArrays(gl.LINES, 2 * (NUM_COLS + i), 2);
    }


    gl.useProgram(program);

    gl.vertexAttribPointer(vTimeSample, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTimeSample);


    gl.drawArrays(gl.LINE_STRIP, 0, 9999);
    requestAnimFrame(render);
}