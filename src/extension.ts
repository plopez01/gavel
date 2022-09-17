import * as vscode from 'vscode';
import { _SESSION, loginCheck, getWebviewContent, sendFile } from './net';
import * as fs from 'fs';
import * as os from 'os';
let statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
let _PROBLEMPATH: string;
let _UPLOADTOKEN: string;
let _PROBLEMID: string;

export function activate(context: vscode.ExtensionContext) {
	let webViewPanel;
	context.subscriptions.push(
		vscode.commands.registerCommand('gavel.dashboard', async () => {

			await loginCheck();

			// Create and show panel
			webViewPanel = vscode.window.createWebviewPanel(
				'dashboard',
				'Dashboard',
				vscode.ViewColumn.Two,
				{}
			);


			let dashboardRaw = await getWebviewContent('https://jutge.org/dashboard');

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

			await loginCheck();

			const problemId = await vscode.window.showInputBox({
				ignoreFocusOut: true,
				placeHolder: "PXXXXX",
				prompt: "jutge.org's problem id",
			});

			if (!problemId) return vscode.window.showErrorMessage('You need to enter a valid problem ID');

			_PROBLEMID = problemId;

			// And set its HTML content
			let problemRaw = await getWebviewContent(`https://jutge.org/problems/${problemId}`);
			fs.writeFile(`${os.homedir()}/test.html`, problemRaw, function (err: any) {
				if (err) {
					console.log(err);
				}
				console.log("Credentials have been removed!");
			});
			
			try {
				let problemTitle = problemRaw.split(`<a style='color: inherit;' title='Problems' href='/problems'><i class='fa fa-fw fa-puzzle-piece'></i></a>`)[1].split('\n')[1].replace(/\s+/, "");;
				let problemStatus = problemRaw.split(`<div class='col-sm-6'>\n                \n        <div class='panel panel-default'>\n            <div class='panel-heading'>\n                `)[1].split('\n')[0];
				let problemSummary
				let expectedInput;
				let expectedOutput;

				// Solve inconsistent caps
				if(problemRaw.split(`<P>`)[1]){
					problemSummary = problemRaw.split(`<P>`)[1].split('</P>')[0];
					expectedInput = problemRaw.split(`<P>`)[3].split('</P>')[0];
					expectedOutput = problemRaw.split(`<P>`)[5].split('</P>')[0];
				}else{
					problemSummary = problemRaw.split(`<p>`)[1].split('</p>')[0];
					expectedInput = problemRaw.split(`<p>`)[3].split('</p>')[0];
					expectedOutput = problemRaw.split(`<p>`)[5].split('</p>')[0];
				}
				
				


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

				for (let i = 1; true; i += 2) {
					let inVal = problemRaw.split(`<pre class='scrollable returnsymbol'>`)[i];
					let outVal = problemRaw.split(`<pre class='scrollable returnsymbol'>`)[i + 1];
					if (!inVal || !outVal) break;
					html += `<tr><td>${inVal.split('</pre>')[0].replace('\n', '<br>')}</td><td>${outVal.split('</pre>')[0].replace('\n', '<br>')}</td></tr>`;
					if (i % 2) i += 2;
				}

				html += `</body></html>`;

				_PROBLEMPATH = problemRaw.split(`<form class='form-horizontal' action='`)[1].split("'")[0];
				_UPLOADTOKEN = problemRaw.split(`<input name='token_uid' type='hidden' value='`)[1].split(`' />`)[0];

				// Create and show panel
				webViewPanel = vscode.window.createWebviewPanel(
					problemId as string,
					problemId as string,
					vscode.ViewColumn.Two,
					{}
				);

				webViewPanel.webview.html = html;

				statusBar.command = 'gavel.problem';
				statusBar.text = `$(hubot) ${problemId}`;
				statusBar.show();
			} catch (e) {
				vscode.window.showErrorMessage("Problem code invalid, or you don't have access.");
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('gavel.submit', async () => {
			loginCheck();
			if (_PROBLEMPATH) {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor) {
					//For Getting File Path
					let filePath = activeEditor.document.uri.fsPath;

					sendFile(filePath, _PROBLEMPATH, _UPLOADTOKEN);

				} else {
					vscode.window.showErrorMessage("You don't have any editor active.");
				}
			} else {
				vscode.window.showErrorMessage("You haven't selected any problem.");
			}
		})
	);
}

export function submissonResult(submissionRaw: string){
	try {

		let problemTitle = submissionRaw.split(`<div class='panel-heading'>\n                `)[1].split('\n')[0];
		let veredict = submissionRaw.split(`title='<b>`)[1].split('<')[0];
		let compiler = submissionRaw.split(`title='<b>`)[2].split('<')[0];
		let veredictUrl = submissionRaw.split(`<img src = '`)[1].split(`'`)[0];

		// TODO: Maybe add a cleaner way to show analitycs
		let analytics = submissionRaw.split(`<table class='result-table'>`)[2].split(`</table>`)[0]


		// TODO: Add code metrics

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
					img {
						float: right;
					}
				</style>
			</header>
			<body>
				<strong><h1>${problemTitle} - ${_PROBLEMID}</h1></strong>
				<hr class="solid"><br>
				<p1>Veredict: ${veredict}</p1><br>
				<p1>Compiler: ${compiler}</p1><br>
				<img src=https://jutge.org${veredictUrl}><br>
				<table class='result-table'>
				${analytics}
			</body>
		</html>`;

		
		// Create and show panel
		let webViewPanel = vscode.window.createWebviewPanel(
			`${problemTitle} - ${_PROBLEMID}`,
			`${problemTitle} - ${_PROBLEMID}`,
			vscode.ViewColumn.Two,
			{}
		);

		webViewPanel.webview.html = html;
	} catch (e) {
		vscode.window.showErrorMessage("Problem code invalid, or you don't have access.");
	}
}
