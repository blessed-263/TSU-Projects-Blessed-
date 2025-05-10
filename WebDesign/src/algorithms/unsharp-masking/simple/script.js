const imageLoader = document.getElementById("imageLoader");
const originalImage = document.getElementById("originalImage");
const resultCanvas = document.getElementById("resultCanvas");
const applyBtn = document.getElementById("applyBtn");
const downloadBtn = document.getElementById("downloadBtn");

let img = new Image();

imageLoader.addEventListener("change", function (e) {
	const reader = new FileReader();
	reader.onload = function (event) {
		img.onload = () => {
			originalImage.src = img.src;
			originalImage.style.display = "block";
			resultCanvas.width = img.width;
			resultCanvas.height = img.height;
			const ctx = resultCanvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			downloadBtn.disabled = true;
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(e.target.files[0]);
});

applyBtn.addEventListener("click", () => {
	const amount = parseFloat(document.getElementById("amount").value);
	const radius = parseFloat(document.getElementById("radius").value);
	const threshold = parseInt(document.getElementById("threshold").value);

	const ctx = resultCanvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	let imageData = ctx.getImageData(
		0,
		0,
		resultCanvas.width,
		resultCanvas.height
	);
	let blurred = ctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);

	const kernelSize = Math.max(1, Math.floor(radius));
	for (let y = kernelSize; y < imageData.height - kernelSize; y++) {
		for (let x = kernelSize; x < imageData.width - kernelSize; x++) {
			let r = 0,
				g = 0,
				b = 0;
			let count = 0;
			for (let ky = -kernelSize; ky <= kernelSize; ky++) {
				for (let kx = -kernelSize; kx <= kernelSize; kx++) {
					let i = ((y + ky) * imageData.width + (x + kx)) * 4;
					r += imageData.data[i];
					g += imageData.data[i + 1];
					b += imageData.data[i + 2];
					count++;
				}
			}
			let i = (y * imageData.width + x) * 4;
			blurred.data[i] = r / count;
			blurred.data[i + 1] = g / count;
			blurred.data[i + 2] = b / count;
		}
	}

	for (let i = 0; i < imageData.data.length; i += 4) {
		for (let c = 0; c < 3; c++) {
			let diff = imageData.data[i + c] - blurred.data[i + c];
			if (Math.abs(diff) > threshold) {
				imageData.data[i + c] = Math.min(
					255,
					Math.max(0, imageData.data[i + c] + diff * amount)
				);
			}
		}
	}

	ctx.putImageData(imageData, 0, 0);
	downloadBtn.disabled = false;
});

downloadBtn.addEventListener("click", () => {
	const link = document.createElement("a");
	link.download = "unsharp-masked.png";
	link.href = resultCanvas.toDataURL();
	link.click();
});
