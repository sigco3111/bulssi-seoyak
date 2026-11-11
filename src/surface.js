// 실루엣 테두리빛과 표면 결(닳은 금속, 가죽 결, 털)을 재질 셰이더에 얹는다. 그림만 바꾸고 판정과 수치는 건드리지 않는다.
const NOISE='varying vec3 vSurfPos;\nfloat sH(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\nfloat sN(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(sH(i),sH(i+vec3(1,0,0)),f.x),mix(sH(i+vec3(0,1,0)),sH(i+vec3(1,1,0)),f.x),f.y),mix(mix(sH(i+vec3(0,0,1)),sH(i+vec3(1,0,1)),f.x),mix(sH(i+vec3(0,1,1)),sH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
const f=n=>Number(n).toFixed(4);
// rim: 테두리빛 색, power: 세기, grain: 결의 진하기, freq: 1m에 들어가는 결의 수, unit: 모델 단위 1이 몇 m인지, streak: 1보다 작으면 한쪽으로 늘어난 털결
export function surface(root,{rim=0x9fc4ff,power=.42,grain=.16,freq=34,unit=1,streak=1}={}){
 const color=[(rim>>16&255)/255,(rim>>8&255)/255,(rim&255)/255].map(f).join(','),k=freq/unit,key='|surf:'+[color,power,grain,k,streak].join(':');
 root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(!m?.isMeshStandardMaterial||m.userData.surface||m.colorWrite===false)continue;m.userData.surface=true;
  const before=m.onBeforeCompile,beforeKey=m.customProgramCacheKey();
  m.onBeforeCompile=(s,r)=>{before.call(m,s,r);
   s.vertexShader='varying vec3 vSurfPos;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfPos=position;');
   s.fragmentShader=NOISE+s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nvec3 sP=vSurfPos*vec3('+f(k)+','+f(k*streak)+','+f(k)+');float sW=sN(sP)*.6+sN(sP*3.1)*.4;diffuseColor.rgb*=mix('+f(1-grain)+','+f(1+grain*.45)+',sW);roughnessFactor=clamp(roughnessFactor+(sW-.5)*'+f(grain*2)+',.08,1.);float sR=pow(1.-saturate(dot(normalize(vViewPosition),normal)),2.6);totalEmissiveRadiance+=vec3('+color+')*sR*'+f(power)+'*(.35+.65*saturate(normal.y*.6+.5));');};
  m.customProgramCacheKey=()=>beforeKey+key;m.needsUpdate=true;}});
}
