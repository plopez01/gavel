import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
const request = require('request');
let _SESSION : string;

export function activate(context: vscode.ExtensionContext) {
	let webViewPanel;
	context.subscriptions.push(
		vscode.commands.registerCommand('gavel.start', async () => {

			_SESSION = await getLoginInfo()

			vscode.window.showInformationMessage("Logged in! Welcome to the courtroom.");

			// Create and show panel
			webViewPanel = vscode.window.createWebviewPanel(
				'dashboard',
				'Dashboard',
				vscode.ViewColumn.Two,
				{}
			);

			// And set its HTML content
			
			let dashboardRaw = await getWebviewContent('https://jutge.org/dashboard', _SESSION) as string;
			//console.log(dashboardRaw);
			// Time to hack us into the data, webscrapping time
			let username = dashboardRaw.split(`<span class='hidden-xs'>`)[1].split('\n')[1].replace(/\s+/, "");
			let acceptedProblems = dashboardRaw.split(`<div class='col-xs-9 text-right'>\n                                <small>Accepted Problems</small>\n                                <div class='huge'>`)[1].split('</div>')[0];
			let rejectedProblems = dashboardRaw.split(`<div class='col-xs-9 text-right'>\n                                <small>Rejected Problems</small>\n                                <div class='huge'>`)[1].split('</div>')[0];
			let submissions = dashboardRaw.split(`<div class='col-xs-9 text-right'>\n                                <small>Submissions</small>\n                                <div class='huge'>`)[1].split('</div>')[0];
			let judgeLevel = dashboardRaw.split(`<div class='col-xs-9 text-right'>\n                                <small>Judge Level</small>\n                                <div class='huge'>`)[1].split('</div>')[0];

			let html = `<!DOCTYPE html>
			<html>
				<header>
					<style>
						hr.solid {
							border-top: 3px solid #bbb;
						}
						p1 {
							font-size: x-large;
						}
					</style>
				</header>
				<body>
					<h1>Welcome to the trial "${username}" ;)</h1>
					<hr class="solid"><br>
					<p1>Accepted problems: ${acceptedProblems}</p1><br>
					<p1>Rejected problems: ${rejectedProblems}</p1><br>
					<p1>Submitted problems: ${submissions}</p1><br>
					<p1>Judge level: ${judgeLevel}</p1>
					<br>
					<br>
					<p2>Excuse ugly html :></p2>
				</body>
			</html>`

			webViewPanel.webview.html = html;
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('gavel.problem', async () => {

			if(!_SESSION) return vscode.window.showWarningMessage('You need to login first (gavel.start)');

			const problemId = await vscode.window.showInputBox({
				ignoreFocusOut: true,
				placeHolder: "PXXXXX",
				prompt: "jutge.org's problem id",
			});

			if(!problemId) return vscode.window.showErrorMessage('You need to enter a valid problem ID');

			// Create and show panel
			webViewPanel = vscode.window.createWebviewPanel(
				problemId as string,
				problemId as string,
				vscode.ViewColumn.Two,
				{}
			);

			// And set its HTML content
			let problemRaw = await getWebviewContent(`https://jutge.org/problems/${problemId}`, _SESSION) as string;
			let problemStatus = problemRaw.split(`<div class='col-sm-6'>\n                \n        <div class='panel panel-default'>\n            <div class='panel-heading'>\n                `)[1].split('\n')[0];
			console.log(problemStatus);
			fs.writeFile(`${os.homedir()}/problem.html`, problemRaw, function (err: any) {
				if (err) {
					console.log(err);
				}
				console.log("Credentials have been removed!");
			});
		})
	);
}

function login(user: string, pass: string) {
	return new Promise(function(resolve, reject) {
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
	
			if(httpResponse.statusCode == 302){
				resolve(httpResponse.headers['set-cookie'][0].split("PHPSESSID=")[1].split(";")[0]);
			}else{
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

function isSessionValid(session: string){
	return new Promise(function(resolve, reject){
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

async function getLoginInfo() {

	const fs = require('fs');

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

	if(username && password){
		login(username, password).then((session) => {
			console.log(session);
			if(session == undefined) return;
			fs.writeFile(`${os.homedir()}/judge.session`, session, function (err: any) {
				if (err) {
					return console.log(err);
				}
				console.log("Credentials have been saved!");
			});
		
			return session;
		});
	}else{
		vscode.window.showErrorMessage("You need to provide a valid username and password");
	}
}

function getWebviewContent(url: string, session: string){
	return new Promise(function(resolve, reject){
		const options = {
			url: url,
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
	
		request.get(options, function (err: any, httpResponse: any, body: string) {
			resolve(body);
		})
	});
}