const imageLoader = document.getElementById("imageLoader");
const segmentBtn = document.getElementById("segmentBtn");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
const errorMessage = document.getElementById("errorMessage");
const modeButtons = document.querySelectorAll(".mode-btn");

const edgeThreshold = document.getElementById("edgeThreshold");
const thresholdValue = document.getElementById("thresholdValue");
const kernelSize = document.getElementById("kernelSize");
const kernelShape = document.getElementById("kernelShape");
const morphOp = document.getElementById("morphOp");
const skeletonIterations = document.getElementById("skeletonIterations");

let originalImage = null;
let currentMode = "morph";

imageLoader.addEventListener("change", handleImage);
segmentBtn.addEventListener("click", processImage);
downloadBtn.addEventListener("click", downloadImage);
edgeThreshold.addEventListener("input", updateThresholdValue);
modeButtons.forEach((btn) => btn.addEventListener("click", switchMode));

updateThresholdValue();

function handleImage(e) {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (event) {
		const img = new Image();
		img.onload = function () {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);
			originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
			segmentBtn.disabled = false;
			errorMessage.textContent = "";
		};
		img.onerror = function () {
			errorMessage.textContent = "Error loading image";
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(file);
}

function processImage() {
	if (!originalImage) return;

	try {
		ctx.putImageData(originalImage, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		switch (currentMode) {
			case "edge":
				edgeDetection(imageData);
				break;
			case "morph":
				morphologicalOperations(imageData);
				break;
			case "skeleton":
				skeletonization(imageData);
				break;
		}

		downloadBtn.disabled = false;
	} catch (error) {
		errorMessage.textContent = `Error: ${error.message}`;
	}
}

function edgeDetection(imageData) {
	const width = imageData.width;
	const height = imageData.height;
	const src = imageData.data;
	const dst = ctx.createImageData(width, height);
	const dstData = dst.data;
	const threshold = parseInt(edgeThreshold.value);

	const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
	const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			let pixelX = 0,
				pixelY = 0;
			let idx = (y * width + x) * 4;

			let k = 0;
			for (let ky = -1; ky <= 1; ky++) {
				for (let kx = -1; kx <= 1; kx++) {
					let i = ((y + ky) * width + (x + kx)) * 4;
					let val = src[i];
					pixelX += gx[k] * val;
					pixelY += gy[k] * val;
					k++;
				}
			}
			let magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
			let out = magnitude > threshold ? 255 : 0;

			dstData[idx] = dstData[idx + 1] = dstData[idx + 2] = out;
			dstData[idx + 3] = 255;
		}
	}
	ctx.putImageData(dst, 0, 0);
}

function morphologicalOperations(imageData) {
	const width = imageData.width;
	const height = imageData.height;
	const src = imageData.data;
	const dst = ctx.createImageData(width, height);
	const dstData = dst.data;
	const size = parseInt(kernelSize.value);
	const operation = morphOp.value;

	for (let i = 0; i < src.length; i += 4) {
		const avg = (src[i] + src[i + 1] + src[i + 2]) / 3;
		const val = avg > 128 ? 255 : 0;
		dstData[i] = dstData[i + 1] = dstData[i + 2] = val;
		dstData[i + 3] = 255;
	}

	for (let y = size; y < height - size; y++) {
		for (let x = size; x < width - size; x++) {
			const idx = (y * width + x) * 4;
			let result = operation === "erode" ? 255 : 0;

			for (let ky = -size; ky <= size; ky++) {
				for (let kx = -size; kx <= size; kx++) {
					const i = ((y + ky) * width + (x + kx)) * 4;
					const val = dstData[i];

					if (operation === "erode") {
						result = Math.min(result, val);
					} else if (operation === "dilate") {
						result = Math.max(result, val);
					}
				}
			}

			dstData[idx] = dstData[idx + 1] = dstData[idx + 2] = result;
		}
	}

	ctx.putImageData(dst, 0, 0);
}

function skeletonization(imageData) {
	const width = imageData.width;
	const height = imageData.height;
	const src = imageData.data;
	const dst = ctx.createImageData(width, height);
	const dstData = dst.data;
	const iterations = parseInt(skeletonIterations.value);

	for (let i = 0; i < src.length; i += 4) {
		const avg = (src[i] + src[i + 1] + src[i + 2]) / 3;
		dstData[i] = dstData[i + 1] = dstData[i + 2] = avg > 128 ? 255 : 0;
		dstData[i + 3] = 255;
	}

	for (let iter = 0; iter < iterations; iter++) {
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				const idx = (y * width + x) * 4;
				if (dstData[idx] === 0) continue;

				let count = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						if (ky === 0 && kx === 0) continue;
						const i = ((y + ky) * width + (x + kx)) * 4;
						if (dstData[i] === 0) count++;
					}
				}

				if (count > 4) {
					dstData[idx] = dstData[idx + 1] = dstData[idx + 2] = 0;
				}
			}
		}
	}

	ctx.putImageData(dst, 0, 0);
}

function downloadImage() {
	const link = document.createElement("a");
	link.download = "segmented-image.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
}

function updateThresholdValue() {
	thresholdValue.textContent = edgeThreshold.value;
}

function switchMode(e) {
	currentMode = e.target.dataset.mode;
	modeButtons.forEach((btn) => btn.classList.remove("active"));
	e.target.classList.add("active");

	document.getElementById("morphParams").style.display = "none";
	document.getElementById("edgeParams").style.display = "none";
	document.getElementById("skeletonParams").style.display = "none";
	document.getElementById(`${currentMode}Params`).style.display = "block";
}
