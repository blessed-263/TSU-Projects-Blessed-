const container = document.getElementById("container");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	45,
	container.clientWidth / container.clientHeight,
	0.1,
	1000
);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	preserveDrawingBuffer: true,
});
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const material = new THREE.MeshStandardMaterial({
	flatShading: true,
	metalness: 0.3,
	roughness: 0.7,
	side: THREE.DoubleSide,
	vertexColors: true,
});

const geometries = {
	tetrahedron: new THREE.TetrahedronGeometry(1),
	cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
	octahedron: new THREE.OctahedronGeometry(1),
	dodecahedron: new THREE.DodecahedronGeometry(1),
	icosahedron: new THREE.IcosahedronGeometry(1),
};

let mesh = null;

function assignFaceColors(geometry, shapeName) {
	const nonIndexedGeometry = geometry.toNonIndexed();
	const position = nonIndexedGeometry.attributes.position;
	const triangleCount = position.count / 3;

	const colors = [];

	if (shapeName === "cube") {
		const faceCount = 6;
		for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
			const color = new THREE.Color();
			color.setHSL(faceIndex / faceCount, 0.7, 0.5);

			for (let i = 0; i < 6; i++) {
				colors.push(color.r, color.g, color.b);
			}
		}
	} else {
		for (let i = 0; i < triangleCount; i++) {
			const color = new THREE.Color();
			color.setHSL(i / triangleCount, 0.7, 0.5);

			for (let j = 0; j < 3; j++) {
				colors.push(color.r, color.g, color.b);
			}
		}
	}

	nonIndexedGeometry.setAttribute(
		"color",
		new THREE.Float32BufferAttribute(colors, 3)
	);

	return {
		geometry: nonIndexedGeometry,
		faceColors: colorsToFaceColors(colors, shapeName),
	};
}

function colorsToFaceColors(colors, shapeName) {
	const faceColors = [];

	if (shapeName === "cube") {
		for (let i = 0; i < 6; i++) {
			const idx = i * 18;
			const r = colors[idx];
			const g = colors[idx + 1];
			const b = colors[idx + 2];
			faceColors.push(new THREE.Color(r, g, b));
		}
	} else {
		for (let i = 0; i < colors.length; i += 9) {
			const r = colors[i];
			const g = colors[i + 1];
			const b = colors[i + 2];
			faceColors.push(new THREE.Color(r, g, b));
		}
	}

	return faceColors;
}

function createMesh(shapeName) {
	if (mesh) {
		scene.remove(mesh);
		mesh.geometry.dispose();
		mesh.material.dispose();
		mesh = null;
	}

	const baseGeometry = geometries[shapeName].clone();

	const { geometry: coloredGeometry, faceColors } = assignFaceColors(
		baseGeometry,
		shapeName
	);

	mesh = new THREE.Mesh(coloredGeometry, material);
	scene.add(mesh);

	buildColorKey(faceColors);
}

function buildColorKey(faceColors) {
	const container = document.getElementById("colorKey");
	container.innerHTML = "";

	const table = document.createElement("table");
	table.style.borderCollapse = "collapse";
	table.style.width = "100%";

	const headerRow = document.createElement("tr");
	const thFace = document.createElement("th");
	thFace.textContent = "Face #";
	thFace.style.textAlign = "left";
	thFace.style.padding = "4px";
	const thColor = document.createElement("th");
	thColor.textContent = "Color";
	thColor.style.textAlign = "left";
	thColor.style.padding = "4px";
	headerRow.appendChild(thFace);
	headerRow.appendChild(thColor);
	table.appendChild(headerRow);

	faceColors.forEach((color, idx) => {
		const row = document.createElement("tr");

		const faceCell = document.createElement("td");
		faceCell.textContent = (idx + 1).toString();
		faceCell.style.padding = "4px";

		const colorCell = document.createElement("td");
		colorCell.style.padding = "4px";

		const swatch = document.createElement("div");
		swatch.style.width = "24px";
		swatch.style.height = "24px";
		swatch.style.backgroundColor = `#${color.getHexString()}`;
		swatch.style.border = "1px solid #000";
		swatch.style.borderRadius = "4px";

		colorCell.appendChild(swatch);

		row.appendChild(faceCell);
		row.appendChild(colorCell);

		table.appendChild(row);
	});

	container.appendChild(table);
}

const rotateXInput = document.getElementById("rotateX");
const rotateYInput = document.getElementById("rotateY");
const rotateZInput = document.getElementById("rotateZ");

function updateRotation() {
	if (!mesh) return;
	mesh.rotation.x = THREE.MathUtils.degToRad(rotateXInput.value);
	mesh.rotation.y = THREE.MathUtils.degToRad(rotateYInput.value);
	mesh.rotation.z = THREE.MathUtils.degToRad(rotateZInput.value);
}

rotateXInput.addEventListener("input", updateRotation);
rotateYInput.addEventListener("input", updateRotation);
rotateZInput.addEventListener("input", updateRotation);

const shapeSelect = document.getElementById("shapeSelect");
shapeSelect.addEventListener("change", () => {
	createMesh(shapeSelect.value);
	resetRotation();
});

function resetRotation() {
	rotateXInput.value = 0;
	rotateYInput.value = 0;
	rotateZInput.value = 0;
	updateRotation();
}

const downloadBtn = document.getElementById("downloadBtn");
downloadBtn.addEventListener("click", () => {
	renderer.render(scene, camera);
	const dataURL = renderer.domElement.toDataURL("image/png");
	const link = document.createElement("a");
	link.href = dataURL;
	link.download = `${shapeSelect.value}.png`;
	link.click();
});

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

function onWindowResize() {
	const width = container.clientWidth;
	const height = container.clientHeight;
	renderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
}

window.addEventListener("resize", onWindowResize);

window.addEventListener("DOMContentLoaded", () => {
	onWindowResize();
	createMesh(shapeSelect.value);
	resetRotation();
	animate();
});
