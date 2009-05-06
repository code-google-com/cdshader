// strauss.frag
// Strauss fragment shader for GLSL

varying vec3 normal, lightDir, view;
uniform vec3 surfaceColor;
uniform float smoothness;
uniform float metalness;
uniform float transparency;

vec4 myDiffuse(vec3 N, float m, float rd)
{
	float c = dot(N, normalize(lightDir)) * (1.0 - m) * rd;
	return vec4(c, c, c, 1.0);
}

// attenuation functions
float F(float a)
{
	float kf = 1.12;
	float num = (1.0 / pow(a - kf, 2.0)) - (1.0 / pow(kf, 2.0));
	float denom = (1.0 / pow(1.0 - kf, 2.0)) - (1.0 / pow(kf, 2.0));
	return num / denom;
}

float G(float y)
{
	float kg = 1.01;
	float num = (1.0 / pow(1.0 - kg, 2.0)) - (1.0 / pow(y - kg, 2.0));
	float denom = (1.0 / pow(1.0 - kg, 2.0)) - (1.0 / pow(kg, 2.0));
	return num / denom;
}

// Specular reflection color
vec4 myCs(vec3 C, float m, float a)
{
	vec3 Cwhite = vec3(1.0, 1.0, 1.0);
	return vec4((Cwhite + m * (1.0 - F(a)) * (C - Cwhite)), 1.0);
}

vec4 mySpecular(vec3 N, vec3 V, float m, float s, float t, float rd)
{
	vec3 H = normalize(lightDir) - 2.0 * max(dot(N, normalize(lightDir)), 0.0) * N;
	float a = max(dot(normalize(N), normalize(lightDir)), 0.0) / (3.14159/2.0);
	float y = max(dot(normalize(N), normalize(V)), 0.0) / (3.14159/2.0);

	float h = 3.0 / (1.0 - s);
	
	float j = F(cos(a)) * G(cos(a)) * G(cos(y));
	float rn = (1.0 - t) - rd;
	float rj = min(1.0, rn + (rn + 0.1) * j);
	
	float c = pow(clamp(dot(normalize(H), normalize(V)), 0.0, 1.0), h) * rj;
	return vec4(c, c, c, 1.0);
}

void main(void) {
	// Color contributions for each component
	vec4 ambient = gl_FrontMaterial.ambient * gl_LightSource[0].ambient;
	vec4 diffuse = gl_FrontMaterial.diffuse * gl_LightSource[0].diffuse;
	vec4 specular = gl_FrontMaterial.specular * gl_LightSource[0].specular;
	
	float rd = (1.0 - pow(smoothness, 3.0)) * (1.0 - transparency);
	
	// Only ambient
	//gl_FragColor = ambient;
	// Only diffuse
	//gl_FragColor = myDiffuse(normal, metalness, rd) * diffuse;
	// Only specular
	//gl_FragColor = mySpecular(normal, view, metalness, smoothness, transparency, rd) * specular;

	// Everything together	
	gl_FragColor = ambient + myDiffuse(normal, metalness, rd) * diffuse + mySpecular(normal, view, metalness, smoothness, transparency, rd) * specular;
}
