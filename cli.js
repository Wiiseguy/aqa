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
const reJsFile = /.js$/;
const reTestFile = /tests?.js$/;
const reNumExtract = /\b\d+\b/;

async function main() {
	//console.log(`Args: ${args}`)
	//console.log(`Called from: ${cwd}`)
	//console.log(`Script located at: ${__dirname}`);

	if(args[0] === '--watch') {
		// Watch files and run tests when changed
		watchFiles();
	} else {
		// Test all files
		let allFiles = await getFiles(cwd);		
		let result = await runTests(allFiles);
		if(result.failed.length > 0) {
			process.exit(1);			
		}
	}
}

async function watchFiles() {
	let allFiles = await getFiles(cwd);	
	let testsFiles = allFiles.filter(f => f.match(reTestFile));
	let nonTestFiles = allFiles.filter(f => f.match(reJsFile) && !testsFiles.includes(f));

	// Collect & debounce
	let requestTimeout;
	let requested = [];
	const requestRun = f => {
		if(!requested.includes(f)) {
			requested.push(f);
		}
		clearTimeout(requestTimeout);
		requestTimeout = setTimeout(_ => {
			console.log("[watch] Running tests for:", requested.map(r => path.basename(r)).join(', '));
			runTests(requested);
			requested.length = 0;
		}, 250);
	};

	// Watch test files
	testsFiles.forEach(tf => {
		fs.watch(tf, type => {
			requestRun(tf);
		})
	});

	// Watch non-test files and simply run all tests when these change
	nonTestFiles.forEach(ntf => {
		fs.watch(ntf, type => {
			testsFiles.forEach(tf => requestRun(tf));
		})
	})

	console.log("[watch] aqa - watcher active, waiting for file changes...")
}

async function runTests(filesToTest) {
	let testsFiles = filesToTest.filter(f => f.match(reTestFile));
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
	}

	return { failed };
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