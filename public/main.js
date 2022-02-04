const mainCanvas = document.getElementById("mapContainer");
const maskCanvas = document.createElement("canvas");

const maskSave = document.getElementById("maskSave");

const mapImage = new Image();
mapImage.src = "./img/map.jpg";
mapImage.onload = () => {
  initCanvas(mapImage);
  const maskImage = new Image();
  maskImage.src = "./img/mask.png";
  maskImage.onerror = () => {};

  maskImage.onload = () => {
    console.log("masque chargé");
    initMaskCanvas(maskImage);
    render();
  };
};

const mainContext = mainCanvas.getContext("2d");
const maskContext = maskCanvas.getContext("2d");
let width = 512;
let height = 512;
const BRUSH_RADIUS = 50;

function initCanvas(mapImage) {
  width = mapImage.width;
  height = mapImage.height;
  mainCanvas.width = width;
  mainCanvas.height = height;
  maskCanvas.width = width;
  maskCanvas.height = height;

  maskContext.fillStyle = "black";
  maskContext.fillRect(0, 0, width, height);

  render();
}

function initMaskCanvas(maskImage) {
  maskContext.save();
  maskContext.drawImage(maskImage, 0, 0);
  maskContext.restore();
}

function render() {
  mainContext.save();
  mainContext.drawImage(mapImage, 0, 0);
  mainContext.globalCompositeOperation = "multiply";
  mainContext.globalAlpha = 0.5;
  mainContext.drawImage(maskCanvas, 0, 0);
  mainContext.restore();
}

let mousePressed = false;

mainCanvas.addEventListener("mousedown", (event) => {
  mousePressed = true;
});

window.addEventListener("mouseup", (event) => {
  mousePressed = false;
});

mainCanvas.addEventListener("mousemove", (event) => {
  if (!mousePressed) return;
  maskContext.beginPath();
  maskContext.fillStyle = event.shiftKey ? "black" : "white";
  maskContext.arc(event.offsetX, event.offsetY, BRUSH_RADIUS, 0, 2 * Math.PI);
  maskContext.fill();
  maskContext.closePath();
  render();
});

const buttonPostMask = document.getElementById("postMask");
buttonPostMask.addEventListener("click", (event) => {
  const formData = new FormData();
  formData.append("file", maskCanvas.toDataURL("img/png"));
  fetch("/mask", {
    method: "POST",
    body: formData,
  });
});
