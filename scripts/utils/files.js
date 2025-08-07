const fs = require('fs');
const path = require('path');

function createDirectoryIfNotExists(directoryPath) {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
	}
}

function copyFile(src, destination) {
	const destinationDirectory = path.dirname(destination);
	createDirectoryIfNotExists(destinationDirectory);
	fs.copyFileSync(src, destination);
}

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

function writeFileIfChanged(filePath, content) {
	let shouldWrite = true;
	if (fs.existsSync(filePath)) {
		const existingContent = fs.readFileSync(filePath, 'utf8');
		if (existingContent === content) {
			shouldWrite = false;
		}
	}

	if (shouldWrite) {
		createDirectoryIfNotExists(path.dirname(filePath));
		fs.writeFileSync(filePath, content, 'utf8');
	}

	return shouldWrite;
}


module.exports = {
	createDirectoryIfNotExists,
	copyFile,
	copyDirectory,
	writeFileIfChanged
};
