const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

const copyToast = document.createElement("div");
copyToast.className = "copy-toast";
copyToast.setAttribute("role", "status");
copyToast.setAttribute("aria-live", "polite");
document.body.append(copyToast);

let copyToastTimeout;

const showCopyToast = (message) => {
	copyToast.textContent = message;
	copyToast.classList.add("is-visible");
	clearTimeout(copyToastTimeout);
	copyToastTimeout = setTimeout(() => copyToast.classList.remove("is-visible"), 2200);
};

window.copyToClipboard = async (text) => {
	try {
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(text);
		} else {
			throw new Error("Clipboard API unavailable");
		}
	} catch {
		const temporaryInput = document.createElement("textarea");
		temporaryInput.value = text;
		temporaryInput.setAttribute("readonly", "");
		temporaryInput.style.position = "fixed";
		temporaryInput.style.opacity = "0";
		document.body.append(temporaryInput);
		temporaryInput.select();
		const copied = document.execCommand("copy");
		temporaryInput.remove();

		if (!copied) {
			showCopyToast("Could not copy to clipboard");
			return false;
		}
	}

	showCopyToast("Copied to clipboard");
	return true;
};

document.querySelectorAll("[data-copy-text]").forEach((copyTarget) => {
	copyTarget.addEventListener("click", (event) => {
		event.preventDefault();
		window.copyToClipboard(copyTarget.dataset.copyText);
	});
});

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

const lightboxImages = document.querySelectorAll("[data-lightbox-gallery]");

if (lightboxImages.length) {
	const lightbox = document.createElement("div");
	lightbox.className = "lightbox";
	lightbox.setAttribute("aria-hidden", "true");
	lightbox.innerHTML = `
		<div class="lightbox-backdrop"></div>
		<div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Expanded image">
			<button class="lightbox-close" type="button" aria-label="Close image">&times;</button>
			<img class="lightbox-image" alt="" draggable="false">
			<div class="lightbox-controls">
				<button class="lightbox-previous" type="button" aria-label="Previous image">&larr;</button>
				<span class="lightbox-counter" aria-live="polite"></span>
				<button class="lightbox-next" type="button" aria-label="Next image">&rarr;</button>
			</div>
		</div>
	`;
	document.body.append(lightbox);

	const expandedImage = lightbox.querySelector(".lightbox-image");
	const closeButton = lightbox.querySelector(".lightbox-close");
	const previousButton = lightbox.querySelector(".lightbox-previous");
	const nextButton = lightbox.querySelector(".lightbox-next");
	const counter = lightbox.querySelector(".lightbox-counter");
	const galleries = new Map();
	let previouslyFocusedImage;
	let activeGallery = [];
	let activeIndex = 0;
	let isZoomed = false;
	let imageOffset = { x: 0, y: 0 };
	let pointerStart;
	let suppressZoomClick = false;

	lightboxImages.forEach((image) => {
		const galleryName = image.dataset.lightboxGallery;
		const gallery = galleries.get(galleryName) || [];
		gallery.push(image);
		galleries.set(galleryName, gallery);
	});

	const getImageSource = (image) => {
		const imageSource = image.currentSrc || image.src;
		return imageSource.replace("/small/", "/full/");
	};

	const resetZoom = () => {
		isZoomed = false;
		imageOffset = { x: 0, y: 0 };
		expandedImage.classList.remove("is-zoomed", "is-dragging");
		expandedImage.style.transform = "";
	};

	const renderZoom = () => {
		expandedImage.style.transform = isZoomed
			? `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(2)`
			: "";
	};

	const toggleZoom = () => {
		isZoomed = !isZoomed;
		if (!isZoomed) {
			imageOffset = { x: 0, y: 0 };
		}
		expandedImage.classList.toggle("is-zoomed", isZoomed);
		renderZoom();
	};

	const renderImage = () => {
		const image = activeGallery[activeIndex];
		resetZoom();
		expandedImage.src = getImageSource(image);
		expandedImage.alt = image.alt;
		counter.textContent = `${activeIndex + 1} / ${activeGallery.length}`;
		const hasAdjacentImages = activeGallery.length > 1;
		previousButton.hidden = !hasAdjacentImages;
		nextButton.hidden = !hasAdjacentImages;
		counter.hidden = !hasAdjacentImages;
	};

	const closeLightbox = () => {
		lightbox.classList.remove("is-open");
		lightbox.setAttribute("aria-hidden", "true");
		resetZoom();
		if (previouslyFocusedImage) {
			previouslyFocusedImage.focus();
		}
	};

	lightboxImages.forEach((image) => {
		image.setAttribute("tabindex", "0");
		image.setAttribute("role", "button");
		image.setAttribute("aria-label", `Open image: ${image.alt}`);

		const openLightbox = () => {
			previouslyFocusedImage = image;
			activeGallery = galleries.get(image.dataset.lightboxGallery);
			activeIndex = activeGallery.indexOf(image);
			renderImage();
			lightbox.classList.add("is-open");
			lightbox.setAttribute("aria-hidden", "false");
			closeButton.focus();
		};

		image.addEventListener("click", openLightbox);
		image.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				openLightbox();
			}
		});
	});

	expandedImage.addEventListener("click", () => {
		if (suppressZoomClick) {
			suppressZoomClick = false;
			return;
		}

		toggleZoom();
	});

	expandedImage.addEventListener("pointerdown", (event) => {
		if (!isZoomed) {
			return;
		}

		pointerStart = {
			x: event.clientX,
			y: event.clientY,
			offsetX: imageOffset.x,
			offsetY: imageOffset.y
		};
		suppressZoomClick = false;
		expandedImage.classList.add("is-dragging");
		expandedImage.setPointerCapture(event.pointerId);
	});

	expandedImage.addEventListener("pointermove", (event) => {
		if (!pointerStart) {
			return;
		}

		const offsetX = event.clientX - pointerStart.x;
		const offsetY = event.clientY - pointerStart.y;
		if (Math.abs(offsetX) > 4 || Math.abs(offsetY) > 4) {
			suppressZoomClick = true;
		}

		imageOffset = {
			x: pointerStart.offsetX + offsetX,
			y: pointerStart.offsetY + offsetY
		};
		renderZoom();
	});

	const stopDragging = (event) => {
		if (!pointerStart) {
			return;
		}

		pointerStart = null;
		expandedImage.classList.remove("is-dragging");
		if (expandedImage.hasPointerCapture(event.pointerId)) {
			expandedImage.releasePointerCapture(event.pointerId);
		}
	};

	expandedImage.addEventListener("pointerup", stopDragging);
	expandedImage.addEventListener("pointercancel", stopDragging);

	const showAdjacentImage = (direction) => {
		if (activeGallery.length < 2) {
			return;
		}

		activeIndex = (activeIndex + direction + activeGallery.length) % activeGallery.length;
		renderImage();
	};

	previousButton.addEventListener("click", () => showAdjacentImage(-1));
	nextButton.addEventListener("click", () => showAdjacentImage(1));
	closeButton.addEventListener("click", closeLightbox);
	lightbox.querySelector(".lightbox-backdrop").addEventListener("click", closeLightbox);
	document.addEventListener("keydown", (event) => {
		if (!lightbox.classList.contains("is-open")) {
			return;
		}

		if (event.key === "ArrowLeft") {
			event.preventDefault();
			showAdjacentImage(-1);
		}

		if (event.key === "ArrowRight") {
			event.preventDefault();
			showAdjacentImage(1);
		}

		if (event.key === "Escape") {
			closeLightbox();
		}
	});
}
