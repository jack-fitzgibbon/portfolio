

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const getHash = require('./utils/hash.js');
const htmlMinifier = require('html-minifier').minify;
const injectContent = require('./utils/inject-content.js');
const { copyFile, copyDirectory, writeFileIfChanged } = require('./utils/files.js');

const CONFIG = {
	cssFiles: ['reset.css', 'styles.css'],
	htmlMinifierOptions: {
		collapseWhitespace: true,
		removeComments: true,
		removeOptionalTags: true,
		removeRedundantAttributes: true,
		removeScriptTypeAttributes: true,
		removeTagWhitespace: true,
		useShortDoctype: true,
		minifyCSS: true,
		minifyJS: true
	}
};

function updateHtmlReferences(htmlPath, replacements) {
	let html = fs.readFileSync(htmlPath, 'utf8');
	Object.entries(replacements).forEach(([original, hashed]) => {
		const regex = new RegExp(original.replace('.', '\\.'), 'g');
		html = html.replace(regex, hashed);
	});
	fs.writeFileSync(htmlPath, html, 'utf8');
}

function setupDirectories() {
	const rootDirectory = path.join(__dirname, '..');
	const srcDirectory = path.join(rootDirectory, 'src');
	const distDirectory = path.join(rootDirectory, 'dist');

	return { rootDirectory, srcDirectory, distDirectory };
}

function copyStaticAssets(srcDirectory, distDirectory) {
	copyFile(
		path.join(srcDirectory, 'index.html'),
		path.join(distDirectory, 'index.html')
	);

	copyFile(
		path.join(srcDirectory, 'assets', 'images', 'favicon.ico'),
		path.join(distDirectory, 'assets', 'images', 'favicon.ico')
	);

	copyDirectory(
		path.join(srcDirectory, 'assets', 'images'),
		path.join(distDirectory, 'assets', 'images')
	);

	copyDirectory(
		path.join(srcDirectory, 'assets', 'fonts'),
		path.join(distDirectory, 'assets', 'fonts')
	);
}

function processCssFiles(srcDirectory, distDirectory, isProd) {
	const cssReplacements = {};

	CONFIG.cssFiles.forEach(cssFile => {
		const srcCssPath = path.join(srcDirectory, 'styles', cssFile);
		let cssContent = fs.readFileSync(srcCssPath, 'utf8');
		let outCssName = cssFile;

		if (isProd) {
			cssContent = new CleanCSS().minify(cssContent).styles;
			const hash = getHash(cssContent);
			outCssName = cssFile.replace('.css', `.min.${hash}.css`);
			cssReplacements[cssFile] = outCssName;
		}

		const outCssPath = path.join(distDirectory, 'styles', outCssName);
		writeFileIfChanged(outCssPath, cssContent);
	});

	return cssReplacements;
}

function processHtmlFile(distDirectory, isProd, cssReplacements) {
	let htmlContent = injectContent();
	let outHtmlName = 'index.html';

	if (isProd) {
		const distIndexHtml = path.join(distDirectory, 'index.html');
		if (fs.existsSync(distIndexHtml)) {
			fs.unlinkSync(distIndexHtml);
		}

		htmlContent = htmlMinifier(htmlContent, CONFIG.htmlMinifierOptions);
		const hash = getHash(htmlContent);
		outHtmlName = `index.min.${hash}.html`;
	}

	const outHtmlPath = path.join(distDirectory, outHtmlName);
	fs.writeFileSync(outHtmlPath, htmlContent, 'utf8');

	if (isProd) {
		updateHtmlReferences(outHtmlPath, cssReplacements);
	}

	return outHtmlPath;
}

function build() {
	try {
		const isProd = process.argv.includes('--prod');
		const { srcDirectory, distDirectory } = setupDirectories();

		copyStaticAssets(srcDirectory, distDirectory);
		const cssReplacements = processCssFiles(srcDirectory, distDirectory, isProd);
		processHtmlFile(distDirectory, isProd, cssReplacements);
	} catch (error) {
		console.error('Error during build:', error);
		process.exit(1);
	}
}

build();
