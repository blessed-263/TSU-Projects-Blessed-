const imageLoader = document.getElementById("imageLoader");
const segmentBtn = document.getElementById("segmentBtn");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");

let originalImage = null;

imageLoader.addEventListener("change", handleImage, false);
segmentBtn.addEventListener("click", segmentImage, false);
downloadBtn.addEventListener("click", downloadImage, false);

function handleImage(e) {
	const reader = new FileReader();
	reader.onload = function (event) {
		const img = new Image();
		img.onload = function () {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);
			originalImage = ctx.getImageData(0, 0, img.width, img.height);
			segmentBtn.disabled = false;
			downloadBtn.disabled = true;
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(e.target.files[0]);
}

function segmentImage() {
	if (!originalImage) return;
	let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		let avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
		data[i] = data[i + 1] = data[i + 2] = avg;
	}
	ctx.putImageData(imageData, 0, 0);
	let edges = sobelEdgeDetection(imageData);
	highlightShapes(edges);
	downloadBtn.disabled = false;
}

function sobelEdgeDetection(imageData) {
	const width = imageData.width;
	const height = imageData.height;
	const src = imageData.data;
	const dst = ctx.createImageData(width, height);
	const dstData = dst.data;
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
			let out = magnitude > 120 ? 255 : 0;
			dstData[idx] = dstData[idx + 1] = dstData[idx + 2] = out;
			dstData[idx + 3] = 255;
		}
	}
	return dst;
}

function highlightShapes(edgeImage) {
	const width = edgeImage.width;
	const height = edgeImage.height;
	const data = edgeImage.data;
	const output = ctx.createImageData(width, height);
	const outputData = output.data;
	const grayscale = ctx.getImageData(0, 0, width, height);
	for (let i = 0; i < data.length; i += 4) {
		if (data[i] === 255) {
			outputData[i] = 255;
			outputData[i + 1] = 0;
			outputData[i + 2] = 0;
			outputData[i + 3] = 255;
		} else {
			outputData[i] = grayscale.data[i];
			outputData[i + 1] = grayscale.data[i + 1];
			outputData[i + 2] = grayscale.data[i + 2];
			outputData[i + 3] = 255;
		}
	}
	ctx.putImageData(output, 0, 0);
}

function downloadImage() {
	const canvasUrl = canvas.toDataURL("image/png");
	const createEl = document.createElement("a");
	createEl.href = canvasUrl;
	createEl.download = "segmented-image.png";
	document.body.appendChild(createEl);
	createEl.click();
	document.body.removeChild(createEl);
}
