
const toggleButton = document.getElementById('dark-mode-toggle');
const localStorageKey = 'jack-fitzgibbon-theme';

function getSystemTheme() {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);
}

function getSavedTheme() {
	return localStorage.getItem(localStorageKey);
}

function setTheme(theme) {
	localStorage.setItem(localStorageKey, theme);
	applyTheme(theme);
}

function initTheme() {
	const saved = getSavedTheme();
	const theme = saved || getSystemTheme();
	applyTheme(theme);
}

toggleButton.addEventListener('click', () => {
	const current = document.documentElement.getAttribute('data-theme');
	const next = current === 'dark' ? 'light' : 'dark';
	setTheme(next);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
	if (!getSavedTheme()) {
		applyTheme(event.matches ? 'dark' : 'light');
	}
});

initTheme();
