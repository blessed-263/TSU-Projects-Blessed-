document.addEventListener("DOMContentLoaded", () => {
	// --- Team member details toggle ---
	const nameBtn = document.getElementById("blessed-name");
	const details = document.getElementById("blessed-details");

	if (nameBtn && details) {
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
	}

	// --- Sidebar controls ---
	const menuBtn = document.querySelector(".menu-btn");
	const closeBtn = document.querySelector(".close-btn");
	const sidebar = document.querySelector(".sidebar");
	const iconLinks = document.querySelectorAll(".icon-link");

	if (menuBtn && sidebar) {
		menuBtn.addEventListener("click", () => {
			sidebar.classList.toggle("active");
		});
	}

	if (closeBtn && sidebar) {
		closeBtn.addEventListener("click", () => {
			sidebar.classList.remove("active");
		});
	}

	// --- Submenu toggle for sidebar ---
	iconLinks.forEach((iconLink) => {
		iconLink.addEventListener("click", (e) => {
			const subMenu = iconLink.nextElementSibling;
			const arrow = iconLink.querySelector(".arrow");

			if (subMenu && subMenu.classList.contains("sub-menu")) {
				e.preventDefault();
				subMenu.classList.toggle("show-menu");
				if (arrow) arrow.classList.toggle("rotate");
			}
		});
	});

	// --- Responsive sidebar behavior ---
	function handleResponsive() {
		if (window.innerWidth < 992) {
			sidebar.classList.remove("active");
			if (menuBtn) menuBtn.style.display = "flex";
		} else {
			sidebar.classList.add("active");
			if (menuBtn) menuBtn.style.display = "none";
		}
	}

	handleResponsive();
	window.addEventListener("resize", handleResponsive);
});
