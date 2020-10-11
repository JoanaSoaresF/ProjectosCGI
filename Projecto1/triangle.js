//Variables

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
var voltScaleLoc;
var timeScaleLoc;
var timeLoc;
var time = 0;

//Constants
const NUM_COLS = 8;
const NUM_LINES = 12;

function grid_vertices() {
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
    voltScaleLoc = gl.getUniformLocation(program, "voltScale");
    timeScaleLoc = gl.getUniformLocation(program, "timeScale");
    timeLoc = gl.getUniformLocation(program, "time");
    colorLoc = gl.getUniformLocation(program, "color");



    render();
}
function drawGrid() {
    gl.useProgram(gridProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    for (let i = 0; i < NUM_COLS - 1; i++) {
        gl.drawArrays(gl.LINES, 2 * i, 2);
    }
    for (let i = 0; i < NUM_LINES - 1; i++) {
        gl.drawArrays(gl.LINES, 2 * (NUM_COLS + i), 2);
    }

}
function drawFunction(func) {
    gl.useProgram(program);

    gl.uniform1i(funcLoc, func);
    computeColor(func);

    var voltScale = voltsScaleInput() * NUM_LINES;
    gl.uniform1f(voltScaleLoc, voltScale);

    var timeScale = timeScaleInput() * NUM_COLS;
    gl.uniform1f(timeScaleLoc, timeScale);
    gl.uniform1f(timeLoc, time);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer(vTimeSample, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTimeSample);

    computeColor(func);
    gl.drawArrays(gl.LINE_STRIP, 0, 9999);

}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    selectedFunctions();
    time += 1 / (60 * 1.5);

    drawGrid();

    requestAnimFrame(render);
}

function timeScaleInput() {
    var values = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];    //values to step to

    var input = document.getElementById('timeSlider'),
        output = document.getElementById('timeScale');

    input.oninput = function () {
        output.innerHTML = values[input.value];
    };
    input.oninput(); //set default value

    return values[input.value];


}

function voltsScaleInput() {
    var values = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];    //values to step to

    var input = document.getElementById('voltSlider'),
        output = document.getElementById('voltScale');

    input.oninput = function () {
        output.innerHTML = values[input.value];
    };
    input.oninput(); //set default value
    return values[input.value];
}

function selectedFunctions() {
    var fList = document.getElementById("function");
    var functions = fList.selectedOptions;

    for (var i = 0; i < functions.length; i++) {
        var f = functions[i].value;

        drawFunction(f);
    }
}

function computeColor(f) {
    colorLoc = gl.getUniformLocation(program, "color");
    switch (f) {
        case "1": gl.uniform4fv(colorLoc, [1.0, 0.0, 0.0, 1.0]); break;
        case "2": gl.uniform4fv(colorLoc, [0.0, 1.0, 0.0, 1.0]); break;
        case "3": gl.uniform4fv(colorLoc, [0.0, 0.0, 1.0, 1.0]); break;
        case "4": gl.uniform4fv(colorLoc, [0.0, 1.0, 1.0, 1.0]); break;
        case "5": gl.uniform4fv(colorLoc, [1.0, 0.0, 1.0, 1.0]); break;
        case "6": gl.uniform4fv(colorLoc, [1.0, 1.0, 0.0, 1.0]); break;
        case "7": gl.uniform4fv(colorLoc, [0.95, 0.55, 0.0, 1.0]); break;
        default: break;
    }

}


