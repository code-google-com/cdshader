// Helper Functions >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
#include "CIEstd.h"
#define	s2pi sqrt(2 * PI)

/**
* convertColor - Converts the calculated SPD value to CIE using
* the CIE standard illuminant values, and then to RGB
*
* See: http://hyperphysics.phy-astr.gsu.edu/HBASE/vision/colper.html
*
* This describes using the SPD to determine the CIE value, which 
* can then be fairly easily converted to RGB
**/
color
convertColor
( float wavelength;)
{
    uniform float ultraviolet = 360.0;
    uniform float infrared    = 830.0;

    // map visible wavelength range to 0.0 -> 1.0
    float a = (wavelength-ultraviolet) / (infrared-ultraviolet);

    // bump function for a quick/simple rainbow map
    uniform float C = 7.0;        // controls width of bump
    color b = color( a ) - color(0.75, 0.5, 0.25);
    return max( (1.0 - C * b * b), color(0.0));
}

/**
* gaussianDelta - Defines the delta function for the Gaussian
* distribution.
* 
* G(x) = (1 / d*sqrt(2*PI)) * e^( -((x-m)^2)/(2d^2) )
* Defaults to standard normal distribution at 1
*
**/
float gaussianDelta ( float x; float deviation; float mean; ) {
    float a = 1 / (deviation * s2pi);
    float g = (x-mean)*(x-mean) / (2 * deviation * deviation);
    //printf("X: %f, Dev: %f, Mean: %f\n", x, deviation, mean );
    return a * exp(-g);
}

// SPD Diffraction >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDdiffracton - Represents the diffraction contribution to the
* specular power distribution, collected by light scattering and
* diffracting on the surface.
**/
float
SPDdiffraction
(
    // The current point
    point P;
    
    // The normal vector point
    vector N;
    
    // The view angle
    vector V;
    
    // The position of the cd in space
    point cdPos;
    
    // The wavelength of the current light
    float wavelength;
    
    // The number of iterations to use
    float iterations;
)
{
    // The return value
    float spd = 0.0;
    float spdHi = 0.0;
    
    // Get the x and y axis of the light
    vector x = vector normalize( cdPos - P );
    vector y = vector normalize( N ^ x );
    
    // The light position
    vector Lp = transform( "world", "current", vector (0, 0, 10) );
    
    // Get the light direction
    vector Ld = Lp - P;
    
    // Illuminate the scene
    illuminance( P, normalize(faceforward( N, V )), PI / 2 )
    {
        // Set the light position vector
        //Ld = L;// - P;
        
        // Get the additive diffraction values
        float u = abs(Ld.x);
        float v = abs(Ld.y);
        
        // The iteration values
        float iter = 0.0;
    
        // The length of Ld
        float Ll = length( Ld );
        
        // Now utilize the values to get the diffraction constants
        for ( iter = 1.0; iter <= iterations; iter += 1.0 )
        {    
            // Get the angle between the light and the normal
            float angleCos2 = normalize( Ld ).normalize( N );
    
            // If the angle value is right
            if( angleCos2 <= wavelength * iter && iter != 0 )
            {
                // Utilize the iteration value, 1 over it to diffract
               spdHi += (2 * PI) / (iter * u * v * wavelength) / 10.0;
               spd += gaussianDelta( abs(( 2 * PI ) / iter * u * v * wavelength), abs(iter), abs(60.0 * iter) ) * 2.0;
           }
        }
    }

    // Return the value
    return abs(spdHi + spd);
}

// Main Shader >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* phDiffuse - Performs the diffuse calculation for a phong shader.
**/
color
phDiffuse
(
	/* The surface normal */
	normal Nn;
)
{
    /* External P */
    extern point P;

	/* The return color */
	color retVal = 0;
	
	/* Define the illuminance function */
	illuminance( P, Nn, PI/2 ) 
	{
		/* Set the return value */
		retVal += Cl * (Nn . normalize(L));
	}
		
	/* Return */
	return retVal;
}

/**
* phSpecular - Performs the specular calculation for a phong shader.
**/
color
phSpecular
(
	/* The surface normal */
	normal Nn;
	
	/* The view vector */
	vector V;
	
	/* The roughness value */
	float roughness;
)
{
    /* Point P to use */
    extern point P;

	/* The return value */
	color retVal = 0;
	
	/* The reflection and to light vectors */
	vector R, toLight;
	
	/* Define the illuminance function */
	illuminance( P, Nn, PI/2 )
	{		
        /* The reflection vector */
	    R = reflect( normalize(L), -Nn );
    
		/* Set the return value */
		retVal += Cl * pow( max( 0.0, R . normalize(V) ), 1.0 / roughness);
	}

	/* Return */
	return retVal;
}

color
realPhong
(
    // The ambient part to use
    float Ka;
    
    // The diffuse part to use
	float Kd;
    
    // The specular part to use
	float Ks;
    
    // The rughness to use
	float roughness;
    
    // The normal to use
    normal Nf;
    
)
{
    // Return the phong light color
    return Ka * ambient() +
           Kd * phDiffuse(Nf) +
           Ks * phSpecular(Nf, I, roughness);
}

/**
* cdshader - The main shader function for the surface of the shader.
**/
surface
cdshader
(
    // The position of the cd in space
    point cdPosition = point "shader" (0, 0, 0);

    // The radius of the hole for the cd
    float radiusOfHole = 2.0;
    
    // The radius of the disc for the cd
    float radiusOfDisc = 8.0;

    // The minimum wavelength for the cd shader
    float minimumWavelength = 380;
    
    // The maximum wavelength for the cd shader
    float maximumWavelength = 830;
    
    // The delta value for stepping between wavelengths
    float wavelengthDelta = 10;
    
    // The number of iterations for the diffraction
    float iterations = 30;
    
    // The ambient component
    float Ka = 0.1;
    
    // The mirror component value
    float Km = 0.1;
    
    // The diffuse component value
    float Kd = 0.3;
    
    // The deffraction component
    float Kf = 1.0;
    
    // The roughness value
    float roughness = 0.1;
)
{
    // Get the distance from the current point to the cd center
    float dist = distance( cdPosition, P );
    
    // The return color
    color SPD = color (0.0);
    
    // If the distance is correct
    if( dist >= radiusOfHole && dist <= radiusOfDisc )
    {
        // The current wavelength value
        float wavelength = 0.0;

        // Loop through the wavelengths
        for
        (
           // Set the wavelength for the minimum value
           wavelength = minimumWavelength;
        
           // Do so until we are above the maximum wavelength
           wavelength <= maximumWavelength;
        
          // Increment by delta
          wavelength += wavelengthDelta
        )
        {
            // Get the total SPD value for the cd shader
            SPD += Kf *
                SPDdiffraction( P, N, I, cdPosition, wavelength, iterations ) *
                convertColor( wavelength );
        }
    
        // Add the color of the ambient, diffuse, and mirror
        SPD += realPhong( Ka, Kd, Km, roughness, normalize(faceforward( N, I )) ) * Cs;
    }
    
    // Set the return value
    Oi = Os;
    Ci = SPD * Oi;
}