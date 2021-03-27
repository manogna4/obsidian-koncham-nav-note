import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';

const plugin_name = 'koncham-nav-note'

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('loading plugin [' + plugin_name + ']');

		this.addCommand({
			id: 'goto-sibling-prev',
			name: 'goto sibling: previous',
			callback: () => this.gotoSibling(-1),
		});

		this.addCommand({
			id: 'goto-sibling-next',
			name: 'goto sibling: next',
			callback: () => this.gotoSibling(1),
		});

		this.addCommand({
			id: 'show-tokens',
			name: 'show tokens',
			callback: () => this.showTokens(),
		});

		this.addCommand({
			id: 'goto-block-prev',
			name: 'goto block: prev',
			callback: () => this.gotoBlockPrev(),
			// callback: () => this.gotoBlock(-1),
		});

		this.addCommand({
			id: 'goto-block-next',
			name: 'goto block: next',
			callback: () => this.gotoBlock(1),
		});
	}

	showTokens(){
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let cursorHead = cm.getCursor();
			let var_token_base = cm.getTokenTypeAt(cursorHead);
			new Notice(var_token_base);
			console.log(var_token_base);
		}
	}


	// gotoBlock is configured only for [n_item = +1 or -1]
	// it may be extended later
	gotoBlock(n_item:number) {
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let cursorHead = cm.getCursor();
			let line_base = cursorHead.line;
			let line_limit = this.getLineLimit(n_item);
			let result = false;
			// checking
			let is_blank;
			if (cm.getTokenTypeAt(cursorHead) === undefined) {is_blank = true} else {is_blank = false}
			if (n_item>0){cursorHead.line+=1;}else{cursorHead.line-=1;}
			console.log('start')
			while (!result && this.gotoCheckLimit(cursorHead.line, n_item, line_limit)) {
				let token = cm.getTokenTypeAt(cursorHead)
				if (is_blank == true && token !== undefined) {
					result = true;
				} else if (cursorHead.line == line_limit+1) {
					result = true;
				} else if (token === undefined){
					is_blank = true;
					cursorHead.line += n_item;
				} else {
					is_blank = false;
					cursorHead.line += n_item;
				}
				// console.log(cursorHead.line, line_limit)
			}
			if (result){
				cm.setCursor(cursorHead);
			} else {
				new Notice(plugin_name + ': not found');
				cursorHead.line = line_base;
			}
		}
	}

	gotoBlockPrev(){
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let cursorHead = cm.getCursor();
			let line_base = cursorHead.line;
			let line_limit = cm.firstLine();
			let result = false;
			cursorHead.line -= 1
			while (!result && cursorHead.line >= line_limit){
				let token1 = cm.getTokenTypeAt(cursorHead)
				cursorHead.line -= 1
				let token2 = cm.getTokenTypeAt(cursorHead)
				console.log(token1, token2);
				if (token1 !== undefined && token2 === undefined){
					result = true;
				} else if (cursorHead.line < line_limit) {
					result = true;
				}
			}
			if (result) {
				cursorHead.line += 1
				cm.setCursor(cursorHead);
			} else {
				new Notice(plugin_name + ': not found');
				cursorHead.line = line_base;
			}
		}
	}

	// gotoSibling is configured only for [n_item = +1 or -1]
	// it may be extended later
	gotoSibling(n_item:number){
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let line_limit
			if (n_item > 0){line_limit = cm.lastLine();} else {line_limit = cm.firstLine();};
			let cursorHead = cm.getCursor();
			let var_token_base = cm.getTokenTypeAt(cursorHead);
			let line_base = cursorHead.line;
			let var_token
			while (var_token != var_token_base
				&& this.gotoCheckLimit(cursorHead.line, n_item, line_limit)) {
				cursorHead.line += n_item;
				var_token = cm.getTokenTypeAt(cursorHead);
			}
			if (var_token == var_token_base) {
				cm.setCursor(cursorHead);
			} else {
				new Notice(plugin_name + ': not found');
				cursorHead.line = line_base;
			}
		}
	}

	// gotoCheckLimit is configured only for [n_item = +1 or -1]
	// it may be extended later
	gotoCheckLimit(current_line:number, n_item:number, line_limit:number){
		if (n_item > 0 && current_line < line_limit){
			return true;
		} else if (n_item < 0 && current_line > line_limit) {
			return true;
		} else {
			return false;
		}
	}

	// gotoCheckLimit is configured only for [n_item = +1 or -1]
	// it may be extended later
	getLineLimit(n_item:number){
		const view = this.app.workspace.activeLeaf.view;
		let line_limit
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			if (n_item > 0) {
				line_limit = cm.lastLine()
			} else {
				line_limit = cm.firstLine()
			}
		}
		return line_limit;
	}

	onunload() {
		console.log('unloading plugin [' + plugin_name + ']');
	}

}