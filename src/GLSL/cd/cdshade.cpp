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


#define CDenabled 1


int currentX;		// Current location of X
int	currentY;		// Current location of Y
int startX;			// Starting location of X
int	startY;			// Starting location of Y
int windowHeight;		// Current height of window
int windowWidth;		// Current width of window

float 	angle 		= 0.0; 
float	axis[3]		= { 0.0, 0.0, 0.0 };
float 	lastPosition[3]	= { 0.0F, 0.0F, 0.0F };
float	trans[3];

bool 	redrawContinue 	= false;
bool    trackballMove 	= false;
bool 	trackingMouse 	= false;

// Scene will mimic the basic scene used in RenderMan exercises
//  Vertices and colors for drawing the objects in the scene
GLfloat WallColors[][3] = {
    { 1.0, 1.0, 1.0 }, { 1.0, 1.0, 1.0 }, { 1.0, 1.0, 1.0 }, 
    { 1.0, 1.0, 1.0 }
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
GLobject cd;

/**
 * Setup the shaders for the scene
 */
void setupShaders() {
	char *cd_vs = NULL, *cd_fs = NULL;
		
	FILE* cd_vs_in = fopen("cd.vert", "rt");
	if (cd_vs_in) {
		fseek(cd_vs_in, 0, SEEK_END);
		int size = ftell(cd_vs_in);
		rewind(cd_vs_in);
		cd_vs = (char*)malloc((size + 1) * sizeof(char));
		if (cd_vs) {
			fread(cd_vs, sizeof(char), size, cd_vs_in);
			cd_vs[size] = '\0';
		
			puts("cd_vs");
			puts(cd_vs); fflush(stdout);
		}
		else {
			perror("cd_vs");
			exit(1);
		}
		fclose(cd_vs_in);	
	}
	
	FILE* cd_fs_in = fopen("cd.frag", "rt");
	if (cd_fs_in) {
		fseek(cd_fs_in, 0, SEEK_END);
		int size = ftell(cd_fs_in);
		rewind(cd_fs_in);
		cd_fs = (char*)malloc((size + 1) * sizeof(char));
		if (cd_fs) {
			fread(cd_fs, sizeof(char), size, cd_fs_in);
			cd_fs[size] = '\0';
		
			puts("cd_fs");
			puts(cd_fs); fflush(stdout);
		}
		else {
			perror("cd_fs");
			exit(1);
		}
				
		fclose(cd_fs_in);
	}

	// Should have read in all the shaders now
	// Attach shaders to the scene
	GLobject cd_vs_p, cd_fs_p;
	cd_vs_p = glCreateShader(GL_VERTEX_SHADER);
	cd_fs_p = glCreateShader(GL_FRAGMENT_SHADER);
	
	const char *cd_vs2 = cd_vs, *cd_fs2 = cd_fs;
	
	glShaderSource(cd_vs_p, 1, &cd_vs2, NULL);
	glShaderSource(cd_fs_p, 1, &cd_fs2, NULL);
	
	free(cd_vs); free(cd_fs);
	
	glCompileShader(cd_vs_p);
	puts("Compile cd_vs");
	printShaderInfoLog(cd_vs_p);
	glCompileShader(cd_fs_p);
	puts("Compile cd_fs");
	printShaderInfoLog(cd_fs_p);
	
	cd = glCreateProgram();
	glAttachShader(cd, cd_vs_p);
	glAttachShader(cd, cd_fs_p);
	glLinkProgram(cd);
	puts("Link cd");
	printProgramInfoLog(cd);
}


// Light position
#if 0
   GLfloat position[]       = { 0.0, 10.0, -6.0, 0.0 };
#else
   GLfloat position[]       = { 0.0, 2.0, -6.0, 0.0 };
#endif


/*  Initialize z-buffer, projection matrix, light source, 
 *  and lighting model.  Do not specify a material property here.
 */
void init( void ) {

   GLfloat ambient[]        = { 0.2, 0.2, 0.2, 1.0 };
   GLfloat diffuse[]        = { 1.0, 1.0, 1.0, 1.0 };
   GLfloat specular[]       = { 1.0, 1.0, 1.0, 1.0 };
   
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
	
	// Rotate
	glRotatef( angle, axis[0], axis[1], axis[2] );

	// draw the wall -- don't forget to assign your texture coords
	glUseProgram(cd);  // Use cd shader
	GLint Center = glGetUniformLocation(cd, "Center");
	glUniform3f(Center, 0.0, 0.0, 0.0);
	GLint DiscR = glGetUniformLocation(cd, "DiscR");
	glUniform1f(DiscR, 5.0);	// radius of whole disc
	GLint HoleR = glGetUniformLocation(cd, "HoleR");
	glUniform1f(HoleR, 1.0);	// radius of hole in the middle

	glMaterialfv( GL_FRONT, GL_AMBIENT,   mat_ambient_color );
	glMaterialfv( GL_FRONT, GL_DIFFUSE,   mat_diffuse );
	glMaterialfv( GL_FRONT, GL_SPECULAR,  mat_specular );
	glMaterialfv( GL_FRONT, GL_SHININESS, high_shininess );
	glMaterialfv( GL_FRONT, GL_EMISSION,  no_mat );		

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

	glPushMatrix();
	glLoadIdentity();
	glUseProgram(0); // disable programmable shaders
	glPointSize(3.0);
	glBegin(GL_POINTS);
		glColor4f(1.0, 0.0, 0.0, 1.0);
		glVertex3fv(position);
	glEnd();
	glPopMatrix();
}



/*
 * Display callback function - used for redisplay as well
 */

void display( void ) {

    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
	
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


// Keyboard press
void keyboard(unsigned char c, int x, int y) {
	if (c == (char)27) {
		exit(0);
	}
	else if (c == 'a') {
		angle = 1.0;
		axis[1] = 1.0;
		axis[2] = axis[0] = 0.0;
	}
	else if (c == 'd') {
		angle = -1.0;
		axis[1] = 1.0;
		axis[2] = axis[0] = 0.0;
	}
	else if (c == 'w') {
		angle = -1.0;
		axis[0] = 1.0;
		axis[1] = axis[2] = 0.0;
	}
	else if (c == 's') {
		angle = 1.0;
		axis[0] = 1.0;
		axis[1] = axis[2] = 0.0;
	}
	else if (c == 'p') {
		printf("angle = %f\n", angle);
		printf("axis[0] = %f, axis[1] = %f, axis[2] = %f\n", axis[0], axis[1], axis[2]);
	}

	glutPostRedisplay();
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
	glutKeyboardFunc( keyboard );

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


