// Import necessary functions and objects
import { loadGLTF } from "./libs/loader.js";
const THREE = window.MINDAR.IMAGE.THREE;

// Function to initialize MindARThree instance with multiple targets
const initializeMindAR = () => {
  return new window.MINDAR.IMAGE.MindARThree({
    container: document.body,
    imageTargetSrc: './assets/targets/course-banner.mind',
  });
};

// Function to set up lighting for the scene
const setupLighting = (scene) => {
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);
};

// Function to load and configure the clock model
const loadClockModel = async () => {
  const clock = await loadGLTF('./assets/models/kampungTEST5.glb'); // 3D model path
  clock.scene.scale.set(0.1, 0.1, 0.1);
  clock.scene.position.set(0, -0.5, 0); // Adjust model position
  return clock;
};

// Function to add sound to the scene
const addSound = (listener, soundPath) => {
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(soundPath, (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
  });
  return sound;
};

// Function to set up multiple anchors with the same model
const setupMultipleAnchors = async (mindarThree, model, malaySound, englishSound, mixer) => {
  const anchor1 = mindarThree.addAnchor(0); // Marker 1
  const anchor2 = mindarThree.addAnchor(1); // Marker 2

  // Add interaction for Marker 1
  setupInteractions(anchor1, model.scene.clone(), malaySound, englishSound, mixer);

  // Add interaction for Marker 2
  setupInteractions(anchor2, model.scene.clone(), malaySound, englishSound, mixer);
};

// Function to set up interactions for an anchor
const setupInteractions = (anchor, model, malaySound, englishSound, mixer) => {
  let isPlaying = false;
  let clickTimeout = null;

  anchor.onTargetFound = () => {
    anchor.group.add(model); // Add the model when target is found
    document.body.addEventListener("click", handleClick);
    document.body.addEventListener("dblclick", handleDoubleClick);
  };

  anchor.onTargetLost = () => {
    malaySound.stop();
    englishSound.stop();
    if (mixer) mixer.stopAllAction();
    document.body.removeEventListener("click", handleClick);
    document.body.removeEventListener("dblclick", handleDoubleClick);
    isPlaying = false;

    // Explicitly remove the model from the anchor group
    anchor.group.remove(model);

    // Dispose of model resources to ensure complete removal
    model.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });

    // Trigger a scene update to reflect changes
    model.visible = false;
  };

  const handleClick = () => {
    if (clickTimeout) return;
    clickTimeout = setTimeout(() => {
      playMalay();
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }, 300);
  };

  const handleDoubleClick = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }
    playEnglish();
  };

  const playMalay = () => {
    if (!isPlaying) {
      malaySound.play();
      startAnimation(mixer);
      isPlaying = true;
    }
  };

  const playEnglish = () => {
    if (!isPlaying) {
      englishSound.play();
      startAnimation(mixer);
      isPlaying = true;
    }
  };
};

// Function to start the animation
const startAnimation = (mixer) => {
  if (mixer) {
    mixer.time = 0; // Restart animation
    mixer.update(0); // Reset state
    mixer.clipAction(mixer._actions[0].getClip()).play();
  }
};

// Main function to start the AR experience
document.addEventListener('DOMContentLoaded', () => {
  const start = async () => {
    const mindarThree = initializeMindAR();
    const { renderer, scene, camera } = mindarThree;

    setupLighting(scene);

    const clockModel = await loadClockModel();
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // Load both Malay and English sounds
    const malaySound = addSound(listener, './assets/sounds/arp1.mp3');
    const englishSound = addSound(listener, './assets/sounds/arp2.mp3');

    // Set up animation mixer
    const mixer = new THREE.AnimationMixer(clockModel.scene);
    if (clockModel.animations && clockModel.animations.length > 0) {
      mixer.clipAction(clockModel.animations[0]).play();
    } else {
      console.warn("No animations found in the loaded model.");
    }

    // Set up multiple anchors for two markers
    await setupMultipleAnchors(mindarThree, clockModel, malaySound, englishSound, mixer);

    const clock = new THREE.Clock();

    // Start rendering and animation loop
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    });
  };

  start();
});
