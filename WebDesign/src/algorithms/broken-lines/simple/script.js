const canvas = document.getElementById("splineCanvas");
const ctx = canvas.getContext("2d");
const interpolateBtn = document.getElementById("interpolateBtn");
const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");

let points = [];
let interpolated = false;

canvas.addEventListener("click", function (e) {
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	points.push({ x, y });
	interpolated = false;
	draw();
	updateButtons();
});

interpolateBtn.addEventListener("click", function () {
	if (points.length >= 4) {
		interpolated = true;
		draw();
		updateButtons();
	}
});

resetBtn.addEventListener("click", function () {
	points = [];
	interpolated = false;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	updateButtons();
});

downloadBtn.addEventListener("click", function () {
	const link = document.createElement("a");
	link.download = "spline.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
});

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (!interpolated && points.length > 1) {
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.strokeStyle = "#2e72d2";
		ctx.lineWidth = 2;
		ctx.setLineDash([8, 6]);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	if (interpolated && points.length >= 4) {
		drawBSpline(points, 3);
	}

	for (let i = 0; i < points.length; i++) {
		ctx.beginPath();
		ctx.arc(points[i].x, points[i].y, 6, 0, 2 * Math.PI);
		ctx.fillStyle = "#e74c3c";
		ctx.fill();
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 2;
		ctx.stroke();
	}
}

function drawBSpline(pts, degree = 3) {
	const n = pts.length - 1;
	const d = degree;

	if (n < d) {
		console.warn("Number of control points must be at least degree + 1");
		return;
	}

	const knotCount = n + d + 2;
	const knots = [];
	for (let i = 0; i < knotCount; i++) {
		if (i <= d) knots.push(0);
		else if (i >= knotCount - d - 1) knots.push(1);
		else knots.push((i - d) / (knotCount - 2 * d - 1));
	}

	function basis(i, k, t) {
		if (k === 0) {
			if (t === 1 && knots[i + 1] === 1) return 1;
			return knots[i] <= t && t < knots[i + 1] ? 1 : 0;
		}
		const denom1 = knots[i + k] - knots[i];
		const denom2 = knots[i + k + 1] - knots[i + 1];
		const term1 =
			denom1 === 0 ? 0 : ((t - knots[i]) / denom1) * basis(i, k - 1, t);
		const term2 =
			denom2 === 0
				? 0
				: ((knots[i + k + 1] - t) / denom2) * basis(i + 1, k - 1, t);
		return term1 + term2;
	}

	ctx.beginPath();

	const steps = 100;
	for (let step = 0; step <= steps; step++) {
		const t = knots[d] + ((knots[n + 1] - knots[d]) * step) / steps;

		let x = 0,
			y = 0;
		for (let i = 0; i <= n; i++) {
			const b = basis(i, d, t);
			x += b * pts[i].x;
			y += b * pts[i].y;
		}

		if (step === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}

	ctx.strokeStyle = "#27ae60";
	ctx.lineWidth = 3;
	ctx.setLineDash([]);
	ctx.stroke();
}

function updateButtons() {
	interpolateBtn.disabled = points.length < 4 || interpolated;
	resetBtn.disabled = points.length === 0;
	downloadBtn.disabled = points.length === 0;
}

updateButtons();
draw();
