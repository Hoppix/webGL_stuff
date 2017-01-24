var gl;
var canvas;

var viewMatrixLoc;
var viewMatrix;

var projectionMatrixLoc;
var projectionMatrix;

var eye;
var target;
var up;

var keys = [];
var moveSpeed = 0.01;

var objects = [];

//texture variables
var cubeTexture;
var cubeImage;
var islandTexture;
var islandImage;

//time variables
var date;
var time;
var startTime;




	//setup viewMatrix (camera)
	eye = vec3.fromValues(3.0, 1.0, 3.0);
	up = vec3.fromValues(0.0, 1.0, 0.0);
	target = vec3.fromValues(1.0, 1.0, 1.0);

var RenderObject = function(transform, color, shader, buffer, bufferLength)
{
	this.transform = transform;
	this.color = color;
	this.shader = shader;
	this.buffer = buffer;
	this.bufferLength = bufferLength;
	this.lighting = false;
	this.texture = false;
	this.bumpMap = false;
	this.displacement = false;

	this.rotationY = 0.01;
	this.rotationX = 0.01;
	this.rotationZ = 0.01;
}

RenderObject.prototype.rotate = function(angle, axis)
{
	mat4.rotate(this.transform, this.transform, angle, axis);
}

window.onload = function init()
{
	// Get canvas and setup webGL
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LESS);

	// Bind input events to functions
	window.addEventListener("keydown", keyDown);
	window.addEventListener("keyup", keyUp);

	//Listener für Maus-Sperre
	pointerLockHandling();
	document.addEventListener('pointerlockchange', setupMouseLock, false);
	document.addEventListener('mozpointerlockchange', setupMouseLock, false);
	
	date = new Date();
	startTime = date.getTime();
	startTime = startTime


	// Configure viewport
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clearColor(0.105, 0.603, 0.854, 1.0);

	// Init shader programs
	var defaultProgram = initShaders(gl, "vertex-shader", "fragment-shader");
	var vertexLightingProgram = initShaders(gl, "vertex-shader-lighting", "fragment-shader-lighting");
	var textureMappingProgram = initShaders(gl, "vertex-shader-texture", "fragment-shader-texture");
	var textureLightingProgram = initShaders(gl, "vertex-shader-texture-lighting", "fragment-shader-texture-lighting");
	var waveProgram = initShaders(gl, "vertex-shader-wave", "fragment-shader-wave");

	///// ISLAND OBJECT /////
	// Init texture
	islandTexture = gl.createTexture();
	islandImage = new Image();
	islandImage.onload = function()
	{
		handleTexture(islandTexture, islandImage);
	}
	islandImage.src = "sand_diffuse.png";

	// Load texture
	var islandTexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, islandTexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, cubeTexArray, gl.STATIC_DRAW);

	var iTexCoords = gl.getAttribLocation(textureLightingProgram, "iTexCoords");
	gl.vertexAttribPointer(iTexCoords, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(iTexCoords);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, islandTexture);
	var mapLoc = gl.getUniformLocation(textureLightingProgram, "map");
	gl.uniform1i(mapLoc, 0);

	// Create buffer and copy data into it
	var vertexBufferIsland = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferIsland);
	gl.bufferData(gl.ARRAY_BUFFER, islandVertices, gl.STATIC_DRAW);

	var normalBufferIsland = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferIsland);
	gl.bufferData(gl.ARRAY_BUFFER, islandNormals, gl.STATIC_DRAW);

	// Create object
	var island = new RenderObject(mat4.create(), vec4.fromValues(1,1,0,0.5), textureLightingProgram, vertexBufferIsland, islandVertices.length/3);
	island.normalBuffer = normalBufferIsland;
	island.normalBufferLength = islandNormals.length/3;
	island.lighting = true;
	island.texture = true
	mat4.translate(island.transform, island.transform, vec3.fromValues(0, 0, 0));
	mat4.scale(island.transform, island.transform, vec3.fromValues(10, 1, 10));

	// Push object on the stack
	objects.push(island);

	///// CUBE OBJECT /////
	// Create buffer and copy data into it
	var vertexBufferCube = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCube);
	gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW)

	// Create Object
	var cube = new RenderObject(mat4.create(), vec4.fromValues(0.3,0.3,0.3,1), defaultProgram, vertexBufferCube, cubePositions.length/3);
	mat4.translate(cube.transform, cube.transform, vec3.fromValues(-2, 1, 1));
	mat4.scale(cube.transform, cube.transform, vec3.fromValues(2, 2, 2));

	//Push object
	objects.push(cube);

	///// WATER OBJECT /////
	// Create buffer and copy data into it
	var vertexBufferWater = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferWater);
	gl.bufferData(gl.ARRAY_BUFFER, waterVerticesTessel, gl.STATIC_DRAW);

	// Create object
	var water = new RenderObject(mat4.create(), vec4.fromValues(0,0,1,1), waveProgram, vertexBufferWater, waterVerticesTessel.length/3);
	mat4.translate(water.transform, water.transform, vec3.fromValues(0, 0, 0));
	mat4.scale(water.transform, water.transform, vec3.fromValues(100, 1, 100));
	water.displacement = true;

	// Push object on the stack
	objects.push(water);

	///// PALM TREE OBJECTS /////
	for (var i = 0; i < 5; i++)
	{
		// Create buffer and copy data into it
		var vertexBufferPalmTree = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPalmTree);
		gl.bufferData(gl.ARRAY_BUFFER, palmTreeVertices, gl.STATIC_DRAW);

		// Create object
		var palmTree = new RenderObject(mat4.create(), vec4.fromValues(0.58,0.3,0,1), defaultProgram, vertexBufferPalmTree, palmTreeVertices.length/3);
		mat4.scale(palmTree.transform, palmTree.transform, vec3.fromValues(0.2, 0.2, 0.2));
		mat4.translate(palmTree.transform, palmTree.transform, vec3.fromValues(5, 3+i, 5));

		// Push object on the stack
		objects.push(palmTree);
	}

	///// PALM LEAF OBJECTS /////
	for (var i = 0; i < 4; i++)
	{
		// Create buffer and copy data into it
		var vertexBufferPalmLeaf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPalmLeaf);
		gl.bufferData(gl.ARRAY_BUFFER, palmLeafVertices, gl.STATIC_DRAW);

		// Create object
		var palmLeaf = new RenderObject(mat4.create(), vec4.fromValues(0,1,0,1), defaultProgram, vertexBufferPalmLeaf, palmLeafVertices.length/3);
		mat4.translate(palmLeaf.transform, palmLeaf.transform, vec3.fromValues(1, 1.6, 1));
		mat4.rotate(palmLeaf.transform, palmLeaf.transform, Math.PI * 0.5 * i, vec3.fromValues(0, 1, 0));

		// Push object on the stack
		objects.push(palmLeaf);
	}

	// Setup projectionMatrix (perspective)
	var fovy = Math.PI * 0.25; // 90 degrees
	var aspectRatio = canvas.width / canvas.height;
	var nearClippingPlane = 0.5;
	var farClippingPlane = 100;
	projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix, fovy, aspectRatio, nearClippingPlane, farClippingPlane);



	render();
};

function render()
{

	//Kamerakoordinaten per frame
	viewMatrix = mat4.create();
	mat4.lookAt(viewMatrix, eye, target, up);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	objects.forEach(function(object)
	{
		// Set shader program
		gl.useProgram(object.shader);

		// Set attribute
		var vPosition = gl.getAttribLocation(object.shader, "vPosition");
		gl.bindBuffer(gl.ARRAY_BUFFER, object.buffer);
		gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);

		// Set lighting
		if (object.lighting == true)
		{
			var vNormal = gl.getAttribLocation(object.shader, "vNormal");
			gl.bindBuffer(gl.ARRAY_BUFFER, object.normalBuffer);
			gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vNormal);

			// Set object color
			var ambientLightLoc = gl.getUniformLocation(object.shader, "ka");
			gl.uniform4f(ambientLightLoc, 0.1, 0.1, 0.1, 1.0);
			var diffuseLightLoc = gl.getUniformLocation(object.shader, "kd");
			gl.uniform4fv(diffuseLightLoc, object.color);
			var specularLightLoc = gl.getUniformLocation(object.shader, "ks");
			gl.uniform4fv(specularLightLoc, object.color);

			// Set light source attributes
			var diffuseLightSourceLoc = gl.getUniformLocation(object.shader, "Id");
			gl.uniform4f(diffuseLightSourceLoc, 1.0, 1.0, 1.0, 1.0);
			var specularLightSourceLoc = gl.getUniformLocation(object.shader, "Is");
			gl.uniform4f(specularLightSourceLoc, 0.5, 0.5, 0.5, 1.0);
			var lightPositionLoc = gl.getUniformLocation(object.shader, "lightPosition");
			gl.uniform3f(lightPositionLoc, 7.0, 3.0, 7.0);
			var ambientLightWorldLoc = gl.getUniformLocation(object.shader, "Ia");
			gl.uniform4f(ambientLightWorldLoc, 0.1, 0.1, 0.1, 1.0);

			// Calculate and set normal matrix
			var mvMatrix = mat4.create();
			mat4.multiply(mvMatrix, viewMatrix, object.transform);
			var normalMatrix = mat4.create();
			mat4.transpose(normalMatrix, mvMatrix);
			mat4.invert(normalMatrix, normalMatrix);
			normalMatrixLoc = gl.getUniformLocation(object.shader, "normalMatrix");
			gl.uniformMatrix4fv(normalMatrixLoc, false, normalMatrix);
		}
		else
		{
			var colorLoc = gl.getUniformLocation(object.shader, "objectColor");
			gl.uniform4fv(colorLoc, object.color);
		}
		
		if(object.displacement)
		{
			date = new Date();
			time = date.getTime();
			time = time
			time = (time - startTime);
			time = time / 1000
			time = time % (Math.PI*2)
			var timeLocation = gl.getUniformLocation(object.shader, "time");
			gl.uniform1f(timeLocation, time);
			
		}

		// Set textures TODO

		//Keyinputs per frame
		moveEventHandling();

		//Kamerakoordinaten per frame
		viewMatrix = mat4.create();
		mat4.lookAt(viewMatrix, eye, target, up);

		// Set uniforms
		var projectionMatrixLoc = gl.getUniformLocation(object.shader, "projectionMatrix");
		var viewMatrixLoc = gl.getUniformLocation(object.shader, "viewMatrix");
		var modelMatrixLoc = gl.getUniformLocation(object.shader, "modelMatrix");
		gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);
		gl.uniformMatrix4fv(viewMatrixLoc, false, viewMatrix);
		gl.uniformMatrix4fv(modelMatrixLoc, false, object.transform);

		// Draw
		gl.drawArrays(gl.TRIANGLES, 0, object.bufferLength);
	});

	requestAnimFrame(render);
}

function moveEventHandling()
{
	moveForward();
	moveBackward();
	moveLeft();
	moveRight();
}

function keyDown(e)
{
	keys[e.keyCode] = true;
}

function keyUp(e)
{
	keys[e.keyCode] = false;
}


function moveForward()
{
	if (keys[87])
	{

		const backupEye = eye[1];
		const backupTarget = target[1];
		var distance = vec3.create();
		vec3.sub(distance, target, eye);
		vec3.normalize(distance, distance);
		vec3.scale(distance, distance, moveSpeed);
		vec3.add(eye, eye, distance);
		vec3.add(target, target, distance);
		eye[1] = backupEye;
		target[1] = backupTarget;
	}
}

function moveBackward()
{
	if (keys[83])
	{
		const backupEye = eye[1];
		const backupTarget = target[1];
		var distance = vec3.create();
		vec3.sub(distance, target, eye);
		vec3.normalize(distance, distance);
		vec3.scale(distance, distance, moveSpeed);
		vec3.sub(eye, eye, distance);
		vec3.sub(target, target, distance);
		eye[1] = backupEye;
		target[1] = backupTarget;
	}
}

function moveLeft()
{
	if (keys[65])
	{
		const backupEye = eye[1];
		const backupTarget = target[1];
		var distance = vec3.create();
		var rotatedTarget = vec3.create();
		vec3.rotateY(rotatedTarget, target, eye, Math.PI/2);
		vec3.sub(distance, rotatedTarget, eye);
		vec3.normalize(distance, distance);
		vec3.scale(distance, distance, moveSpeed);
		vec3.add(eye, eye, distance);
		vec3.add(target, target, distance);
		eye[1] = backupEye;
		target[1] = backupTarget;

	}
}

function moveRight()
{
	if (keys[68])
	{
		const backupEye = eye[1];
		const backupTarget = target[1];
		var distance = vec3.create();
		var rotatedTarget = vec3.create();
		vec3.rotateY(rotatedTarget, target, eye, Math.PI*3/2);
		vec3.sub(distance, rotatedTarget, eye);
		vec3.normalize(distance, distance);
		vec3.scale(distance, distance, moveSpeed);
		vec3.add(eye, eye, distance);
		vec3.add(target, target, distance);
		eye[1] = backupEye;
		target[1] = backupTarget;
	}
}

function pointerLockHandling()
{
	//Fragt beim Brower den Mouselock an.
	canvas.requestPointerLock = canvas.requestPointerLock ||
		canvas.mozRequestPointerLock;

	document.exitPointerLock = document.exitPointerLock ||
		document.mozExitPointerLock;

	canvas.onclick = function()
	{
		canvas.requestPointerLock();
	}
}

function setupMouseLock()
{
	//Wenn die canvas geklickt wird dann wird die Mausbewegung aktiviert.
	if (document.pointerLockElement === canvas ||
		document.mozPointerLockElement === canvas)
	{
		document.addEventListener("mousemove", setLook, false);
	}
	else
	{
		document.removeEventListener("mousemove", setLook, false);
	}
}

function setLook(e)
{
	var korrektur = -0.0033;
	vec3.rotateY(target, target, eye, e.movementX*korrektur);
}



function degreeToRadian(degrees)
{
	//Hilfsfunktion
	return (degrees/180) * Math.PI()
}

function goFullScreen()
{
    var canvasFull = document.getElementById("gl-canvas");
    if(canvasFull.requestFullScreen)
        canvasFull.requestFullScreen();
    else if(canvasFull.webkitRequestFullScreen)
        canvas.webkitRequestFullScreen();
    else if(canvasFull.mozRequestFullScreen)
        canvasFull.mozRequestFullScreen();
}

function handleTexture(texture, image)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
}
