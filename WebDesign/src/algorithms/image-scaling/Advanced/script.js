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

// Cubic convolution kernel function for bicubic interpolation
function cubicHermite(t) {
	const a = -0.5; // Catmull-Rom spline parameter
	if (t < 0) t = -t;
	const t2 = t * t;
	const t3 = t2 * t;
	if (t <= 1) {
		return (a + 2) * t3 - (a + 3) * t2 + 1;
	} else if (t < 2) {
		return a * t3 - 5 * a * t2 + 8 * a * t - 4 * a;
	}
	return 0;
}

// Get pixel RGBA value from source image data with boundary checks
function getPixel(data, width, height, x, y, c) {
	x = Math.min(width - 1, Math.max(0, x));
	y = Math.min(height - 1, Math.max(0, y));
	return data[(y * width + x) * 4 + c];
}

// Bicubic interpolation for one channel
function bicubicInterpolate(data, width, height, x, y, c) {
	const xInt = Math.floor(x);
	const yInt = Math.floor(y);
	let result = 0;
	for (let m = -1; m <= 2; m++) {
		const mm = yInt + m;
		const wY = cubicHermite(y - mm);
		for (let n = -1; n <= 2; n++) {
			const nn = xInt + n;
			const wX = cubicHermite(x - nn);
			const pixel = getPixel(data, width, height, nn, mm, c);
			result += pixel * wX * wY;
		}
	}
	return Math.min(255, Math.max(0, result));
}

scaleBtn.addEventListener("click", () => {
	const scale = parseFloat(scaleRatioInput.value);
	if (isNaN(scale) || scale <= 0) {
		alert("Please enter a valid scale ratio greater than 0.");
		return;
	}

	const srcWidth = inputCanvas.width;
	const srcHeight = inputCanvas.height;
	const destWidth = Math.floor(srcWidth * scale);
	const destHeight = Math.floor(srcHeight * scale);

	const srcImageData = inputCtx.getImageData(0, 0, srcWidth, srcHeight);
	const srcPixels = srcImageData.data;

	const destImageData = outputCtx.createImageData(destWidth, destHeight);
	const destPixels = destImageData.data;

	for (let j = 0; j < destHeight; j++) {
		for (let i = 0; i < destWidth; i++) {
			// Map destination pixel to source coordinate space
			const srcX = i / scale;
			const srcY = j / scale;
			const destIdx = (j * destWidth + i) * 4;

			for (let c = 0; c < 4; c++) {
				destPixels[destIdx + c] = bicubicInterpolate(
					srcPixels,
					srcWidth,
					srcHeight,
					srcX,
					srcY,
					c
				);
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
