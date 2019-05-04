var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = 0;

const numbersView = document.getElementById("numbers");
const historyView = document.getElementById("history");

if (navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");
  var constraints = { audio: true };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function(stream) {
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      draw();
    })
    .catch(function(err) {
      console.log("The following gUM error occured: " + err);
    });
} else {
  console.log("getUserMedia not supported on your browser!");
}

analyser.fftSize = 2048;
// analyser.fftSize = 32;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(dataArray);

// Get a canvas defined with ID "oscilloscope"
var canvas = document.getElementById("oscilloscope");
var canvasCtx = canvas.getContext("2d");

const WIDTH = canvas.clientWidth;
const HEIGHT = canvas.clientHeight;

// draw an oscilloscope of the current audio source

let recordedCharacter = false;
let lastIntValue = 0;
let lastChange = Date.now();
const timeThreshold = 20;

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  canvasCtx.fillStyle = "rgb(0, 0, 0)";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  var barWidth = (WIDTH / bufferLength) * 0.9;
  var barHeight;
  var x = 0;

  for (var i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i];

    if (relevantFrequency(i)) {
      canvasCtx.fillStyle = "rgb(0,255,0)";
    } else {
      canvasCtx.fillStyle = "rgb(255,0,0)";
    }
    canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth + 1;
  }

  const binaryString = getBits(dataArray).join("");
  const intValue = parseInt(binaryString, 2);

  // console.log(Date.now() - lastChange);
  if (lastIntValue === intValue) {
    if (!recordedCharacter && Date.now() - lastChange > timeThreshold) {
      recordCharacter({ binaryString, intValue });
      recordedCharacter = true;
    }
  } else {
    lastChange = Date.now();
    lastIntValue = intValue;
    recordedCharacter = false;
  }
}

const amplitudeThreshold = 150;

const bitRanges = [
  [47, 50],
  [54, 57],
  [61, 64],
  [69, 71],
  [76, 78],
  [83, 85],
  [89, 92],
  [96, 99]
];

const bitFrequencies = bitRanges.map(range =>
  Math.round((range[0] + range[1]) / 2)
);

function getBits(frequencyArray) {
  return bitFrequencies
    .map(frequency => (frequencyArray[frequency] > amplitudeThreshold) + 0)
    .reverse();
}

function relevantFrequency(index) {
  return bitRanges.some(([low, high]) => index >= low && index <= high);
}

function recordCharacter({ binaryString, intValue }) {
  const character = String.fromCharCode(intValue);
  numbersView.innerHTML = `${binaryString} -- ${intValue} -- ${character}`;

  historyView.innerHTML = historyView.innerHTML + character;
}

draw();
