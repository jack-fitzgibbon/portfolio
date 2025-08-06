
const path = require('path');
const injectContent = require('./inject-content.js');
const { copyFile, copyDirectory } = require('./utils/file-utilities.js');

try {
	const rootDirectory = path.join(__dirname, '..');
	const srcDirectory = path.join(rootDirectory, 'src');
	const distDirectory = path.join(rootDirectory, 'dist');


	copyFile(
		path.join(srcDirectory, 'assets', 'images', 'favicon.ico'),
		path.join(distDirectory, 'assets', 'images', 'favicon.ico')
	);

	copyFile(
		path.join(srcDirectory, 'styles', 'reset.css'),
		path.join(distDirectory, 'styles', 'reset.css')
	);

	copyFile(
		path.join(srcDirectory, 'styles', 'styles.css'),
		path.join(distDirectory, 'styles', 'styles.css')
	);

	copyDirectory(
		path.join(srcDirectory, 'assets', 'images'),
		path.join(distDirectory, 'assets', 'images')
	);

	copyDirectory(
		path.join(srcDirectory, 'assets', 'fonts'),
		path.join(distDirectory, 'assets', 'fonts')
	);

	copyFile(
		path.join(srcDirectory, 'index.html'),
		path.join(distDirectory, 'index.html')
	);

	injectContent();
} catch (error) {
	console.error('Error during update:', error);
	process.exit(1);
}
