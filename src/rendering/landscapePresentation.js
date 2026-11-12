import {ACESFilmicToneMapping,SRGBColorSpace,HemisphereLight,DirectionalLight,Color,Vector3} from 'three';

// Shared warm presentation. Comparison disables shadows in BOTH renderers;
// ordinary prototype shadows remain available, with no production shadow cost.
export function applyLandscapePresentation(renderer,scene){
 renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 renderer.outputColorSpace=SRGBColorSpace;scene.background=new Color(0xafb9a6);
 const sky=new HemisphereLight(0xf4edd6,0x53624a,2),sun=new DirectionalLight(0xffebc5,3.2);
 sun.position.set(-16,27,14);scene.add(sky,sun);return sun;
}

// Opt-in comparison: same view direction, target world height, FOV and projected
// world units per CSS pixel at the target plane, irrespective of canvas height.
export function applyComparisonCamera(camera,controls,canvasHeight){
 camera.fov=43;camera.near=.1;camera.far=500;camera.zoom=1;camera.updateProjectionMatrix();
 const distance=Math.max(1,canvasHeight)*.12/(2*Math.tan(43*Math.PI/360));
 controls.target.set(0,4,0);
 camera.position.copy(controls.target).addScaledVector(new Vector3(0,1,.65).normalize(),distance);
 controls.update();controls.saveState();
}
