"use strict";

var canvas;
var gl;
var points = [];
var numTimesToSubdivide = 0;
var angle = 1/6*Math.PI;
var bufferId;

function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

	// Load vertex shader
    var vertElem = document.getElementById( "vertex-shader" );
    if ( !vertElem ) { 
        alert( "Unable to load vertex-shader" );
        return -1;
    }
    var vertShdr = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource( vertShdr, vertElem.text );
    gl.compileShader( vertShdr );
    if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
        alert ("Vertex shader failed to compile.  The error log is:" + "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>");
        return -1;
    }

	// Load fragment shader
	    var fragElem = document.getElementById( "fragment-shader" );
    if ( !fragElem ) { 
        alert( "Unable to load fragment shader" );
        return -1;
    }
    var fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource( fragShdr, fragElem.text );
    gl.compileShader( fragShdr );
    if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
        alert ("Fragment shader failed to compile.  The error log is:" + "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>");
        return -1;
    }

	// Link the shaders
    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        alert ("Shader program failed to link.  The error log is:" + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>");
        return -1;
    }
    gl.useProgram( program );

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*Math.pow(4, 6), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	// Input event handlers are initialized
    document.getElementById("slider").onchange = slider_change;
	document.getElementById("angleBox").onchange = angle_box;
    render();
}

function slider_change() {
    numTimesToSubdivide = event.srcElement.value;
    render();
}

function angle_box() {
	angle = event.srcElement.value;
	render();
}

function rotate ( a ) {
	var t = Math.sqrt(a[0]*a[0]+a[1]*a[1]) * angle;
	var f1 = Math.cos(t);
	var f2 = Math.sin(t);
    return vec2(a[0]*f1 - a[1]*f2, a[0]*f2 + a[1]*f1);
};

function divideTriangle( a, b, c, count ) {
    // check for end of recursion
    if ( count == 0 ) {
		var p0 = rotate( a );
		var p1 = rotate( b );
		var p2 = rotate( c );
		points.push( p0, p1, p2 );
    } else {
        //bisect the sides
        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        // four new triangles
        divideTriangle( a, ab, ac, count-1 );
        divideTriangle( c, ac, bc, count-1 );
        divideTriangle( b, bc, ab, count-1 );
        divideTriangle( ab, bc, ac, count-1 );
    }
}

window.onload = init;

function render() {
    var vertices = [
        vec2( -0.5, -0.5 ),
        vec2(  0,  0.5 ),
        vec2(  0.5, -0.5 )
    ];
    points = [];
    divideTriangle( vertices[0], vertices[1], vertices[2], numTimesToSubdivide );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    points = [];
}