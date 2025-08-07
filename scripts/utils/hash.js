const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getHash(content) {
	return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

module.exports = getHash
