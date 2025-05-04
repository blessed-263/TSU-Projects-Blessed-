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
				applyFilter();
				downloadBtn.disabled = false;
			};
			originalImage.src = event.target.result;
		};
		reader.readAsDataURL(file);
	});

	colorFilter.addEventListener("change", applyFilter);

	downloadBtn.addEventListener("click", () => {
		if (!outputImage.src) return;

		const link = document.createElement("a");
		link.href = outputImage.src;
		link.download = "filtered-image.png";
		link.click();
	});

	function applyFilter() {
		ctx.drawImage(originalImage, 0, 0);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		const filter = colorFilter.value;

		for (let i = 0; i < data.length; i += 4) {
			let red = data[i];
			let green = data[i + 1];
			let blue = data[i + 2];

			if (filter === "red") {
				red = Math.min(255, red * 1.5);
				green = green * 0.5;
				blue = blue * 0.5;
			} else if (filter === "blue") {
				red = red * 0.5;
				green = green * 0.5;
				blue = Math.min(255, blue * 1.5);
			} else if (filter === "green") {
				red = red * 0.5;
				green = Math.min(255, green * 1.5);
				blue = blue * 0.5;
			} else if (filter === "yellow") {
				red = Math.min(255, red * 1.5);
				green = Math.min(255, green * 1.5);
				blue = blue * 0.5;
			} else if (filter === "purple") {
				red = Math.min(255, red * 1.5);
				green = green * 0.5;
				blue = Math.min(255, blue * 1.5);
			} else if (filter === "cyan") {
				red = red * 0.5;
				green = Math.min(255, green * 1.5);
				blue = Math.min(255, blue * 1.5);
			}

			data[i] = red;
			data[i + 1] = green;
			data[i + 2] = blue;
		}

		ctx.putImageData(imageData, 0, 0);
		outputImage.src = canvas.toDataURL();
	}
});
