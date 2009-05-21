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
varying vec3 P_tex;		// 2D coordinates of current point in texture space

uniform vec3 Center;	// Center of disc
uniform float DiscR;	// radius of disc
uniform float HoleR;	// radius of hole in disc

uniform float Llength;		// Length of line light source

uniform float Aa;		// track separation distance
uniform float Bb;		// pit sequence length (varies between 900nm and 3300nm in steps of 300nm)

uniform int LambdaI;		// Starting wavelength (400 nm)
uniform int LambdaStep;	// Step value (50nm)
uniform int LambdaF;		// Final wavelength value, do not exceed (700nm)

const float PI = 3.14159;	// constant PI value

//vec3 convertColor(float SPD, int wavelength);

// map a visible wavelength [nm] to OpenGL's RGB representation
// Took from example in the book
vec3 lambda2rgb(int lambda)
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
	float sqrt_variance = 2.0;
	float Ca = 1.0 / (sqrt_variance * sqrt(2.0 * PI));
	float Cb = 50.0;	// expected value
	
	return Ca * exp(-((x - Cb) * (x - Cb)) / (2.0 * sqrt_variance * sqrt_variance));
}

float spd_track(vec3 q, vec3 L, vec3 k2_uv, float t, vec3 t_uv, float d, int lambda)
{
	float spd = 0.0;
	// loop through some values
	for (int n = 1; n <= 10; n += 1)
	{
		// condition:
		//   a * ((2 * PI) / lambda) * (Ax + Bx * t) - 2 * PI * n == 0      AND
		//   b * ((2 * PI) / lambda) * (Ay + By * t) - 2 * PI * m == 0
		//vec3 A = (P - L) / d - k2_uv;
		//vec3 B = t_uv / d;
		
		//float Ax = length(cross(A, vec3(0.0, 0.0, P.z)));
		//float Bx = length(cross(B, vec3(0.0, 0.0, P.z)));
		
		float qx = dot(q, cross(normalize(P_tex - Center), vec3(0.0, 0.0, 1.0)));
		
		//float equation_14_1 = Aa * ((2.0 * PI) / lambda) * (Ax + Bx * t) - 2.0 * PI * n;
		//if (equation_14_1 == 0)	// must be true for there to be a contribution by this.
		//{
			spd += gauss(Aa * qx - 2.0 * PI * n);	// Cn = 1.0
		//}
		
		//float equation_14_2 = Aa * ((2.0 * PI) / lambda) * (Ax + Bx * t) - 2.0 * PI * -n;
		//if (equation_14_2 == 0)	// must be true for there to be a contribution by this.
		//{
			spd += gauss(Aa * qx - 2.0 * PI * -n); // Cn = 1.0
		//}
	}
	
	return spd;
}

float spd_pit(vec3 q, vec3 L, vec3 k2_uv, float t, vec3 t_uv, float d, int lambda)
{
	float spd = 0.0;
	// loop through some values
	for (int m = 1; m <= 10; m += 1)
	{
		// condition:
		//   a * ((2 * PI) / lambda) * (Ax + Bx * t) - 2 * PI * n == 0      AND
		//   b * ((2 * PI) / lambda) * (Ay + By * t) - 2 * PI * m == 0
		//vec3 A = (P - L) / d - k2_uv;
		//vec3 B = t_uv / d;
		
		//float Ay = dot(A, P_tex - Center);
		//float By = dot(B, P_tex - Center);
		
		float qy = dot(q, normalize(P_tex - Center));
		
		//float equation_15_1 = Bb * ((2.0 * PI) / lambda) * (Ay + By * t) - 2.0 * PI * m;
		//if (equation_15_1 == 0.0)	// must be true for there to be a contribution by this.
		//{
			spd += gauss(Bb * qy - 2.0 * PI * m); // Cm = 1.0
		//}
		
		//float equation_15_2 = Bb * ((2.0 * PI) / lambda) * (Ay + By * t) - 2.0 * PI * -m;
		//if (equation_15_2 == 0.0)	// must be true for there to be a contribution by this.
		//{
			spd += gauss(Bb * qy - 2.0 * PI * -m); // Cm = 1.0
		//}
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
	vec3 L = vec3(gl_ModelViewMatrix * gl_LightSource[0].position);	// Light position
	vec3 t_uv = normalize(cross(lightDir, L));	// Direction (orientation) of line light
	
	//loop through all wavelengths and add up final color based on spd_pit*spd_track*rgb, return
	for (int lambda = LambdaI; lambda <= LambdaF; lambda += LambdaStep)
	{
		vec3 k2_uv = normalize(-P / abs(-P));
		vec3 k2 = (2.0 * PI / lambda) * k2_uv;
		float d = distance(P, L);
		for (float t = 0.0; t < Llength; t += (Llength / 10.0))
		{
			vec3 k1_uv = normalize((P - L) / d - (t_uv / d) * t);	// must loop through t from 0 to Llength
			vec3 k1 = (2.0 * PI / lambda) * k1_uv;
			
			vec3 q = k1 - k2;
			finalcolor += (spd_pit(q, L, k2_uv, t, t_uv, d, lambda) * spd_track(q, L, k2_uv, t, t_uv, d, lambda)) * lambda2rgb(lambda);
			//finalcolor += (spd_track(q, L, k2_uv, t, t_uv, d, lambda)) * lambda2rgb(lambda);
			//finalcolor += (spd_pit(q, L, k2_uv, t, t_uv, d, lambda)) * lambda2rgb(lambda);
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
