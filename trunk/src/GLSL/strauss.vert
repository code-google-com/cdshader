// strauss.vert
// Strauss vertex shader for GLSL

varying vec3 normal, lightDir, view;

void main(void) {
	normal = normalize(gl_NormalMatrix * gl_Normal);
	lightDir = normalize(vec3(gl_LightSource[0].position));
	
	//reflect = normalize(reflect(-lightDir, normal));
	view = normalize(vec3(gl_ModelViewMatrix * gl_Vertex));
	
	gl_Position = ftransform();
}
