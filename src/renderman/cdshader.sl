// Helper Functions >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

#define	s2pi sqrt(2 * PI)

/**
* wavelengthToRGB - Converts a given wavelength value into an RGB
* value.
**/
color
wavelengthToRGB
(
    // The wavelength to evaluate
    float wavelength;
)
{
    // TODO: Convert from the wavelength to an RGB value
    return color(0.0, 0.0, 0.0);
}

/**
* gaussianDelta - Defines the delta function for the Gaussian
* distribution.
* 
* G(x) = (1 / d*sqrt(2*PI)) * e^( -((x-m)^2)/(2d^2) )
* Defaults to standard normal distribution at 1
*
**/
float
gaussianDelta
( float x = 1, float deviation = 1, float mean = 0 )
{
	double a = 1 / (deviation * s2pi);
	double g = (x-mean)*(x-mean) / (2 * deviation * deviation);
	return a * exp(-g);
}

// SPD Mirror >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDmirror - Represents the mirror contribution to the specular
* power distribution of the surface.
**/
color
SPDmirror
(
    // TODO: Define arguments for the function
)
{
    // TODO: Compute the mirrored surface color for the cd
    return color(0.0, 0.0, 0.0);
}

// SPD Diffuse >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDdiffuse - Represents the diffuse contribution to the specular
* power distribution for the surface.
**/
color
SPDdiffuse
(
    // The normal point to use
    normal N;
)
{
    // Return the diffuse color
    return diffuse( normalize(N) );
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
color
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
    // The track SPD color
    color trackColor = 0;
    
    // The pit SPD color
    color pitColor = 0;
    
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
                    // Add their color contributions to the return color
                    trackColor += SPDtrack( lambda, n ) * wavelengthToRGB(lambda);
                    pitColor += SPDpit( lambda, m ) * wavelengthToRGB(lambda);
                }
            };
        };
    };
    
    // Return the color for the diffraction
    return trackColor * pitColor;
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
    float radiusOfHole = 0;
    
    // The radius of the disc for the cd
    float radiusOfDisc = 5.0;

    // The minimum wavelength for the cd shader
    float minimumWavelength = 0;
    
    // The maximum wavelength for the cd shader
    float maximumWavelength = 100;
    
    // The delta value for stepping between wavelengths
    float wavelengthDelta = 100;
    
    // The number of iterations for the diffraction (should be even)
    float iterations = 6;
)
{
    // Get the distance from the current point to the cd center
    float dist = distance( cdPosition, P );
    
    // If we're inside the cd
    if( dist <= radiusOfDisc && dist >= radiusOfHole )
    {
        // Set the wavelength for the minimum value
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
            color SPD =
                SPDmirror() +
                SPDdiffuse( N ) +
                SPDdiffraction( P, N, wavelength, iterations );
        }
    }
    else
    {
        // Set the opacity
        Oi = 0.0;
    }
    
    // Set the color and the opacity
    Ci = Cs * Oi;
}