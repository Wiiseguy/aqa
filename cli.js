#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawn;

const [,,...args] = process.argv
const cwd = process.cwd();


function main() {
	console.log(`Args: ${args}`)
	console.log(`Called from: ${cwd}`)
	console.log(`Script located at: ${__dirname}`)	
}

main();