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
( float SPD; float wavelength;)
{
	float X = getCIEcmX(wavelength);
	float Y = getCIEcmY(wavelength);
	float Z = getCIEcmZ(wavelength);
	
	// X part of CIE equation
    float hue = SPD * X;
    
    // Y part of CIE equation
    float saturation = SPD * Y;
    
    // Z part of CIE equation
    float zval = SPD * Z;
    
    color CIEcolor = color "xyz" (hue, saturation, zval);
    color r = ctransform("rgb", CIEcolor);
    
    return r;
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
	return a * exp(-g);
}

// SPD Mirror >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDmirror - Represents the mirror contribution to the specular
* power distribution of the surface.
*
* This is currently just the Ks value from Phong shading, but 
* we may want to change it in the future, so this function may not
* be useless.
**/
float
SPDmirror
(
	// Specular component
    float m;
)
{
    // TODO: Compute the mirrored surface color for the cd
    return m;
}

// SPD Diffuse >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDdiffuse - Represents the diffuse contribution to the specular
* power distribution for the surface.
*
* This is currently just the Kd value from Phong shading, but 
* we may want to change it in the future, so this function may not
* be useless.
**/
float
SPDdiffuse
(
	// Diffuse component
    float d;
)
{
    // Return the diffuse contribution
    return d;
}

// SPD Diffraction >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDtrack - Represents the diffraction contribution of the tracks on
* the CD to the specular power distribution.
**/
float
SPDtrack
(
    // TODO: Define arguments for the function
    
    // The wavelength lambda of the light
    float lambda;
    
    // The current spike intensity iteration value
    float n;
)
{
    // TODO: Compute the SPD value for the track contribution
    return 0.0;
}

/**
* SPDpit - Represents the diffraction contribution of the pits on the
* CD to the specular power distribution.
**/
float
SPDpit
(
    // TODO: Define arguments for the function
    
    // The wavelength lambda of the light
    float lambda;
    
    // The current spike intensity iteration value
    float m;
)
{
    // TODO: Compute the SPD value for the pit contribution
    return 0.0;
}

/**
* SPDdiffracton - Represents the diffraction contribution to the
* specular power distribution, collected by light scattering and
* diffracting on the surface.
**/
float
SPDdiffraction
(
    // The Point
    point P;
    
    // The normal
    normal N;
    
    // The wavelength of light
    float lambda;
    
    // The number of iterations for the spike intensity
    float iterations;
)
{
    // The track SPD
    float trackSPD = 0;
    
    // The pit SPD color
    float pitSPD = 0;
    
    // The normal
    normal Nn = normalize(N);
    
    // The light normal
    vector Ln;
    
    // Get the iteration half-way value
    float iterationHalf = ceil(iterations / 2);
        
    // The current track and pit iterations
    float n = 0.0, m = 0.0;
    
    // TODO: Decide if track separation should be a passed in parameter or generated value
    // The track separation
    float trackSeparation = 30;
    
    // TODO: Decide if track separation should be a passed in parameter or generated value
    // The pit separation
    float pitSeparation = 900;

    // Illuminate
    illuminance( P, Nn, PI/2 )
    {
        // Get the light normal
        Ln = normalize(L);
        
        // Loop through for the iterations
        for
        (
            // The current iteration for the track
            n = -iterationHalf;
            
            // Compare versus the max value of the iteration
            n <= iterationHalf;
            
            // Increment
            n += 1.0
        )
        {
            // Loop through for the pit
            for
            (
                // The current iteration for the track
                m = -iterationHalf;
            
                // Compare versus the max value of the iteration
                m <= iterationHalf;
            
                // Increment
                m += 1.0
            )
            {
                // TODO: Get the comparison values to see if we have a contribution
                float trackComparator = 0.0;
                float pitComparator = 0.0;
                
                // If the values are equal to 0
                if( trackComparator == 0.0 && pitComparator == 0.0 )
                {
                    // Add their contributions to the return value
                    trackSPD += SPDtrack( lambda, n );
                    pitSPD += SPDpit( lambda, m );
                }
            };
        };
    };
    
    // Return the color for the diffraction
    return trackSPD * pitSPD;
}

// Main Shader >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
    float minimumWavelength = 360;
    
    // The maximum wavelength for the cd shader
    float maximumWavelength = 830;
    
    // The delta value for stepping between wavelengths
    float wavelengthDelta = 100;
    
    // The number of iterations for the diffraction (should be even)
    float iterations = 6;
    
    // Phong variables
    float Ka = 0.5;
    float Kd = 0.5;
    float Ks = 1;
    float roughness = 0.1;
	color specularcolor = 1;
)
{
    // Get the distance from the current point to the cd center
    float dist = distance( cdPosition, P );
    color Cdisc = 0;
    
    // If we're inside the cd
    if( dist <= radiusOfDisc && dist >= radiusOfHole )
    {
        // Set the wavelength for the minimum value
        float wavelength = 0.0;
    
        // Loop through the wavelengths
        for
        ( wavelength = minimumWavelength; 
          wavelength <= maximumWavelength; 
          wavelength += wavelengthDelta ) {
            // Get the total SPD value for the cd shader
            float SPD =
                SPDmirror(Ks) +
                SPDdiffuse(Kd) +
                SPDdiffraction( P, N, wavelength, iterations );
        
        	// Use the total SPD to get the color contribution
        	Cdisc += convertColor(SPD, wavelength);
        }
    }
    else 
    {
        // Set the opacity
        Oi = 0.0;
    }

    // Set the color and the opacity
    normal Nf = faceforward (normalize(N),I);
    color phongcontrib = (Ka*ambient() + Kd*diffuse(Nf)) +
	 	specularcolor * Ks*specular(Nf,-normalize(I),roughness);
    Ci = Cdisc * phongcontrib * Oi;
}