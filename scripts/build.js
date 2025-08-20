const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const getHash = require('./utils/hash.js');
const htmlMinifier = require('html-minifier').minify;
const injectContent = require('./utils/inject-content.js');
const { copyFile, copyDirectory, writeFileIfChanged } = require('./utils/files.js');

const htmlMinifierOptions = {
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

function updateHtmlReferences(htmlContent, combinedCssFileName) {
	const existingCssLinkTags = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi
	let updatedHtml = htmlContent.replace(existingCssLinkTags, '');
	const cssLink = `<link rel="stylesheet" href="${combinedCssFileName}">`;
	updatedHtml = updatedHtml.replace(/<\/head>/i, `  ${cssLink}\n</head>`);

	return updatedHtml;
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
	if (isProd) {
		const cssFiles = fs.readdirSync(path.join(srcDirectory, 'styles')).filter(file => file.endsWith('.css'));
		let combinedCssContent = '';

		cssFiles.forEach(cssFile => {
			const srcCssPath = path.join(srcDirectory, 'styles', cssFile);
			let cssContent = fs.readFileSync(srcCssPath, 'utf8');
			// Replace '../assets' with 'assets' for correct asset paths
			cssContent = cssContent.replace(/\.\.\/assets\//g, 'assets/');
			combinedCssContent += cssContent + '\n\n';
		});

		const finalCssContent = new CleanCSS().minify(combinedCssContent).styles;
		const outCssName = 'styles.css';
		const outCssPath = path.join(distDirectory, outCssName);
		writeFileIfChanged(outCssPath, finalCssContent);

		return outCssName;
	} else {
		const cssReplacements = {};
		const cssFiles = fs.readdirSync(path.join(srcDirectory, 'styles')).filter(file => file.endsWith('.css'));

		cssFiles.forEach(cssFile => {
			const srcCssPath = path.join(srcDirectory, 'styles', cssFile);
			let cssContent = fs.readFileSync(srcCssPath, 'utf8');

			if (isProd) {
				cssContent = cssContent.replace(/\.\.\/assets\//g, 'assets/');
			}

			const outCssPath = path.join(distDirectory, 'styles', cssFile);
			writeFileIfChanged(outCssPath, cssContent);
			cssReplacements[cssFile] = cssFile;
		});

		return cssReplacements;
	}
}

function processHtmlFile(distDirectory, isProd, cssFileInfo) {
	let htmlContent = injectContent();
	let outHtmlName = 'index.html';

	if (isProd) {
		htmlContent = updateHtmlReferences(htmlContent, cssFileInfo);

		const distIndexHtml = path.join(distDirectory, 'index.html');
		if (fs.existsSync(distIndexHtml)) {
			fs.unlinkSync(distIndexHtml);
		}

		htmlContent = htmlMinifier(htmlContent, htmlMinifierOptions);
	} else {
		Object.entries(cssFileInfo).forEach(([original, hashed]) => {
			const regex = new RegExp(original.replace('.', '\.'), 'g');
			htmlContent = htmlContent.replace(regex, hashed);
		});
	}

	const outHtmlPath = path.join(distDirectory, outHtmlName);
	fs.writeFileSync(outHtmlPath, htmlContent, 'utf8');

	return outHtmlPath;
}

function build() {
	try {
		const isProd = process.argv.includes('--prod');
		const { srcDirectory, distDirectory } = setupDirectories();

		copyStaticAssets(srcDirectory, distDirectory);
		const combinedCssFileName = processCssFiles(srcDirectory, distDirectory, isProd);
		processHtmlFile(distDirectory, isProd, combinedCssFileName);

		console.log(`Build completed successfully. CSS combined into: ${combinedCssFileName}`);
	} catch (error) {
		console.error('Error during build:', error);
		process.exit(1);
	}
}

build();
