const canvas = document.getElementById("splineCanvas");
const ctx = canvas.getContext("2d");
const interpolateBtn = document.getElementById("interpolateBtn");
const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");
const convexityControls = document.getElementById("convexityControls");

let points = [];
let interpolated = false;
let convexities = [];

canvas.addEventListener("click", function (e) {
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	points.push({ x, y });
	interpolated = false;
	updateConvexities();
	draw();
	updateButtons();
});

interpolateBtn.addEventListener("click", function () {
	if (points.length >= 3) {
		interpolated = true;
		draw();
	}
});

resetBtn.addEventListener("click", function () {
	points = [];
	interpolated = false;
	convexities = [];
	convexityControls.innerHTML = "";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	updateButtons();
});

downloadBtn.addEventListener("click", function () {
	const link = document.createElement("a");
	link.download = "spline.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
});

function updateConvexities() {
	convexities = [];
	convexityControls.innerHTML = "";
	for (let i = 0; i < Math.max(0, points.length - 1); i++) {
		const group = document.createElement("div");
		group.className = "convexity-slider-group";
		const label = document.createElement("label");
		label.textContent = `Interval ${i + 1} convexity`;
		const slider = document.createElement("input");
		slider.type = "range";
		slider.min = -1;
		slider.max = 1;
		slider.step = 0.01;
		slider.value = 0;
		slider.dataset.index = i;
		const valueLabel = document.createElement("span");
		valueLabel.textContent = slider.value;
		slider.addEventListener("input", function () {
			convexities[i] = parseFloat(slider.value);
			valueLabel.textContent = slider.value;
			if (interpolated) draw();
		});
		group.appendChild(label);
		group.appendChild(slider);
		group.appendChild(valueLabel);
		convexityControls.appendChild(group);
		convexities.push(0);
	}
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (points.length > 1) {
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

	if (interpolated && points.length >= 3) {
		drawAdvancedSpline(points, convexities);
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

function drawAdvancedSpline(pts, convexities) {
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[i];
		const p1 = pts[i + 1];
		const c = convexities[i] || 0;
		const prev = pts[i - 1] || p0;
		const next = pts[i + 2] || p1;

		const dx1 = (p1.x - prev.x) * 0.3;
		const dy1 = (p1.y - prev.y) * 0.3;
		const dx2 = (next.x - p0.x) * 0.3;
		const dy2 = (next.y - p0.y) * 0.3;

		const cp1x = p0.x + dx1 * (1 + c);
		const cp1y = p0.y + dy1 * (1 + c);
		const cp2x = p1.x - dx2 * (1 - c);
		const cp2y = p1.y - dy2 * (1 - c);

		ctx.beginPath();
		ctx.moveTo(p0.x, p0.y);
		ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
		ctx.strokeStyle = "#27ae60";
		ctx.lineWidth = 3;
		ctx.setLineDash([]);
		ctx.stroke();
	}
}

function updateButtons() {
	interpolateBtn.disabled = points.length < 3 || interpolated;
	resetBtn.disabled = points.length === 0;
	downloadBtn.disabled = points.length === 0;
}

updateButtons();
draw();
