// script.js
const imageUpload = document.getElementById("imageUpload");
const scaleRatioInput = document.getElementById("scaleRatio");
const scaleBtn = document.getElementById("scaleBtn");
const downloadBtn = document.getElementById("downloadBtn");
const inputCanvas = document.getElementById("inputCanvas");
const outputCanvas = document.getElementById("outputCanvas");
const inputCtx = inputCanvas.getContext("2d");
const outputCtx = outputCanvas.getContext("2d");

let originalImage = new Image();
let currentProcessing = false;

// Image Upload Handler
imageUpload.addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (evt) => {
		originalImage = new Image();
		originalImage.onload = () => {
			// Preview dimensions
			const maxPreviewWidth = 400;
			const maxPreviewHeight = 300;
			let [previewWidth, previewHeight] = maintainAspectRatio(
				originalImage.width,
				originalImage.height,
				maxPreviewWidth,
				maxPreviewHeight
			);

			// Draw preview
			inputCanvas.width = previewWidth;
			inputCanvas.height = previewHeight;
			inputCtx.clearRect(0, 0, previewWidth, previewHeight);
			inputCtx.drawImage(originalImage, 0, 0, previewWidth, previewHeight);

			// Reset output
			outputCanvas.width = 0;
			outputCanvas.height = 0;
			scaleBtn.disabled = false;
			downloadBtn.disabled = true;
		};
		originalImage.src = evt.target.result;
	};
	reader.readAsDataURL(file);
});

// Scaling Handler
scaleBtn.addEventListener("click", async () => {
	if (currentProcessing) return;
	currentProcessing = true;

	try {
		const scale = parseFloat(scaleRatioInput.value);
		if (isNaN(scale) || scale <= 0) throw new Error("Invalid scale value");

		// Calculate target dimensions
		const targetWidth = Math.max(1, Math.floor(originalImage.width * scale));
		const targetHeight = Math.max(1, Math.floor(originalImage.height * scale));

		// Create source canvas
		const srcCanvas = document.createElement("canvas");
		srcCanvas.width = originalImage.width;
		srcCanvas.height = originalImage.height;
		const srcCtx = srcCanvas.getContext("2d");
		srcCtx.drawImage(originalImage, 0, 0);

		// Process scaling
		const srcData = srcCtx.getImageData(
			0,
			0,
			srcCanvas.width,
			srcCanvas.height
		);
		const resultData = bilinearRescale(srcData, targetWidth, targetHeight);

		// Display result
		outputCanvas.width = targetWidth;
		outputCanvas.height = targetHeight;
		outputCtx.putImageData(resultData, 0, 0);
		downloadBtn.disabled = false;
	} catch (error) {
		alert(error.message);
	} finally {
		currentProcessing = false;
	}
});

// Download Handler
downloadBtn.addEventListener("click", () => {
	outputCanvas.toBlob((blob) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `scaled-image-${Date.now()}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	});
});

// Helper Functions
function maintainAspectRatio(width, height, maxWidth, maxHeight) {
	const ratio = Math.min(maxWidth / width, maxHeight / height);
	return [Math.floor(width * ratio), Math.floor(height * ratio)];
}

function bilinearRescale(srcData, targetWidth, targetHeight) {
	const srcWidth = srcData.width;
	const srcHeight = srcData.height;
	const srcPixels = srcData.data;

	const dstCanvas = document.createElement("canvas");
	const dstCtx = dstCanvas.getContext("2d");
	dstCanvas.width = targetWidth;
	dstCanvas.height = targetHeight;
	const dstData = dstCtx.createImageData(targetWidth, targetHeight);

	const xRatio = srcWidth / targetWidth;
	const yRatio = srcHeight / targetHeight;

	for (let y = 0; y < targetHeight; y++) {
		for (let x = 0; x < targetWidth; x++) {
			const srcX = x * xRatio;
			const srcY = y * yRatio;
			const x1 = Math.floor(srcX);
			const y1 = Math.floor(srcY);
			const x2 = Math.min(x1 + 1, srcWidth - 1);
			const y2 = Math.min(y1 + 1, srcHeight - 1);

			const dx = srcX - x1;
			const dy = srcY - y1;

			for (let c = 0; c < 4; c++) {
				const val = interpolateChannel(
					srcPixels,
					srcWidth,
					x1,
					y1,
					x2,
					y2,
					dx,
					dy,
					c
				);
				dstData.data[(y * targetWidth + x) * 4 + c] = val;
			}
		}
	}
	return dstData;
}

function interpolateChannel(pixels, width, x1, y1, x2, y2, dx, dy, channel) {
	const topLeft = pixels[(y1 * width + x1) * 4 + channel];
	const topRight = pixels[(y1 * width + x2) * 4 + channel];
	const bottomLeft = pixels[(y2 * width + x1) * 4 + channel];
	const bottomRight = pixels[(y2 * width + x2) * 4 + channel];

	return Math.round(
		topLeft * (1 - dx) * (1 - dy) +
			topRight * dx * (1 - dy) +
			bottomLeft * (1 - dx) * dy +
			bottomRight * dx * dy
	);
}
