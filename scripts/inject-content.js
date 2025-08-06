const fs = require('fs');
const path = require('path');

function injectContent() {
	const contentPath = path.join(__dirname, '..', 'src', 'site-content.json');
	const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
	const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
	const html = fs.readFileSync(htmlPath, 'utf8');
	const processedHtml = processHtmlTemplate(html, content);
	fs.writeFileSync(htmlPath, processedHtml);
}

function processHtmlTemplate(html, data) {
	// Looking for placeholders in the format {{path.to.property}}
	const placeholders = /{{([^{}]+)}}/g;

	return html.replace(placeholders, (match, path) => {
		const value = path.split('.').reduce((object, key) => {
			if (!object) return null;
			if (!object.hasOwnProperty(key)) return null;
			return object[key];
		}, data);

		return value !== null ? value : match;
	});
}

module.exports = injectContent;
