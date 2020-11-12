var canvas;
var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc, colorLoc, fixedColorLoc;

var matrixStack = [];
var modelView;
var time, view, wheelsAngle_Y, wheelsAngle_Z, drive, antennaUpAngle, antennaSideAngle, speed, xPos, zPos, vanAngle; 
var fixedColor;


const VP_DISTANCE = 1000;
//Van back FordTransit
const BACK_TRUCK = 1;
const BACKTRUCK_X = 330;
const BACKTRUCK_Y = 242;
const BACKTRUCK_Z = 206;
//cabine
const CABINE_TRUCK = 2;
const CABINETRUCK_X = 120;
const CABINETRUCK_Y = 170;
const CABINETRUCK_Z = 190;
//Support
const SUPPORT_ANTENNA = 3;
const SUPPORT_ANTENNA_X = 20;
const SUPPORT_ANTENNA_Y = 50;
const SUPPORT_ANTENNA_Z = 20;
//Wheels
const WHEEL = 4;
const WHEEL_DIAMETER = 80;
const WHEEL_WELL = 5;
const FBWHEEL_DISTANCE = (BACKTRUCK_X + WHEEL_DIAMETER)/2-BACKTRUCK_X / 3;
//Antena arm
const KNEECAP = 8;
const ARM_ANTENNA = 6;
const ARM_ANTENNA_SIZE = 110;
//Atenna
const ANTENNA = 7;
const ANTENNA_X = 100;
const ANTENNA_Y = 50;
const ANTENNA_Z = 100;

const TOP_VIEW = 1;
const SIDE_VIEW = 2;
const FRONT_VIEW = 3;
const OUR_VIEW = 0;

const FLOOR = 9;


// Stack related operations
function pushMatrix() {
    var m = mat4(modelView[0], modelView[1],
        modelView[2], modelView[3]);
    matrixStack.push(m);
}
function popMatrix() {
    modelView = matrixStack.pop();
}
// Append transformations to modelView
function multMatrix(m) {
    modelView = mult(modelView, m);
}
function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}
function multScale(s) {
    modelView = mult(modelView, scalem(s));
}
function multRotationX(angle) {
    modelView = mult(modelView, rotateX(angle));
}
function multRotationY(angle) {
    modelView = mult(modelView, rotateY(angle));
}
function multRotationZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
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
    fixedColor = true;
    time = 0;
    view = 2;
    wheelsAngle_Y = 0;
    wheelsAngle_Z = 0;
    antennaSideAngle = antennaUpAngle = 0;
    drive = 0;
    speed = 0;
    xPos = 0;
    zPos = 0;
    vanAngle = 0;


    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    colorLoc = gl.getUniformLocation(program, "color");
    fixedColorLoc = gl.getUniformLocation(program, "fixedColor");


    sphereInit(gl);
    cubeInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    paraboloidInit(gl);
    document.onkeydown = function (event) {
        var command = (event.key).toLowerCase();
        switch (command) {
            case ' ': fixedColor = !fixedColor; break;
            case 's': if (speed < 0.3 || wheelsAngle_Y === 0)speed -= 0.1; break;//drive--
            case 'w': if (speed < 0.3 || wheelsAngle_Y===0) speed += 0.1; break;//drive++
            case 'i': antennaUpAngle++; break;
            case 'k': antennaUpAngle--; break;
            case 'j': antennaSideAngle++; break;
            case 'l': antennaSideAngle--; break;
            case 'a': if (wheelsAngle_Y < 50 && speed===0) wheelsAngle_Y++; break;
            case 'd': if (wheelsAngle_Y > -50 && speed === 0) wheelsAngle_Y--; break;
            case '1': view = TOP_VIEW; break;
            case '2': view = SIDE_VIEW; break;
            case '3': view = FRONT_VIEW; break;
            case '0': view = OUR_VIEW; break;
            case '4': view = OUR_VIEW; break;
            case 'b': if (speed > 0.4) {speed -= 0.5;}
                    else if (speed < -0.4) {speed += 0.5;}
                    else {speed = 0;}
                    break;
        }
    }

    render();
}

function computeView() {
    var projection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    if (view == OUR_VIEW) {
        modelView = lookAt([VP_DISTANCE, VP_DISTANCE, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    } else if (view == TOP_VIEW) {
        modelView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, -1]);
    } else if (view == SIDE_VIEW) {
        modelView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    } else if (view == FRONT_VIEW) {
        modelView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]);
    }
    //modelView = lookAt([0, VP_DISTANCE, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);


}

function render() {
    requestAnimationFrame(render);
    time += 1 / 60;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //
    if (wheelsAngle_Y===0){
    wheelsAngle_Z -= 360 * speed * time / (Math.PI * WHEEL_DIAMETER);
    vanAngle += speed * time * Math.sin(wheelsAngle_Y) / (2 * Math.PI * (FBWHEEL_DISTANCE/Math.cos(wheelsAngle_Y)));//wheelsAngle_Z * Math.PI * WHEEL_DIAMETER * Math.cos(wheelsAngle_Y)/(2*Math.PI*FBWHEEL_DISTANCE);
    xPos += (speed * time)*Math.cos(vanAngle);
    zPos += (speed * time)*Math.sin(vanAngle);
    }
    if(wheelsAngle_Y< - 5||wheelsAngle_Y > 5)
        wheelsAngle_Y *= 0.99;
    else if (wheelsAngle_Y < - 0.1 || wheelsAngle_Y > 0.1)
        wheelsAngle_Y*=0.9;
    else
        wheelsAngle_Y = 0;

    computeView();
    drawScene();
}
function computeColor(part) {
    var color;
    if (fixedColor) {
        switch (part) {
            case BACK_TRUCK: color = vec4(1.0, 1.0, 1.0, 1.0); break;
            case CABINE_TRUCK: color = vec4(0.8, 0.8, 0.8, 1.0); break;
            case SUPPORT_ANTENNA: color = vec4(0.3, 0.9, 0.9, 1.0); break;
            case WHEEL: color = vec4(0.5, 0.3, 0.9, 1.0); break;
            case WHEEL_WELL: color = vec4(0.8, 0.5, 1.0, 1.0); break;
            case ANTENNA: color = vec4(0.8, 0.5, 1.0, 1.0); break;
            case ARM_ANTENNA: color = vec4(1, 0.5, 0.7, 1.0); break;
            case KNEECAP: color = vec4(0.8, 1.0, 0.5, 1.0); break;
            case FLOOR: color = vec4(0.63, 0.5, 0.56, 1.0); break;
            default: color = vec4(1.0, 1.0, 1.0, 1.0); break;
        }

        gl.uniform1i(fixedColorLoc, 1);
        gl.uniform4fv(colorLoc, color);
    } else {
        gl.uniform1i(fixedColorLoc, -1);
    }

}

function drawScene() {
    //multRotationZ(45);
    pushMatrix();
    //Truck
        multTranslation([xPos, 0, zPos]);
        //multRotationY(vanAngle);

        pushMatrix();
        //BackTruck
            multScale([BACKTRUCK_X, BACKTRUCK_Y, BACKTRUCK_Z]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
            computeColor(BACK_TRUCK);
            cubeDrawWireFrame(gl, program, true);
        popMatrix();
        pushMatrix();
        //FrontTruck
            multTranslation([(BACKTRUCK_X + CABINETRUCK_X) / 2, -(BACKTRUCK_Y - CABINETRUCK_Y) / 2, 0]);
            multScale([CABINETRUCK_X, CABINETRUCK_Y, CABINETRUCK_Z]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
            computeColor(CABINE_TRUCK);
            cubeDrawWireFrame(gl, program, true);

        popMatrix();
        pushMatrix();
        //Antenna Support
            multTranslation([0, (BACKTRUCK_Y + SUPPORT_ANTENNA_Y) / 2, 0]);
            multRotationY(90);
            multScale([SUPPORT_ANTENNA_X, SUPPORT_ANTENNA_Y, SUPPORT_ANTENNA_Z]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
            computeColor(SUPPORT_ANTENNA);
            cylinderDraw(gl, program, true);
        popMatrix();
        pushMatrix();
            multTranslation([0, BACKTRUCK_Y / 2 + SUPPORT_ANTENNA_Y, 0]);
            multRotationY(antennaSideAngle);
            multRotationZ(antennaUpAngle);

            pushMatrix();
            //Antenna ball
                //multTranslation([0, BACKTRUCK_Y / 2 + SUPPORT_ANTENNA_Y, 0]);
                multScale([SUPPORT_ANTENNA_X * 1.5, SUPPORT_ANTENNA_X * 1.5, SUPPORT_ANTENNA_Z * 1.5]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(KNEECAP);
                sphereDrawWireFrame(gl, program, true);
            popMatrix();
            pushMatrix();
            //Antenna arm
                multTranslation([ARM_ANTENNA_SIZE / 2, 0, 0]);
                multRotationZ(90);
                multScale([SUPPORT_ANTENNA_X, ARM_ANTENNA_SIZE, SUPPORT_ANTENNA_Z]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(SUPPORT_ANTENNA);
                cylinderDraw(gl, program, true);
            popMatrix();
            pushMatrix();
            //Antenna Fore-arm
                multTranslation([5 * ARM_ANTENNA_SIZE / 6, ARM_ANTENNA_SIZE * 0.43 / 8, 0]);
                multScale([SUPPORT_ANTENNA_X, ARM_ANTENNA_SIZE * 0.35, SUPPORT_ANTENNA_Z]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(ARM_ANTENNA);
                cubeDraw(gl, program, true);
            popMatrix();
            pushMatrix();
            //Antenna
                multTranslation([5 * ARM_ANTENNA_SIZE / 6, ARM_ANTENNA_SIZE * 0.35 + ARM_ANTENNA_SIZE * 0.43 / 8, 0]);
                multScale([ANTENNA_X, ANTENNA_Y, ANTENNA_Z]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(ANTENNA);
                paraboloidDraw(gl, program, true);
            popMatrix();
        popMatrix();
        pushMatrix();
        //Eixos
            pushMatrix();
                multTranslation([-BACKTRUCK_X / 3, -BACKTRUCK_Y / 2, 0]);
                multRotationY(90);
                multRotationZ(90);
                multScale([WHEEL_DIAMETER / 5, BACKTRUCK_Z, WHEEL_DIAMETER / 5]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(WHEEL_WELL);
                cylinderDraw(gl, program, true);
            popMatrix();
            pushMatrix();
                multTranslation([(BACKTRUCK_X + WHEEL_DIAMETER) / 2, -BACKTRUCK_Y / 2, 0]);
                multRotationY(90);
                multRotationZ(90);
                multScale([WHEEL_DIAMETER / 5, BACKTRUCK_Z, WHEEL_DIAMETER / 5]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(WHEEL_WELL);
                cylinderDraw(gl, program, true);
            popMatrix();
        //Rodas
            drawWheels(wheelsAngle_Y);
        
        popMatrix();
    popMatrix();

    function drawWheels(frontWheelsAngle) {
        //backWheels
        pushMatrix();
            multTranslation([-BACKTRUCK_X / 3, -BACKTRUCK_Y / 2, 0]);
            multRotationZ(wheelsAngle_Z);
            pushMatrix();
                multTranslation([0, 0, BACKTRUCK_Z / 2]);
                wheels();
                wheelWell();
            popMatrix();
            pushMatrix();
                multTranslation([0, 0, -BACKTRUCK_Z / 2]);
                wheels();
                wheelWell();
            popMatrix();
        popMatrix();
        //frontWheels
        pushMatrix();
            multTranslation([(BACKTRUCK_X + WHEEL_DIAMETER) / 2, -BACKTRUCK_Y / 2, 0]);
            pushMatrix();
                multTranslation([0, 0, BACKTRUCK_Z / 2]);
                multRotationY(frontWheelsAngle);
                multRotationZ(wheelsAngle_Z);
                wheels();
                wheelWell();
            popMatrix();
            pushMatrix();
                multTranslation([0, 0, -BACKTRUCK_Z / 2]);
                multRotationY(frontWheelsAngle);
                multRotationZ(wheelsAngle_Z);
                wheels();
                wheelWell();
            popMatrix();
        popMatrix();
    }

    function wheels() {
        pushMatrix();
        //multRotationY(angle);
        //multRotationZ(wheelsAngle_Z);
            multRotationX(90);
            multScale([WHEEL_DIAMETER, WHEEL_DIAMETER, WHEEL_DIAMETER]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
            computeColor(WHEEL);
            torusDraw(gl, program, true);
        popMatrix();
    }
    function wheelWell() {
        pushMatrix();
        //multRotationY(angle);
            pushMatrix();
                multRotationZ(90);
                multScale([WHEEL_DIAMETER / 5, WHEEL_DIAMETER, WHEEL_DIAMETER / 5]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                computeColor(WHEEL_WELL);
                cylinderDraw(gl, program, true);
            popMatrix();
            //pushMatrix();
            multScale([WHEEL_DIAMETER / 5, WHEEL_DIAMETER, WHEEL_DIAMETER / 5]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
            computeColor(WHEEL_WELL);
            cylinderDraw(gl, program, true);
            //popMatrix();
        popMatrix();
    }

}
