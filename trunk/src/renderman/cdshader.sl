// SPD Mirror >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDmirror - Represents the mirror contribution to the specular
* power distribution of the surface.
**/
color
SPDmirror
(

)
{

}

// SPD Diffuse >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDdiffuse - Represents the diffuse contribution to the specular
* power distribution for the surface.
**/
color
SPDdiffuse
(

)
{

}

// SPD Diffraction >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* SPDtrack - Represents the diffraction contribution of the tracks on
* the CD to the specular power distribution.
**/
float
SPDtrack
(

)
{

}

/**
* SPDpit - Represents the diffraction contribution of the pits on the
* CD to the specular power distribution.
**/
float
SPDpit
(

)
{

}

/**
* SPDdiffracton - Represents the diffraction contribution to the
* specular power distribution, collected by light scattering and
* diffracting on the surface.
**/
color
SPDdiffraction
(

)
{

}

// Helper Functions >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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

}

// Main Shader >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
* cdshader - The main shader function for the surface of the shader.
**/
surface
cdshader
(
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
    
    // The number of iterations for the diffraction
    float iterations = 1;
)
{
    // Loop through the wavelengths
    for
    (
        // Set the wavelength for the minimum value
        float wavelength = minimumWavelength;
        
        // Do so until we are above the maximum wavelength
        wavelength <= maximumWavelength;
        
        // Increment by delta
        wavelength += wavelengthDelta;
    )
    {
        // Get the total SPD value for the cd shader
        color SPD = SPDmirror() + SPDdiffuse() + SPDdiffraction();
    }
    
}