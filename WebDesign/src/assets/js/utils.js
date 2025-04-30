document.addEventListener("DOMContentLoaded", () => {
	const nameBtn = document.getElementById("blessed-name");
	const details = document.getElementById("blessed-details");

	if (!nameBtn || !details) return;

	nameBtn.addEventListener("click", () => {
		const isExpanded = nameBtn.getAttribute("aria-expanded") === "true";
		if (isExpanded) {
			details.classList.remove("show");
			details.hidden = true;
			nameBtn.setAttribute("aria-expanded", "false");
		} else {
			details.hidden = false;
			requestAnimationFrame(() => {
				details.classList.add("show");
			});
			nameBtn.setAttribute("aria-expanded", "true");
		}
	});

	document.addEventListener("click", (e) => {
		if (!nameBtn.contains(e.target) && !details.contains(e.target)) {
			if (details.classList.contains("show")) {
				details.classList.remove("show");
				details.hidden = true;
				nameBtn.setAttribute("aria-expanded", "false");
			}
		}
	});
});
