import { App, Notice, Plugin, MarkdownView, FuzzySuggestModal } from 'obsidian';

const plugin_name = 'koncham-nav-note'

interface headingItem {
	title: string;
	name_full: string;
	level: number;
	line: number;
	start?: number;
}

export default class MyPlugin extends Plugin {

	onunload() {
		console.log('unloading plugin :' + plugin_name);
	}

	async onload() {
		console.log('loading plugin: ' + plugin_name);

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
			id: 'flash-line',
			name: 'flash line',
			callback: () => this.flashLine(),
		});

		this.addCommand({
			id: 'goto-block-prev',
			name: 'goto block: prev',
			callback: () => this.gotoBlockPrev(),
		});

		this.addCommand({
			id: 'goto-block-next',
			name: 'goto block: next',
			callback: () => this.gotoBlockNext(),
		});

		this.addCommand({
			id: 'goto-section-prev',
			name: 'goto section: prev',
			callback: () => this.gotoSection(-1),
		});

		this.addCommand({
			id: 'goto-section-next',
			name: 'goto section: next',
			callback: () => this.gotoSection(1),
		});
		
		this.addCommand({
			id: 'show-family',
			name: 'show family',
			callback: () => this.showFamily(),
		});

		this.addCommand({
			id: 'goto-cousin-next',
			name: 'goto cousin: next',
			callback: () => this.gotoCousin(1),
		});

		this.addCommand({
			id: 'goto-cousin-prev',
			name: 'goto cousin: prev',
			callback: () => this.gotoCousin(-1),
		});

		this.addCommand({
			id: 'log-headings',
			name: 'log headings',
			hotkeys: [{ "modifiers": [], "key": "F21" }],
			callback: () => this.getHeadingsNote(),
		});

		this.addCommand({
			id: 'switch-heading',
			name: 'Open Heading Switcher',
			hotkeys: [{ "modifiers": [], "key": "F22" }],
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new headingSwitchModal(this.app, this.getHeadingsNote()).open();
					}
					return true;
				}
				return false;
			}
		});
	}

	showFamily() {
		let family = this.getFamily();
		new Notice(family);
		console.log(family);
	}

	private getFamily() {
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let cursorHead = cm.getCursor();
			let var_token_base = cm.getTokenTypeAt(cursorHead);
			let family;
			if (var_token_base === undefined) {
				family = '--blank'
			} else if (var_token_base === null) {
				family = '--paragraph'
			} else if (var_token_base.includes('hashtag')) {
				family = 'hashtag'
			} else if (var_token_base.includes('header')) {
				family = 'header'
			} else if (var_token_base.includes('list')) {
				family = 'list'
			} else if (var_token_base.includes('quote')) {
				family = 'quote'
			} else {
				family = '--tbd'
			}
			return(family)
		}
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

	// flashes the current line to highlight
	flashLine() {
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let cursorLine = cm.getCursor().line;
			cm.addLineClass(cursorLine, "wrap", plugin_name + "-flash")
			setTimeout(() => {
				cm.removeLineClass(cursorLine, "wrap", plugin_name + "-flash")
			}, 100);
		}
	}

	// flashes the current line to highlight an error
	errorLine() {
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let cursorLine = cm.getCursor().line;
			cm.addLineClass(cursorLine, "wrap", plugin_name + "-error")
			setTimeout(() => {
				cm.removeLineClass(cursorLine, "wrap", plugin_name + "-error")
			}, 100);
		}
	}


	gotoBlockNext() {
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			cm.execCommand('goLineStartSmart');
			let cursorHead = cm.getCursor();
			let line_base = cursorHead.line;
			let line_limit = cm.lastLine();
			let result = false;
			let is_blank;
			if (cm.getTokenTypeAt(cursorHead) === undefined) {is_blank = true} else {is_blank = false}
			cursorHead.line+=1;
			while (!result && cursorHead.line <= line_limit) {
				let token = cm.getTokenTypeAt(cursorHead)
				if (is_blank == true && token !== undefined) {
					result = true;
				} else if (cursorHead.line == line_limit+1) {
					result = true;
				} else if (token === undefined){
					is_blank = true;
					cursorHead.line += 1;
				} else {
					is_blank = false;
					cursorHead.line += 1;
				}
			}
			if (result){
				cm.setCursor(cursorHead);
				this.flashLine();
			} else {
				cursorHead.line = line_base;
				this.errorLine();
			}
		}
	}

	gotoBlockPrev(){
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			cm.execCommand('goLineStartSmart');
			let cursorHead = cm.getCursor();
			let line_base = cursorHead.line;
			let line_limit = cm.firstLine();
			let result = false;
			cursorHead.line -= 1
			while (!result && cursorHead.line >= line_limit){
				let token1 = cm.getTokenTypeAt(cursorHead)
				cursorHead.line -= 1
				let token2 = cm.getTokenTypeAt(cursorHead)
				if (token1 !== undefined && token2 === undefined){
					result = true;
				} else if (cursorHead.line < line_limit) {
					result = true;
				}
			}
			if (result) {
				cursorHead.line += 1
				cm.setCursor(cursorHead);
				this.flashLine()
			} else {
				cursorHead.line = line_base;
				this.errorLine();
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
				this.flashLine();
			} else {
				cursorHead.line = line_base;
				this.errorLine();
			}
		}
	}

	// gotoCousin is configured only for [n_item = +1 or -1]
	// it may be extended later
	gotoCousin(n_item: number) {
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let line_limit
			if (n_item > 0) { line_limit = cm.lastLine(); } else { line_limit = cm.firstLine(); };
			let cursorHead = cm.getCursor();
			let family_base = this.getFamily()
			let line_base = cursorHead.line;
			let family
			while (family != family_base
				&& this.gotoCheckLimit(cursorHead.line, n_item, line_limit)) {
				cursorHead.line += n_item;
				family = this.getFamily()
			}
			if (family == family_base) {
				cm.setCursor(cursorHead);
				this.flashLine();
			} else {
				cursorHead.line = line_base;
				this.errorLine();
			}
		}
	}


	// gotoSection is configured only for [n_item = +1 or -1]
	// it may be extended later
	gotoSection(n_item: number) {
		const view = this.app.workspace.activeLeaf.view;
		if (view instanceof MarkdownView) {
			const cm = view.sourceMode.cmEditor;
			let cursorHead = cm.getCursor();
			let line_base = cursorHead.line;
			let line_limit
			if (n_item > 0) { line_limit = cm.lastLine(); } else { line_limit = cm.firstLine(); };
			let result = false;
			let var_token
			while (this.gotoCheckLimit(cursorHead.line, n_item, line_limit) && !result) {
				cursorHead.line += n_item;
				var_token = cm.getTokenTypeAt(cursorHead);
				if (var_token !== undefined && var_token !== null){
					if (var_token.includes('header')){
						result = true;
					}
				}
			}
			if (result) {
				cm.setCursor(cursorHead);
				this.flashLine();
			} else {
				cursorHead.line = line_base;
				this.errorLine();
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

	getHeadingsNote(){
		let file = this.app.workspace.getActiveFile();
		let file_cache = this.app.metadataCache.getFileCache(file);
		let heading_cache = file_cache.headings
		console.log(heading_cache)
		let heading_data_interface = []
		let heading_context: string[]
		heading_context = []
		for (const [key, value] of Object.entries(heading_cache)) {
			heading_context = process_heading(heading_context, value.level, value.heading)
			let name_full = heading_context.slice().reverse().join('  <  ')
			heading_data_interface.push({
				title: value.heading,
				level: value.level,
				name_full: name_full,
				line: value.position.start.line,
				start: value.position.start.col
			})

			function process_heading(heading_context: string[], level: number, title: string){
				heading_context[level-1] = title
				heading_context = heading_context.slice(0,level)
				return heading_context
			}
		}
		// console.log('final: ', heading_data_interface)
		return heading_data_interface
	}

}



class headingSwitchModal extends FuzzySuggestModal<headingItem> {
	app: App;
	items: headingItem[];

	constructor(app: App, items: headingItem[]) {
		super(app);
		this.app = app;
		this.items = items;
	}

	getItems(): headingItem[] {
		return this.items;
	}

	getItemText(item: headingItem): string {
		let level_indicator = "    "
		return item.level + 'HH' + level_indicator.repeat(item.level) + item.name_full;
	}

	onChooseItem(item: headingItem, evt: MouseEvent | KeyboardEvent): void {
		let view = this.app.workspace.activeLeaf.view
		// if (view instanceof MarkdownView) {
		// 	let editor = view.editor
		// 	editor.setSelection({ line: item.line, ch: item.start + 1 })
		// }
		console.log(item.name_full)
	}
}