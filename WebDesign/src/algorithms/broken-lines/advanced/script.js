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
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;
	const x = (e.clientX - rect.left) * scaleX;
	const y = (e.clientY - rect.top) * scaleY;
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
			const idx = parseInt(slider.dataset.index);
			convexities[idx] = parseFloat(slider.value);
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

// Catmull-Rom spline with convexity adjustment on tangents
function catmullRomWithConvexity(t, p0, p1, p2, p3, convexity) {
	// Calculate tangents with convexity factor applied
	const tension = 0.5; // standard Catmull-Rom tension
	const tangent1 = {
		x: tension * (p2.x - p0.x) * (1 + convexity),
		y: tension * (p2.y - p0.y) * (1 + convexity),
	};
	const tangent2 = {
		x: tension * (p3.x - p1.x) * (1 - convexity),
		y: tension * (p3.y - p1.y) * (1 - convexity),
	};

	const t2 = t * t;
	const t3 = t2 * t;

	// Hermite basis functions
	const h00 = 2 * t3 - 3 * t2 + 1;
	const h10 = t3 - 2 * t2 + t;
	const h01 = -2 * t3 + 3 * t2;
	const h11 = t3 - t2;

	const x = h00 * p1.x + h10 * tangent1.x + h01 * p2.x + h11 * tangent2.x;
	const y = h00 * p1.y + h10 * tangent1.y + h01 * p2.y + h11 * tangent2.y;

	return { x, y };
}

function getSplinePoints(points, convexities, segments = 30) {
	const splinePoints = [];
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i - 1] || points[i];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2] || points[i + 1];
		const convexity = convexities[i] || 0;

		for (let t = 0; t <= 1; t += 1 / segments) {
			splinePoints.push(catmullRomWithConvexity(t, p0, p1, p2, p3, convexity));
		}
	}
	return splinePoints;
}

function drawAdvancedSpline(points, convexities) {
	if (points.length < 2) return;

	const splinePoints = getSplinePoints(points, convexities, 30);

	ctx.beginPath();
	ctx.moveTo(splinePoints[0].x, splinePoints[0].y);
	for (let i = 1; i < splinePoints.length; i++) {
		ctx.lineTo(splinePoints[i].x, splinePoints[i].y);
	}
	ctx.strokeStyle = "#27ae60";
	ctx.lineWidth = 3;
	ctx.stroke();
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw polyline connecting points
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

	// Draw spline if interpolated
	if (interpolated && points.length >= 3) {
		drawAdvancedSpline(points, convexities);
	}

	// Draw points
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

function updateButtons() {
	interpolateBtn.disabled = points.length < 3 || interpolated;
	resetBtn.disabled = points.length === 0;
	downloadBtn.disabled = points.length === 0;
}

updateButtons();
draw();
