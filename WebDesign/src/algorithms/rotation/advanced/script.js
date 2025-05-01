const imageUpload = document.getElementById("imageUpload");
const rotationAngleInput = document.getElementById("rotationAngle");
const interpolationSelect = document.getElementById("interpolation");
const previewScale = document.getElementById("previewScale");
const scaleValue = document.getElementById("scaleValue");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");
const errorMsg = document.getElementById("errorMsg");

let originalImage = null;

function clearCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawRotatedImage(img, angle, interpolation, scale) {
	const radians = (angle * Math.PI) / 180;
	const sin = Math.abs(Math.sin(radians));
	const cos = Math.abs(Math.cos(radians));
	const width = img.width;
	const height = img.height;
	const newWidth = Math.floor((width * cos + height * sin) * scale);
	const newHeight = Math.floor((height * cos + width * sin) * scale);

	canvas.width = newWidth;
	canvas.height = newHeight;

	if (interpolation === "nearest") {
		ctx.imageSmoothingEnabled = false;
	} else if (interpolation === "bilinear") {
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "medium";
	} else if (interpolation === "bicubic") {
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";
	}

	clearCanvas();

	ctx.translate(newWidth / 2, newHeight / 2);
	ctx.rotate(radians);
	ctx.scale(scale, scale);
	ctx.drawImage(img, -width / 2, -height / 2);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function updateScaleValue() {
	scaleValue.textContent = previewScale.value + "x";
}

imageUpload.addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;

	if (!file.type.startsWith("image/")) {
		errorMsg.textContent = "Please upload a valid image file.";
		return;
	}
	errorMsg.textContent = "";

	const img = new Image();
	const url = URL.createObjectURL(file);
	img.onload = () => {
		originalImage = img;
		drawRotatedImage(
			originalImage,
			parseFloat(rotationAngleInput.value),
			interpolationSelect.value,
			parseFloat(previewScale.value)
		);
		downloadBtn.disabled = false;
		URL.revokeObjectURL(url);
	};
	img.onerror = () => {
		errorMsg.textContent = "Failed to load image. Please try another file.";
		downloadBtn.disabled = true;
	};
	img.src = url;
});

rotationAngleInput.addEventListener("input", () => {
	if (!originalImage) return;
	drawRotatedImage(
		originalImage,
		parseFloat(rotationAngleInput.value),
		interpolationSelect.value,
		parseFloat(previewScale.value)
	);
});

interpolationSelect.addEventListener("change", () => {
	if (!originalImage) return;
	drawRotatedImage(
		originalImage,
		parseFloat(rotationAngleInput.value),
		interpolationSelect.value,
		parseFloat(previewScale.value)
	);
});

previewScale.addEventListener("input", () => {
	updateScaleValue();
	if (!originalImage) return;
	drawRotatedImage(
		originalImage,
		parseFloat(rotationAngleInput.value),
		interpolationSelect.value,
		parseFloat(previewScale.value)
	);
});

downloadBtn.addEventListener("click", () => {
	if (!originalImage) return;
	const link = document.createElement("a");
	link.download = "rotated-image.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
});

updateScaleValue();
