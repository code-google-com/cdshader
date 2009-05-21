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

uniform float Aa;		// track separation distance
uniform float Bb;		// pit sequence length (varies between 900nm and 3300nm in steps of 300nm)

uniform float LambdaI;		// Starting wavelength (400 nm)
uniform float LambdaStep;	// Step value (50nm)
uniform float LambdaF;		// Final wavelength value, do not exceed (700nm)

const float PI = 3.14159;	// constant PI value

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
	float sqrt_variance = 0.4;
	float expected_val = 1.0;
	float Ca = 1.0 / (sqrt_variance * sqrt(2.0 * PI));
	float Cb = expected_val;
	float Cc = sqrt_variance;
	
	return Ca * exp(-((x - Cb) * (x - Cb)) / (2.0 * Cc * Cc));
}

float spd_track(vec3 q, vec3 L, vec3 k2_uv, float t, vec3 t_uv, float lambda)
{
	float spd = 0.0;
	// loop through some values
	//float n = 1.0;
	for (int n = 1; n <= 5; n += 1)
	{
		// condition:
		//   a * ((2 * PI) / lambda) * (Ax + Bx * t) - 2 * PI * n == 0      AND
		//   b * ((2 * PI) / lambda) * (Ay + By * t) - 2 * PI * m == 0
		vec3 A = (P - L) / Llength - k2_uv;
		vec3 B = t_uv / Llength;
		
		vec3 Ax = cross(A, vec3(0.0, 0.0, P.z));
		vec3 Bx = cross(B, vec3(0.0, 0.0, P.z));
		
		vec3 qx = cross(q, vec3(0.0, 0.0, P.z));
		
		float equation_14_1 = Aa * ((2.0 * PI) / (lambda / 1000.0)) * (Ax.x + Bx.x * t) - 2.0 * PI * n;
		if (equation_14_1 == 0)	// must be true for there to be a contribution by this.
		{
			spd += 1.0 * gauss(Aa * qx.x - 2.0 * PI * n);
		}
		
		float equation_14_2 = Aa * ((2.0 * PI) / (lambda / 1000.0)) * (Ax.x + Bx.x * t) - 2.0 * PI * -n;
		if (equation_14_2 == 0)	// must be true for there to be a contribution by this.
		{
			spd += 1.0 * gauss(Aa * qx.x - 2.0 * PI * -n);
		}
	}
	
	return spd;
}

float spd_pit(vec3 q, vec3 L, vec3 k2_uv, float t, vec3 t_uv, float lambda)
{
	float spd = 0.0;
	// loop through some values
	//float m = 1.0;
	for (int m = 1; m <= 5; m += 1)
	{
		// condition:
		//   a * ((2 * PI) / lambda) * (Ax + Bx * t) - 2 * PI * n == 0      AND
		//   b * ((2 * PI) / lambda) * (Ay + By * t) - 2 * PI * m == 0
		vec3 A = (P - L) / Llength - k2_uv;
		vec3 B = t_uv / Llength;
		
		float Ay = dot(A, P - Center);
		float By = dot(B, P - Center);
		
		float qy = dot(q, P - Center);
		
		float equation_15_1 = Bb * ((2.0 * PI) / (lambda / 1000.0)) * (Ay + By * t) - 2.0 * PI * m;
		if (equation_15_1 == 0.0)	// must be true for there to be a contribution by this.
		{
			spd += 2.0 * gauss(Bb * qy - 2.0 * PI * m);
		}
		
		float equation_15_2 = Bb * ((2.0 * PI) / (lambda / 1000.0)) * (Ay + By * t) - 2.0 * PI * -m;
		if (equation_15_2 == 0.0)	// must be true for there to be a contribution by this.
		{
			spd += 2.0 * gauss(Bb * qy - 2.0 * PI * -m);
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
	
	// unit vectors
	vec3 t_uv = cross(normalize(lightDir), normalize(eyeVec));	// Direction (orientation) of line light
	vec3 L = gl_LightSource[0].position.xyz;	// Light position	
	
	//loop through all wavelengths and add up final color based on spd_pit*spd_track*rgb, return
	for (float lambda = LambdaI; lambda <= LambdaF; lambda += LambdaStep)
	{
		for (float t = 0; t < Llength; t += (Llength / 10.0))
		{
			vec3 k2_uv = normalize((-P) / abs(-P));
			vec3 k1_uv = (P - L) / Llength - t_uv / Llength * t;	// must loop through t from 0 to Llength
		
			vec3 k1 = (1.0 / lambda) * (k1_uv - k2_uv);
			vec3 k2 = (2.0 * PI) / lambda * k2_uv;
			
			vec3 q = k1 - k2;
			//finalcolor += convertColor(spd_pit(q, L, k2_uv, t, t_uv, lambda), lambda) + convertColor(spd_track(q, L, k2_uv, t, t_uv, lambda), lambda);
			finalcolor += (spd_pit(q, L, k2_uv, t, t_uv, lambda) + spd_track(q, L, k2_uv, t, t_uv, lambda)) * lambda2rgb(lambda);
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
	vec4 diffuse = vec4 (0.2, 0.2, 0.2, 1.0);
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
	float r = sqrt(pow(P_tex.x - Center.x, 2.0) + pow(P_tex.y - Center.y, 2.0));
	   
	if (r <= HoleR || r > DiscR)
	{
		// Transparent
		gl_FragColor = vec4(0.0);
	}
	else
	{
		// Implement CD shader here...
		//gl_FragColor = vec4(spd_mirror() + spd_diffuse() + spd_diffraction(), 1.0);
		gl_FragColor = vec4(spd_diffraction(), 1.0);
	}     
}
