const fs = require('fs');
const path = require('path');

// Creates a directory if it doesn't exist
function createDirectoryIfNotExists(directoryPath) {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
	}
}

// Copies a file, ensuring the destination directory exists
function copyFile(src, destination) {
	const destinationDirectory = path.dirname(destination);
	createDirectoryIfNotExists(destinationDirectory);
	fs.copyFileSync(src, destination);
}

// Recursively copies a directory
function copyDirectory(src, destination) {
	if (!fs.existsSync(src)) return;

	createDirectoryIfNotExists(destination);

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destinationPath = path.join(destination, entry.name);

		if (entry.isDirectory()) {
			copyDirectory(srcPath, destinationPath);
		} else {
			copyFile(srcPath, destinationPath);
		}
	}
}

module.exports = {
	copyFile,
	copyDirectory
};
