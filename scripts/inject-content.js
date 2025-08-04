const fs = require('fs');
const path = require('path');

const contentPath = path.join(__dirname, 'site-content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

function processHtmlTemplate(html, data) {
	// Looking for placeholders in the format {{path.to.property}}
	const placeholders = /{{([^{}]+)}}/g;

	return html.replace(placeholders, (match, path) => {
		const value = path.split('.').reduce((obj, key) => {
			return obj && obj[key] !== undefined ? obj[key] : null;
		}, data);

		return value !== null ? value : match;
	});
}

const processedHtml = processHtmlTemplate(html, content);
fs.writeFileSync(htmlPath, processedHtml);
