/**
 * cd.vert
 * CD shader (vertex shader)
 * Author: Benjamin Richards (bdr9025)
 * Procedural Shading Project
 */


//attribute vec3 Tangent;     // parallel to grating lines at each vertex
varying vec3 normal, lightDir, eyeVec, P;
varying vec2 P_tex;


// Main function
void main() {
     // from plastic shader in lab1
     vec3 LightPos = gl_LightSource[0].position.xyz;
     normal = gl_NormalMatrix * gl_Normal;
     P = vec3(gl_ModelViewMatrix * gl_Vertex);
     lightDir = LightPos - P;
     eyeVec = -P;
	
	// Point we're shading in texture space
	P_tex = vec2(gl_TextureMatrix[3] * gl_Vertex);
	
	gl_Position = ftransform();
}
