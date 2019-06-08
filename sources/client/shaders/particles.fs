precision lowp float;

uniform sampler2D texture;

varying vec4 _color;

void main() {
	gl_FragColor = texture2D(texture, gl_PointCoord) * _color;
}