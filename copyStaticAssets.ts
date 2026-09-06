import * as shell from "shelljs";
shell.cp("-R", "src/public/bower_components", "build/public/");
shell.cp("-R", "src/public/dist", "build/public/");
shell.cp("-R", "src/public/plugins", "build/public/");
shell.cp("-R", "src/public/img", "build/public/");
shell.cp("-R", "src/public/css", "build/public/");
shell.cp("-R", "src/public/js", "build/public/");

// Ensure Font Awesome package is available under plugins so views can
// load `/plugins/fontawesome-free/css/all.min.css` without returning HTML.
try {
	shell.mkdir("-p", "build/public/plugins");
	shell.cp("-R", "node_modules/@fortawesome/fontawesome-free", "build/public/plugins/");
} catch (err) {
	// Non-fatal: copying assets may fail on systems without node_modules present.
	// Log to console so developers can notice during build.
	console.warn("Warning: failed to copy @fortawesome/fontawesome-free to build/public/plugins:", err && err.message ? err.message : err);
}
