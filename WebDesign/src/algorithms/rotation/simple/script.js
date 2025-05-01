document.addEventListener("DOMContentLoaded", () => {
	const imageUpload = document.getElementById("imageUpload");
	const output = document.getElementById("output");
	const rotationInput = document.getElementById("rotation");
	const downloadBtn = document.getElementById("downloadBtn");

	let currentImage = new Image();

	function updateRotation() {
		let degrees = parseInt(rotationInput.value, 10);
		if (isNaN(degrees) || degrees % 90 !== 0) {
			degrees = 0;
			rotationInput.value = 0;
		}
		output.style.transform = `rotate(${degrees}deg)`;
	}

	imageUpload.addEventListener("change", () => {
		const file = imageUpload.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				output.src = e.target.result;
				output.style.transform = "rotate(0deg)";
				rotationInput.value = 0;
				downloadBtn.disabled = false;

				currentImage = new Image();
				currentImage.src = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	});

	rotationInput.addEventListener("change", updateRotation);
	rotationInput.addEventListener("input", updateRotation);

	downloadBtn.addEventListener("click", () => {
		const degrees = parseInt(rotationInput.value, 10) || 0;
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		const angle = degrees % 360;
		const radians = (angle * Math.PI) / 180;

		let imgWidth = currentImage.width;
		let imgHeight = currentImage.height;

		const maxDimension = 1024;
		let scaleFactor = 1;
		if (imgWidth > maxDimension || imgHeight > maxDimension) {
			scaleFactor = Math.min(maxDimension / imgWidth, maxDimension / imgHeight);
			imgWidth = imgWidth * scaleFactor;
			imgHeight = imgHeight * scaleFactor;
		}

		if (angle === 90 || angle === 270) {
			canvas.width = imgHeight;
			canvas.height = imgWidth;
		} else {
			canvas.width = imgWidth;
			canvas.height = imgHeight;
		}

		const scaleX =
			canvas.width / (angle === 90 || angle === 270 ? imgHeight : imgWidth);
		const scaleY =
			canvas.height / (angle === 90 || angle === 270 ? imgWidth : imgHeight);
		const scale = Math.min(scaleX, scaleY);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(radians);
		ctx.scale(scale, scale);

		ctx.drawImage(
			currentImage,
			-currentImage.width / 2,
			-currentImage.height / 2,
			currentImage.width,
			currentImage.height
		);
		ctx.restore();

		canvas.toBlob(
			(blob) => {
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "rotated-image.jpg";
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
			},
			"image/jpeg",
			0.8
		);
	});
});
