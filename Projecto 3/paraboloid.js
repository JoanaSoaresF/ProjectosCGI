
/**
 * Projeto 3 CGI 
 * Gonçalo Loureço nº55780
 * Joana Faria nº55754
 */

var paraboloid_points = [];
var paraboloid_normals = [];
var paraboloid_faces = [];
var paraboloid_edges = [];

var paraboloid_points_buffer;
var paraboloid_normals_buffer;
var paraboloid_faces_buffer;
var paraboloid_edges_buffer;

var PARABOLOID_LATS = 20;
var PARABOLOID_LONS = 30; //TODO talvez 20

function paraboloidInit(gl, nlat, nlon) {
    nlat = nlat | PARABOLOID_LATS;
    nlon = nlon | PARABOLOID_LONS;
    paraboloidBuild(nlat, nlon);
    paraboloidUploadData(gl);
}

// Generate points using polar coordinates
function paraboloidBuild(nlat, nlon) {
    // phi will be latitude
    // theta will be longitude

    var d_phi = Math.PI / (nlat + 1);
    var d_theta = 2 * Math.PI / nlon;
    var r = 0;

    // Generate south polar cap
    var south = vec3(0, -1, 0);
    paraboloid_points.push(south);
    paraboloid_normals.push(vec3(0, -1, 0));

    // Generate middle
    for (var i = 0 /*, phi = Math.PI / 2 - d_phi*/; i < nlat; i+=2/*, phi -= d_phi*/) {
        for (var j = 0, theta = 0; j < nlon; j++, theta += d_theta) {
            r = i / nlat;
            var pt = vec3(r /* Math.cos(phi)*/ * Math.cos(theta), r*r /* Math.sin(phi)*/, r /* Math.cos(phi)*/ * Math.sin(theta));
            paraboloid_points.push(pt);
            var n = vec3(pt);
            paraboloid_normals.push(normalize(n));
        }
    }

    for (var i = nlat; i > 0; i-=2) {
        for (var j = 0, theta = 0; j < nlon; j++, theta += d_theta) {
            r = i / nlat;
            var pt = vec3(r  * Math.cos(theta), r*r+0.05, r * Math.sin(theta));
            paraboloid_points.push(pt);
            var n = vec3(pt);
            paraboloid_normals.push(normalize(n));
        }
    }

    // Generate norh south cap
    
    var north = vec3(0, 0.05, 0);
    paraboloid_points.push(north);
    paraboloid_normals.push(vec3(0, 1, 0));
    
    // Generate the faces

    // north pole faces
    for (var i = 0; i < nlon - 1; i++) {
        paraboloid_faces.push(i); //TODO tirei 0 para i
        paraboloid_faces.push(i + 2);
        paraboloid_faces.push(i + 1);
    }
    paraboloid_faces.push(0);
    paraboloid_faces.push(1);
    paraboloid_faces.push(nlon);

    // general middle faces
    var offset = 1;

    for (var i = 0; i < nlat; i++) { //TODO alterei aqui e meti *2
        for (var j = 0; j < nlon - 1; j++) {
            var p = offset + i * nlon + j;
            paraboloid_faces.push(p);
            paraboloid_faces.push(p + nlon + 1);
            paraboloid_faces.push(p + nlon);

            paraboloid_faces.push(p);
            paraboloid_faces.push(p + 1);
            paraboloid_faces.push(p + nlon + 1);
        }
        var p = offset + i * nlon + nlon - 1;
        paraboloid_faces.push(p);
        paraboloid_faces.push(p + 1);
        paraboloid_faces.push(p + nlon);

        paraboloid_faces.push(p);
        paraboloid_faces.push(p - nlon + 1);
        paraboloid_faces.push(p + 1);
    }

    // south pole faces
    //TODO tirei isto
    var offset = 1 + (nlat) * nlon;//TODO tirei -1
    for (var j = 0; j < nlon - 1; j++) {
        paraboloid_faces.push(offset + nlon);
        paraboloid_faces.push(offset + j);
        paraboloid_faces.push(offset + j + 1);
    }
    paraboloid_faces.push(offset + nlon);
    paraboloid_faces.push(offset + nlon - 1);
    paraboloid_faces.push(offset);
    
    // Build the edges
    for (var i = 0; i < nlon; i++) {
        paraboloid_edges.push(0);   // North pole 
        paraboloid_edges.push(i + 1);
    }

    for (var i = 0; i < nlat; i++, p++) { //TODO alterei aqui e meti *2
        for (var j = 0; j < nlon; j++, p++) {
            var p = 1 + i * nlon + j;
            paraboloid_edges.push(p);   // horizontal line (same latitude)
            if (j != nlon - 1)
                paraboloid_edges.push(p + 1);
            else paraboloid_edges.push(p + 1 - nlon);

            if (i != nlat - 1) {
                paraboloid_edges.push(p);   // vertical line (same longitude)
                paraboloid_edges.push(p + nlon);
            }
            else {
                paraboloid_edges.push(p);
                paraboloid_edges.push(paraboloid_points.length - 1);
            }
        }
    }

}

function paraboloidUploadData(gl) {
    paraboloid_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(paraboloid_points), gl.STATIC_DRAW);

    paraboloid_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(paraboloid_normals), gl.STATIC_DRAW);

    paraboloid_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(paraboloid_faces), gl.STATIC_DRAW);

    paraboloid_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(paraboloid_edges), gl.STATIC_DRAW);
}

function paraboloidDrawWireFrame(gl, program) {
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_edges_buffer);
    gl.drawElements(gl.LINES, paraboloid_edges.length, gl.UNSIGNED_SHORT, 0);
}

function paraboloidDrawFilled(gl, program) {
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_faces_buffer);
    gl.drawElements(gl.TRIANGLES, paraboloid_faces.length, gl.UNSIGNED_SHORT, 0);
}

function paraboloidDraw(gl, program, filled = false) {
    if (filled) paraboloidDrawFilled(gl, program);
    else paraboloidDrawWireFrame(gl, program);
}