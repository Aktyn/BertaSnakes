precision mediump float;

varying vec2 vUV;

uniform sampler2D sampler;
uniform vec4 color;

void main() {
    vec4 texture = texture2D(sampler, vUV);
	gl_FragColor =  texture * color;
}