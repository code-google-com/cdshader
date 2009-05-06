/* 
 * lab2.c
 *
 * Template application for Procedural Shading textures lab.  Based on trackball
 * demo from CGI.
 *
 */


#ifdef _WIN32
#include <windows.h>
#include <GL/glew.h>
#include <GL/glut.h>

// Defines to get things working on Windows XP with ARB extensions a bit painlessly (ignore warnings about redefinitions, it's a hack)
// Remember to 
#define GL_VERTEX_SHADER	GL_VERTEX_SHADER_ARB
#define GL_FRAGMENT_SHADER	GL_FRAGMENT_SHADER_ARB

#define glShaderSource		glShaderSourceARB
#define glCreateShader		glCreateShaderObjectARB
#define glCompileShader		glCompileShaderARB
#define glCreateProgram		glCreateProgramObjectARB
#define glAttachShader		glAttachObjectARB
#define glLinkProgram		glLinkProgramARB
#define glUseProgram		glUseProgramObjectARB

#define GLobject GLhandleARB

#else
#include <GLUT/glut.h>
#define GLobject GLuint
#endif

#include <math.h>
#include <assert.h>

#include "ShaderSetup.h"
void printShaderInfoLog(GLuint obj);
void printProgramInfoLog(GLuint obj);


#include <stdio.h>

#define bool int
#define false 0
#define true 1

int currentX;		// Current location of X
int	currentY;		// Current location of Y
int startX;			// Starting location of X
int	startY;			// Starting location of Y
int windowHeight;		// Current height of window
int windowWidth;		// Current width of window

float 	angle 		= 0.0; 
float	axis[3];
float 	lastPosition[3]	= { 0.0F, 0.0F, 0.0F };
float	trans[3];

bool 	redrawContinue 	= false;
bool    trackballMove 	= false;
bool 	trackingMouse 	= false;

// Scene will mimic the basic scene used in RenderMan exercises
//  Vertices and colors for drawing the objects in the scene
GLfloat WallColors[][3] = {
    { 1.0, 0.0, 0.0 }, { 1.0, 0.0, 0.0 }, { 1.0, 0.0, 0.0 }, 
    { 1.0, 0.0, 0.0 }
};

GLfloat WallVertices[][3] = {
    { -5.0,  5.0,  0.0 }, {  5.0, 5.0,  0.0 }, { 5.0,  -5.0,  0.0 }, 
    { -5.0,  -5.0,  0.0 }
};

GLfloat FloorColors[][3] = {
    { 1.0, 1.0, 0.5 }, { 1.0, 1.0, 0.5 }, { 1.0, 1.0, 0.5 }, 
    { 1.0, 1.0, 0.5 }
};

GLfloat FloorVertices[][3] = {
    { -5.0, -5.0,  5.0 }, {  5.0, -5.0,  5.0 }, { 5.0,  -5.0,  -5.0 }, 
    { -5.0, -5.0, -5.0 }
};

GLUquadricObj *sphere = NULL;


// Some global material properties
GLfloat no_mat[]            = { 0.0, 0.0, 0.0, 1.0 };
GLfloat mat_ambient[]       = { 0.7, 0.7, 0.1, 1.0 };
GLfloat mat_ambient_color[] = { 0.5, 0.5, 0.05, 1.0 };
GLfloat mat_diffuse[]       = { 0.5, 0.5, 0.05, 1.0 };
GLfloat mat_specular[]      = { 0.8, 0.8, 0.8, 1.0 };
GLfloat no_shininess[]      = { 0.0 };
GLfloat low_shininess[]     = { 5.0 };
GLfloat high_shininess[]    = { 100.0 };
GLfloat mat_emission[]      = { 0.3, 0.2, 0.2, 0.0 };


// Shader programs
GLobject strauss;

/**
 * Setup the shaders for the scene
 */
void setupShaders() {
	char *strauss_vs = NULL, *strauss_fs = NULL;
		
	FILE* strauss_vs_in = fopen("strauss.vert", "rt");
	if (strauss_vs_in) {
		fseek(strauss_vs_in, 0, SEEK_END);
		int size = ftell(strauss_vs_in);
		rewind(strauss_vs_in);
		strauss_vs = (char*)malloc((size + 1) * sizeof(char));
		if (strauss_vs) {
			fread(strauss_vs, sizeof(char), size, strauss_vs_in);
			strauss_vs[size] = '\0';
		
			puts("strauss_vs");
			puts(strauss_vs); fflush(stdout);
		}
		else {
			perror("strauss_vs");
			exit(1);
		}
		fclose(strauss_vs_in);	
	}
	
	FILE* strauss_fs_in = fopen("strauss.frag", "rt");
	if (strauss_fs_in) {
		fseek(strauss_fs_in, 0, SEEK_END);
		int size = ftell(strauss_fs_in);
		rewind(strauss_fs_in);
		strauss_fs = (char*)malloc((size + 1) * sizeof(char));
		if (strauss_fs) {
			fread(strauss_fs, sizeof(char), size, strauss_fs_in);
			strauss_fs[size] = '\0';
		
			puts("strauss_fs");
			puts(strauss_fs); fflush(stdout);
		}
		else {
			perror("strauss_fs");
			exit(1);
		}
				
		fclose(strauss_fs_in);
	}

	// Should have read in all the shaders now
	// Attach shaders to the scene
	GLobject strauss_vs_p, strauss_fs_p;
	strauss_vs_p = glCreateShader(GL_VERTEX_SHADER);
	strauss_fs_p = glCreateShader(GL_FRAGMENT_SHADER);
	
	const char *strauss_vs2 = strauss_vs, *strauss_fs2 = strauss_fs;
	
	glShaderSource(strauss_vs_p, 1, &strauss_vs2, NULL);
	glShaderSource(strauss_fs_p, 1, &strauss_fs2, NULL);
	
	free(strauss_vs); free(strauss_fs);
	
	glCompileShader(strauss_vs_p);
	puts("Compile strauss_vs");
	printShaderInfoLog(strauss_vs_p);
	glCompileShader(strauss_fs_p);
	puts("Compile strauss_fs");
	printShaderInfoLog(strauss_fs_p);
	
	strauss = glCreateProgram();
	glAttachShader(strauss, strauss_vs_p);
	glAttachShader(strauss, strauss_fs_p);
	glLinkProgram(strauss);
	puts("Link strauss");
	printProgramInfoLog(strauss);
}


/*  Initialize z-buffer, projection matrix, light source, 
 *  and lighting model.  Do not specify a material property here.
 */
void init( void ) {

   GLfloat ambient[]        = { 0.2, 0.2, 0.2, 1.0 };
   GLfloat diffuse[]        = { 1.0, 1.0, 1.0, 1.0 };
   GLfloat specular[]       = { 1.0, 1.0, 1.0, 1.0 };
#if 0
   GLfloat position[]       = { 0.0, 10.0, -8.0, 0.0 };
#else
   GLfloat position[]       = { 4.0, 10.0, -6.0, 0.0 };
#endif
   
   GLfloat lmodel_ambient[] = { 0.4, 0.4, 0.4, 1.0 };
   GLfloat local_view[]     = { 0.0 };

   glClearColor( 0.0, 0.1, 0.1, 0.0 );
   glEnable( GL_DEPTH_TEST );
   glShadeModel( GL_SMOOTH );

   glLightfv( GL_LIGHT0, GL_AMBIENT, ambient );
   glLightfv( GL_LIGHT0, GL_DIFFUSE, diffuse );
   glLightfv( GL_LIGHT0, GL_POSITION, position );
   glLightModelfv( GL_LIGHT_MODEL_AMBIENT, lmodel_ambient );
   glLightModelfv( GL_LIGHT_MODEL_LOCAL_VIEWER, local_view );

   glEnable( GL_LIGHTING );
   glEnable( GL_LIGHT0 );

}


/*
 *  The function draws your scene.  It will also apply the shader and attach it to
 *  correct primitive.  For sake of the example, the shader will be applied to the
 *  wall.
 */

void drawscene( void ) {

	glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

	glUseProgram(0); // disable programmable shaders
	
	// draw your floor
	glBegin( GL_POLYGON );
      glColor3fv(  FloorColors[0]   );
      glVertex3fv( FloorVertices[0] );

      glColor3fv(  FloorColors[1]   );
      glVertex3fv( FloorVertices[1] );

      glColor3fv(  FloorColors[2]   );
      glVertex3fv( FloorVertices[2] );

      glColor3fv(  FloorColors[3]   );
      glVertex3fv( FloorVertices[3] );
	glEnd( );

	// draw the wall -- don't forget to assign your texture coords
	glBegin( GL_POLYGON );
      glColor3fv(  WallColors[0]   );
	  glTexCoord2f (0.0, 0.0);
      glVertex3fv( WallVertices[0] );

      glColor3fv(  WallColors[1]   );
	  glTexCoord2f (0.0, 1.0);
      glVertex3fv( WallVertices[1] );

      glColor3fv(  WallColors[2]   );
	  glTexCoord2f (1.0, 1.0);
      glVertex3fv( WallVertices[2] );

      glColor3fv(  WallColors[3]   );
	  glTexCoord2f (1.0, 0.0);
      glVertex3fv( WallVertices[3] );
	glEnd( );

	glUseProgram(strauss);  // Use Strauss shader
	GLint surfaceColor = glGetUniformLocation(strauss, "surfaceColor");
	glUniform3f(surfaceColor, 1.0, 1.0, 0.0);
	GLint smoothness = glGetUniformLocation(strauss, "smoothness");
	glUniform1f(smoothness, 0.7);
	GLint metalness = glGetUniformLocation(strauss, "metalness");
	glUniform1f(metalness, 0.3);
	GLint transparency = glGetUniformLocation(strauss, "transparency");
	glUniform1f(transparency, 0.0);

	// draw the sphere
	if (!sphere) {
		sphere = gluNewQuadric();
		gluQuadricDrawStyle(sphere, GLU_FILL);
	}
	glPushMatrix();
		glTranslatef (0.0, 0.0, -2.0);

		// Apply material properties here and then use your shader program.
		glMaterialfv( GL_FRONT, GL_AMBIENT,   mat_ambient_color );
		glMaterialfv( GL_FRONT, GL_DIFFUSE,   mat_diffuse );
		glMaterialfv( GL_FRONT, GL_SPECULAR,  mat_specular );
		glMaterialfv( GL_FRONT, GL_SHININESS, high_shininess );
		glMaterialfv( GL_FRONT, GL_EMISSION,  no_mat );		

		gluSphere (sphere,2,100, 100);
	glPopMatrix();

}



/*
 * Display callback function - used for redisplay as well
 */

void display( void ) {

    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

    // View transform 
    if ( trackballMove ) {

        glRotatef( angle, axis[0], axis[1], axis[2] );

    }
	
    drawscene();

    glutSwapBuffers();
}



/*
 * Callback function for screen window resizing/reshaping
 */

void myReshape( int width, int height ) {

    glViewport( 0, 0, width, height );
    windowWidth = width;
    windowHeight = height;

}


/*
 * Main routine - GLUT setup and initialization
 */

int main( int argc, char **argv ) {

	// Initialize GLUT
    glutInit( &argc, argv );

    // Enable double buffering and depth buffering
	glutInitDisplayMode( GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH );
	glutInitWindowSize( 500, 500 );
	glutCreateWindow( argv[0] );

	// Callback functions are specified 
	glutReshapeFunc( myReshape );
	glutDisplayFunc( display );

	// enable depth testing
	glEnable( GL_DEPTH_TEST ); 
	glEnable (GL_BLEND);
	glBlendFunc(GL_SRC_ALPHA,GL_ONE_MINUS_SRC_ALPHA);

	// Camera stuff - matrix initialization
	glMatrixMode( GL_PROJECTION );
	glLoadIdentity( );
	gluPerspective (45, 1.0, 1.0, 100.0);

	glMatrixMode( GL_MODELVIEW );
	glLoadIdentity( );
	gluLookAt (0.0, 15.0, -15.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
	
#ifdef _WIN32
	// Initialize GLEW
	glewInit();
	if (GLEW_ARB_vertex_shader && GLEW_ARB_fragment_shader)
		printf("Ready for GLSL\n");
	else {
		printf("Not totally ready :( \n");
		exit(1);
	}
#endif

	setupShaders();
	
	init();
	
	// enter your display loop.
	glutMainLoop();
	
	return 0;
}


