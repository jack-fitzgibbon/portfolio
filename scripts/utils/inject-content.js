const fs = require('fs');
const path = require('path');

function injectContent() {
	const contentPath = path.join(__dirname, '..', '..', 'src', 'site-content.json');
	const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
	const htmlPath = path.join(__dirname, '..', '..', 'src', 'index.html');
	const html = fs.readFileSync(htmlPath, 'utf8');
	const processedHtml = processHtmlTemplate(html, content);
	return processedHtml;
}

function findMatchingBrace(html, startIndex) {
	let braceCount = 1;
	let index = startIndex + 1;

	while (index < html.length && braceCount > 0) {
		if (html[index] === '{') {
			braceCount++;
		} else if (html[index] === '}') {
			braceCount--;
		}
		index++;
	}

	return braceCount === 0 ? index : -1;
}

function replaceTemplateVariables(template, itemName, item) {
	let result = template;

	result = result.replace(new RegExp(`\\{\\{${itemName}\\.(\\w+)\\}\\}`, 'g'), (match, propName) => {
		return item[propName] || '';
	});

	result = result.replace(new RegExp(`\\{\\{${itemName}\\.(\\w+(?:\\.\\w+)*)\\}\\}`, 'g'), (match, propPath) => {
		const value = propPath.split('.').reduce((obj, key) => obj && obj[key], item);
		return value || '';
	});

	return result;
}

function replaceGlobalVariables(html, data) {
	const placeholderRegex = /{{([^{}]+)}}/g;

	return html.replace(placeholderRegex, (match, path) => {
		const value = getNestedValue(data, path);
		return value !== null ? value : match;
	});
}

function processForEachLoops(html, data) {
	let result = html;
	let match;
	const forEachRegex = /@foreach\s*\(\s*([\w.]+)\s+as\s+(\w+)\s*\)\s*\{/gm;

	while ((match = forEachRegex.exec(html)) !== null) {
		const arrayPath = match[1];
		const itemName = match[2];
		const startIndex = match.index;
		const openBraceIndex = html.indexOf('{', startIndex + match[0].length - 1);
		const endIndex = findMatchingBrace(html, openBraceIndex);

		if (endIndex === -1) continue;

		const fullMatch = html.substring(startIndex, endIndex);
		const template = html.substring(openBraceIndex + 1, endIndex - 1);

		const array = arrayPath.split('.').reduce((obj, key) => obj && obj[key], data);

		if (!Array.isArray(array)) {
			result = result.replace(fullMatch, '');
			continue;
		}

		const replacement = array.map(item => replaceTemplateVariables(template, itemName, item)).join('');
		result = result.replace(fullMatch, replacement);

		forEachRegex.lastIndex = 0;
		html = result;
	}

	return result;
}

function getNestedValue(object, path) {
	return path.split('.').reduce((obj, key) => {
		return (obj && obj.hasOwnProperty(key)) ? obj[key] : null;
	}, object);
}

function processHtmlTemplate(html, data) {
	const htmlWithLoops = processForEachLoops(html, data);
	return replaceGlobalVariables(htmlWithLoops, data);
}

module.exports = injectContent;
