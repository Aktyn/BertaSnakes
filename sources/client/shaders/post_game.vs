precision lowp float;

attribute vec2 position;
attribute vec2 uv;//uv texture coordinates

varying vec2 vUV;

void main() {
	gl_Position = vec4(position.x, position.y, 0.0, 1.0);
	vUV = uv;
}