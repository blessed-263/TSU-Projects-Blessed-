const imageLoader = document.getElementById("imageLoader");
const retouchOptions = document.getElementById("retouchOptions");
const imageCanvas = document.getElementById("imageCanvas");
const downloadBtn = document.getElementById("downloadBtn");

const ctx = imageCanvas.getContext("2d");
let img = new Image();
let imgLoaded = false;
let selection = null;
let isSelecting = false;
let startX = 0;
let startY = 0;

// Image loader handler
imageLoader.addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (event) {
		img = new Image();
		img.onload = function () {
			imageCanvas.width = img.width;
			imageCanvas.height = img.height;
			ctx.drawImage(img, 0, 0);
			imgLoaded = true;
			downloadBtn.disabled = true;
			selection = null;
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(file);
});

// Mouse event handlers with improved coordinates
imageCanvas.addEventListener("mousedown", (e) => {
	if (!imgLoaded) return;
	isSelecting = true;
	const rect = imageCanvas.getBoundingClientRect();
	const scaleX = imageCanvas.width / rect.width;
	const scaleY = imageCanvas.height / rect.height;

	startX = (e.clientX - rect.left) * scaleX;
	startY = (e.clientY - rect.top) * scaleY;
	startX = Math.max(0, Math.min(imageCanvas.width, startX));
	startY = Math.max(0, Math.min(imageCanvas.height, startY));

	selection = { x: startX, y: startY, width: 0, height: 0 };
});

imageCanvas.addEventListener("mousemove", (e) => {
	if (!isSelecting) return;
	const rect = imageCanvas.getBoundingClientRect();
	const scaleX = imageCanvas.width / rect.width;
	const scaleY = imageCanvas.height / rect.height;

	let mouseX = (e.clientX - rect.left) * scaleX;
	let mouseY = (e.clientY - rect.top) * scaleY;
	mouseX = Math.max(0, Math.min(imageCanvas.width, mouseX));
	mouseY = Math.max(0, Math.min(imageCanvas.height, mouseY));

	selection.width = mouseX - startX;
	selection.height = mouseY - startY;
	redrawCanvasWithSelection();
});

// Handle mouseup anywhere in window
window.addEventListener("mouseup", (e) => {
	if (!isSelecting) return;
	isSelecting = false;
	applyRetouch();
});

// ESC key to cancel selection
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && isSelecting) {
		isSelecting = false;
		selection = null;
		redrawCanvasWithSelection();
	}
});

function redrawCanvasWithSelection() {
	ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
	ctx.drawImage(img, 0, 0);
	if (selection) {
		ctx.strokeStyle = "red";
		ctx.lineWidth = 2;
		ctx.setLineDash([6]);
		ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
		ctx.setLineDash([]);
	}
}

function applyRetouch() {
	if (!selection) return;

	// Convert to integer coordinates
	let x = Math.floor(Math.min(selection.x, selection.x + selection.width));
	let y = Math.floor(Math.min(selection.y, selection.y + selection.height));
	let w = Math.floor(Math.abs(selection.width));
	let h = Math.floor(Math.abs(selection.height));

	if (w === 0 || h === 0) return;

	const imageData = ctx.getImageData(x, y, w, h);
	const data = imageData.data;

	switch (retouchOptions.value) {
		case "grayscale":
			for (let i = 0; i < data.length; i += 4) {
				const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
				data[i] = data[i + 1] = data[i + 2] = avg;
			}
			break;

		case "blur":
			boxBlur(imageData, w, h);
			break;

		case "sharpen":
			sharpen(imageData, w, h);
			break;

		case "spotRemoval":
			spotRemoval(imageData, w, h);
			break;

		case "vignette":
			vignette(imageData, w, h);
			break;

		case "dodgeAndBurn":
			dodgeAndBurn(imageData, w, h);
			break;
	}

	ctx.putImageData(imageData, x, y);

	// Update base image with changes
	const dataUrl = imageCanvas.toDataURL();
	const newImg = new Image();
	newImg.onload = () => {
		img = newImg;
		downloadBtn.disabled = false;
		selection = null;
		redrawCanvasWithSelection();
	};
	newImg.src = dataUrl;
}

// Image processing functions
function boxBlur(imageData, w, h) {
	const src = imageData.data;
	const temp = new Uint8ClampedArray(src);
	const radius = 2;

	for (let y = radius; y < h - radius; y++) {
		for (let x = radius; x < w - radius; x++) {
			let r = 0,
				g = 0,
				b = 0,
				count = 0;
			for (let dy = -radius; dy <= radius; dy++) {
				for (let dx = -radius; dx <= radius; dx++) {
					const idx = ((y + dy) * w + x + dx) * 4;
					r += temp[idx];
					g += temp[idx + 1];
					b += temp[idx + 2];
					count++;
				}
			}
			const i = (y * w + x) * 4;
			src[i] = r / count;
			src[i + 1] = g / count;
			src[i + 2] = b / count;
		}
	}
}

function sharpen(imageData, w, h) {
	const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
	applyConvolution(imageData, w, h, weights);
}

function spotRemoval(imageData, w, h) {
	const src = imageData.data;
	const temp = new Uint8ClampedArray(src);

	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const neighbors = [];
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const idx = ((y + dy) * w + x + dx) * 4;
					neighbors.push({
						r: temp[idx],
						g: temp[idx + 1],
						b: temp[idx + 2],
					});
				}
			}
			neighbors.sort((a, b) => a.r + a.g + a.b - (b.r + b.g + b.b));
			const median = neighbors[4];
			const i = (y * w + x) * 4;
			src[i] = median.r;
			src[i + 1] = median.g;
			src[i + 2] = median.b;
		}
	}
}

function vignette(imageData, w, h) {
	const data = imageData.data;
	const centerX = w / 2;
	const centerY = h / 2;
	const maxDist = Math.hypot(centerX, centerY);

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			const dist = Math.hypot(x - centerX, y - centerY);
			const factor = 1 - Math.pow(dist / maxDist, 2);
			data[i] *= factor;
			data[i + 1] *= factor;
			data[i + 2] *= factor;
		}
	}
}

function dodgeAndBurn(imageData, w, h) {
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
		if (brightness < 128) {
			data[i] *= 0.8;
			data[i + 1] *= 0.8;
			data[i + 2] *= 0.8;
		} else {
			data[i] = Math.min(255, data[i] * 1.2);
			data[i + 1] = Math.min(255, data[i + 1] * 1.2);
			data[i + 2] = Math.min(255, data[i + 2] * 1.2);
		}
	}
}

function applyConvolution(imageData, w, h, weights) {
	const src = imageData.data;
	const temp = new Uint8ClampedArray(src);
	const side = Math.sqrt(weights.length);
	const half = Math.floor(side / 2);

	for (let y = half; y < h - half; y++) {
		for (let x = half; x < w - half; x++) {
			let r = 0,
				g = 0,
				b = 0;
			for (let cy = 0; cy < side; cy++) {
				for (let cx = 0; cx < side; cx++) {
					const idx = ((y + cy - half) * w + x + cx - half) * 4;
					const weight = weights[cy * side + cx];
					r += temp[idx] * weight;
					g += temp[idx + 1] * weight;
					b += temp[idx + 2] * weight;
				}
			}
			const i = (y * w + x) * 4;
			src[i] = clamp(r);
			src[i + 1] = clamp(g);
			src[i + 2] = clamp(b);
		}
	}
}

function clamp(value) {
	return Math.max(0, Math.min(255, value));
}

downloadBtn.addEventListener("click", () => {
	if (!imgLoaded) return;
	const link = document.createElement("a");
	link.download = "retouched-image.png";
	link.href = imageCanvas.toDataURL("image/png");
	link.click();
});
