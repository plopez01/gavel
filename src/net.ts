const request = require('request');
import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import { submissonResult } from './extension';

export let _SESSION: string;

let _progress = 0;
let progressTimer: NodeJS.Timer;

let fortune = ["Preparant el semáfor groc",
"Segur que no t'has deixat un ;?",
"Segmentation fault (core dumped)",
"T'has deixat un punter penjant",
"Que fas estudiant a aquestes hores?",
"Segur que ara ho tens bé.",
"Fes clic aquí per veure la solució ;)",
"T'agraden els judicis? Proba l'ace attorney",
"Boss makes a dollar. I make a dime. That's why my algorithms run in exponential time",
"Donde está el peluche de linux?"];


export function sendFile(filePath: string, problemPath: string, uploadToken: string) {
	const formData = {
		file: fs.createReadStream(filePath),
		annotation: "",
		compiler_id: "Clang++17",
		token_uid: uploadToken,
		submit: ""
	};

	const options = {
		url: `https://jutge.org${problemPath}`,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			'Referer': 'https://jutge.org/problems/P15613_ca/submissions/S006',
			'Origin': 'https://jutge.org',
			'Connection': 'keep-alive',
			'Cookie': `PHPSESSID=${_SESSION}`,
			'Upgrade-Insecure-Requests': '1',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'same-origin',
			'Sec-Fetch-User': '?1',
			'Pragma': 'no-cache',
			'Cache-Control': 'no-cache'
		},
		formData: formData
	};

	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: `Submitting - `,
		cancellable: false
	}, (progress) => {
		progress.report({ increment: 0 });

		const p = new Promise<void>(resolve => {

			request.post(options, async function optionalCallback(err: any, httpResponse: any, body: string) {
				if (err) {
					return console.error('upload failed:', err);
				}
				console.log('Upload successful!  Server responded with:', body);

				progressTimer = setInterval(function(){
					isSubmissionDone(httpResponse.headers.location, resolve);
					progress.report({ increment: _progress+=16, message: fortune[Math.round(Math.random() * fortune.length) - 1] });
				}, 6000);
			});
		});

		return p;
	});


}

async function isSubmissionDone(location: string, resolve: any) {
	let submissionRaw = await getWebviewContent(`https://jutge.org${location}`);
	//console.log(submissionRaw);
	//console.log(submissionRaw.includes('Fortune'))
	if(!submissionRaw.includes('Fortune')){
		submissonResult(submissionRaw);
		clearInterval(progressTimer);
		vscode.window.showInformationMessage("Uploaded succesfully!");
		resolve();
		return true;
	}

	return false;
}

export async function loginCheck() {
	if (!_SESSION) {
		_SESSION = await getLoginInfo();
		vscode.window.showInformationMessage("Logged in! Welcome to the courtroom.");
	}
}

export function getWebviewContent(url: string): Promise<string> {
	return new Promise(function (resolve, reject) {
		const options = {
			url: url,
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
				'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Cookie': `_ga=GA1.2.1936067010.1660485179; PHPSESSID=${_SESSION}`,
				'Origin': 'https://jutge.org',
				'Pragma': 'no-cache',
				'Referer': 'https://jutge.org/',
				'Sec-Fetch-Dest': 'document',
				'Sec-Fetch-Mode': 'navigate',
				'Sec-Fetch-Site': 'same-origin',
				'Sec-Fetch-User': '?1',
				'Upgrade-Insecure-Requests': '1',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
				'sec-ch-ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"Windows"'
			},
		};

		request.get(options, function (err: any, httpResponse: any, body: string) {
			resolve(body);
		})
	});
}

export function login(user: string, pass: string): Promise<string> {
	return new Promise(function (resolve, reject) {
		const options = {
			url: 'https://jutge.org/',
			form: { email: user, password: pass, submit: '' },
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
				'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Cookie': '_ga=GA1.2.1936067010.1660485179; PHPSESSID=invq8ruvovi0650psnk4526h0a',
				'Origin': 'https://jutge.org',
				'Pragma': 'no-cache',
				'Referer': 'https://jutge.org/',
				'Sec-Fetch-Dest': 'document',
				'Sec-Fetch-Mode': 'navigate',
				'Sec-Fetch-Site': 'same-origin',
				'Sec-Fetch-User': '?1',
				'Upgrade-Insecure-Requests': '1',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
				'sec-ch-ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"Windows"'
			},
		};

		request.post(options, function (err: any, httpResponse: any, body: any) {
			console.log(body);
			console.log(httpResponse.headers);
			console.log(httpResponse.statusCode);

			if (httpResponse.statusCode == 302) {
				resolve(httpResponse.headers['set-cookie'][0].split("PHPSESSID=")[1].split(";")[0]);
			} else {
				vscode.window.showErrorMessage("An error has ocurred loggin in, please check your credentials");
				fs.writeFile(`${os.homedir()}/judge.session`, '', function (err: any) {
					if (err) {
						reject(console.log(err));
					}
					console.log("Credentials have been removed!");
				});
			}
		})

	});
}

export function isSessionValid(session: string): Promise<boolean> {
	return new Promise(function (resolve, reject) {
		const options = {
			url: 'https://jutge.org/dashboard',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
				'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Cookie': `_ga=GA1.2.1936067010.1660485179; PHPSESSID=${session}`,
				'Origin': 'https://jutge.org',
				'Pragma': 'no-cache',
				'Referer': 'https://jutge.org/',
				'Sec-Fetch-Dest': 'document',
				'Sec-Fetch-Mode': 'navigate',
				'Sec-Fetch-Site': 'same-origin',
				'Sec-Fetch-User': '?1',
				'Upgrade-Insecure-Requests': '1',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
				'sec-ch-ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"Windows"'
			},
		};

		request.get(options, function (err: any, httpResponse: any, body: any) {
			resolve(!body.includes('Did you sign in'));
		})
	});
}

export async function getLoginInfo(): Promise<string> {

	try {
		const session = fs.readFileSync(`${os.homedir()}/judge.session`, 'utf8');
		if (session) {
			if (await isSessionValid(session)) return session;
		}
	} catch (err) {
		console.error(err);
	}

	// If not then ask for credentials and save them at the user homedir
	const username = await vscode.window.showInputBox({
		ignoreFocusOut: true,
		placeHolder: "user@example.com",
		prompt: "jutge.org's username",
	});

	const password = await vscode.window.showInputBox({
		ignoreFocusOut: true,
		password: true,
		placeHolder: "password",
		prompt: "jutge.org's password",
	});

	if (username && password) {
		login(username, password).then((session) => {
			console.log(session);
			if (session == undefined) return;
			fs.writeFile(`${os.homedir()}/judge.session`, session, function (err: any) {
				if (err) {
					return console.log(err);
				}
				console.log("Credentials have been saved!");
			});

			return session;
		});
	} else {
		vscode.window.showErrorMessage("You need to provide a valid username and password");
	}
	return "";
}