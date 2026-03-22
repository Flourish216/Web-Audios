let mic;
let delayFx;
let roboticDist;
let roboticHigh;
let roboticLow;
let amp;

let micStarted = false;
let delayTime = 0.2;
let roboticAmt = 0.35;
let smoothedLevel = 0;

const statusEl = document.getElementById("mic-status");
const delayEl = document.getElementById("delay-readout");
const roboticEl = document.getElementById("robotic-readout");

function setup() {
  const holder = document.getElementById("sketch-holder");
  const w = Math.max(320, holder.clientWidth);
  const h = Math.max(320, holder.clientHeight);

  const cnv = createCanvas(w, h);
  cnv.parent("sketch-holder");

  mic = new p5.AudioIn();
  delayFx = new p5.Delay();
  roboticDist = new p5.Distortion();
  roboticHigh = new p5.HighPass();
  roboticLow = new p5.LowPass();

  delayFx.process(mic, delayTime, 0.2, 2400);
  delayFx.drywet(0.55);
  delayFx.disconnect();

  roboticDist.process(delayFx, roboticAmt * 0.7, "2x");
  roboticDist.disconnect();

  roboticHigh.process(roboticDist);
  roboticHigh.freq(380);
  roboticHigh.res(1.2);

  roboticLow.process(roboticHigh);
  roboticLow.freq(3600);
  roboticLow.res(1);

  amp = new p5.Amplitude();
  amp.setInput(roboticLow);

  updateReadouts();
}

function windowResized() {
  const holder = document.getElementById("sketch-holder");
  resizeCanvas(Math.max(320, holder.clientWidth), Math.max(320, holder.clientHeight));
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    toggleMic();
  }
}

async function toggleMic() {
  try {
    await userStartAudio();
    if (!micStarted) {
      mic.start();
      micStarted = true;
    } else {
      mic.stop();
      micStarted = false;
    }
    updateReadouts();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "ERROR";
  }
}

function draw() {
  const orbX = width * 0.5;
  const orbY = height * 0.5;

  if (micStarted) {
    const mx = constrain(mouseX, 0, width);
    const my = constrain(mouseY, 0, height);

    delayTime = map(mx, 0, width, 0.03, 0.45, true);
    roboticAmt = map(my, height, 0, 0.05, 0.65, true);
    const feedbackAmt = map(roboticAmt, 0.05, 0.65, 0.12, 0.36, true);

    delayFx.delayTime(delayTime);
    delayFx.feedback(feedbackAmt);
    delayFx.drywet(0.5 + roboticAmt * 0.2);
    roboticDist.set(roboticAmt * 0.8, "2x");
    roboticHigh.freq(220 + roboticAmt * 900);
    roboticHigh.res(0.9 + roboticAmt * 3.2);
    roboticLow.freq(3800 - roboticAmt * 1300);
    roboticLow.res(0.8 + roboticAmt * 1.4);
  }

  const level = micStarted ? amp.getLevel() : 0;
  smoothedLevel = lerp(smoothedLevel, level, 0.2);

  background(230, 236, 244);

  const orbSize = 70 + smoothedLevel * 420;
  const ringSize = orbSize * 1.6 + delayTime * 90 + roboticAmt * 45;

  noFill();
  stroke(70, 110, 150, 100 + roboticAmt * 80);
  strokeWeight(1);
  circle(orbX, orbY, ringSize);

  noStroke();
  fill(90, 140, 185, 28 + smoothedLevel * 120 + roboticAmt * 25);
  circle(orbX, orbY, orbSize * 1.25);
  fill(245, 248, 252, 200);
  circle(orbX, orbY, orbSize);

  updateReadouts();
}

function updateReadouts() {
  statusEl.textContent = micStarted ? "ON" : "OFF";
  delayEl.textContent = `${delayTime.toFixed(2)} s`;
  roboticEl.textContent = roboticAmt.toFixed(2);
}
