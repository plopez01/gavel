import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import { getLoginInfo, getWebviewContent } from './net';
let _SESSION : string;

export function activate(context: vscode.ExtensionContext) {
	let webViewPanel;
	context.subscriptions.push(
		vscode.commands.registerCommand('gavel.start', async () => {

			_SESSION = await getLoginInfo();

			vscode.window.showInformationMessage("Logged in! Welcome to the courtroom.");

			// Create and show panel
			webViewPanel = vscode.window.createWebviewPanel(
				'dashboard',
				'Dashboard',
				vscode.ViewColumn.Two,
				{}
			);


			let dashboardRaw = await getWebviewContent('https://jutge.org/dashboard', _SESSION);
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
					<strong><h1>Welcome to the trial "${username}" ;)</h1></strong>
					<hr class="solid"><br>
					<p1>Accepted problems: ${acceptedProblems}</p1><br>
					<p1>Rejected problems: ${rejectedProblems}</p1><br>
					<p1>Submitted problems: ${submissions}</p1><br>
					<p1>Judge level: ${judgeLevel}</p1>
					<br>
					<br>
					<p2>Excuse ugly html :></p2>
				</body>
			</html>`;

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
			let problemRaw = await getWebviewContent(`https://jutge.org/problems/${problemId}`, _SESSION);
			let problemTitle = problemRaw.split(`<a style='color: inherit;' title='Problems' href='/problems'><i class='fa fa-fw fa-puzzle-piece'></i></a>`)[1].split('\n')[1].replace(/\s+/, "");;
			let problemStatus = problemRaw.split(`<div class='col-sm-6'>\n                \n        <div class='panel panel-default'>\n            <div class='panel-heading'>\n                `)[1].split('\n')[0];
			let problemSummary = problemRaw.split(`<P>`)[1].split('</P>')[0];
			let expectedInput = problemRaw.split(`<P>`)[3].split('</P>')[0];
			let expectedOutput = problemRaw.split(`<P>`)[5].split('</P>')[0];
		

			let html = `<!DOCTYPE html>
			<html>
				<header>
					<style>
						hr.solid {
							border-top: 3px solid #bbb;
						}
						p1 {
							font-size: medium;
						}
						td, th {
							border: 1px solid #555555;
							text-align: left;
							padding: 8px;
						}
						tr:nth-child(even) {
							background-color: #555555;
						}
					</style>
				</header>
				<body>
					<strong><h1>${problemTitle} - ${problemStatus}</h1></strong>
					<hr class="solid"><br>
					<p1>${problemSummary}</p1><br>
					<h3>Expected Input</h3>
					<p1>${expectedInput}</p1>
					<h3>Expected Output</h3>
					<p1>${expectedOutput}</p1>
					<h2>Public test case</h2>
					<table>
					<tr>
						<th>Input</th>
						<th>Output</th>
					</tr>
					`;
			
			for(let i = 1; true; i+= 2){
				let inVal = problemRaw.split(`<pre class='scrollable returnsymbol'>`)[i];
				let outVal = problemRaw.split(`<pre class='scrollable returnsymbol'>`)[i+1];
				if(!inVal || !outVal) break;
				html += `<tr><td>${inVal.split('</pre>')[0]}</td><td>${outVal.split('</pre>')[0]}</td></tr>`;
				if(i % 2) i+=2;
			}

			html += `</body></html>`;

			webViewPanel.webview.html = html;

			console.log(problemTitle);
			fs.writeFile(`${os.homedir()}/problem.html`, problemRaw, function (err: any) {
				if (err) {
					console.log(err);
				}
				console.log("Credentials have been removed!");
			});
		})
	);
}