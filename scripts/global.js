const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
	const closeMenu = () => {
		menuToggle.setAttribute("aria-expanded", "false");
		menuToggle.setAttribute("aria-label", "Open navigation");
		siteNav.classList.remove("open");
	};

	menuToggle.addEventListener("click", () => {
		const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

		menuToggle.setAttribute("aria-expanded", String(!isOpen));
		menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
		siteNav.classList.toggle("open", !isOpen);
	});

	siteNav.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", closeMenu);
	});

	document.addEventListener("click", (event) => {
		if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) {
			closeMenu();
		}
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeMenu();
			menuToggle.focus();
		}
	});

	window.addEventListener("resize", () => {
		if (window.innerWidth > 1000) {
			closeMenu();
		}
	});
}

const animatedSections = document.querySelectorAll(".section");

if ("IntersectionObserver" in window) {
	const sectionObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) {
				return;
			}

			entry.target.classList.add("is-visible");
			observer.unobserve(entry.target);
		});
	}, {
		threshold: 0.30
	});

	animatedSections.forEach((section) => sectionObserver.observe(section));
} else {
	animatedSections.forEach((section) => section.classList.add("is-visible"));
}
