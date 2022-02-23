attribute vec2 coords;

void main(void) {
    gl_Position = vec4(coords.xy, 0.0, 1.0);
}