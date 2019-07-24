precision lowp float;

varying vec2 vUV;

uniform sampler2D scene_pass;
uniform sampler2D curves_pass;
uniform sampler2D background_texture;
uniform float map_scale;
uniform float aspect;
uniform vec3 camera;
uniform vec2 offset;//unsuded here

vec4 combined(in vec2 uv) {
	vec4 foreground = texture2D(scene_pass, uv);
	return mix(texture2D(curves_pass, uv), foreground, foreground.a);
}

void main() {
	vec4 scene = combined(vUV);//texture2D(scene_pass, vUV);
	
	if(scene.a == 1.0) {//optimization
		gl_FragColor = scene;
		return;
	}
	
	vec2 tile_coord = vec2(
		((vUV.x-0.5)*aspect / camera.z + (camera.x+map_scale)/2.0)/map_scale,
		((vUV.y-0.5) / camera.z + (camera.y+map_scale)/2.0)/map_scale
	);
	
	vec3 background_tex = texture2D(background_texture, tile_coord/*, -5.0*/).rgb;
	
	gl_FragColor = vec4(mix(background_tex, scene.rgb, scene.a), 1.);
}