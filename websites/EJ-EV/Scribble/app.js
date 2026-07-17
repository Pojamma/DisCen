document.querySelectorAll('.draggable').forEach(item => {
    item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData("text/plain", event.target.style.backgroundImage);
    });

    item.addEventListener('touchstart', (event) => {
        const touchLocation = event.targetTouches[0];
        event.target.style.position = 'absolute';
        event.target.style.left = touchLocation.pageX + 'px';
        event.target.style.top = touchLocation.pageY + 'px';
        document.body.appendChild(event.target);
    });

    item.addEventListener('touchmove', (event) => {
        event.preventDefault(); // Prevent scrolling while dragging
        const touchLocation = event.targetTouches[0];
        // You can use event.target here instead of item for clarity:
        event.target.style.left = touchLocation.pageX + 'px';
        event.target.style.top = touchLocation.pageY + 'px';
    });
});

const drawingPanel = document.getElementById('drawingPanel');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Set initial line width and color
context.lineWidth = 5;
context.strokeStyle = '#000000';

document.getElementById('colorPicker').addEventListener('input', (event) => {
    context.strokeStyle = event.target.value;
});

drawingPanel.addEventListener('dragover', (event) => {
    event.preventDefault();
});

drawingPanel.addEventListener('drop', (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const imgSrc = data.slice(5, -2); // Remove 'url("' and '")'
    console.log('Image Source:', imgSrc); // Log image source for debugging
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
        context.drawImage(img, event.offsetX, event.offsetY, 100, 100); // Draw image on canvas
        undoStack.push({ type: 'image', data: imgSrc, x: event.offsetX, y: event.offsetY }); // Save image action for undo
    };
});

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

let undoStack = [];
let redoStack = [];

// Declare isDrawing, lastX, and lastY
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function undoLast() {
    if (undoStack.length > 0) {
        const lastAction = undoStack.pop();
        redoStack.push(canvas.toDataURL()); // Save current state to redo stack

        clearCanvas();
        const img = new Image();
        img.src = lastAction;
        img.onload = () => {
            context.drawImage(img, 0, 0);
        };
    }
}

function redoLast() {
    if (redoStack.length > 0) {
        const lastState = redoStack.pop();
        undoStack.push(canvas.toDataURL()); // Save current state to undo stack
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            clearCanvas();
            context.drawImage(img, 0, 0);
        };
    }
}

function saveState() {
    try {
        undoStack.push(canvas.toDataURL()); // Save canvas state for undo
    } catch (error) {
        console.error("Failed to save canvas state: ", error);
    }
}

canvas.addEventListener('mousedown', (event) => {
    isDrawing = true;
    lastX = event.offsetX;
    lastY = event.offsetY;
    saveState();
});

canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(event.offsetX, event.offsetY);
    context.stroke();
    lastX = event.offsetX;
    lastY = event.offsetY;
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('touchstart', (event) => {
    isDrawing = true;
    const touch = event.targetTouches[0];
    lastX = touch.pageX - drawingPanel.offsetLeft;
    lastY = touch.pageY - drawingPanel.offsetTop;
    saveState();
});

canvas.addEventListener('touchmove', (event) => {
    if (!isDrawing) return;
    event.preventDefault();
    const touch = event.targetTouches[0];
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(touch.pageX - drawingPanel.offsetLeft, touch.pageY - drawingPanel.offsetTop);
    context.stroke();
    lastX = touch.pageX - drawingPanel.offsetLeft;
    lastY = touch.pageY - drawingPanel.offsetTop;
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
});