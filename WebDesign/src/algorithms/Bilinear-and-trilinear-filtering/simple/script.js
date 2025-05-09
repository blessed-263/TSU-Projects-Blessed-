document.addEventListener("DOMContentLoaded", function () {
	const imageUpload = document.getElementById("imageUpload");
	const inputCanvas = document.getElementById("inputCanvas");
	const outputCanvas = document.getElementById("outputCanvas");
	const applyBtn = document.getElementById("applyBtn");
	const downloadBtn = document.getElementById("downloadBtn");
	const restartBtn = document.getElementById("restartBtn");

	const inputCtx = inputCanvas.getContext("2d");
	const outputCtx = outputCanvas.getContext("2d");

	let inputImage = null;
	let srcPoints = [];
	let dstPoints = [];
	let selectingSrc = true;
	let mipmaps = null;

	function initCanvasSizes() {
		const container = document.querySelector(".canvas-container");
		const maxWidth = container.offsetWidth / 2 - 30;
		[inputCanvas, outputCanvas].forEach((canvas) => {
			canvas.width = maxWidth;
			canvas.height = (maxWidth * 2) / 3;
		});
	}

	function handleImageUpload(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function (evt) {
			const img = new Image();
			img.onload = function () {
				const scale = Math.min(
					inputCanvas.width / img.width,
					inputCanvas.height / img.height
				);

				inputCanvas.width = img.width * scale;
				inputCanvas.height = img.height * scale;
				outputCanvas.width = img.width * scale;
				outputCanvas.height = img.height * scale;

				inputCtx.drawImage(img, 0, 0, inputCanvas.width, inputCanvas.height);
				outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

				inputImage = img;
				srcPoints = [];
				dstPoints = [];
				selectingSrc = true;
				applyBtn.disabled = true;
				downloadBtn.disabled = true;
				restartBtn.disabled = false;
				clearMarkers();
				mipmaps = generateMipmaps(img, inputCanvas.width, inputCanvas.height);
			};
			img.src = evt.target.result;
		};
		reader.readAsDataURL(file);
	}

	// Helper: Find nearest point in a list, within a threshold radius
	function findNearestPoint(points, x, y, threshold = 15) {
		for (let i = 0; i < points.length; i++) {
			const dx = points[i].x - x;
			const dy = points[i].y - y;
			if (dx * dx + dy * dy < threshold * threshold) {
				return i;
			}
		}
		return -1;
	}

	function handleCanvasClick(e, isSrc) {
		const canvas = isSrc ? inputCanvas : outputCanvas;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (isSrc && selectingSrc) {
			const idx = findNearestPoint(srcPoints, x, y);
			if (idx !== -1) {
				// Move existing point
				srcPoints[idx] = { x, y };
			} else if (srcPoints.length < 3) {
				srcPoints.push({ x, y });
				if (srcPoints.length === 3) {
					selectingSrc = false;
					alert("Now select 3 points on the output canvas");
				}
			}
			clearMarkers();
			srcPoints.forEach((pt, i) =>
				drawMarker(inputCanvas, pt.x, pt.y, i + 1, true)
			);
			dstPoints.forEach((pt, i) =>
				drawMarker(outputCanvas, pt.x, pt.y, i + 1, false)
			);
		} else if (!isSrc && !selectingSrc) {
			const idx = findNearestPoint(dstPoints, x, y);
			if (idx !== -1) {
				dstPoints[idx] = { x, y };
			} else if (dstPoints.length < 3) {
				dstPoints.push({ x, y });
			}
			clearMarkers();
			srcPoints.forEach((pt, i) =>
				drawMarker(inputCanvas, pt.x, pt.y, i + 1, true)
			);
			dstPoints.forEach((pt, i) =>
				drawMarker(outputCanvas, pt.x, pt.y, i + 1, false)
			);
			if (dstPoints.length === 3) applyBtn.disabled = false;
		}
	}

	function drawMarker(canvas, x, y, num, isSrc) {
		const ctx = isSrc ? inputCtx : outputCtx;
		ctx.save();
		ctx.beginPath();
		ctx.arc(x, y, 7, 0, 2 * Math.PI);
		ctx.fillStyle = ["#e74c3c", "#27ae60", "#2980b9"][num - 1] || "#222";
		ctx.fill();
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.font = "bold 16px Montserrat, sans-serif";
		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(num.toString(), x, y);
		ctx.restore();
	}

	function clearMarkers() {
		inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
		outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
		if (inputImage) {
			inputCtx.drawImage(
				inputImage,
				0,
				0,
				inputCanvas.width,
				inputCanvas.height
			);
		}
	}

	function applyFiltering() {
		if (srcPoints.length !== 3 || dstPoints.length !== 3) return;

		const srcTri = srcPoints.map((p) => [p.x, p.y]);
		const dstTri = dstPoints.map((p) => [p.x, p.y]);
		const matrix = getAffineTransformMatrix(dstTri, srcTri);
		const scaleFactor = calculateScaleFactor(srcTri, dstTri);

		inputCtx.drawImage(inputImage, 0, 0, inputCanvas.width, inputCanvas.height);
		const inputImageData = inputCtx.getImageData(
			0,
			0,
			inputCanvas.width,
			inputCanvas.height
		);

		const outputImageData = outputCtx.createImageData(
			outputCanvas.width,
			outputCanvas.height
		);

		for (let y = 0; y < outputCanvas.height; y++) {
			for (let x = 0; x < outputCanvas.width; x++) {
				if (!pointInTriangle([x, y], dstTri[0], dstTri[1], dstTri[2])) continue;

				const [srcX, srcY] = multiplyMatVec(matrix, [x, y, 1]);
				let color;

				if (scaleFactor >= 1) {
					color = bilinearInterpolation(inputImageData, srcX, srcY);
				} else {
					color = trilinearSampleFromMipmaps(mipmaps, srcX, srcY, scaleFactor);
				}

				const idx = (y * outputCanvas.width + x) * 4;
				outputImageData.data.set(color, idx);
			}
		}

		outputCtx.putImageData(outputImageData, 0, 0);
		downloadBtn.disabled = false;
		restartBtn.disabled = false;
	}

	function getAffineTransformMatrix(from, to) {
		const A = [];
		const B = [];
		for (let i = 0; i < 3; i++) {
			A.push([from[i][0], from[i][1], 1, 0, 0, 0]);
			B.push(to[i][0]);
			A.push([0, 0, 0, from[i][0], from[i][1], 1]);
			B.push(to[i][1]);
		}
		const X = solveLinearSystem(A, B);
		return [
			[X[0], X[1], X[2]],
			[X[3], X[4], X[5]],
			[0, 0, 1],
		];
	}

	function solveLinearSystem(A, B) {
		const n = B.length;
		for (let i = 0; i < n; i++) {
			let maxRow = i;
			for (let k = i + 1; k < n; k++) {
				if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
			}
			[A[i], A[maxRow]] = [A[maxRow], A[i]];
			[B[i], B[maxRow]] = [B[maxRow], B[i]];

			for (let k = i + 1; k < n; k++) {
				const factor = A[k][i] / A[i][i];
				A[k][i] = 0;
				for (let j = i + 1; j < n; j++) {
					A[k][j] -= factor * A[i][j];
				}
				B[k] -= factor * B[i];
			}
		}

		const X = new Array(n);
		for (let i = n - 1; i >= 0; i--) {
			X[i] = B[i] / A[i][i];
			for (let k = i - 1; k >= 0; k--) {
				B[k] -= A[k][i] * X[i];
			}
		}
		return X;
	}

	function multiplyMatVec(mat, vec) {
		return [
			mat[0][0] * vec[0] + mat[0][1] * vec[1] + mat[0][2] * vec[2],
			mat[1][0] * vec[0] + mat[1][1] * vec[1] + mat[1][2] * vec[2],
			mat[2][0] * vec[0] + mat[2][1] * vec[1] + mat[2][2] * vec[2],
		];
	}

	function bilinearInterpolation(imageData, x, y) {
		const width = imageData.width;
		const height = imageData.height;
		x = Math.max(0, Math.min(width - 1e-6, x));
		y = Math.max(0, Math.min(height - 1e-6, y));

		const x0 = Math.floor(x);
		const y0 = Math.floor(y);
		const x1 = Math.min(width - 1, x0 + 1);
		const y1 = Math.min(height - 1, y0 + 1);

		const dx = x - x0;
		const dy = y - y0;

		const idx00 = (y0 * width + x0) * 4;
		const idx10 = (y0 * width + x1) * 4;
		const idx01 = (y1 * width + x0) * 4;
		const idx11 = (y1 * width + x1) * 4;

		const interpolate = (ch) =>
			imageData.data[idx00 + ch] * (1 - dx) * (1 - dy) +
			imageData.data[idx10 + ch] * dx * (1 - dy) +
			imageData.data[idx01 + ch] * (1 - dx) * dy +
			imageData.data[idx11 + ch] * dx * dy;

		return [0, 1, 2, 3].map((ch) => Math.round(interpolate(ch)));
	}

	function generateMipmaps(img, baseW, baseH) {
		let mipmaps = [];
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d");

		canvas.width = baseW;
		canvas.height = baseH;
		ctx.drawImage(img, 0, 0, baseW, baseH);
		mipmaps.push(ctx.getImageData(0, 0, baseW, baseH));

		let currentW = baseW;
		let currentH = baseH;

		while (currentW > 2 && currentH > 2) {
			const nextW = Math.max(1, Math.floor(currentW / 2));
			const nextH = Math.max(1, Math.floor(currentH / 2));

			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = currentW;
			tempCanvas.height = currentH;
			const tempCtx = tempCanvas.getContext("2d");
			tempCtx.putImageData(mipmaps[mipmaps.length - 1], 0, 0);

			canvas.width = nextW;
			canvas.height = nextH;
			ctx.imageSmoothingEnabled = true;
			ctx.drawImage(tempCanvas, 0, 0, currentW, currentH, 0, 0, nextW, nextH);

			mipmaps.push(ctx.getImageData(0, 0, nextW, nextH));
			currentW = nextW;
			currentH = nextH;
		}

		return mipmaps;
	}

	function trilinearSampleFromMipmaps(mipmaps, x, y, scaleFactor) {
		const level = Math.log2(1 / scaleFactor);
		const l0 = Math.floor(level);
		const l1 = Math.min(mipmaps.length - 1, l0 + 1);
		const t = level - l0;

		const m0 = mipmaps[l0];
		const m1 = mipmaps[l1];

		const factor0 = Math.pow(0.5, l0);
		const factor1 = Math.pow(0.5, l1);

		const color0 = bilinearInterpolation(m0, x * factor0, y * factor0);
		const color1 = bilinearInterpolation(m1, x * factor1, y * factor1);

		return color0.map((c, i) => Math.round(c * (1 - t) + color1[i] * t));
	}

	function triangleArea(a, b, c) {
		return Math.abs(
			(a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])) / 2
		);
	}

	function calculateScaleFactor(srcTri, dstTri) {
		const srcArea = triangleArea(srcTri[0], srcTri[1], srcTri[2]);
		const dstArea = triangleArea(dstTri[0], dstTri[1], dstTri[2]);
		return Math.sqrt(dstArea / Math.max(srcArea, 1e-6));
	}

	function pointInTriangle(p, a, b, c) {
		const area = triangleArea(a, b, c);
		const area1 = triangleArea(p, b, c);
		const area2 = triangleArea(a, p, c);
		const area3 = triangleArea(a, b, p);
		return Math.abs(area - (area1 + area2 + area3)) < 1e-6;
	}

	function downloadResult() {
		const link = document.createElement("a");
		link.download = "transformed-image.png";
		link.href = outputCanvas.toDataURL();
		link.click();
	}

	function restartApp() {
		srcPoints = [];
		dstPoints = [];
		selectingSrc = true;
		applyBtn.disabled = true;
		downloadBtn.disabled = true;
		restartBtn.disabled = true;
		inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
		outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
		if (inputImage) {
			inputCtx.drawImage(
				inputImage,
				0,
				0,
				inputCanvas.width,
				inputCanvas.height
			);
		}
		clearMarkers();
	}

	imageUpload.addEventListener("change", handleImageUpload);
	inputCanvas.addEventListener("click", (e) => handleCanvasClick(e, true));
	outputCanvas.addEventListener("click", (e) => handleCanvasClick(e, false));
	applyBtn.addEventListener("click", applyFiltering);
	downloadBtn.addEventListener("click", downloadResult);
	restartBtn.addEventListener("click", restartApp);
	window.addEventListener("resize", initCanvasSizes);

	initCanvasSizes();
});
