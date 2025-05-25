// script.js

// Get references to DOM elements
const statusElement = document.createElement("p");
statusElement.id = "opencv-status";
document.querySelector(".main-content").prepend(statusElement);

const imageLoader = document.getElementById("imageLoader");
const segmentBtn = document.getElementById("segmentBtn");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("imageCanvas");

let cvInstance = null; // OpenCV instance after loading
let originalMat = null; // Original image as OpenCV Mat

// Load OpenCV.js and wait for it to be ready
async function loadOpenCv() {
	try {
		cvInstance = await window.cv;
		statusElement.innerText = "OpenCV.js is ready.";
		segmentBtn.disabled = false;
	} catch (err) {
		statusElement.innerText = "Failed to load OpenCV.js.";
		console.error("Error loading OpenCV.js:", err);
	}
}

// Handle image upload and draw to canvas
imageLoader.addEventListener("change", (e) => {
	if (e.target.files.length > 0) {
		const imgFile = e.target.files[0];
		const imgURL = URL.createObjectURL(imgFile);
		const img = new Image();
		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);

			if (originalMat) originalMat.delete();

			try {
				originalMat = cvInstance.imread(canvas);
				statusElement.innerText = "Image loaded. Ready for segmentation.";
				downloadBtn.disabled = true;
			} catch (err) {
				statusElement.innerText = "Error reading image with OpenCV.js.";
				console.error("cv.imread error:", err);
			}
		};
		img.onerror = () => {
			statusElement.innerText = "Failed to load the selected image.";
		};
		img.src = imgURL;
	}
});

// Perform contour detection and draw contours on button click
segmentBtn.addEventListener("click", () => {
	if (!cvInstance || !originalMat) {
		statusElement.innerText =
			"Load an image and wait for OpenCV.js to be ready.";
		return;
	}

	let gray = new cvInstance.Mat();
	let blurred = new cvInstance.Mat();
	let edges = new cvInstance.Mat();
	let hierarchy = new cvInstance.Mat();
	let contours = new cvInstance.MatVector();

	try {
		// Convert to grayscale
		cvInstance.cvtColor(originalMat, gray, cvInstance.COLOR_RGBA2GRAY, 0);

		// Apply Gaussian blur to reduce noise
		cvInstance.GaussianBlur(gray, blurred, new cvInstance.Size(5, 5), 0);

		// Apply Canny edge detector (tune thresholds as needed)
		cvInstance.Canny(blurred, edges, 50, 150);

		// Optional: dilate edges to close gaps
		let kernel = cvInstance.getStructuringElement(
			cvInstance.MORPH_RECT,
			new cvInstance.Size(3, 3)
		);
		cvInstance.dilate(edges, edges, kernel);

		// Find contours from edges
		cvInstance.findContours(
			edges,
			contours,
			hierarchy,
			cvInstance.RETR_EXTERNAL,
			cvInstance.CHAIN_APPROX_SIMPLE
		);

		// Clone original image to draw contours
		let contourImg = originalMat.clone();

		let minContourArea = 100; // Filter small contours (adjust as needed)
		let validContoursCount = 0;

		for (let i = 0; i < contours.size(); ++i) {
			let cnt = contours.get(i);
			let area = cvInstance.contourArea(cnt, false);
			if (area > minContourArea) {
				validContoursCount++;
				const color = new cvInstance.Scalar(
					Math.round(Math.random() * 255),
					Math.round(Math.random() * 255),
					Math.round(Math.random() * 255),
					255
				);
				cvInstance.drawContours(
					contourImg,
					contours,
					i,
					color,
					2,
					cvInstance.LINE_8,
					hierarchy,
					0
				);
			}
			cnt.delete();
		}

		cvInstance.imshow(canvas, contourImg);
		contourImg.delete();
		kernel.delete();

		statusElement.innerText = `Contours detected: ${validContoursCount}`;
		downloadBtn.disabled = false;
	} catch (err) {
		statusElement.innerText = "Error during contour detection.";
		console.error("Contour detection error:", err);
	} finally {
		gray.delete();
		blurred.delete();
		edges.delete();
		hierarchy.delete();
		contours.delete();
	}
});

// Download the processed image as PNG
downloadBtn.addEventListener("click", () => {
	const link = document.createElement("a");
	link.download = "segmented-image.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
});

// Initialize OpenCV.js loading after page load
window.addEventListener("load", loadOpenCv);
