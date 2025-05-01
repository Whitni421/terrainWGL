precision mediump float;

attribute vec3 vertPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main()
{
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vertPosition, 1.0);
}
