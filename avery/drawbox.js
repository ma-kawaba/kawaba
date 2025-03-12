// Get elements from the DOM
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const brushSizeInput = document.getElementById('brushSize');
const brushColorInput = document.getElementById('brushColor');
const messageInput = document.getElementById('message');
const submitButton = document.getElementById('submit');
const undoButton = document.getElementById('undoButton');

// Set initial drawing settings
let drawing = false;
let brushSize = brushSizeInput.value;
let brushColor = brushColorInput.value;

// History of canvas states for undo functionality
let canvasHistory = [];
const maxHistory = 10; // Limit the number of states to save memory

// Track canvas size and scaling
let canvasScale = { x: 1, y: 1 };

// Initialize and adjust the canvas size
function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  canvas.width = width;
  canvas.height = height;

  // Restore the previous content after resizing
  ctx.putImageData(imageData, 0, 0);

  // Update scale to maintain proper alignment
  canvasScale.x = canvas.width / width;
  canvasScale.y = canvas.height / height;
}

// Fill canvas with white when the page loads
function fillCanvasWithWhite() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Save the current state of the canvas
function saveState() {
  if (canvasHistory.length >= maxHistory) {
    canvasHistory.shift(); // Remove the oldest state if history exceeds max length
  }
  canvasHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// Undo the last drawing action
function undo() {
  if (canvasHistory.length > 0) {
    const lastState = canvasHistory.pop();
    ctx.putImageData(lastState, 0, 0);
  }
}

// Adjust brush size and color dynamically
brushSizeInput.addEventListener('input', () => {
  brushSize = brushSizeInput.value;
});

brushColorInput.addEventListener('input', () => {
  brushColor = brushColorInput.value;
});

// Get the scaled canvas coordinates
function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvasScale.x;
  const y = (event.clientY - rect.top) * canvasScale.y;
  return { x, y };
}

// Start drawing
function startDrawing(event) {
  saveState(); // Save the state before starting a new drawing
  drawing = true;
  draw(event);
}

// Stop drawing
function stopDrawing() {
  drawing = false;
  ctx.beginPath();
}

// Draw on the canvas
function draw(event) {
  if (!drawing) return;

  const { x, y } = getCanvasCoordinates(event);

  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.strokeStyle = brushColor;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

// Event listeners for mouse
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', (event) => {
  if (drawing) draw(event);
});
canvas.addEventListener('mouseout', stopDrawing);

// Event listeners for touch
canvas.addEventListener('touchstart', (event) => {
  event.preventDefault();
  startDrawing(event.touches[0]);
});
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', (event) => {
  event.preventDefault();
  if (drawing) draw(event.touches[0]);
});

// Check if the canvas is empty (all white pixels)
function isCanvasEmpty() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
      return false; // Found a non-white pixel
    }
  }
  return true;
}

// Resize the canvas on window resize
window.addEventListener('resize', resizeCanvas);

// Initialize canvas size
resizeCanvas();

// Fill the canvas with white on load
fillCanvasWithWhite();

// Undo button event listener
undoButton.addEventListener('click', undo);

// Submit button event listener
submitButton.addEventListener('click', async () => {
  const imageData = canvas.toDataURL(); // Get canvas data as base64 image
  const message = messageInput.value.trim();

  if (isCanvasEmpty() && !message) {
    alert('You must draw something or enter a message before submitting!');
    return;
  }

  if (!isCanvasEmpty() && message) {
    await sendMessageAndDrawingToDiscord(message, imageData);
  } else if (message) {
    await sendMessageToDiscord(message);
  } else if (!isCanvasEmpty()) {
    await sendDrawingToDiscord(imageData);
  }
});