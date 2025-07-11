const imageUpload = document.getElementById("imageUpload");
const scaleBtn = document.getElementById("scaleBtn");
const downloadBtn = document.getElementById("downloadBtn");
const scaleRatioInput = document.getElementById("scaleRatio");
const inputCanvas = document.getElementById("inputCanvas");
const outputCanvas = document.getElementById("outputCanvas");
const inputCtx = inputCanvas.getContext("2d");
const outputCtx = outputCanvas.getContext("2d");

let inputImage = new Image();

imageUpload.addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function (event) {
		inputImage.onload = function () {
			inputCanvas.width = inputImage.width;
			inputCanvas.height = inputImage.height;
			inputCtx.drawImage(inputImage, 0, 0);
			scaleBtn.disabled = false;
		};
		inputImage.src = event.target.result;
	};
	reader.readAsDataURL(file);
});

scaleBtn.addEventListener("click", () => {
	const scale = parseFloat(scaleRatioInput.value);
	if (isNaN(scale) || scale <= 0) return alert("Enter a valid scale ratio > 0");

	const srcWidth = inputCanvas.width;
	const srcHeight = inputCanvas.height;
	const destWidth = Math.floor(srcWidth * scale);
	const destHeight = Math.floor(srcHeight * scale);

	const srcData = inputCtx.getImageData(0, 0, srcWidth, srcHeight);
	const srcPixels = srcData.data;

	const destImageData = outputCtx.createImageData(destWidth, destHeight);
	const destPixels = destImageData.data;

	// Bilinear interpolation function
	function bilinearInterpolate(x, y, c) {
		// x and y are floating point coordinates in source image space
		const x1 = Math.floor(x);
		const y1 = Math.floor(y);
		const x2 = Math.min(x1 + 1, srcWidth - 1);
		const y2 = Math.min(y1 + 1, srcHeight - 1);

		const dx = x - x1;
		const dy = y - y1;

		// Pixel indices for the four neighbors
		const i11 = (y1 * srcWidth + x1) * 4 + c;
		const i21 = (y1 * srcWidth + x2) * 4 + c;
		const i12 = (y2 * srcWidth + x1) * 4 + c;
		const i22 = (y2 * srcWidth + x2) * 4 + c;

		// Interpolate in x direction
		const r1 = srcPixels[i11] * (1 - dx) + srcPixels[i21] * dx;
		const r2 = srcPixels[i12] * (1 - dx) + srcPixels[i22] * dx;

		// Interpolate in y direction
		return r1 * (1 - dy) + r2 * dy;
	}

	for (let j = 0; j < destHeight; j++) {
		for (let i = 0; i < destWidth; i++) {
			// Map destination pixel to source image coordinate
			const srcX = i / scale;
			const srcY = j / scale;

			const destIndex = (j * destWidth + i) * 4;

			// Interpolate each color channel (R,G,B,A)
			for (let c = 0; c < 4; c++) {
				destPixels[destIndex + c] = bilinearInterpolate(srcX, srcY, c);
			}
		}
	}

	outputCanvas.width = destWidth;
	outputCanvas.height = destHeight;
	outputCtx.putImageData(destImageData, 0, 0);

	downloadBtn.disabled = false;
});

downloadBtn.addEventListener("click", () => {
	const link = document.createElement("a");
	link.download = "scaled-image.png";
	link.href = outputCanvas.toDataURL();
	link.click();
});
