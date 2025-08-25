const fs = require('fs');
const path = require('path');
const terser = require('terser');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier').minify;
const injectContent = require('./utils/inject-content.js');
const { copyFile, copyDirectory } = require('./utils/files.js');

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

	copyDirectory(
		path.join(srcDirectory, 'scripts'),
		path.join(distDirectory, 'scripts')
	);

	copyDirectory(
		path.join(srcDirectory, 'styles'),
		path.join(distDirectory, 'styles')
	);
}

function processCssFilesInline(srcDirectory) {
	const cssFiles = fs.readdirSync(path.join(srcDirectory, 'styles')).filter(file => file.endsWith('.css'));
	let combinedCssContent = '';
	cssFiles.forEach(cssFile => {
		const srcCssPath = path.join(srcDirectory, 'styles', cssFile);
		let cssContent = fs.readFileSync(srcCssPath, 'utf8');
		cssContent = cssContent.replace(/\.\.\/assets\//g, 'assets/');
		combinedCssContent += cssContent + '\n\n';
	});
	return new CleanCSS().minify(combinedCssContent).styles;
}

async function processJavaScriptFilesInline(srcDirectory) {
	const jsFiles = fs.readdirSync(path.join(srcDirectory, 'scripts')).filter(file => file.endsWith('.js'));
	let combinedJs = '';
	for (const jsFile of jsFiles) {
		const srcJsPath = path.join(srcDirectory, 'scripts', jsFile);
		let jsContent = fs.readFileSync(srcJsPath, 'utf8');
		jsContent = jsContent.replace(/\.\.\/assets\//g, 'assets/');
		combinedJs += jsContent + '\n';
	}
	const minified = await terser.minify(combinedJs);
	return minified.code || combinedJs;
}

function processHtmlFileInline(distDirectory, minifiedCss, minifiedJs) {
	let htmlContent = injectContent();
	let outHtmlName = 'index.html';

	htmlContent = htmlContent.replace(/<link rel="stylesheet"[^>]*>/g, '');
	htmlContent = htmlContent.replace(/<script src="\.\/scripts\/[^"]+" defer><\/script>/g, '');
	htmlContent = htmlContent.replace(/<\/head>/i, `  <style>${minifiedCss}</style>\n</head>`);
	htmlContent = htmlContent.replace(/<\/body>/i, `  <script>${minifiedJs}</script>\n</body>`);
	htmlContent = htmlMinifier(htmlContent, htmlMinifierOptions);

	const outHtmlPath = path.join(distDirectory, outHtmlName);
	fs.writeFileSync(outHtmlPath, htmlContent, 'utf8');
	return outHtmlPath;
}

async function build() {
	try {
		const isProd = process.argv.includes('--prod');
		const { srcDirectory, distDirectory } = setupDirectories();

		if (isProd) {
			if (fs.existsSync(distDirectory)) {
				fs.readdirSync(distDirectory).forEach(file => {
					if (file !== 'assets') {
						const filePath = path.join(distDirectory, file);
						if (fs.lstatSync(filePath).isDirectory()) {
							fs.rmSync(filePath, { recursive: true, force: true });
						} else {
							fs.unlinkSync(filePath);
						}
					}
				});
			}

			copyDirectory(path.join(srcDirectory, 'assets'), path.join(distDirectory, 'assets'));

			const minifiedCss = processCssFilesInline(srcDirectory);
			const minifiedJs = await processJavaScriptFilesInline(srcDirectory);
			processHtmlFileInline(distDirectory, minifiedCss, minifiedJs);

			console.log('Build completed successfully. All CSS and JS inlined into index.html.');
		} else {
			copyStaticAssets(srcDirectory, distDirectory);
			const distIndexHtml = path.join(distDirectory, 'index.html');
			let htmlContent = injectContent();
			fs.writeFileSync(distIndexHtml, htmlContent, 'utf8');
		}
	} catch (error) {
		console.error('Error during build:', error);
		process.exit(1);
	}
}

build();
