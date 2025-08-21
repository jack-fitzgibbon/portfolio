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

function getNestedValue(object, path) {
	return path.split('.').reduce((object, key) => {
		return (object && object.hasOwnProperty(key)) ? object[key] : null;
	}, object);
}

function getDirectContextValue(path, itemContext) {
	return itemContext.hasOwnProperty(path) ? itemContext[path] : undefined;
}

function getNestedContextValue(path, itemContext) {
	for (const [itemName, itemData] of Object.entries(itemContext)) {
		if (path.startsWith(itemName + '.')) {
			const propertyPath = path.substring(itemName.length + 1);
			return getNestedValue(itemData, propertyPath);
		}
	}
	return undefined;
}

function getGlobalValue(path, globalData) {
	return getNestedValue(globalData, path);
}

function replaceVariables(template, globalData, itemContext = {}) {
	const variablePattern = /{{([^{}]+)}}/g;

	return template.replace(variablePattern, (match, rawPath) => {
		const path = rawPath.trim();

		const directValue = getDirectContextValue(path, itemContext);
		if (directValue !== undefined && directValue !== null) return directValue;

		const nestedValue = getNestedContextValue(path, itemContext);
		if (nestedValue !== undefined && nestedValue !== null) return nestedValue;

		const globalValue = getGlobalValue(path, globalData);
		if (globalValue !== undefined && globalValue !== null) return globalValue;

		return match;
	});
}

function extractForEachBlocks(html) {
	const forEachRegex = /@foreach\s*\(\s*([\w.]+)\s+as\s+(\w+)\s*\)\s*\{/gm;
	const matches = Array.from(html.matchAll(forEachRegex));

	return matches.map(match => {
		const arrayPath = match[1];
		const itemName = match[2];
		const startIndex = match.index;
		const openBraceIndex = html.indexOf('{', startIndex + match[0].length - 1);
		const endIndex = findMatchingBrace(html, openBraceIndex);
		if (endIndex === -1) return null;
		const fullMatch = html.substring(startIndex, endIndex);
		const template = html.substring(openBraceIndex + 1, endIndex - 1);
		return { arrayPath, itemName, startIndex, endIndex, fullMatch, template };
	}).filter(Boolean);
}

function getDataFromArrayPath(arrayPath, globalData, itemContext) {
	for (const [contextItemName, contextItemData] of Object.entries(itemContext)) {
		if (arrayPath.startsWith(contextItemName + '.')) {
			const nestedPath = arrayPath.substring(contextItemName.length + 1);
			return getNestedValue(contextItemData, nestedPath);
		}
	}
	return getNestedValue(globalData, arrayPath);
}

function processForEachLoops(html, globalData, itemContext = {}) {
	let result = html;
	let blocks = extractForEachBlocks(result);

	while (blocks.length > 0) {
		for (const block of blocks) {
			const data = getDataFromArrayPath(block.arrayPath, globalData, itemContext);

			// If the data is not an array, remove the block
			if (!Array.isArray(data)) {
				result = result.replace(block.fullMatch, '');
				continue;
			}

			const replacement = data.map(item => {
				const newContext = { ...itemContext, [block.itemName]: item };
				let processedTemplate = replaceVariables(block.template, globalData, newContext);
				processedTemplate = processForEachLoops(processedTemplate, globalData, newContext);
				return processedTemplate;
			}).join('');

			result = result.replace(block.fullMatch, replacement);
		}
		blocks = extractForEachBlocks(result);
	}

	return result;
}

function processHtmlTemplate(html, data) {
	let result = processForEachLoops(html, data);
	result = replaceVariables(result, data);
	return result;
}

module.exports = injectContent;
