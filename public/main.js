const mainCanvas = document.getElementById("mapContainer");
const maskCanvas = document.createElement("canvas");
const exportCanvas = document.getElementById("exportContainer");
const mainContext = mainCanvas.getContext("2d");
const maskContext = maskCanvas.getContext("2d");
const exportContext = exportCanvas.getContext("2d");
let width = 512;
let height = 512;
const BRUSH_RADIUS = 5;
let cursorPos = { x: 0, y: 0 };

const mapImage = new Image();
mapImage.src = "./img/map.jpg";
mapImage.onload = () => {
  initCanvas(mapImage);
  const maskImage = new Image();
  maskImage.src = "./img/mask.png";
  maskImage.onerror = () => {};

  maskImage.onload = () => {
    initMaskCanvas(maskImage);
    render();
    renderBrush();
    initExportCanvas();
  };
};

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
  renderBrush();
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

/**
 * Mask painting
 */
let mousePressed = false;
let brushRadiusMultiplier = 5;
let brushType = "circle";

document.getElementById("brushStyle").addEventListener("change", (event) => {
  brushType = event.target.value;
});

mainCanvas.addEventListener("mousedown", (event) => {
  mousePressed = true;
});

window.addEventListener("mouseup", (event) => {
  mousePressed = false;
});

mainCanvas.addEventListener("wheel", (event) => {
  render();
  renderBrush();
  if (!event.shiftKey) {
    return;
  }

  brushRadiusMultiplier -= event.deltaY / 150;
  if (brushRadiusMultiplier < 1) {
    brushRadiusMultiplier = 1;
  }
  if (brushRadiusMultiplier > 20) {
    brushRadiusMultiplier = 20;
  }
});

mainCanvas.addEventListener("mousemove", (event) => {
  cursorPos = { x: event.offsetX, y: event.offsetY };
  if (mousePressed) {
    maskContext.beginPath();
    maskContext.fillStyle = event.shiftKey ? "black" : "white";
    if (brushType === "circle") {
      maskContext.arc(
        cursorPos.x,
        cursorPos.y,
        BRUSH_RADIUS * brushRadiusMultiplier,
        0,
        2 * Math.PI
      );
    }
    if (brushType === "rect") {
      maskContext.rect(
        cursorPos.x - (BRUSH_RADIUS * brushRadiusMultiplier) / 2,
        cursorPos.y - (BRUSH_RADIUS * brushRadiusMultiplier) / 2,
        BRUSH_RADIUS * brushRadiusMultiplier,
        BRUSH_RADIUS * brushRadiusMultiplier
      );
    }
    maskContext.fill();
    maskContext.closePath();
  }
  render();
  renderBrush();
});

mainCanvas.addEventListener("mouseout", (event) => {
  render();
});

function renderBrush() {
  mainContext.save();
  mainContext.beginPath();
  mainContext.strokeStyle = "red";
  mainContext.lineWidth = 3;
  if (brushType === "circle") {
    mainContext.arc(
      cursorPos.x,
      cursorPos.y,
      BRUSH_RADIUS * brushRadiusMultiplier,
      0,
      2 * Math.PI
    );
  }
  if (brushType === "rect") {
    mainContext.rect(
      cursorPos.x - (BRUSH_RADIUS * brushRadiusMultiplier) / 2,
      cursorPos.y - (BRUSH_RADIUS * brushRadiusMultiplier) / 2,
      BRUSH_RADIUS * brushRadiusMultiplier,
      BRUSH_RADIUS * brushRadiusMultiplier
    );
  }
  mainContext.stroke();
  mainContext.closePath();
  mainContext.restore();
}
/**
 * Exporting canvas
 */
const buttonPostMask = document.getElementById("postMask");
buttonPostMask.addEventListener("click", (event) => {
  const maskFormData = new FormData();
  maskFormData.append("file", maskCanvas.toDataURL("img/png"));
  fetch("/mask", {
    method: "POST",
    body: maskFormData,
  });
  initExportCanvas();
  const exportFormData = new FormData();
  exportFormData.append("file", exportCanvas.toDataURL("img/png"));
  fetch("/export", {
    method: "POST",
    body: exportFormData,
  });
});

function initExportCanvas() {
  exportCanvas.width = width;
  exportCanvas.height = height;
  exportContext.save();
  exportContext.drawImage(mapImage, 0, 0);
  exportContext.globalCompositeOperation = "multiply";
  exportContext.globalAlpha = 1;
  exportContext.drawImage(maskCanvas, 0, 0);
  exportContext.restore();
  renderTokens();
}

/**
 * TOKENS
 */
const TOKEN_RADIUS = 30;
const fontSize = TOKEN_RADIUS * 2.0;
const fontFamily = "Roboto";

const tokensData = [
  { x: 40, y: 40, color: "red", label: "C" },
  { x: 50, y: 40, color: "blue", label: "S" },
];
let currentTokenId = -1;
let mouseOffset = {
  x: 0,
  y: 0,
};

function renderTokens() {
  exportContext.save();
  for (let token of tokensData) {
    // Draw circle
    exportContext.beginPath();
    exportContext.fillStyle = token.color;
    exportContext.arc(token.x, token.y, TOKEN_RADIUS, 0, 2 * Math.PI);
    exportContext.fill();
    exportContext.closePath();

    // Draw label
    exportContext.fillStyle = "white";
    exportContext.font = `${fontSize}px ${fontFamily}`;
    exportContext.textBaseline = "middle";
    exportContext.textAlign = "center";
    exportContext.fillText(token.label, token.x, token.y + TOKEN_RADIUS * 0.15);
  }

  exportContext.restore();
}

exportCanvas.addEventListener("mousedown", (event) => {
  currentTokenId = getClickedTokenId(event.offsetX, event.offsetY);
  if (currentTokenId === -1) return;
  const currentToken = tokensData.splice(currentTokenId, 1)[0];
  tokensData.push(currentToken);
  mouseOffset.x = tokensData[tokensData.length - 1].x - event.offsetX;
  mouseOffset.y = tokensData[tokensData.length - 1].y - event.offsetY;
  renderTokens();
});

window.addEventListener("mouseup", () => {
  if (currentTokenId < 0) return;
  currentTokenId = -1;
});

exportCanvas.addEventListener("mousemove", (event) => {
  if (currentTokenId === -1) return;

  tokensData[tokensData.length - 1].x = event.offsetX + mouseOffset.x;
  tokensData[tokensData.length - 1].y = event.offsetY + mouseOffset.y;
  initExportCanvas();
  renderTokens();
});

function getClickedTokenId(x, y) {
  for (let i = tokensData.length - 1; i >= 0; i--) {
    const token = tokensData[i];
    if (distance(x, y, token.x, token.y) <= TOKEN_RADIUS) return i;
  }
  return -1;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
