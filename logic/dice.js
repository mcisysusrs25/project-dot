const canvas = document.getElementById("diceCanvas");
const ctx = canvas.getContext("2d");

// Define grid size (number of dice in rows and columns)
const gridSize = 10; // 10x10 grid
const diceSize = 60; // Each dice will be a 60x60 square

// Sample image for testing (replace with an actual image URL)
const img = new Image();
img.src = 'https://via.placeholder.com/600'; // Use your image here

// Draw grid of dice
img.onload = function() {
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  createDiceGrid(img);
};

// Create dice grid based on image
function createDiceGrid(image) {
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Get color for each grid cell from the image
      const pixelIndex = ((row * diceSize) * image.width + col * diceSize) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      
      // Draw dice (colored block) at position
      drawDice(col * diceSize, row * diceSize, r, g, b);
    }
  }
}

// Function to draw a dice (square) with color based on pixel
function drawDice(x, y, r, g, b) {
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y, diceSize, diceSize);  // Draw square representing the dice
}
