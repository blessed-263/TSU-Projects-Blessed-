const upload = document.getElementById("upload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let image = new Image();
let imageLoaded = false;
let sourcePoints = [];
let destPoints = [];
let step = 0;

upload.addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (event) => {
		image.onload = () => {
			canvas.width = image.width;
			canvas.height = image.height;
			ctx.drawImage(image, 0, 0);
			imageLoaded = true;
			resetPoints();
		};
		image.src = event.target.result;
	};
	reader.readAsDataURL(file);
});

canvas.addEventListener("click", (e) => {
	if (!imageLoaded) return;

	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	ctx.fillStyle = step < 3 ? "red" : "blue";
	ctx.beginPath();
	ctx.arc(x, y, 4, 0, 2 * Math.PI);
	ctx.fill();

	if (step < 3) {
		sourcePoints.push([x, y]);
	} else if (step < 6) {
		destPoints.push([x, y]);
	}

	step++;

	if (step === 6) {
		applyTransform();
	}
});

document.getElementById("reset").addEventListener("click", () => {
	resetPoints();
	if (imageLoaded) {
		ctx.drawImage(image, 0, 0);
	}
});

function resetPoints() {
	sourcePoints = [];
	destPoints = [];
	step = 0;
}

function computeAffineMatrix(src, dst) {
	const A = [];
	const B = [];

	for (let i = 0; i < 3; i++) {
		A.push([src[i][0], src[i][1], 1, 0, 0, 0]);
		A.push([0, 0, 0, src[i][0], src[i][1], 1]);
		B.push(dst[i][0]);
		B.push(dst[i][1]);
	}

	const Ainv = math.inv(A);
	const X = math.multiply(Ainv, B);

	return [
		[X[0], X[1], X[2]],
		[X[3], X[4], X[5]],
	];
}

function applyTransform() {
	const M = computeAffineMatrix(destPoints, sourcePoints); // inverse matrix
	const scaleX = Math.sqrt(M[0][0] ** 2 + M[1][0] ** 2);
	const scaleY = Math.sqrt(M[0][1] ** 2 + M[1][1] ** 2);
	const scale = Math.max(scaleX, scaleY);

	if (scale > 1.0) {
		drawWithBilinear(M);
	} else {
		drawWithTrilinear(M);
	}
}

function bilinearSample(imgData, x, y) {
	const { width: w, height: h, data } = imgData;

	const x0 = Math.floor(x),
		y0 = Math.floor(y);
	const x1 = Math.min(x0 + 1, w - 1);
	const y1 = Math.min(y0 + 1, h - 1);
	const dx = x - x0;
	const dy = y - y0;

	function getPixel(xx, yy) {
		const i = (yy * w + xx) * 4;
		return [data[i], data[i + 1], data[i + 2], data[i + 3]];
	}

	function mix(a, b, t) {
		return a.map((v, i) => v * (1 - t) + b[i] * t);
	}

	const p00 = getPixel(x0, y0);
	const p10 = getPixel(x1, y0);
	const p01 = getPixel(x0, y1);
	const p11 = getPixel(x1, y1);

	const top = mix(p00, p10, dx);
	const bottom = mix(p01, p11, dx);
	return mix(top, bottom, dy);
}

function drawWithBilinear(M) {
	const srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const result = ctx.createImageData(canvas.width, canvas.height);

	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			const srcX = M[0][0] * x + M[0][1] * y + M[0][2];
			const srcY = M[1][0] * x + M[1][1] * y + M[1][2];

			if (
				srcX >= 0 &&
				srcY >= 0 &&
				srcX < canvas.width &&
				srcY < canvas.height
			) {
				const color = bilinearSample(srcData, srcX, srcY);
				const i = (y * canvas.width + x) * 4;
				for (let c = 0; c < 4; c++) {
					result.data[i + c] = color[c];
				}
			}
		}
	}

	ctx.putImageData(result, 0, 0);
}

function drawWithTrilinear(M) {
	const scale = 0.5;
	const offCanvas = document.createElement("canvas");
	const offCtx = offCanvas.getContext("2d");

	offCanvas.width = canvas.width * scale;
	offCanvas.height = canvas.height * scale;
	offCtx.drawImage(image, 0, 0, offCanvas.width, offCanvas.height);

	const fullRes = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const halfRes = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
	const result = ctx.createImageData(canvas.width, canvas.height);

	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			const srcX = M[0][0] * x + M[0][1] * y + M[0][2];
			const srcY = M[1][0] * x + M[1][1] * y + M[1][2];

			if (
				srcX >= 0 &&
				srcY >= 0 &&
				srcX < canvas.width &&
				srcY < canvas.height
			) {
				const hi = bilinearSample(fullRes, srcX, srcY);
				const lo = bilinearSample(halfRes, srcX * scale, srcY * scale);
				const t = 0.5;
				const blended = hi.map((v, i) => v * (1 - t) + lo[i] * t);

				const i = (y * canvas.width + x) * 4;
				for (let c = 0; c < 4; c++) {
					result.data[i + c] = blended[c];
				}
			}
		}
	}

	ctx.putImageData(result, 0, 0);
}

document.getElementById("download").addEventListener("click", function () {
	const canvas = document.getElementById("canvas");
	const imageURL = canvas.toDataURL("image/png");
	const link = document.createElement("a");
	link.href = imageURL;
	link.download = "processed-image.png";

	link.click();
});

document.getElementById("process").addEventListener("click", function () {
	document.getElementById("download").disabled = false;
});
