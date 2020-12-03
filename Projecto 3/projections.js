var canvas;
var gl;
var program;
var aspect;

var mProjectionLoc, mModelViewLoc;
var modelView;
var fixedColor, hiddenSurfacesMode;
var projectionMode, orthoMode, axonometricMode;
var gamma, theta, d;
var shape;

const NONE = 0;
const BACKFACE_CULLING =1;
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



function computeInterface() {
    var orthoDiv = document.getElementById("ortho_menu");
    var perspectiveDiv = document.getElementById("perspetive");
    var axonometricDiv =  document.getElementById("axonometric_menu");
    var freeAxonometricDiv =  document.getElementById("free_axonometric");
   
    if(projectionMode===ORTHO) {
        orthoDiv.style.display = "block";
        perspectiveDiv.style.display = "none";
        axonometricDiv.style.display = "none";
        freeAxonometricDiv.style.display = "none";
    }else if(projectionMode===AXONOMETRIC) {
        orthoDiv.style.display = "none";
        perspectiveDiv.style.display = "none";
        axonometricDiv.style.display = "block";
        freeAxonometricDiv.style.display = "none";

    } else if(projectionMode===PERSPECTIVE) {
        orthoDiv.style.display = "none";
        perspectiveDiv.style.display = "block";
        axonometricDiv.style.display = "none";
        freeAxonometricDiv.style.display = "none";
    }

}


function fit_canvas_to_window() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

}

window.onresize = function () {
    fit_canvas_to_window();
}

window.onload = function () {
    canvas = document.getElementById('gl-canvas');

    //initialize variables to default values
    fixedColor = false;
    hiddenSurfacesMode = NONE;

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    sphereInit(gl);
    cubeInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    paraboloidInit(gl);

    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case 'f': fixedColor = true; break;
            case 'w': fixedColor = false; break;
            case 'z': hiddenSurfacesMode = Z_BUFFER; break;
            case 'b': hiddenSurfacesMode = BACKFACE_CULLING; break;
        }
    }

    document.getElementById("projection").onchange = function () {
        var x = document.getElementById("projection");
        projectionMode = x.options.selectedIndex;
        computeInterface();
    };

    document.getElementById("axonometric_menu").onchange = function () {
        var x = document.getElementById("axonometric_menu");
        axonometricMode = x.options.selectedIndex;
        if(axonometricMode===FREE) {
            freeAxonometricDiv.style.display = "block";
        } else {
            freeAxonometricDiv.style.display = "none";
        }
    };
    document.getElementById("ortho_menu").onchange = function () {
        var x = document.getElementById("ortho_menu");
        orthoMode = x.options.selectedIndex;
    };

    render();
}

function computeView() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    if (view == OUR_VIEW) {
        modelView = lookAt([VP_DISTANCE/1.5, VP_DISTANCE, VP_DISTANCE], [0, -VP_DISTANCE, 0], [0, 1, 0]);
    } else if (view == TOP_VIEW) {
        modelView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, -1]);
    } else if (view == SIDE_VIEW) {
        modelView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    } else if (view == FRONT_VIEW) {
        modelView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]);
    }
}

function render() {
    gl.enable(gl.DEPTH_TEST);
    requestAnimationFrame(render);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    switch (shape) {
        case 0: gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(WHEEL_WELL);
                cubeDraw(gl, program, false);
                break;
        case 1: break;
        case 2: break;
        case 3: break;
        case 4: break;
    }

    computeView();
    
}
