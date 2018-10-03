precision lowp float;

attribute vec3 position;

attribute vec4 color;
varying vec4 _color;

uniform float screen_height;
uniform float aspect;

uniform vec3 camera;

void main() {
	gl_PointSize = screen_height * position.z * camera.z;

	vec2 pos = (position.xy - camera.xy) * camera.z;
	gl_Position = vec4(pos.x / aspect, pos.y, 0., 1.);

	_color = color;
}