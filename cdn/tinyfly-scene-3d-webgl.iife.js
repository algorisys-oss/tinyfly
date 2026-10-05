(function(h){"use strict";function j(e,i){return[e[0]*i,e[1]*i,e[2]*i]}function X(e){return Math.hypot(e[0],e[1],e[2])}function B(e){const i=X(e);return i===0?[0,0,0]:j(e,1/i)}function W(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Y(e){const i=new Array(16);for(let t=0;t<4;t++)for(let o=0;o<4;o++)i[o*4+t]=e[t*4+o];return i}function z(e){const[i,t,o,r,n,l,u,c,_,a,f,g,m,v,p,b]=e,A=i*l-t*n,y=i*u-o*n,E=i*c-r*n,R=t*u-o*l,L=t*c-r*l,M=o*c-r*u,F=_*v-a*m,T=_*p-f*m,C=_*b-g*m,S=a*p-f*v,I=a*b-g*v,x=f*b-g*p,O=A*x-y*I+E*S+R*C-L*T+M*F;if(Math.abs(O)<1e-12)return null;const s=1/O;return[(l*x-u*I+c*S)*s,(o*I-t*x-r*S)*s,(v*M-p*L+b*R)*s,(f*L-a*M-g*R)*s,(u*C-n*x-c*T)*s,(i*x-o*C+r*T)*s,(p*E-m*M-b*y)*s,(_*M-f*E+g*y)*s,(n*I-l*C+c*F)*s,(t*C-i*I-r*F)*s,(m*L-v*E+b*A)*s,(a*E-_*L-g*A)*s,(l*T-n*S-u*F)*s,(i*S-t*T+o*F)*s,(v*y-m*R-p*A)*s,(_*R-a*y+f*A)*s]}const N=new Map;function w(e){const i=N.get(e);if(i)return i;let t=[1,1,1];const o=e.trim().replace("#","");if(e.trim().startsWith("#")&&(o.length===3||o.length===6)){const r=o.length===3?o.split("").map(n=>n+n).join(""):o;t=[0,2,4].map(n=>Number.parseInt(r.slice(n,n+2),16)/255)}else{const r=e.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);r&&(t=[Number(r[1])/255,Number(r[2])/255,Number(r[3])/255])}return N.size<512&&N.set(e,t),t}B([-3,-5,-4]);const d=8,P={unlit:0,flat:1,lambert:2,toon:3},k={ambient:0,directional:1,point:2,spot:3},K=`#version 300 es
in vec3 a_position;
in vec3 a_normal;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
out vec3 v_world;
out vec3 v_normal;
void main() {
  vec4 world = u_model * vec4(a_position, 1.0);
  v_world = world.xyz;
  v_normal = u_normalMatrix * a_normal;
  gl_Position = u_projection * u_view * world;
}
`,V=`#version 300 es
precision highp float;
#define MAX_LIGHTS ${d}
uniform int u_lightCount;
uniform int u_lightKind[MAX_LIGHTS];
uniform vec3 u_lightColor[MAX_LIGHTS];
uniform float u_lightIntensity[MAX_LIGHTS];
uniform vec3 u_lightPosition[MAX_LIGHTS];
uniform vec3 u_lightDirection[MAX_LIGHTS];
uniform float u_lightRange[MAX_LIGHTS];
uniform vec2 u_lightCone[MAX_LIGHTS];
uniform vec3 u_color;
uniform float u_opacity;
uniform int u_shading;
uniform float u_bands;
uniform vec3 u_eye;
uniform vec3 u_forward;
uniform bool u_orthographic;
uniform bool u_fog;
uniform vec3 u_fogColor;
uniform vec2 u_fogRange;
in vec3 v_world;
in vec3 v_normal;
out vec4 outColor;

vec3 lightAt(vec3 p, vec3 n) {
  vec3 total = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= u_lightCount) break;
    float amount;
    int kind = u_lightKind[i];
    if (kind == 0) {
      amount = u_lightIntensity[i];
    } else if (kind == 1) {
      amount = u_lightIntensity[i] * max(0.0, -dot(n, u_lightDirection[i]));
    } else {
      vec3 toLight = u_lightPosition[i] - p;
      float distance = length(toLight);
      vec3 l = distance > 0.0 ? toLight / distance : n;
      float fade = u_lightRange[i] > 0.0 ? pow(max(0.0, 1.0 - distance / u_lightRange[i]), 2.0) : 1.0;
      amount = u_lightIntensity[i] * max(0.0, dot(n, l)) * fade;
      if (kind == 3) amount *= smoothstep(u_lightCone[i].x, u_lightCone[i].y, -dot(l, u_lightDirection[i]));
    }
    total += u_lightColor[i] * amount;
  }
  return total;
}

void main() {
  vec3 rgb = u_color;
  if (u_shading != 0) {
    // Flat: the face's own normal, from the surface's slope; otherwise the smooth one.
    vec3 n = u_shading == 1 ? normalize(cross(dFdx(v_world), dFdy(v_world))) : normalize(v_normal);
    vec3 toEye = u_orthographic ? -u_forward : normalize(u_eye - v_world);
    if (dot(n, toEye) < 0.0) n = -n;
    vec3 light = lightAt(v_world, n);
    if (u_shading == 3) {
      // Band the brightness, not each channel, so coloured lights keep their hue.
      float level = max(light.r, max(light.g, light.b));
      float steps = max(2.0, floor(u_bands + 0.5));
      float banded = min(1.2, ceil(min(1.0, level) * steps - 1e-6) / steps);
      light = level > 0.0 ? light * (banded / level) : vec3(0.0);
    }
    rgb *= light;
  }
  if (u_fog) {
    float amount = clamp((distance(v_world, u_eye) - u_fogRange.x) / (u_fogRange.y - u_fogRange.x), 0.0, 1.0);
    rgb = mix(rgb, u_fogColor, amount);
  }
  outColor = vec4(clamp(rgb, 0.0, 1.0), u_opacity);
}
`,$=`#version 300 es
in vec3 a_position;
in vec3 a_normal;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform vec2 u_viewport;
uniform float u_width;
void main() {
  mat4 viewProjection = u_projection * u_view;
  vec4 clip = viewProjection * u_model * vec4(a_position, 1.0);
  vec3 worldNormal = normalize(u_normalMatrix * a_normal);
  vec4 tip = viewProjection * (u_model * vec4(a_position, 1.0) + vec4(worldNormal * 0.01, 0.0));
  vec2 direction = tip.xy / tip.w - clip.xy / clip.w;
  float length2 = dot(direction, direction);
  vec2 push = length2 > 0.0 ? direction * inversesqrt(length2) : vec2(0.0);
  clip.xy += push * u_width * 2.0 / u_viewport * clip.w;
  gl_Position = clip;
}
`,q=`#version 300 es
precision highp float;
uniform vec4 u_ink;
out vec4 outColor;
void main() {
  outColor = u_ink;
}
`,Q=[{id:"default-ambient",light:"ambient",color:"#ffffff",intensity:.35,position:[0,0,0],direction:[0,-1,0],angle:30},{id:"default-key",light:"directional",color:"#ffffff",intensity:.8,position:[3,5,4],direction:B([-3,-5,-4]),angle:30}];function D(e){const i=(e.length>0?e:Q).slice(0,d),t={count:i.length,kind:new Int32Array(d),color:new Float32Array(d*3),intensity:new Float32Array(d),position:new Float32Array(d*3),direction:new Float32Array(d*3),range:new Float32Array(d),cone:new Float32Array(d*2)};return i.forEach((o,r)=>{t.kind[r]=k[o.light],t.color.set(w(o.color),r*3),t.intensity[r]=o.intensity,t.position.set(o.position,r*3),t.direction.set(o.direction,r*3),t.range[r]=o.range??0,t.cone[r*2]=Math.cos(o.angle*Math.PI/180),t.cone[r*2+1]=Math.cos(o.angle*.8*Math.PI/180)}),t}function G(e,i,t){return{color:w(i??e.color),opacity:t,shading:P[e.shading??"lambert"],bands:e.bands??3}}function U(e){const i=Y(z(e)??W());return new Float32Array([i[0],i[1],i[2],i[4],i[5],i[6],i[8],i[9],i[10]])}class J{gl;surface;outline;buffers=new WeakMap;overlay;constructor(i,t={}){this.gl=i,this.overlay=t.overlay,this.surface=H(i,K,V),this.outline=H(i,$,q)}render(i){const t=this.gl,o=t.drawingBufferWidth,r=t.drawingBufferHeight;t.viewport(0,0,o,r);const n=i.background&&i.background!=="transparent"?w(i.background):null;t.clearColor(n?.[0]??0,n?.[1]??0,n?.[2]??0,n?1:0),t.clearDepth(1),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.enable(t.CULL_FACE),t.frontFace(t.CCW);const l=i.meshes.filter(a=>a.opacity>=1),u=i.camera.position,c=a=>Math.hypot(a.world[12]-u[0],a.world[13]-u[1],a.world[14]-u[2]),_=i.meshes.filter(a=>a.opacity<1).sort((a,f)=>c(f)-c(a)||a.objectIndex-f.objectIndex);t.disable(t.BLEND),t.depthMask(!0);for(const a of l)a.material.outline&&this.drawOutline(i,a,o,r);for(const a of l)this.drawSurface(i,a);t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.depthMask(!1);for(const a of _)this.drawSurface(i,a);if(t.depthMask(!0),t.disable(t.BLEND),this.overlay&&i.drawables.length>0){const a=this.overlay;a.save(),a.setTransform(a.canvas.width/i.width,0,0,a.canvas.height/i.height,0,0),a.clearRect(0,0,i.width,i.height);for(const f of i.drawables)a.save(),f.draw(a,i),a.restore();a.restore()}else this.overlay&&this.overlay.clearRect(0,0,this.overlay.canvas.width,this.overlay.canvas.height)}drawSurface(i,t){const o=this.gl,r=this.surface;o.useProgram(r.program),t.material.doubleSided?o.disable(o.CULL_FACE):(o.enable(o.CULL_FACE),o.cullFace(o.BACK)),this.bindMesh(r,t.mesh);const n=r.uniform;o.uniformMatrix4fv(n("u_model"),!1,t.world),o.uniformMatrix4fv(n("u_view"),!1,i.camera.view),o.uniformMatrix4fv(n("u_projection"),!1,i.camera.projection),o.uniformMatrix3fv(n("u_normalMatrix"),!1,U(t.world));const l=D(i.lights);o.uniform1i(n("u_lightCount"),l.count),o.uniform1iv(n("u_lightKind"),l.kind),o.uniform3fv(n("u_lightColor"),l.color),o.uniform1fv(n("u_lightIntensity"),l.intensity),o.uniform3fv(n("u_lightPosition"),l.position),o.uniform3fv(n("u_lightDirection"),l.direction),o.uniform1fv(n("u_lightRange"),l.range),o.uniform2fv(n("u_lightCone"),l.cone);const u=G(t.material,t.color,t.opacity);o.uniform3fv(n("u_color"),u.color),o.uniform1f(n("u_opacity"),u.opacity),o.uniform1i(n("u_shading"),u.shading),o.uniform1f(n("u_bands"),u.bands),o.uniform3fv(n("u_eye"),i.camera.position),o.uniform3fv(n("u_forward"),i.camera.forward),o.uniform1i(n("u_orthographic"),i.camera.orthographic?1:0),o.uniform1i(n("u_fog"),i.fog?1:0),i.fog&&(o.uniform3fv(n("u_fogColor"),w(i.fog.color)),o.uniform2f(n("u_fogRange"),i.fog.near,i.fog.far)),o.drawElements(o.TRIANGLES,t.mesh.indices.length,o.UNSIGNED_INT,0)}drawOutline(i,t,o,r){const n=this.gl,l=this.outline,u=t.material.outline;n.useProgram(l.program),n.enable(n.CULL_FACE),n.cullFace(n.FRONT),this.bindMesh(l,t.mesh);const c=l.uniform;n.uniformMatrix4fv(c("u_model"),!1,t.world),n.uniformMatrix4fv(c("u_view"),!1,i.camera.view),n.uniformMatrix4fv(c("u_projection"),!1,i.camera.projection),n.uniformMatrix3fv(c("u_normalMatrix"),!1,U(t.world)),n.uniform2f(c("u_viewport"),o,r),n.uniform1f(c("u_width"),u.width*(o/i.width));const[_,a,f]=w(u.color);n.uniform4f(c("u_ink"),_,a,f,1),n.drawElements(n.TRIANGLES,t.mesh.indices.length,n.UNSIGNED_INT,0),n.cullFace(n.BACK)}bindMesh(i,t){const o=this.gl;let r=this.buffers.get(t);if(!r){const l=o.createBuffer();o.bindBuffer(o.ARRAY_BUFFER,l),o.bufferData(o.ARRAY_BUFFER,new Float32Array(t.positions),o.STATIC_DRAW);const u=o.createBuffer();o.bindBuffer(o.ARRAY_BUFFER,u),o.bufferData(o.ARRAY_BUFFER,new Float32Array(t.normals),o.STATIC_DRAW);const c=o.createBuffer();o.bindBuffer(o.ELEMENT_ARRAY_BUFFER,c),o.bufferData(o.ELEMENT_ARRAY_BUFFER,new Uint32Array(t.indices),o.STATIC_DRAW),r={position:l,normal:u,index:c},this.buffers.set(t,r)}const n=(l,u)=>{const c=o.getAttribLocation(i.program,l);c<0||(o.bindBuffer(o.ARRAY_BUFFER,u),o.enableVertexAttribArray(c),o.vertexAttribPointer(c,3,o.FLOAT,!1,0,0))};n("a_position",r.position),n("a_normal",r.normal),o.bindBuffer(o.ELEMENT_ARRAY_BUFFER,r.index)}destroy(){this.gl.deleteProgram(this.surface.program),this.gl.deleteProgram(this.outline.program)}}function H(e,i,t){const o=(l,u)=>{const c=e.createShader(l);if(e.shaderSource(c,u),e.compileShader(c),!e.getShaderParameter(c,e.COMPILE_STATUS))throw new Error(`scene-3d webgl: shader failed to compile — ${e.getShaderInfoLog(c)}`);return c},r=e.createProgram();if(e.attachShader(r,o(e.VERTEX_SHADER,i)),e.attachShader(r,o(e.FRAGMENT_SHADER,t)),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw new Error(`scene-3d webgl: program failed to link — ${e.getProgramInfoLog(r)}`);const n=new Map;return{program:r,uniform:l=>(n.has(l)||n.set(l,e.getUniformLocation(r,l)),n.get(l))}}h.LIGHT_CODE=k,h.MAX_LIGHTS=d,h.SHADING_CODE=P,h.WebGL2Renderer=J,h.normalMatrix3=U,h.packLights=D,h.surfaceUniforms=G,Object.defineProperty(h,Symbol.toStringTag,{value:"Module"})})(this.tinyfly=this.tinyfly||{});
