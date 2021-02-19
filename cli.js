#!/usr/bin/env node
const util = require('util');
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const exec = util.promisify(child_process.exec);
const readdir = fs.promises.readdir;

const [,,...args] = process.argv
const cwd = process.cwd();

// RegExps
const reSkip = /\\\.|\\node_modules/;
const reTestFile = /tests?.js$/;
const reNumExtract = /\b\d+\b/;

async function main() {
	//console.log(`Args: ${args}`)
	//console.log(`Called from: ${cwd}`)
	//console.log(`Script located at: ${__dirname}`);

	// Collect files to test
	let allFiles = await getFiles(cwd);		
	let testsFiles = allFiles.filter(f => f.match(reTestFile));
	let tasks = [];
	testsFiles.forEach(tf => {
		tasks.push({
			name: tf, 
			exec: _ => exec(`node ${tf}`),
			result: null
		 });
	});
	
	// Execute tests
	for(let task of tasks) {
		try {
			task.result = await task.exec();
		} catch(e) {
			task.result = e;
		}
	}
	
	// Check and handle results
	let numOk = 0;
	let numFailed = 0;
	let failed = [];
	tasks.forEach((m,i) => {
		let result = m.result;
		
		if(result.stderr) {
			let lastLine = getLastLine(result.stderr);
			numFailed += extractNumber(lastLine);
			failed.push({ name: m.name, result})
		}
		if(result.stdout) {
			let lastLine = getLastLine(result.stdout);
			numOk += extractNumber(lastLine);
		}
	});

	// Output results
	console.log();	
	if(numFailed === 0) {
		console.log(`\x1b[32m Ran ${numOk} test${numOk === 1 ? '' : 's'} succesfully!`, '\x1b[0m')
		console.log();
	} else {
		failed.forEach(f => {
			console.log('  ', path.relative(cwd, f.name) + ':');
			console.error(withoutLastLine(f.result.stderr));
			console.log();	
		});

		console.error(`\x1b[31m ${numFailed} test${numFailed === 1 ? '' : 's'} failed.`, '\x1b[0m')
		console.log();

		process.exit(1);
	}
}

function getLastLine(str) {
	str = str.trimEnd();
	str = str.substr(Math.max(0, str.lastIndexOf('\n')));
	return str;
}

function withoutLastLine(str) {
	str = str.trimEnd();
	let lastNl = str.lastIndexOf('\n');
	if(lastNl === -1) return str;
	return str.substr(0, lastNl);
}

function extractNumber(str) {
	let matches = str.match(reNumExtract);
	if(matches && matches.length > 0) {
		return Number(matches[0]);
	}
	return 0;
}

// Taken and modified from https://stackoverflow.com/a/45130990/1423052
async function getFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(dirents.map((dirent) => {
		const res = path.resolve(dir, dirent.name);
		if(res.match(reSkip)) return;
		return dirent.isDirectory() ? getFiles(res) : res;
	}));
	return Array.prototype.concat(...files).filter(n => n);
}

main();