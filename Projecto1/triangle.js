//Variables

var gl;
var gridProgram, program;
var gridBufferId, bufferId;
var grid = [], vertices = [], yFunctions = [], xFunction;
var yFuncLoc, xFuncLoc, colorLoc, voltScaleLoc, timeScaleLoc, timeLoc, nPointsLoc;
var vTimeSample, vPosition;
var time, frame;
var timeScale, voltScale, xOffset, yOffset;
var xOffsetLoc, yOffsetLoc;


//Constants
const NUM_COLS = 12;
const NUM_LINES = 8;
const NUM_POINTS = 10000.0;
const TIME_VALUES = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
const VOLTS_VALUES = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];

/**Computes the vertices necessary to draw the grid */
function grid_vertices() {
    for (let i = 0; i <= NUM_COLS; i++) {
        grid.push(vec2(i * 2 / (NUM_COLS) - 1, -1));
        grid.push(vec2(i * 2 / (NUM_COLS) - 1, 1));
    }
    for (let i = 0; i <= NUM_LINES; i++) {
        grid.push(vec2(-1, i * 2 / (NUM_LINES) - 1));
        grid.push(vec2(1, i * 2 / (NUM_LINES) - 1));
    }
}

/**Creates NUM_POINTS (10 000) points */
function formVertex() {
    for (let i = 0.0; i < NUM_POINTS; i = i + 1.0) {
        vertices.push(i);
    }
}

/**Initializes the callbacks to respond to the events with the interaction with the user */
function initCallbacks() {
    //Callbacks
    document.getElementById("timeSlider").onchange = function (event) {
        time = 0;
        frame = 0;
        output = document.getElementById('timeScale');
        output.innerHTML = TIME_VALUES[event.target.value];
        timeScale = TIME_VALUES[event.target.value];
    };

    document.getElementById("voltSlider").onchange = function (event) {
        time = 0;
        frame = 0;
        output = document.getElementById('voltScale');
        output.innerHTML = VOLTS_VALUES[event.target.value];
        voltScale = VOLTS_VALUES[event.target.value];
    };
    document.getElementById("horizontalPos").onchange = function (event) {
        xOffset = event.target.value;

    };
    document.getElementById("verticalPos").onchange = function (event) {
        yOffset = event.target.value / NUM_LINES;

    };

    document.getElementById("yFunction").onclick = function () {
        time = 0;
        frame = 0;
        var fList = document.getElementById("yFunction");
        yFunctions = fList.selectedOptions;
    };
    document.getElementById("xFunction").onclick = function () {
        time = 0;
        frame = 0;
        var fList = document.getElementById("xFunction");
        xFunction = fList.value;
    };

}

window.onload = function init() {
    time = 0;
    frame = 0;
    xFunction = 0;
    timeScale = TIME_VALUES[4];
    voltScale = VOLTS_VALUES[2];
    xOffset = 0;
    yOffset = 0;


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

    // Load the data into the GPU
    gridBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(grid), gl.STATIC_DRAW);

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(gridProgram, "vPosition"); //grid
    vTimeSample = gl.getAttribLocation(program, "vTimeSample"); //function

    //Prepares all the uniforms with the necessary variables to compute the result function
    xFuncLoc = gl.getUniformLocation(program, "xFunc");
    yFuncLoc = gl.getUniformLocation(program, "yFunc");
    voltScaleLoc = gl.getUniformLocation(program, "voltScale");
    timeScaleLoc = gl.getUniformLocation(program, "timeScale");
    timeLoc = gl.getUniformLocation(program, "time");
    colorLoc = gl.getUniformLocation(program, "color");
    nPointsLoc = gl.getUniformLocation(program, "nPoints");
    xOffsetLoc = gl.getUniformLocation(program, "xOffset");
    yOffsetLoc = gl.getUniformLocation(program, "yOffset");
    gl.uniform1f(nPointsLoc, NUM_POINTS);

    //callbacks
    initCallbacks();

    render();
}

/**Draws the grid with NUM_LINES lines and NUM_COLS columns */
function drawGrid() {
    gl.useProgram(gridProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    for (let i = 0; i <= NUM_COLS; i++) {
        gl.drawArrays(gl.LINES, 2 * i, 2);
    }
    for (let i = 0; i <= NUM_LINES; i++) {
        gl.drawArrays(gl.LINES, 2 * (NUM_COLS + 1 + i), 2);
    }

}

/**Assigns one color to which function, sets the color to the selected function f*/
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

/**Draws the selected function func, sends the necessary values to draw the function (the time scale, the volts scale, the x and y offsets, and the variable in the x axis) */
function drawFunction(func) {
    gl.useProgram(program);

    gl.uniform1i(xFuncLoc, xFunction);
    gl.uniform1i(yFuncLoc, func);

    computeColor(func);

    gl.uniform1f(voltScaleLoc, voltScale * NUM_LINES / 2); //Metade positiva metade negativa
    gl.uniform1f(timeScaleLoc, timeScale * NUM_COLS);
    gl.uniform1f(timeLoc, time);

    gl.uniform1f(xOffsetLoc, xOffset);
    gl.uniform1f(yOffsetLoc, yOffset);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer(vTimeSample, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTimeSample);

    computeColor(func);
    gl.drawArrays(gl.LINE_STRIP, 0, pointsToDraw());

}
/**
 * This function will decide how many points we have to draw in the present frame. If the time passed is enough to draw the complete panel, the number os points to draw is NUM_POINTS, else is the correspondent percentage of point considered the time passed.
 */
function pointsToDraw() {
    if (timeScale * NUM_COLS < 1 / 60) {
        return NUM_POINTS;
    } else {
        return Math.min(NUM_POINTS * (frame / (60 * NUM_COLS * timeScale)), NUM_POINTS);
    }
}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);
    time += 1 / 60;
    drawGrid();
    if (frame > 60 * timeScale * NUM_COLS && xFunction == 0) {
        //when the scale is fully draw, we restart our frame counter, if the x axis is the time.
        frame = 0;
    } else {
        frame += 1;
    }

    /**Draws every function selected */
    for (var i = 0; i < yFunctions.length; i++) {
        var f = yFunctions[i].value;
        drawFunction(f);
    }
    requestAnimFrame(render);

}
















/*
        float computeFunction(int func, float x, float y) {

            float y1 = y * 2.0 * pi * timeScale;

            if (func == 0) {
                return x;
            } else if (func == 1) {
                return (c4(y1)) / voltScale;
            } else if (func == 2){
                return (e4(y1)) / voltScale;
            } else if (func == 3){
                return (g4(y1)) / voltScale;
            } else if(func == 4) {
                return (c4(y1)+e4(y1)+g4(y1)) / voltScale;
            }else if(func == 5){
                return (f4(y1)) / voltScale;
            } else if(func == 6) {
                return (f4Sharp(y1)) / voltScale;
            } else if(func == 7) {
                return (f4(y1) + f4Sharp(y1)) / voltScale;
            }
        }
        void main(){
            float x = (vTimeSample*(2.0/9999.0)-1.0);
            gl_Position = vec4(computeFunction(xFunc, x, (time+x)),computeFunction(yFunc, x, (time+x)), 0.0, 1.0);
        }



        float computeFunction(int func, float y) {

            float add = (timeScale * vTimeSample) / 10000.0;
            float y1 = (y + add) * 2.0 * pi;

            if (func == 0) {
                float x1 = (vTimeSample * (2.0 / 9999.0) - 1.0);
                return x1;
            } else if (func == 1) {
                return (c4(y1)) / voltScale;
            } else if (func == 2){
                return (e4(y1)) / voltScale;
            } else if (func == 3){
                return (g4(y1)) / voltScale;
            } else if(func == 4) {
                return (c4(y1)+e4(y1)+g4(y1)) / voltScale;
            }else if(func == 5){
                return (f4(y1)) / voltScale;
            } else if(func == 6) {
                return (f4Sharp(y1)) / voltScale;
            } else if(func == 7) {
                return (f4(y1) + f4Sharp(y1)) / voltScale;
            }
        }
        void main(){
            float x = computeFunction(xFunc, (time));
            float y = computeFunction(yFunc, (time));
            gl_Position = vec4(x,y, 0.0, 1.0);
        }
        */