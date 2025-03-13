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
  const lastState = canvasHistory.pop();
  ctx.putImageData(lastState, 0, 0);
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

// Check if the canvas is empty (all white)
function isCanvasDrawn() {
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  
  // Loop through pixels in steps of 4 (RGBA)
  for (let i = 0; i < pixelData.length; i += 4) {
    // Check if the pixel is not white (not 255, 255, 255) or not fully transparent
    if (pixelData[i] !== 255 || pixelData[i + 1] !== 255 || pixelData[i + 2] !== 255) {
      return true; // Something has been drawn
    }
  }

  return false; // Canvas is entirely white
}

// Resize the canvas on window resize
window.addEventListener('resize', resizeCanvas);

// Initialize canvas size
resizeCanvas();

// Fill the canvas with white on load
fillCanvasWithWhite();

// Undo button event listener
undoButton.addEventListener('click', undo);

// Submit button event listener (unchanged)
submitButton.addEventListener('click', async () => {
  const imageData = canvas.toDataURL();
  const message = messageInput.value.trim();
});

// Submit the drawing and message to Discord Webhook
submitButton.addEventListener('click', async () => {
  const imageData = canvas.toDataURL(); // Get canvas data as base64 image
  const message = messageInput.value.trim();

  if (!isCanvasDrawn() && !message) {
    alert('You must draw something or enter a message before submitting!');
    return;
  }

  if (isCanvasDrawn() && message) {
    await sendMessageAndDrawingToDiscord(message, imageData);
    return;
  } else if (message) {
      await sendMessageToDiscord(message);
  } else if (isCanvasDrawn()) {
      await sendDrawingToDiscord(imageData);
  }
  return;
});

// Function to send message to Discord
async function sendMessageAndDrawingToDiscord(message, imageData) {
  const webhookUrl = 'https://discord.com/api/webhooks/1349113245155197028/mGhUqujM0OOE02MbTrYc3A2PV62tPtRPTVPdqhcKKY8t3Y08mKIgRckKBuHrRBXD4ENg'; // Replace with your actual Discord webhook URL

  // Convert the base64 data URL to a Blob
  const blob = await fetch(imageData).then((res) => res.blob());

  // Create a FormData object for the file and message
  const formData = new FormData();
  formData.append('payload_json', JSON.stringify({ content: message })); // Attach the message
  formData.append('file', blob, 'drawing.png'); // Attach the image

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 429) {
      throw new Error(`Too many requests! please wait before submitting your next message`) 
    } else if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert('Your message and drawing have been submitted!');
    messageInput.value = ''; // Clear the message input
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    canvasHistory = []; // Clear history after submission
  } catch (error) {
    console.error('Error sending message to Discord:', error);
    alert(error);
  }
}

// Function to send message to Discord
async function sendMessageToDiscord(message) {
  const webhookUrl = 'https://tuvik-dog.xyz/web-inbox.php?target=aster'; // Replace with your actual Discord webhook URL

  // Create a FormData object for the file and message
  const formData = new FormData();
  formData.append('payload_json', JSON.stringify({ content: message })); // Attach the message

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 429) {
      throw new Error(`Too many requests! please wait before submitting your next message`) 
    } else if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert('Your message has been submitted!');
    messageInput.value = ''; // Clear the message input
  } catch (error) {
    console.error('Error sending message to Discord:', error);
    alert(error);
  }
}

// Function to send drawing to Discord
async function sendDrawingToDiscord(imageData) {
  const webhookUrl = 'https://tuvik-dog.xyz/web-inbox.php?target=aster'; // Replace with your actual Discord webhook URL

  // Convert the base64 data URL to a Blob
  const blob = await fetch(imageData).then((res) => res.blob());

  // Create a FormData object for the file and message
  const formData = new FormData();
  formData.append('file', blob, 'drawing.png'); // Attach the image

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 429) {
      throw new Error(`Too many requests! please wait before submitting your next message`) 
    } else if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert('Your drawing has been submitted!');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    canvasHistory = []; // Clear history after submission
  } catch (error) {
    console.error('Error sending drawing and message to Discord:', error);
    alert(error);
  }
}

// Undo button event listener
undoButton.addEventListener('click', undo);