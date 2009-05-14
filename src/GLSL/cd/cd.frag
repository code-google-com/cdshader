/**
 * cd.frag
 * CD shader (fragment shader)
 * Author: Benjamin Richards (bdr9025)
 * Procedural Shading Project
 */

varying vec3 normal, lightDir, eyeVec, P;

uniform vec3 Center;     // Center of disc
uniform float DiscR;     // radius of disc
uniform float HoleR;     // radius of hole in disc


// map a visible wavelength [nm] to OpenGL's RGB representation
// Took from example in the book
vec3 lambda2rgb(float lambda)
{
    const float ultraviolet = 400.0;
    const float infrared    = 700.0;

    // map visible wavelength range to 0.0 -> 1.0
    float a = (lambda-ultraviolet) / (infrared-ultraviolet);

    // bump function for a quick/simple rainbow map
    const float C = 7.0;        // controls width of bump
    vec3 b = vec3(a) - vec3(0.75, 0.5, 0.25);
    return max((1.0 - C * b * b), 0.0);
}

void main(void) {     
     // Convert coordinate system
     //float theta = atan((P.y - Center.y) / (P.x - Center.x));
     float r = sqrt(pow(P.x - Center.x, 2.0) + pow(P.y - Center.y, 2.0));
               
     if (r <= HoleR || r > DiscR)
     {
          // Transparent
          gl_FragColor = vec4(0.0);
     }
     else
     {
          // Implement CD shader here...
          
          
          // Taken from plastic shader in lab1
          vec4 final_color = vec4(0.3, 0.3, 0.3, 1.0);
                    
          vec3 N = normalize(normal);
          vec3 L = normalize(lightDir);
          float lambertTerm = dot(N,L);
          
          vec4 LightSource = vec4 (1.0, 1.0, 1.0, 1.0);
          vec4 diffuse = vec4 (0.8, 0.8, 0.0, 1.0);
          vec4 specColor = vec4 (1.0, 1.0, 1.0, 1.0);
          float shininess = 50.0;
          if(lambertTerm > 0.0)
          {
               final_color += LightSource * diffuse * lambertTerm;
               vec3 E = normalize(eyeVec);
               vec3 R = reflect(-L, N);
               float specular = pow( max(dot(R, E), 0.0), shininess);
               final_color += LightSource * specColor * specular;
          }
          gl_FragColor = final_color;
     }     
}

// From example CD shader in book:
	/*
    // extract positions from input uniforms
    vec3 lightPosition = gl_LightSource[0].position.xyz;
    vec3 eyePosition   = -osg_ViewMatrix[3].xyz / osg_ViewMatrix[3].w;

    // H = halfway vector between light and viewer from vertex
    vec3 P = vec3(gl_ModelViewMatrix * gl_Vertex);
    vec3 L = normalize(lightPosition - P);
    vec3 V = normalize(eyePosition - P);
    vec3 H = L + V;

    // accumulate contributions from constructive interference
    // over several spectral orders.
    vec3 T  = gl_NormalMatrix * Tangent;
    float u = abs(dot(T, H));
    vec3 diffColor = vec3(0.0);
    const int numSpectralOrders = 3;
    for (int m = 1; m <= numSpectralOrders; ++m)
    {
        float lambda = GratingSpacing * u / float(m);
        diffColor += lambda2rgb(lambda);
    }

    // compute anisotropic highlight for zero-order (m = 0) reflection.
    vec3  N = gl_NormalMatrix * gl_Normal;
    float w = dot(N, H);
    float e = SurfaceRoughness * u / w;
    vec3 hilight = exp(-e * e) * HighlightColor;

    // write the values required for fixed function fragment processing
    const float diffAtten = 0.8; // attenuation of the diffraction color
    gl_FrontColor = vec4(diffAtten * diffColor + hilight, 1.0);
    gl_Position = ftransform();
    */