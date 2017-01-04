var RenderObject = function(transform, color, shader, buffer, indexBuffer, normalBuffer, animationFunction)
{
	this.transform = transform;
	this.color = color;
	this.shader = shader;
	this.buffer = buffer;
	this.indexBuffer = indexBuffer;
	this.normalBuffer = normalBuffer;
	
	this.animationFunction = function() {};
	if(typeof animationFunction === 'function') {
	    this.animationFunction = animationFunction;
	}
	
	this.rotationY = 0.01;
	this.rotationX = 0.01;
	this.rotationZ = 0.01;
}

RenderObject.prototype.rotate = function(angle, axis) 
{
	mat4.rotate(this.transform, this.transform, angle, axis);
}

RenderObject.prototype.scale = function(scaleVector) 
{
	mat4.scale(this.transform, this.transform, scaleVector);
}

RenderObject.prototype.move = function(directionVector) 
{
	mat4.translate(this.transform, this.transform, directionVector);
}
