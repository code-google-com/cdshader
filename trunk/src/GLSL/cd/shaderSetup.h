/**
 * Auxillary function to set up a GLSL shader program.  requires the name of a vertex program and a fragment
 * program.  Returns a handle to the created GLSL program
 *
 * vert - Name of source file for vertex program
 * frag - Name of source file for fragment program
 */

GLuint setUpAShader (char *vert, char *frag);