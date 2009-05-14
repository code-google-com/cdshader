/**
 * cd.vert
 * CD shader (vertex shader)
 * Author: Benjamin Richards (bdr9025)
 * Procedural Shading Project
 */


//attribute vec3 Tangent;     // parallel to grating lines at each vertex
varying vec3 normal, lightDir, eyeVec, P;


// Main function
void main() {
     // from plastic shader in lab1
     vec3 LightPos = vec3 (0.0, 5.0, -15.0);
     normal = gl_NormalMatrix * gl_Normal;
     vec3 vVertex = vec3(gl_ModelViewMatrix * gl_Vertex);
     lightDir = LightPos - vVertex;
     eyeVec = -vVertex;
	
	// Point shading in texture space
	P = vec3(gl_TextureMatrix[2] * gl_Vertex);
	
	gl_Position = ftransform();
}
