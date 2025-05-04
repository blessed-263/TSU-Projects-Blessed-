document.addEventListener("DOMContentLoaded", () => {
	const imageUpload = document.getElementById("imageUpload");
	const colorFilter = document.getElementById("colorFilter");
	const outputImage = document.getElementById("output");
	const downloadBtn = document.getElementById("downloadBtn");

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	let originalImage = new Image();

	imageUpload.addEventListener("change", (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function (event) {
			originalImage = new Image();
			originalImage.onload = () => {
				canvas.width = originalImage.width;
				canvas.height = originalImage.height;
				ctx.drawImage(originalImage, 0, 0);
				outputImage.src = canvas.toDataURL();
				downloadBtn.disabled = false;
			};
			originalImage.src = event.target.result;
		};
		reader.readAsDataURL(file);
	});

	colorFilter.addEventListener("change", () => {
		if (!originalImage.src) return;

		ctx.drawImage(originalImage, 0, 0);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		const filter = colorFilter.value;

		for (let i = 0; i < data.length; i += 4) {
			const red = data[i];
			const green = data[i + 1];
			const blue = data[i + 2];

			if (filter === "red") {
				data[i] = Math.min(255, red * 1.5);
				data[i + 1] = green * 0.5;
				data[i + 2] = blue * 0.5;
			} else if (filter === "blue") {
				data[i] = red * 0.5;
				data[i + 1] = green * 0.5;
				data[i + 2] = Math.min(255, blue * 1.5);
			} else if (filter === "green") {
				data[i] = red * 0.5;
				data[i + 1] = Math.min(255, green * 1.5);
				data[i + 2] = blue * 0.5;
			}
		}

		ctx.putImageData(imageData, 0, 0);
		outputImage.src = canvas.toDataURL();
	});

	downloadBtn.addEventListener("click", () => {
		if (!outputImage.src) return;

		const link = document.createElement("a");
		link.href = outputImage.src;
		link.download = "filtered-image.png";
		link.click();
	});
});
