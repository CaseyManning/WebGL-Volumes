precision highp float;
          
uniform vec4 mr;

void main(void) {
    vec2 p = gl_FragCoord.xy;
    vec2 q = (p + p - mr.ba) / mr.b;
    for(int i = 0; i < 13; i++) {
        q = abs(q)/dot(q,q) -  mr.xy/mr.zw;
    }
    gl_FragColor = vec4(q, q.x/q.y, 1.0);
}