const playBackgroundMusic = (musicFilePath) => {
  const music = new Audio(musicFilePath);
  music.loop = true;
  music.autoplay = true; // Add this line
  music.muted = true; // Add this line
  music.play()
    .then(() => {
      music.muted = false; // Unmute the audio once it starts playing
    })
    .catch((error) => {
      console.error('Error playing background music:', error);
    });
  return music;
};



document.addEventListener('DOMContentLoaded', async function() {
  const canvas = document.getElementById('renderCanvas');

  window.addEventListener('load', () => {
    canvas.focus();
  });

  const backgroundMusic = playBackgroundMusic('bgmusic.mp3');
  const engine = new BABYLON.Engine(canvas, true);
  const scoreDisplay = document.getElementById('scoreDisplay');
  let score = 0;

  let bestScore = 0;
const bestScoreDisplay = document.getElementById('bestScoreDisplay');



  let spaceshipSpeed = 0.1;
  const speedChangeFactor = 0.01;
  let trackDirection = 0;

  let musicStarted = false;
  document.addEventListener('keydown', () => {
    if (!musicStarted) {
      playBackgroundMusic('bgmusic.mp3');
      musicStarted = true;
    }
  });

  // //backgroundPlane variables
  // const imageWidth = 1536; // Replace with your image's width
  // const imageHeight = 768; // Replace with your image's height

  // const aspectRatio = imageWidth / imageHeight;
  // const planeHeight = 100; // You can adjust this value to change the height of the background plane
  // const planeWidth = planeHeight * aspectRatio;

  // //skybox for background
  // const createBackgroundPlane = (scene, texturePath) => {
  //   const backgroundPlane = BABYLON.MeshBuilder.CreatePlane("backgroundPlane", { width: planeWidth, height: planeHeight }, scene);
  //   backgroundPlane.position.z = -100;
  //   backgroundPlane.rotation.y = Math.PI;

  //   const backgroundPlaneMaterial = new BABYLON.StandardMaterial("backgroundPlaneMaterial", scene);
  //   backgroundPlaneMaterial.diffuseTexture = new BABYLON.Texture(texturePath, scene);
  //   backgroundPlaneMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
  //   backgroundPlaneMaterial.backFaceCulling = false;
  //   backgroundPlane.material = backgroundPlaneMaterial;

  //   return backgroundPlane;
  // };

  // const createFloorPlane = (scene, texturePath) => {
  //   const floorPlane = BABYLON.MeshBuilder.CreatePlane("floorPlane", { width: planeWidth, height: planeWidth }, scene);
  //   floorPlane.position.y = -0.5;
  //   floorPlane.rotation.x = Math.PI / 2;

  //   const floorPlaneMaterial = new BABYLON.StandardMaterial("floorPlaneMaterial", scene);
  //   floorPlaneMaterial.diffuseTexture = new BABYLON.Texture(texturePath, scene);
  //   floorPlaneMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
  //   floorPlaneMaterial.backFaceCulling = false;
  //   floorPlane.material = floorPlaneMaterial;

  //   return floorPlane;
  // 

  //bg music




  const createSkybox = (scene, texturePath) => {
    const skybox = BABYLON.Mesh.CreateSphere('skybox', 32, 1000, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial('skyboxMaterial', scene);

    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true; // Disable lighting to avoid unwanted shading on the skybox
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.emissiveTexture = new BABYLON.Texture(texturePath, scene); // Use Texture instead of CubeTexture
    skyboxMaterial.emissiveTexture.coordinatesMode = BABYLON.Texture.SPHERICAL_MODE; // Set coordinates mode to SPHERICAL_MODE

    skybox.material = skyboxMaterial;
    skybox.isPickable = false; // Disable picking to avoid clicking on the skybox

    return skybox;
  };




  //Game over
  const gameOverDisplay = document.createElement('div');
  gameOverDisplay.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; color: white; display: none; cursor: pointer;';
  gameOverDisplay.innerHTML = 'Game Over. Click to restart!';
  document.body.appendChild(gameOverDisplay);
  let isGameOver = false;
  let scene = null;

  const showGameOver = () => {
    isGameOver = true;
    gameOverDisplay.style.display = 'block';
    if (score > bestScore) {
      bestScore = score;
      bestScoreDisplay.innerHTML = "Best Score: " + bestScore;
    }
  };

  const restartGame = async () => {
    isGameOver = false;
    gameOverDisplay.style.display = 'none';
    engine.stopRenderLoop();
    spaceshipSpeed = 0.1;

    scene.dispose();
    scene = await createScene();
    scoreDisplay.innerHTML = "Score: 0";
    hasStarted = false;

    engine.runRenderLoop(() => {
      if (isGameOver) {
        return;
      }
      scene.render();
    });

    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
  };

  // gameOverDisplay.addEventListener('click', () => {
  //   restartGame();
  // });

  const loadGLTFModel = async (scene, url) => {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", url, scene);
    const model = result.meshes[0];

    // Update the bounding info
    model.refreshBoundingInfo();

    return model;
  };



  const createScene = async () => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    createSkybox(scene, "./skybox2.jpg"); // Update the path to your skybox image if necessary


    // createBackgroundPlane(scene, "spacefloor.jpg");
    // const backgroundPlane = createBackgroundPlane(scene, "canvasbg.png");

    // const floorPlane = createFloorPlane(scene, "spacefloor.jpg");


    // Camera
    const camera = new BABYLON.FreeCamera('freeCamera', new BABYLON.Vector3(0, 4, -10), scene);

    camera.radius = 10;
    camera.heightOffset = 4;
    camera.rotationOffset = 0;
    camera.cameraAcceleration = 0.05;
    camera.maxCameraSpeed = 10;

    const updateCamera = () => {
      const targetPosition = spaceship.position.clone();
      targetPosition.y = 4;
      targetPosition.z += 10;

      camera.position.x += (targetPosition.x - camera.position.x) * 0.1;
      camera.position.z += (targetPosition.z - camera.position.z) * 0.1;
    };

    const skybox = createSkybox(scene, "./skybox2.jpg");

    // Lights
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Spaceship
    const spaceship = await loadGLTFModel(scene, './spaceshipa.glb'); // Change this path to the correct one
    spaceship.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);


    spaceship.position.y = 1;

    // Set camera target
    camera.lockedTarget = spaceship;

    // Track
    const trackWidth = 10;
    const trackDepth = 200;
    let trackSegments = [];
    let obstacles = [];

    const createTrackSegment = (startZ, direction) => {
      const trackSegment = BABYLON.MeshBuilder.CreateBox('trackSegment', { width: trackWidth, height: 0.5, depth: trackDepth }, scene);
      trackSegment.position.y = -0.25;
      trackSegment.position.z = startZ - trackDepth / 2;
      trackSegment.position.x = direction * trackWidth;
      trackSegment.rotation.y = direction * Math.PI / 6;
      trackSegment.material = new BABYLON.StandardMaterial('trackMat', scene);
      const trackTexture = new BABYLON.Texture('./texture2.jpg', scene); // Replace with your image's path and extension
      trackTexture.uScale = 15; // Repeat the texture 5 times along the width
      trackTexture.vScale = 1; // Repeat the texture 20 times along the depth

      trackSegment.material.diffuseTexture = trackTexture;

      // trackSegment.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
      return trackSegment;
    };

    const gapSize = 3;
    const obstacleHeight = 1;

    const createObstacles = (startZ, trackPositionX) => {
      const newObstacles = [];
      // Existing obstacle creation logic...
      for (let i = 0; i < 20; i++) {
        const obstacleWidth = Math.random() * (trackWidth - gapSize) + gapSize;
        const obstacle = BABYLON.MeshBuilder.CreateBox('obstacle' + i, { width: obstacleWidth, height: obstacleHeight, depth: 1 }, scene);
        obstacle.position.y = 0.5;
        obstacle.position.z = startZ - 10 * i - 20;
        const halfGap = Math.random() * (trackWidth - obstacleWidth) / 2;
        const direction = Math.random() > 0.5 ? 1 : -1;
        obstacle.position.x = direction * halfGap + trackPositionX;

        obstacle.material = new BABYLON.StandardMaterial('obstacleMat' + i, scene);
        obstacle.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        newObstacles.push(obstacle);
      }
      return newObstacles;
    };


    trackSegments.push(createTrackSegment(0, 0));
    trackSegments.push(createTrackSegment(-trackDepth, 0));
    trackSegments.push(createTrackSegment(-2 * trackDepth, 0));

    obstacles = obstacles.concat(createObstacles(0, 0));
    obstacles = obstacles.concat(createObstacles(-trackDepth, 0));
    // Add the new set of obstacles for the third track segment
    obstacles = obstacles.concat(createObstacles(-2 * trackDepth, 0));


    // Game loop
    scene.registerBeforeRender(() => {
      if (isGameOver) {
        if (inputMap["ArrowUp"]) {
          restartGame();
        }
        return;
      }
      // Spaceship controls
      if (inputMap["ArrowLeft"]) {
        spaceship.position.x += 0.1;
      }
      if (inputMap["ArrowRight"]) {
        spaceship.position.x -= 0.1;
      }


      // Speed up with the up arrow key
      if (inputMap["ArrowUp"]) {
        spaceshipSpeed += speedChangeFactor;
      }

      // Slow down with the down arrow key
      if (inputMap["ArrowDown"]) {
        spaceshipSpeed -= speedChangeFactor;
        if (spaceshipSpeed < 0) {
          spaceshipSpeed = 0;
        }
      }

      // Keep the spaceship upright
      spaceship.rotationQuaternion = BABYLON.Quaternion.Identity();
      // Update skybox position to match camera position
      skybox.position.copyFrom(camera.position);

      updateCamera();

      if (inputMap[" "] && spaceship.position.y <= 1 && !inputMap["ArrowLeft"] && !inputMap["ArrowRight"]) {
        spaceship.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 1, 0), spaceship.getAbsolutePosition());
      }

      // Move spaceship forward
      spaceship.position.z -= spaceshipSpeed;


      // Check if the spaceship falls off the track
      if (spaceship.position.y < -2) {
        // Reset the spaceship's position
        showGameOver();

      }

      // console.log(inputMap)

      // Update score based on distance covered
      score = Math.floor(-spaceship.position.z);
      scoreDisplay.innerHTML = "Score: " + score;
      if (spaceship.position.z <= obstacles[obstacles.length - 1].position.z - 100) {
        // Generate new obstacles 100 units in front of the last obstacle
        obstacles = obstacles.concat(createObstacles(obstacles[obstacles.length - 1].position.z - 100, trackSegments[trackSegments.length - 1].position.x));

      }


      // Update track segments and obstacles
      // Update track segments and obstacles
      // Update track segments and obstacles
      if (spaceship.position.z <= trackSegments[0].position.z - trackDepth / 2) {
        // Move the first track segment to the end
        const firstTrackSegment = trackSegments.shift();
        firstTrackSegment.position.z = trackSegments[trackSegments.length - 1].position.z - trackDepth;

        // Randomly change the track direction with higher probability
        const randomDirection = Math.random();
        if (randomDirection < 0.45) {
          trackDirection = -1;
        } else if (randomDirection < 0.9) {
          trackDirection = 1;
        } else {
          trackDirection = 0;
        }
        firstTrackSegment.position.x = trackDirection * trackWidth;
        firstTrackSegment.rotation.y = trackDirection * Math.PI / 6;
        trackSegments.push(firstTrackSegment);

        // Move the first 20 obstacles to the end
        const firstObstacles = obstacles.splice(0, 20);
        for (let i = 0; i < firstObstacles.length; i++) {
          firstObstacles[i].position.z = obstacles[obstacles.length - 1].position.z - 10;
          firstObstacles[i].position.x = (Math.random() - 0.5) * gapSize + trackDirection * trackWidth;
        }

        obstacles = obstacles.concat(firstObstacles);
      }


      // Check for collisions
      for (const obstacle of obstacles) {
        //COMMENT IT OUT IF YOU WANT TO DRIVE ENDLESSLY
        // if (spaceship.intersectsMesh(obstacle, false) && spaceship.position.y <= obstacleHeight) {
        //   // Restart the game or end the game
        //   showGameOver();
        // }
      }
    });

    // Keyboard input
    // Keyboard input
    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);

    const onKeyUp = (evt) => {
      inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
    };

    const onKeyDown = (evt) => {
      inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";

      if (isGameOver && evt.sourceEvent.key === "ArrowUp") {
        restartGame();
      }
    };

    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        onKeyDown
      )
    );
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        onKeyUp
      )
    );



    // Physics
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
    scene.getPhysicsEngine().setTimeStep(1 / 120);

    spaceship.physicsImpostor = new BABYLON.PhysicsImpostor(spaceship, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, scene);

    spaceship.physicsImpostor.dispose();
    spaceship.physicsImpostor = new BABYLON.PhysicsImpostor(spaceship, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, scene);


    for (const trackSegment of trackSegments) {
      trackSegment.physicsImpostor = new BABYLON.PhysicsImpostor(trackSegment, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
    }

    return scene;
  };

  scene = await createScene();
  engine.runRenderLoop(() => {
    if (isGameOver) {
      return;
    }
    scene.render();
  });

  window.addEventListener('resize', function() {
    engine.resize();
  });
});
