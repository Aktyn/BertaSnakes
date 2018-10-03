precision lowp float;

varying vec2 vUV;

uniform sampler2D scene_pass;
uniform sampler2D curves_pass;
uniform vec3 background_color;//background color
uniform vec2 offset;//normalized flipped resolution
uniform float shadow_length;

#define SHADOW_TRANSPARENCY 0.15//0.15
#define SAMPLES 20
#define SAMPLESf 20.0
#define PARALAX_VALUE 1.5

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

    vec2 paralax = 0.1 * shadow_length * offset * 
        vec2(-(vUV.x * 2.0 - 1.0), vUV.y * 2.0 - 1.0) * PARALAX_VALUE;

    float STEP = 1.0 / SAMPLESf;
    float ll = STEP;
    float darkness_factor = 1.0;
    float sh = scene.a;
    for(int i=1; i<=SAMPLES; i++) {
        vec4 curve = texture2D(curves_pass, vUV+paralax*ll);
        if( curve.a  > 0.0 ) {
            if(curve.a > sh) {
                sh = curve.a;
                scene.rgb = curve.rgb;

                if(i == 1)
                    darkness_factor = 0.9;
                else if(i == 2)
                    darkness_factor = 0.9;
                else if(i == 3)
                    darkness_factor = 0.9;
                else if(i == 4)
                    darkness_factor = 0.866666;
                else if(i == 5)
                    darkness_factor = 0.833333;
                else
                    darkness_factor = 0.8;
            }
        }

        ll += STEP;
    }
    scene.rgb *= darkness_factor;
    scene.a = sh;
    
    float shadow = combined(vUV + paralax+offset*shadow_length*0.1).a * SHADOW_TRANSPARENCY - scene.a;

    gl_FragColor = vec4(mix(background_color * (1.-shadow), scene.rgb, scene.a), 1.);
}