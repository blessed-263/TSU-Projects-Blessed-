// script.js

const imageUpload = document.getElementById("imageUpload");
const imageFilter = document.getElementById("imageFilter");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");

let originalImage = new Image();
let originalImageData = null;

imageUpload.addEventListener("change", handleImageUpload);
imageFilter.addEventListener("change", applyFilter);
downloadBtn.addEventListener("click", downloadImage);

function handleImageUpload(e) {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (event) {
		originalImage = new Image();
		originalImage.onload = () => {
			canvas.width = originalImage.width;
			canvas.height = originalImage.height;
			ctx.drawImage(originalImage, 0, 0);
			originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			downloadBtn.disabled = false;
			imageFilter.value = "none"; // reset filter selector
		};
		originalImage.src = event.target.result;
	};
	reader.readAsDataURL(file);
}

function applyFilter() {
	if (!originalImageData) return;

	// Copy original image data to avoid cumulative effects
	const imageData = ctx.createImageData(originalImageData);
	imageData.data.set(originalImageData.data);

	const filter = imageFilter.value;

	switch (filter) {
		case "grayscale":
			grayscaleFilter(imageData);
			break;
		case "sepia":
			sepiaFilter(imageData);
			break;
		case "invert":
			invertFilter(imageData);
			break;
		case "blur":
			blurFilter(imageData);
			break;
		case "brightness":
			brightnessFilter(imageData, 40); // example brightness adjustment
			break;
		case "contrast":
			contrastFilter(imageData, 40); // example contrast adjustment
			break;
		case "none":
		default:
			// no filter, just draw original
			break;
	}

	ctx.putImageData(imageData, 0, 0);
}

function grayscaleFilter(imageData) {
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
		data[i] = data[i + 1] = data[i + 2] = avg;
	}
}

function sepiaFilter(imageData) {
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const r = data[i],
			g = data[i + 1],
			b = data[i + 2];
		data[i] = Math.min(0.393 * r + 0.769 * g + 0.189 * b, 255);
		data[i + 1] = Math.min(0.349 * r + 0.686 * g + 0.168 * b, 255);
		data[i + 2] = Math.min(0.272 * r + 0.534 * g + 0.131 * b, 255);
	}
}

function invertFilter(imageData) {
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		data[i] = 255 - data[i]; // Red
		data[i + 1] = 255 - data[i + 1]; // Green
		data[i + 2] = 255 - data[i + 2]; // Blue
	}
}

function brightnessFilter(imageData, adjustment) {
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		data[i] = clamp(data[i] + adjustment);
		data[i + 1] = clamp(data[i + 1] + adjustment);
		data[i + 2] = clamp(data[i + 2] + adjustment);
	}
}

function contrastFilter(imageData, adjustment) {
	// adjustment in range [-255, 255], positive increases contrast
	const data = imageData.data;
	const factor = (259 * (adjustment + 255)) / (255 * (259 - adjustment));
	for (let i = 0; i < data.length; i += 4) {
		data[i] = clamp(factor * (data[i] - 128) + 128);
		data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
		data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
	}
}

function blurFilter(imageData) {
	// Simple box blur with 3x3 kernel
	const width = imageData.width;
	const height = imageData.height;
	const src = imageData.data;
	const dst = new Uint8ClampedArray(src.length);
	const kernelSize = 3;
	const edge = Math.floor(kernelSize / 2);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0,
				g = 0,
				b = 0,
				count = 0;
			for (let ky = -edge; ky <= edge; ky++) {
				for (let kx = -edge; kx <= edge; kx++) {
					const nx = x + kx;
					const ny = y + ky;
					if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
						const idx = (ny * width + nx) * 4;
						r += src[idx];
						g += src[idx + 1];
						b += src[idx + 2];
						count++;
					}
				}
			}
			const i = (y * width + x) * 4;
			dst[i] = r / count;
			dst[i + 1] = g / count;
			dst[i + 2] = b / count;
			dst[i + 3] = src[i + 3]; // alpha
		}
	}
	imageData.data.set(dst);
}

function clamp(value) {
	return Math.max(0, Math.min(255, value));
}

function downloadImage() {
	const link = document.createElement("a");
	link.download = "filtered-image.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
}
