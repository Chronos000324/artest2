// Import necessary functions and objects
import { loadGLTF } from "./libs/loader.js";
const THREE = window.MINDAR.IMAGE.THREE;

// Function to initialize MindARThree instance
const initializeMindAR = () => {
  return new window.MINDAR.IMAGE.MindARThree({
    container: document.body,
     imageTargetSrc: './assets/target/course-banner.mind',
  });
};

// Function to set up lighting for the scene
const setupLighting = (scene) => {
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);
};

// Function to load and configure a 3D model                              // mixer and clock
const loadAndConfigureModel = async (path, scale, position) => {
  const model = await loadGLTF(path);
  model.scene.scale.set(scale.x, scale.y, scale.z);
  model.scene.position.set(position.x, position.y, position.z);

  // If the model has animations, set up an animation mixer
  if (model.animations && model.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model.scene);
    const action = mixer.clipAction(model.animations[0]);
    action.play();
    model.mixer = mixer;
  }

  return model;
};

// Function to set up the anchor with the model
const setupAnchor = (mindarThree, anchorIndex, model) => {
  const anchor = mindarThree.addAnchor(anchorIndex);
  anchor.group.add(model.scene);
};

// Function to start rendering loop
const startRenderingLoop = (renderer, scene, camera, models) => {
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    models.forEach((model) => {
      if (model.mixer) {
        model.mixer.update(delta);
      }
    });
    renderer.render(scene, camera);
  });
};

// Main function to start the AR experience
document.addEventListener('DOMContentLoaded', () => {
  const start = async () => {
    const mindarThree = initializeMindAR();
    const { renderer, scene, camera } = mindarThree;

    setupLighting(scene);

   const goufModel = await loadAndConfigureModel('./assets/models/RobotExpressive.glb', { x: 0.5, y: 0.5, z: 0.5 }, { x: 0, y: -0.4, z: 0 });
    //const droneModel = await loadAndConfigureModel('./assets/models/sd/scene.gltf', { x: 0.3, y: 0.3, z: 0.3 }, { x: 0, y: -0.4, z: 0 });

    setupAnchor(mindarThree, 0, goufModel);
   // setupAnchor(mindarThree, 1, droneModel);

    await mindarThree.start();
    startRenderingLoop(renderer, scene, camera, [goufModel]);
  };

  start();
});
