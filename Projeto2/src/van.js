var gl;
var program;
var bufferId;
var vPosition, vNormal, vColor;

var transforms = [];
var draws = [];
var mView = [];
var mProjection = [];

var tx, ty, tz, rz, rx, ry, sx, sy, sz, cube, sphere;
var ctmLoc, mProjectionLoc, mViewLoc;
function referential() {
    var at = [0, 0, 0];
    var eye = [1, 1, 1];
    var up = [0, 1, 0];

    mView = lookAt(eye, at, up);
    mProjection = ortho(-2, 2, -2, 2, 10, -10);

}

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    cubeInit(gl);
    sphereInit(gl);
    referential();

    ctmLoc = gl.getUniformLocation(program, "ctm");
    mViewLoc = gl.getUniformLocation(program, "mView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    document.getElementById("cube").onclick = function () {
        transforms.push(mat4());
        draws.push(cubeDrawWireFrame);
        tx.value = ty.value = tz.value = 0;
        rz.value = ry.value = rx.value = 0;
        sx.value = sy.value = sz.value = 1;
        //build_ctm();
    };
    document.getElementById("sphere").onclick = function () {
        transforms.push(mat4());
        draws.push(sphereDrawWireFrame);
        tx.value = ty.value = tz.value = 0;
        rz.value = ry.value = rx.value = 0;
        sx.value = sy.value = sz.value = 1;
        //build_ctm();
    };

    tx = document.getElementById("tx"); tx.oninput = build_ctm;
    ty = document.getElementById("ty"); ty.oninput = build_ctm;
    tz = document.getElementById("tz"); tz.oninput = build_ctm;
    rz = document.getElementById("rz"); rz.oninput = build_ctm;
    rx = document.getElementById("rx"); rx.oninput = build_ctm;
    ry = document.getElementById("ry"); ry.oninput = build_ctm;
    sx = document.getElementById("sx"); sx.oninput = build_ctm;
    sy = document.getElementById("sy"); sy.oninput = build_ctm;
    sz = document.getElementById("sz"); sz.oninput = build_ctm;
    transforms.push(mat4());
    draws.push(cubeDrawWireFrame);

    render();
}

function build_ctm() {
    var t_x = parseFloat(tx.value);
    var t_y = parseFloat(ty.value);
    var t_z = parseFloat(tz.value);
    var r_x = parseFloat(rx.value);
    var r_y = parseFloat(ry.value);
    var r_z = parseFloat(rz.value);
    var s_x = parseFloat(sx.value);
    var s_y = parseFloat(sy.value);
    var s_z = parseFloat(sz.value);

    transforms[transforms.length - 1] = mult(translate(t_x, t_y, t_z), mult(rotateZ(r_z), mult(rotateY(r_y), mult(rotateX(r_x), scalem(s_x, s_y, s_z)))));
}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    // Associate our shader (position) variables with our data buffer
    //gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    //gl.enableVertexAttribArray(vPosition);

    // Associate our shader (color) variables with our data buffer
    // gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 24);
    //gl.enableVertexAttribArray(vColor);

    // Draw stored primitives
    for (let i = 0; i < transforms.length; i++) {
        let t = transforms[i];
        const draw = draws[i];
        gl.uniformMatrix4fv(ctmLoc, false, flatten(t));
        draw(gl, program);
    }
    //gl.uniformMatrix4fv(ctmLoc, false, flatten(mat4()));

    //cubeDrawWireFrame(gl, program);


    window.requestAnimationFrame(render);
}
