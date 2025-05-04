document.addEventListener("DOMContentLoaded", () => {
	const cube = document.getElementById("cube");
	const rotateX = document.getElementById("rotateX");
	const rotateY = document.getElementById("rotateY");
	const rotateZ = document.getElementById("rotateZ");
	const downloadBtn = document.getElementById("downloadBtn");

	const faceElements = {
		front: document.querySelector(".face.front"),
		back: document.querySelector(".face.back"),
		right: document.querySelector(".face.right"),
		left: document.querySelector(".face.left"),
		top: document.querySelector(".face.top"),
		bottom: document.querySelector(".face.bottom"),
	};

	const colorInputs = {
		front: document.getElementById("color-front"),
		back: document.getElementById("color-back"),
		right: document.getElementById("color-right"),
		left: document.getElementById("color-left"),
		top: document.getElementById("color-top"),
		bottom: document.getElementById("color-bottom"),
	};

	function updateCubeRotation() {
		const x = rotateX.value;
		const y = rotateY.value;
		const z = rotateZ.value;
		cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
	}

	function updateFaceColors() {
		for (const face in faceElements) {
			faceElements[face].style.backgroundColor = colorInputs[face].value;
		}
	}

	function downloadCubeImage() {
		const size = 400;
		const canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");

		ctx.clearRect(0, 0, size, size);

		const half = 100;
		const vertices = [
			[-half, -half, -half],
			[half, -half, -half],
			[half, half, -half],
			[-half, half, -half],
			[-half, -half, half],
			[half, -half, half],
			[half, half, half],
			[-half, half, half],
		];

		const faces = [
			{ name: "front", verts: [4, 5, 6, 7], number: "1" },
			{ name: "back", verts: [0, 1, 2, 3], number: "6" },
			{ name: "right", verts: [1, 5, 6, 2], number: "2" },
			{ name: "left", verts: [0, 4, 7, 3], number: "5" },
			{ name: "top", verts: [3, 2, 6, 7], number: "3" },
			{ name: "bottom", verts: [0, 1, 5, 4], number: "4" },
		];

		const rx = (rotateX.value * Math.PI) / 180;
		const ry = (rotateY.value * Math.PI) / 180;
		const rz = (rotateZ.value * Math.PI) / 180;

		function rotateXMat(p) {
			const [x, y, z] = p;
			return [
				x,
				y * Math.cos(rx) - z * Math.sin(rx),
				y * Math.sin(rx) + z * Math.cos(rx),
			];
		}
		function rotateYMat(p) {
			const [x, y, z] = p;
			return [
				x * Math.cos(ry) + z * Math.sin(ry),
				y,
				-x * Math.sin(ry) + z * Math.cos(ry),
			];
		}
		function rotateZMat(p) {
			const [x, y, z] = p;
			return [
				x * Math.cos(rz) - y * Math.sin(rz),
				x * Math.sin(rz) + y * Math.cos(rz),
				z,
			];
		}

		function rotate(p) {
			return rotateZMat(rotateYMat(rotateXMat(p)));
		}

		function project(p) {
			const scale = 1;
			return [p[0] * scale, p[1] * scale];
		}

		function drawFace(face) {
			const verts3D = face.verts.map((i) => rotate(vertices[i]));
			const verts2D = verts3D.map(project);

			const v0 = verts3D[0];
			const v1 = verts3D[1];
			const v2 = verts3D[2];
			const ux = v1[0] - v0[0];
			const uy = v1[1] - v0[1];
			const uz = v1[2] - v0[2];
			const vx = v2[0] - v0[0];
			const vy = v2[1] - v0[1];
			const vz = v2[2] - v0[2];
			const nx = uy * vz - uz * vy;
			const ny = uz * vx - ux * vz;
			const nz = ux * vy - uy * vx;

			if (nz > 0) return;

			ctx.beginPath();
			verts2D.forEach(([x, y], i) => {
				const cx = x + size / 2;
				const cy = -y + size / 2;
				if (i === 0) ctx.moveTo(cx, cy);
				else ctx.lineTo(cx, cy);
			});
			ctx.closePath();

			ctx.fillStyle = colorInputs[face.name].value;
			ctx.fill();
			ctx.strokeStyle = "#333";
			ctx.lineWidth = 2;
			ctx.stroke();

			const cx =
				verts2D.reduce((sum, v) => sum + v[0], 0) / verts2D.length + size / 2;
			const cy =
				-verts2D.reduce((sum, v) => sum + v[1], 0) / verts2D.length + size / 2;

			ctx.fillStyle = "white";
			ctx.font = "bold 48px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(face.number, cx, cy);
		}

		const facesWithZ = faces.map((face) => {
			const avgZ =
				face.verts.reduce((sum, i) => sum + rotate(vertices[i])[2], 0) / 4;
			return { face, avgZ };
		});
		facesWithZ.sort((a, b) => b.avgZ - a.avgZ);

		facesWithZ.forEach(({ face }) => drawFace(face));

		const link = document.createElement("a");
		link.download = "3d-cube.png";
		link.href = canvas.toDataURL("image/png");
		link.click();
	}

	rotateX.addEventListener("input", () => {
		cube.style.transform = `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) rotateZ(${rotateZ.value}deg)`;
	});

	rotateY.addEventListener("input", () => {
		cube.style.transform = `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) rotateZ(${rotateZ.value}deg)`;
	});

	rotateZ.addEventListener("input", () => {
		cube.style.transform = `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) rotateZ(${rotateZ.value}deg)`;
	});

	for (const face in colorInputs) {
		colorInputs[face].addEventListener("input", () => {
			faceElements[face].style.backgroundColor = colorInputs[face].value;
		});
	}

	downloadBtn.addEventListener("click", downloadCubeImage);

	cube.style.transform = `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
	for (const face in faceElements) {
		faceElements[face].style.backgroundColor = colorInputs[face].value;
	}
});
