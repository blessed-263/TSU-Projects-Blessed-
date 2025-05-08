let originalMat = null;

const checkOpenCVReady = setInterval(() => {
	if (window.cv) {
		clearInterval(checkOpenCVReady);
		if (!window.cvReady) {
			console.log("OpenCV detected via fallback check");
			onOpenCvReady();
		}
	}
}, 100);

document.addEventListener("DOMContentLoaded", () => {
	const inputElement = document.getElementById("uploadInput");
	const imgElement = document.getElementById("previewImg");
	const canvas = document.getElementById("imageCanvas");
	const ctx = canvas.getContext("2d");
	const applyBtn = document.getElementById("applyBtn");
	const downloadBtn = document.getElementById("downloadBtn");

	function cleanup() {
		if (originalMat && !originalMat.isDeleted()) {
			originalMat.delete();
			originalMat = null;
		}
	}

	inputElement.addEventListener("change", (event) => {
		if (event.target.files.length === 0) return;

		const file = event.target.files[0];
		if (!file.type.match("image.*")) {
			alert("Please select an image file");
			return;
		}

		const url = URL.createObjectURL(file);
		imgElement.onload = function () {
			URL.revokeObjectURL(url);
			handleImageLoad();
		};
		imgElement.onerror = function () {
			URL.revokeObjectURL(url);
			alert("Error loading image");
		};
		imgElement.src = url;
		imgElement.classList.remove("hidden");
		downloadBtn.disabled = true;
		cleanup();
	});

	function handleImageLoad() {
		if (!window.cvReady) {
			alert("OpenCV.js is not ready yet. Please wait.");
			return;
		}

		try {
			cleanup();
			originalMat = cv.imread(imgElement);
			canvas.width = originalMat.cols;
			canvas.height = originalMat.rows;
			cv.imshow(canvas, originalMat);
		} catch (err) {
			console.error("Error processing image:", err);
			alert("Error processing image. See console for details.");
			cleanup();
		}
	}

	applyBtn.addEventListener("click", () => {
		if (!window.cvReady) {
			alert("OpenCV.js is not ready yet.");
			return;
		}
		if (!originalMat) {
			alert("Please upload an image first.");
			return;
		}

		try {
			let src = originalMat.clone();
			let gray = new cv.Mat();
			let blurred = new cv.Mat();
			let thresh = new cv.Mat();
			let contours = new cv.MatVector();
			let hierarchy = new cv.Mat();

			cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
			cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
			cv.threshold(blurred, thresh, 100, 255, cv.THRESH_BINARY);
			cv.findContours(
				thresh,
				contours,
				hierarchy,
				cv.RETR_EXTERNAL,
				cv.CHAIN_APPROX_SIMPLE
			);

			for (let i = 0; i < contours.size(); ++i) {
				let color = new cv.Scalar(255, 0, 0, 255);
				cv.drawContours(src, contours, i, color, 2, cv.LINE_8, hierarchy, 100);
			}

			cv.imshow(canvas, src);
			downloadBtn.disabled = false;

			src.delete();
			gray.delete();
			blurred.delete();
			thresh.delete();
			contours.delete();
			hierarchy.delete();
		} catch (err) {
			console.error("Error applying segmentation:", err);
			alert("Error during image processing. See console for details.");
		}
	});

	downloadBtn.addEventListener("click", () => {
		try {
			const link = document.createElement("a");
			link.download = "segmented_image.png";
			link.href = canvas.toDataURL("image/png");
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (err) {
			console.error("Error downloading image:", err);
			alert("Error downloading image. See console for details.");
		}
	});
});
