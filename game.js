document.addEventListener('DOMContentLoaded', async function() {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scoreDisplay = document.getElementById('scoreDisplay');
  let score = 0;
  let spaceshipSpeed = 0.1;
  const speedChangeFactor = 0.01;

  //skybox for background
  const createSkybox = (scene, texturePath) => {
    const skybox = BABYLON.MeshBuilder.CreateBox("skybox", { size: 1000 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyboxMaterial", scene);

    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(texturePath, scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;

    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;

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
  };

  // gameOverDisplay.addEventListener('click', () => {
  //   restartGame();
  // });

  const loadGLTFModel = async (scene, url) => {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", url, scene);
    const model = result.meshes[0];
    return model;
  };



  const createScene = async () => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    createSkybox(scene, "./cubemap.png"); // Replace with your image's path and extension

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

    // Lights
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Spaceship
    const spaceship = await loadGLTFModel(scene, './spaceshipa.glb'); // Change this path to the correct one
    spaceship.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
    spaceship.position.y = 1;

    // Set camera target
    camera.lockedTarget = spaceship;

    // Track
    const trackWidth = 10;
    const trackDepth = 200;
    let trackSegments = [];
    let obstacles = [];

    const createTrackSegment = (startZ) => {
      const trackSegment = BABYLON.MeshBuilder.CreateBox('trackSegment', { width: trackWidth, height: 0.5, depth: trackDepth }, scene);
      trackSegment.position.y = -0.25;
      trackSegment.position.z = startZ - trackDepth / 2;
      trackSegment.material = new BABYLON.StandardMaterial('trackMat', scene);
      trackSegment.material.diffuseTexture = new BABYLON.Texture('./texture.png', scene); // Replace with your image's path and extension

      // trackSegment.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
      return trackSegment;
    };

    const gapSize = 3;
    const obstacleHeight = 1;

    const createObstacles = (startZ) => {
      const newObstacles = [];
      for (let i = 0; i < 20; i++) {
        const obstacle = BABYLON.MeshBuilder.CreateBox('obstacle' + i, { width: trackWidth - gapSize, height: obstacleHeight, depth: 1 }, scene);
        obstacle.position.y = 0.5;
        obstacle.position.z = startZ - 10 * i - 20;
        obstacle.position.x = (Math.random() - 0.5) * gapSize;
        obstacle.material = new BABYLON.StandardMaterial('obstacleMat' + i, scene);
        obstacle.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        newObstacles.push(obstacle);
      }
      return newObstacles;
    };

    trackSegments.push(createTrackSegment(0));
    trackSegments.push(createTrackSegment(-trackDepth));
    // Add the third track segment and set of obstacles
    trackSegments.push(createTrackSegment(-2 * trackDepth));
    obstacles = obstacles.concat(createObstacles(0));
    obstacles = obstacles.concat(createObstacles(-trackDepth));
    // Add the new set of obstacles for the third track segment
    obstacles = obstacles.concat(createObstacles(-2 * trackDepth));


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

      updateCamera();

      if (inputMap[" "] && spaceship.position.y <= 1) {
        spaceship.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 1, 0), spaceship.getAbsolutePosition());
      }

      // Move spaceship forward
      spaceship.position.z -= spaceshipSpeed;


      // Check if the spaceship falls off the track
      if (spaceship.position.y < -2) {
        // Reset the spaceship's position
        showGameOver();

      }

      // Update score based on distance covered
      score = Math.floor(-spaceship.position.z);
      scoreDisplay.innerHTML = "Score: " + score;

      // Update track segments and obstacles
      // Update track segments and obstacles
      // Update track segments and obstacles
      if (spaceship.position.z <= trackSegments[0].position.z - trackDepth / 2) {
        // Move the first track segment to the end
        const firstTrackSegment = trackSegments.shift();
        firstTrackSegment.position.z = trackSegments[trackSegments.length - 1].position.z - trackDepth;
        trackSegments.push(firstTrackSegment);

        // Move the first 20 obstacles to the end
        const firstObstacles = obstacles.splice(0, 20);
        for (let i = 0; i < firstObstacles.length; i++) {
          firstObstacles[i].position.z = obstacles[obstacles.length - 1].position.z - 10;
          firstObstacles[i].position.x = (Math.random() - 0.5) * gapSize;
        }
        obstacles = obstacles.concat(firstObstacles);
      }



      // Check for collisions
      for (const obstacle of obstacles) {
        if (spaceship.intersectsMesh(obstacle, false) && spaceship.position.y <= obstacleHeight) {
          // Restart the game or end the game
          showGameOver();
        }
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
