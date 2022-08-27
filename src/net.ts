const request = require('request');
import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';

export let _SESSION: string;

export function sendFile(filePath: string, problemPath: string) {
	const formData = {
		file: fs.createReadStream(filePath),
		annotation: "",
		compiler_id: "Clang++17",
		token_uid: "6b26d4909b4fd817a19ef8eeafce2009799e68002dccb8814f7c7187811793c7bed33b6402d2617bf6b0df620016cee371b815ea3d6cd64d4df50caf72867dee",
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
			'Cookie': 'PHPSESSID=kb0i6874rn51rn94bp6ota000k',
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

	request.post(options, function optionalCallback(err: any, httpResponse: any, body: string) {
		if (err) {
			return console.error('upload failed:', err);
		}
		console.log('Upload successful!  Server responded with:', body);
		console.log(httpResponse.statusCode);
	});
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