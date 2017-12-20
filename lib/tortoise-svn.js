'use babel';

let TortoiseSvn;
const { CompositeDisposablem } = require("atom");
const path = require("path");
const fs = require("fs");

const tortoiseSvn = function(args, cwd) {
	const {
		spawn
	} = require("child_process");
	const command = atom.config.get("scm-svn.tortoisePath") + "/TortoiseProc.exe";
	const options = {
		cwd
	};

	const tProc = spawn(command, args, options);

	tProc.stdout.on("data", data => console.log(`stdout: ${data}`));

	tProc.stderr.on("data", data => console.log(`stderr: ${data}`));

	return tProc.on("close", code => console.log(`child process exited with code ${code}`));
};

const resolveTreeSelection = function() {
	if (atom.packages.isPackageLoaded("tree-view")) {
		let treeView = atom.packages.getLoadedPackage("tree-view");
		({treeView} = treeView.mainModule);
		return treeView.selectedPath;
	}
};

const resolveTreeHead = function() {
	if (atom.packages.isPackageLoaded("tree-view")) {
		let treeView = atom.packages.getLoadedPackage("tree-view");
		({treeView} = treeView.mainModule);
		return treeView.list.querySelector('.header > span').getAttribute('data-path');
	}
};

const resolveEditorFile = function() {
	const editor = atom.workspace.getActivePaneItem();
	const file = editor != null ? editor.buffer.file : undefined;
	return (file != null ? file.path : undefined);
};

const blame = function(currFile) {
	let cwd;
	const stat = fs.statSync(currFile);
	const args = ["/command:blame"];
	if (stat.isFile()) {
		args.push(`/path:${path.basename(currFile)}`);
		cwd = path.dirname(currFile);
	} else {
		args.push("/path:.");
		cwd = currFile;
	}
	// there is a problem with TortoiseSVN 1.9+ and passing the -1 as the endrev value
	//     the -1 is interpreted as another paramater
	//     quoting works from the command line (i.e. /endrev:"-1")
	// args.push("/startrev:1", "/endrev:-1") if atom.config.get("tortoise-svn.tortoiseBlameAll")
	// console.log "invoking tortoisesvn with args=", args
	return tortoiseSvn(args, cwd);
};

const commit = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:commit", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:commit", "/path:."], currFile);
	}
};

const diff = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:diff", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:diff", "/path:."], currFile);
	}
};
//+
const log = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:log", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:log", "/path:."], currFile);
	}
};


const revert = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:revert", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:revert", "/path:."], currFile);
	}
};

const update = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:update", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:update", "/path:."], currFile);
	}
};

const tsvnswitch = function(currFile) {
	let target;
	const stat = fs.statSync(currFile);
	if (stat.isDirectory()) {
		target = currFile;
	} else {
		target = path.parse(currFile).dir;
	}

	return tortoiseSvn(["/command:switch", `/path:${target}`], target);
};

const add = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:add", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:add", "/path:."], currFile);
	}
};

const rename = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:rename", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:rename", "/path:."], currFile);
	}
};

const lock = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:lock", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:lock", "/path:."], currFile);
	}
};

const unlock = function(currFile) {
	const stat = fs.statSync(currFile);
	if (stat.isFile()) {
		return tortoiseSvn(["/command:unlock", `/path:${path.basename(currFile)}`], path.dirname(currFile));
	} else {
		return tortoiseSvn(["/command:unlock", "/path:."], currFile);
	}
};

const checkout = function(url, dir, userinfo) {
	const svn = require('node-svn-ultimate');
	atom.notifications.addInfo("체크아웃 중...");
	return svn.commands.checkout(url, dir, userinfo, function(err) {
		if (err === null) {
			atom.project.addPath(dir);
			return atom.notifications.addSuccess('Checkout complete');
		} else {
			return atom.notifications.addError(err);
		}
	});
};


module.exports = (TortoiseSvn = {
	config: {
		tortoisePath: {
			title: "Tortoise SVN bin path",
			description: "The folder containing TortoiseProc.exe",
			type: "string",
			default: "C:/Program Files/TortoiseSVN/bin"
		},
		tortoiseBlameAll: {
			title: "Blame all versions",
			description: "Default to looking at all versions in the file's history." +
				" Uncheck to allow version selection.",
			type: "boolean",
			default: true
		}
	},

	activate(state) {
		atom.commands.add("atom-workspace", {
			"tortoise-svn:blameFromTreeView": () => this.blameFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:blameFromEditor": () => this.blameFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:commitFromTreeView": () => this.commitFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:commitFromEditor": () => this.commitFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:diffFromTreeView": () => this.diffFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:diffFromEditor": () => this.diffFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:logFromTreeView": () => this.logFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:logFromEditor": () => this.logFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:revertFromTreeView": () => this.revertFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:revertFromEditor": () => this.revertFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:updateFromTreeView": () => this.updateFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:updateFromEditor": () => this.updateFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:switchFromTreeView": () => this.switchFromTreeView()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:addFromTreeView": () => this.addFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:addFromEditor": () => this.addFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:renameFromTreeView": () => this.renameFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:renameFromEditor": () => this.renameFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:lockFromTreeView": () => this.lockFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:lockFromEditor": () => this.lockFromEditor()
		});

		atom.commands.add("atom-workspace", {
			"tortoise-svn:unlockFromTreeView": () => this.unlockFromTreeView()
		});
		atom.commands.add("atom-workspace", {
			"tortoise-svn:unlockFromEditor": () => this.unlockFromEditor()
		});

		return atom.commands.add("atom-workspace", {
			"tortoise-svn:checkoutSVN": () => this.checkoutSVN()
		});
	},
	blameFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return blame(currFile);
		}
	},

	blameFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return blame(currFile);
		}
	},

	commitFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return commit(currFile);
		}
	},

	commitFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return commit(currFile);
		}
	},

	diffFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return diff(currFile);
		}
	},

	diffFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return diff(currFile);
		}
	},

	logFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return log(currFile);
		}
	},

	logFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return log(currFile);
		}
	},

	revertFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return revert(currFile);
		}
	},

	revertFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return revert(currFile);
		}
	},

	updateFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return update(currFile);
		}
	},

	updateFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return update(currFile);
		}
	},

	switchFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return tsvnswitch(currFile);
		}
	},

	addFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return add(currFile);
		}
	},

	addFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return add(currFile);
		}
	},

	renameFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return rename(currFile);
		}
	},

	renameFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return rename(currFile);
		}
	},

	lockFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return lock(currFile);
		}
	},

	lockFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return lock(currFile);
		}
	},

	unlockFromTreeView() {
		const currFile = resolveTreeSelection();
		if (currFile != null) {
			return unlock(currFile);
		}
	},

	unlockFromEditor() {
		const currFile = resolveEditorFile();
		if (currFile != null) {
			return unlock(currFile);
		}
	}
});