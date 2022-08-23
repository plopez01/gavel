import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('gavel.start', async () => {

			console.log(await getLoginInfo());

			// Create and show panel
			const panel = vscode.window.createWebviewPanel(
				'catCoding',
				'Cat Coding',
				vscode.ViewColumn.One,
				{}
			);

			// And set its HTML content
			panel.webview.html = getWebviewContent();
		})
	);
}

async function getLoginInfo(){

	const fs = require('fs');

	try {
		const data = fs.readFileSync(`${os.homedir()}/judge.session`, 'utf8');
		let session = JSON.parse(data);
		if(session){
			return session; // If sesison already exists return
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

	console.log(username + " " + password);

	fs.writeFile(`${os.homedir()}/judge.session`, JSON.stringify({username, password}), function(err: any) {
		if(err) {
			return console.log(err);
		}
		console.log("The file was saved!");
	});

	return {username, password}
}

function getWebviewContent() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
</body>
</html>`;
}