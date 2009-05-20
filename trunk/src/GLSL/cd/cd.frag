/**
 * cd.frag
 * CD shader (fragment shader)
 * Author: Benjamin Richards (bdr9025)
 * Procedural Shading Project
 */

varying vec3 normal;	// normal to point we are shading
varying vec3 lightDir;	// vector from light source to current point
varying vec3 eyeVec;		// vector from current point to eye
varying vec3 P;			// coordinates of point
varying vec2 P_tex;		// 2D coordinates of current point in texture space

uniform vec3 Center;	// Center of disc
uniform float DiscR;	// radius of disc
uniform float HoleR;	// radius of hole in disc

uniform float Llength;		// Length of line light source
//uniform L;					// Orientation is determined by taking lightDir x eyeVec so that it is fixed as a line source

uniform float a;		// track separation distance
uniform float b;		// pit sequence length (varies between 900nm and 3300nm in steps of 300nm)

uniform float LambdaI;		// Starting wavelength (400 nm)
uniform float LambdaStep;	// Step value (50nm)
uniform float LambdaF;		// Final wavelength value, do not exceed (700nm)

float PI = 3.14159;	// constant PI value


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

// Parameterized description of the linear light source (based on egholm, eq 5)
vec3 S(float t)
{
	vec3 t_vec = cross(normalize(lightDir), normalize(eyeVec));	// Direction (orientation) of line light
	vec3 L = gl_LightSource[0].position.xyz;
	return L + (t_vec * t);
}

float gauss(float x)
{
	float sqrt_variance = 1.0;
	float expected_val = 1.0;
	float a = 1.0 / (sqrt_variance * sqrt(2.0 * PI));
	float b = expected_val;
	float c = sqrt_variance;
	
	return a * exp(-pow(x - b, 2.0) / (2.0 * pow(c, 2.0)));
}

float spd_track(vec3 q, vec3 L, vec3 k2_uv, float t, vec3 t_uv, float lambda)
{
	float spd = 0.0;
	// loop through some values
	for (float n = -2.0; n <= 2.0; n += 1.0)
	{
		// condition:
		//   a * ((2 * PI) / lambda) * (Ax + Bx * t) - 2 * PI * n == 0      AND
		//   b * ((2 * PI) / lambda) * (Ay + By * t) - 2 * PI * m == 0
		vec3 A = (P - L) / Llength - k2_uv;
		vec3 B = t_uv / Llength;
		float equation_14 = a * ((2 * PI) / lambda) * (A.x + B.x * t) - 2 * PI * n;
		
		if (equation_14 == 0)	// must be true for there to be a contribution by this.
		{
			spd += 2.0 * gauss(a * q.x - 2.0 * PI * n);
		}
	}
	
	return spd;
}

float spd_pit(vec3 q, vec3 L, vec3 k2_uv, float t, vec3 t_uv, float lambda)
{
	float spd = 0.0;
	// loop through some values
	for (float m = -2.0; m <= 2.0; m += 1.0)
	{
		// condition:
		//   a * ((2 * PI) / lambda) * (Ax + Bx * t) - 2 * PI * n == 0      AND
		//   b * ((2 * PI) / lambda) * (Ay + By * t) - 2 * PI * m == 0
		vec3 A = (P - L) / Llength - k2_uv;
		vec3 B = t_uv / Llength;
		float equation_15 = b * ((2 * PI) / lambda) * (A.y + B.y * t) - 2 * PI * m;
		
		if (equation_15 == 0.0)	// must be true for there to be a contribution by this.
		{
			spd += 2.0 * gauss(b * q.y - 2.0 * PI * m);
		}
	}
	
	return spd;
}

vec3 spd_mirror()
{
	return vec3(0.0);
}

vec3 spd_diffraction()
{
	vec3 finalcolor = vec3(0.0);
	
	//loop through all wavelengths and add up final color based on spd_pit*spd_track*rgb, return
	for (float lambda = LambdaI; lambda <= LambdaF; lambda += LambdaStep)
	{
		// unit vectors
		vec3 t_uv = cross(normalize(lightDir), normalize(eyeVec));	// Direction (orientation) of line light
		vec3 L = gl_LightSource[0].position.xyz;	// Light position
		
		for (float t = 0; t < Llength; t += (Llength / 10.0))
		{
			vec3 k2_uv = normalize((-P) / abs(-P));
			vec3 k1_uv = (P - L) / Llength - t_uv / Llength * t;	// must loop through t from 0 to Llength
		
			vec3 k1 = (1.0 / lambda) * (k1_uv - k2_uv);
			vec3 k2 = (2 * PI) / lambda * k2_uv;
			
			vec3 q = k1 - k2;
			finalcolor += spd_pit(q, L, k2_uv, t, t_uv, lambda) * spd_track(q, L, k2_uv, t, t_uv, lambda) * lambda2rgb(lambda);
		}
	}
	
	return finalcolor;
}

vec3 spd_diffuse()
{
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
	return final_color.rgb;
}

void main(void) {
	// Convert coordinate system
	//float theta = atan((P_tex.y - Center.y) / (P_tex.x - Center.x));	// not needed?
	float r = sqrt(pow(P_tex.x - Center.x, 2.0) + pow(P_tex.y - Center.y, 2.0));
	   
	if (r <= HoleR || r > DiscR)
	{
		// Transparent
		gl_FragColor = vec4(0.0);
	}
	else
	{
		// Implement CD shader here...
		vec3 finalcolor = spd_mirror() + spd_diffuse() + spd_diffraction();
		gl_FragColor = vec4(finalcolor, 1.0);
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