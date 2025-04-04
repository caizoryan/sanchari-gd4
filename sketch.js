
let video;
let posenet;
// store body points
let keypoints = [];
// store lines between points
let skeleton = [];
// store effort images
let uppereffortMoving;
let uppereffortStill;
let lowereffortMoving;
let lowereffortStill;
let head
let zone1, zone2, zone3

let wristLeft
let wristRight
let kneeLeft
let kneeRight
let ankleLeft
let ankleRight

let o_nose = [];
// to store older wrist positions
let o_wristLeft = [];
let o_wristRight = [];

let o_shoulderRight = []
let o_shoulderLeft = []

// to store older knee positions
let o_kneeLeft = [];
let o_kneeRight = [];

// to store older ankle positions
let o_ankleLeft = [];
let o_ankleRight = [];


// ******************
/*
 * Ellipses
 * nose -> keypoint
 * wrists -> keypoints
 * ankles -> keypoints
 *
 * Pngs -> [
 *  ue_MOVING
 *  ue_STILL
 *
 *  le_MOVING
 *  le_STILL
 * ]
 *
 * Zones -> [
 *   based on movement over last 2-3s
 * ]

*/

// ******************
/*
 * Flow of logic
 * - draw keypoints
 *
 * - calculate avg movement
 *
 * - based on movement show pngs
 * - based on movement show zones

*/




function preload() {
  // Load images in preload, then resize them
  uppereffortMoving = loadImage('notation assets/uppereffortmoving.png');
  uppereffortStill = loadImage('notation assets/uppereffortstill.png');
  lowereffortMoving = loadImage('notation assets/lowereffortmoving.png');
  lowereffortStill = loadImage('notation assets/lowereffortstill.png');

  zone1 = loadImage('notation assets/zone1.png');
  zone2 = loadImage('notation assets/zone2.png');
  zone3 = loadImage('notation assets/zone3.png');

  head = loadImage('notation assets/head.png');

}

//document.body.style.filter = "grayscale(1)"
document.body.style.transform = "scaleX(-1)"

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);

  video = createCapture(VIDEO);
  video.hide();

  let ratio = min(width / video.width, height / video.height);

  let newVideoWidth = video.width * ratio;
  let newVideoHeight = video.height * ratio;

  video.size(newVideoWidth, newVideoHeight);

  // Initialize poseNet
  posenet = ml5.poseNet(video, modelReady);
  posenet.on('pose', gotPoses);
}

function modelReady() {
  console.log('model is readyyyyy');
}

function gotPoses(poses) {
  if (poses.length > 0) {
    //image(video, 0, 0)
    background(0, 30)
    keypoints = [];
    skeleton = [];

    poses.forEach((pose, i) => {
      if (i > 0) return
      keypoints.push(pose.pose.keypoints);
      skeleton.push(pose.skeleton);
    });

    //drawkeypoints();
    // will draw the keypoints and pngs
    trackUpperBody();
    //trackLowerBody();
    //zones();
  }
}

/**@param {any[]} arr */
function addToArray(point, arr, limit = 50) {
  arr.push(point)
  if (arr.length > limit) arr.shift()
}

function movementOfPositions(arr, size = 5, maxs = 150) {
  let min_x = arr
    .slice(-size)
    .reduce((acc, value) => min(acc, value.position.x), 999)

  let max_x = arr
    .slice(-size)
    .reduce((acc, value) => max(acc, value.position.x), 0)

  return min(max_x - min_x, maxs)
}

function averagePositions(arr, size = 5) {
  if (arr.length < size) arr[arr.length - 1].position
  let summed = arr
    .slice(-size)
    .reduce(
      (acc, value) => ({ x: acc.x + value.position.x, y: acc.y + value.position.y }),
      { x: 1, y: 1 }
    )

  return { x: summed.x / size, y: summed.y / size }
}

function trackUpperBody() {
  if (keypoints.length <= 0) return

  let c_wristLeft = getkeypointbyname(keypoints[0], 'leftWrist');
  let c_wristRight = getkeypointbyname(keypoints[0], 'rightWrist');
  let c_shoulderRight = getkeypointbyname(keypoints[0], 'rightShoulder');
  let c_shoulderLeft = getkeypointbyname(keypoints[0], 'leftShoulder');

  let c_ankleLeft = getkeypointbyname(keypoints[0], 'leftAnkle');
  let c_ankleRight = getkeypointbyname(keypoints[0], 'rightAnkle');

  let c_kneeLeft = getkeypointbyname(keypoints[0], 'leftKnee');
  let c_kneeRight = getkeypointbyname(keypoints[0], 'rightKnee');

  let c_nose = getkeypointbyname(keypoints[0], 'nose');

  addToArray(c_nose, o_nose)
  addToArray(c_wristRight, o_wristRight)
  addToArray(c_wristLeft, o_wristLeft)
  addToArray(c_shoulderRight, o_shoulderRight)
  addToArray(c_shoulderLeft, o_shoulderLeft)

  addToArray(c_ankleRight, o_ankleRight)
  addToArray(c_ankleLeft, o_ankleLeft)

  addToArray(c_kneeRight, o_kneeRight)
  addToArray(c_kneeLeft, o_kneeLeft)


  let wrist_dist = 0

  if (c_wristLeft && c_wristRight) {
    let a_wristLeft = averagePositions(o_wristLeft)
    let dist_left = movementOfPositions(o_wristLeft)

    let a_wristRight = averagePositions(o_wristRight)
    let dist_right = movementOfPositions(o_wristRight)
    wrist_dist = (dist_left + dist_right) / 2

    drawKeypoint(a_wristLeft)
    drawKeypoint(a_wristRight)
  }

  let a_ankleLeft
  let a_ankleRight
  if (c_ankleLeft && c_ankleRight) {
    a_ankleLeft = averagePositions(o_ankleLeft)
    let dist_left = movementOfPositions(o_ankleLeft)

    a_ankleRight = averagePositions(o_ankleRight)
    let dist_right = movementOfPositions(o_ankleRight)

    drawKeypoint(a_ankleLeft)
    drawKeypoint(a_ankleRight)
  }


  let ratio
  if (c_shoulderLeft && c_shoulderRight) {
    let a_shoulderLeft = averagePositions(o_shoulderLeft, 10)
    let a_shoulderRight = averagePositions(o_shoulderRight, 10)

    // drawKeypoint(a_shoulderLeft)
    // drawKeypoint(a_shoulderRight)


    let img = wrist_dist < 50 ? uppereffortStill : uppereffortMoving
    let lower_img = wrist_dist < 50 ? lowereffortStill : lowereffortMoving

    let full_height = a_ankleLeft.y - a_shoulderLeft.y
    let full_ratio = (full_height / lower_img.height)
    let full_w = lower_img.width * full_ratio

    let w = full_w
    ratio = (w / img.width)
    let h = img.height * ratio

    let center = a_shoulderLeft.x + ((a_shoulderRight.x - a_shoulderLeft.x) / 2)
    let x = center - (w / 2)

    image(img, x, a_shoulderRight.y, w, h)
    image(lower_img, x, a_shoulderRight.y, full_w, full_height)
  }

  if (c_kneeLeft && c_kneeRight) {
    let a_kneeLeft = averagePositions(o_kneeLeft)
    let a_kneeRight = averagePositions(o_kneeRight)

    let distance = abs(a_kneeRight.x - a_kneeLeft.x)

    let img
    if (distance < 150) {
      img = zone1
    }
    else if (distance < 250) {
      img = zone2
    }
    else {
      img = zone3
    }

    let w = img.width * ratio
    let h = img.height * ratio
    let center = a_ankleLeft.x + ((a_ankleRight.x - a_ankleLeft.x) / 2)
    let x = center - (w / 2)

    image(img, x, a_ankleLeft.y, w, h)
    // drawKeypoint(a_kneeLeft)
    // drawKeypoint(a_kneeRight)
  }


  if (c_nose) {
    let a_nose = averagePositions(o_nose)
    drawKeypoint(a_nose)
    image(head, (a_nose.x - (head.width * ratio) / 2), a_nose.y - (head.height * ratio) / 2, head.width * ratio, head.height * ratio);
  }

}

/**
 * @param {{x: number, y: number}} position 
 * @param {number} size 
 * @param {string} name 
 * */
function drawKeypoint(position, size = 20, name = "") {
  fill(255);
  ellipse(position.x, position.y, size, size); // Right wrist
}

function zones() {
  if (keypoints.length > 0) {
    let currentankleLeft = getkeypointbyname(keypoints[0], 'leftAnkle');
    let currentankleRight = getkeypointbyname(keypoints[0], 'rightAnkle');

    if (currentankleLeft && currentankleRight) {
      let leftmove = 0;
      let rightmove = 0;

      // Left knee calculating movement
      if (o_ankleLeft) {
        leftmove = calculateMovement(o_ankleLeft, currentankleLeft.position);
      }

      // Right knee calculating movement
      if (o_ankleRight) {
        rightmove = calculateMovement(o_ankleRight, currentankleRight.position);
      }

      let midX = (currentankleLeft.position.x + currentankleRight.position.x) / 2;
      let midY = (currentankleLeft.position.y + currentankleRight.position.y) / 2;

      if (leftmove > 30 || rightmove > 30) {
        showzoneimages(midX, midY, zone1);
      } else if (leftmove > 10 || rightmove > 10) {
        showzoneimages(midX, midY, zone2);
      } else {
        showzoneimages(midX, midY, zone3);
      }

      o_ankleLeft = currentankleLeft.position;
      o_ankleRight = currentankleRight.position;
    }
  }
}

function getkeypointbyname(keypoints, name) {
  return keypoints.find(point => point.part === name);
}

function calculateMovement(prevpoint, currentpoint) {
  let d = distance(prevpoint, currentpoint);
  return d;
}

function distance(point_1, point_2) {
  var a = point_1.x - point_2.x;
  var b = point_1.y - point_2.y;
  return Math.sqrt(a * a + b * b);
}

function draw() {
  //background(0, 127);
}
