var canvas;
var gl;
var program;
var aspect;

var mProjectionLoc, mViewLoc, mModelLoc;
var mView;
var filledColor, hiddenSurfacesMode;
var projectionMode, orthoMode, axonometricMode;
var a, b, d;
var shape;
var zoom;

const NONE = 0;
const BACKFACE_CULLING = 1;
const Z_BUFFER = 2;

const ORTHO = 0;
const AXONOMETRIC = 1
const PERSPECTIVE = 2;

const ALCADO_PRINCIPAL = 0;
const PLANTA = 1;
const ALCADO_DIREITO = 2;


const ISOMETRIA = 0;
const DIMETRIA = 1;
const TRIMETRIA = 2;
const FREE = 3;


const CUBE = 0;
const SPHERE = 1;
const TORUS = 2;
const CYLINDER = 3;
const PARABOLOID = 4;


//Temporario
const VP_DISTANCE = 1;



function computeInterface() {
    var orthoDiv = document.getElementById("ortho_menu");
    var perspectiveDiv = document.getElementById("perspective");
    var axonometricDiv = document.getElementById("axonometric_menu");
    var freeAxonometricDiv = document.getElementById("free_axonometric");

    if (projectionMode === ORTHO) {
        orthoDiv.style.display = "inline";
        perspectiveDiv.style.display = "none";
        axonometricDiv.style.display = "none";
        freeAxonometricDiv.style.display = "none";
    } else if (projectionMode === AXONOMETRIC) {
        orthoDiv.style.display = "none";
        perspectiveDiv.style.display = "none";
        axonometricDiv.style.display = "inline";
        if (axonometricMode == FREE) {
            freeAxonometricDiv.style.display = "block";
        } else {
            freeAxonometricDiv.style.display = "none";
        }

    } else if (projectionMode === PERSPECTIVE) {
        orthoDiv.style.display = "none";
        perspectiveDiv.style.display = "inline";
        axonometricDiv.style.display = "none";
        freeAxonometricDiv.style.display = "none";
    }

}


function fit_canvas_to_window() {
    canvas.width = window.innerWidth;
    canvas.height = 0.79 * window.innerHeight;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

}

window.onresize = function () {
    fit_canvas_to_window();
}

window.onload = function () {
    canvas = document.getElementById('gl-canvas');

    //initialize variables to default values
    filledColor = false;
    hiddenSurfacesMode = NONE;
    projectionMode = AXONOMETRIC;
    orthoMode = ALCADO_PRINCIPAL;
    axonometricMode = DIMETRIA;
    shape = CUBE;
    a = 30 * Math.PI / 180.0;
    b = 30 * Math.PI / 180.0;
    d = 5;
    zoom = 1;

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    mViewLoc = gl.getUniformLocation(program, "mView");
    mModelLoc = gl.getUniformLocation(program, "mModel");
    gl.uniformMatrix4fv(mModelLoc, false, flatten(mat4()));
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    sphereInit(gl);
    cubeInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    paraboloidInit(gl);

    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case 'f':
                filledColor = true;
                var output = document.getElementById("filled");
                output.innerHTML = "FILLED";
                break;
            case 'w':
                filledColor = false;
                var output = document.getElementById("filled");
                output.innerHTML = "WIREFRAME";
                break;
            case 'z':
                hiddenSurfacesMode = Z_BUFFER;
                var output = document.getElementById("hidden");
                output.innerHTML = "Z-BUFFER";
                break;
            case 'b':
                hiddenSurfacesMode = BACKFACE_CULLING;
                var output = document.getElementById("hidden");
                output.innerHTML = "CULLING";
                break;
        }
    }

    document.getElementById("distance").oninput = function () {
        var x = document.getElementById("distance");
        d = x.value;
        var output = document.getElementById("dValue");
        output.innerHTML = d;
    };
    document.getElementById("aSlider").oninput = function () {
        maxRange();
        var x = document.getElementById("aSlider");
        a = x.value * Math.PI / 180.0;
        var output = document.getElementById("aValue");
        output.innerHTML = x.value;
    };
    document.getElementById("bSlider").oninput = function () {
        maxRange();
        var x = document.getElementById("bSlider");
        b = x.value * Math.PI / 180.0;
        var output = document.getElementById("bValue");
        output.innerHTML = x.value;
    };
    document.getElementById("projection").onchange = function () {
        var x = document.getElementById("projection");
        projectionMode = x.options.selectedIndex;
        computeInterface();
    };

    document.getElementById("axonometric_menu").onchange = function () {
        var x = document.getElementById("axonometricOptions");
        axonometricMode = x.selectedIndex;
        computeInterface();
    };
    document.getElementById("ortho_menu").onchange = function () {
        var x = document.getElementById("orthogonalOptions");
        computeInterface();
        orthoMode = x.options.selectedIndex;

    };

    document.getElementById("objects").onchange = function () {
        var x = document.getElementById("objects");
        shape = x.options.selectedIndex;
    };
    document.onwheel = function (event) {
        //TODO
        var y = event.deltaY;
        if (y > 0 && zoom<15) {
            zoom += 0.1;
        } else if(zoom>0.79){
            zoom -= 0.1;
        }
    }

    computeInterface();
    render();
}
function maxRange() {
    var aa = document.getElementById("aSlider");
    var bb = document.getElementById("bSlider");
    aa.setAttribute("max", 90 - (b * 180.0 / Math.PI));
    bb.setAttribute("max", 90 - (a * 180.0 / Math.PI));
}

function computeView() {

    switch (projectionMode) {
        case ORTHO: orthoProjection(); break;
        case AXONOMETRIC: axonometricProjection(); break;
        case PERSPECTIVE: perspectiveProjection(); break;
    }
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
}

function orthoProjection() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -VP_DISTANCE * aspect, VP_DISTANCE * aspect);
    projection = mult(scalem([zoom, zoom, zoom]), projection);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    switch (orthoMode) {
        case ALCADO_PRINCIPAL: mView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]); break;
        case ALCADO_DIREITO: mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]); break;
        case PLANTA: mView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, -1]); break;
    }
}

function axonometricProjection() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -VP_DISTANCE * aspect, VP_DISTANCE * aspect);
    projection = mult(scalem([zoom, zoom, zoom]), projection);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    var eye;
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    var theta, gamma;
    var radius = VP_DISTANCE / 3; //foste embora do discord
    var aa, bb;

    switch (axonometricMode) {
        case ISOMETRIA:
            aa = 30 * Math.PI / 180.0;
            bb = aa;
            break;
        case DIMETRIA:
            aa = 42 * Math.PI / 180.0;
            bb = 7 * Math.PI / 180.0;
            break;
        case TRIMETRIA:
            aa = (54 + 16 / 60) * Math.PI / 180.0;
            bb = (23 + 16 / 60) * Math.PI / 180.0;
            break;
        case FREE:
            aa = a;
            bb = b;
            break;
    }
    theta = computeTheta(aa, bb);
    gamma = computeGamma(aa, bb);
    eye = vec3(radius * Math.sin(theta), radius * Math.sin(gamma),
        radius * Math.cos(theta));

    mView = lookAt(eye, at, up);

}
function computeTheta(aa, bb) {
    return Math.atan(Math.sqrt((Math.tan(aa) / Math.tan(bb)))) - Math.PI / 2;
}
function computeGamma(aa, bb) {
    return Math.asin(Math.sqrt((Math.tan(aa) * Math.tan(bb))));
}

function perspectiveProjection() {
    let near = Math.max(-d, (-VP_DISTANCE));
    let fovy = 2 * Math.atan(VP_DISTANCE / (d)) * 180 / Math.PI;
    /*se pretendermos nao mexer uma face "deslocamos" o solido com a mesma 
    face ate a origem fazendo d-0.5 no caso do cubo*/

    var projection = perspective(fovy, aspect, near, (VP_DISTANCE));
    projection = mult(scalem([zoom, zoom, zoom]), projection);
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    var eye = vec3(0.0, 0.0, -d);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    mView = lookAt(eye, at, up);
}

function render() {
    requestAnimationFrame(render);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (hiddenSurfacesMode == Z_BUFFER) {
        gl.enable(gl.DEPTH_TEST);
    } else if (hiddenSurfacesMode == BACKFACE_CULLING) {
        gl.enable(gl.CULL_FACE);
    }
    computeView();

    switch (shape) {
        case CUBE:
            cubeDraw(gl, program, filledColor);
            break;
        case SPHERE:
            sphereDraw(gl, program, filledColor);
            break;
        case TORUS:
            torusDraw(gl, program, filledColor);
            break;
        case CYLINDER:
            cylinderDraw(gl, program, filledColor);
            break;
        case PARABOLOID:
            mView = mult(mView, scalem([0.5, 0.5, 0.5]));
            gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
            paraboloidDraw(gl, program, filledColor);
            break;
    }
}








