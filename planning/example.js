// an example Roots application API that will evolve as time goes on?
// first, rt-init Contacts generates:
/*
contacts/
	main.js	-- starts server
	core.js -- connects to apps with auto-app-loader (reload scripts automatically?)
	seeds/
		contacts/
			core.js -- defines sub-seeds
	client/ (normal sproutcore project)
		(normal sproutcore stuff here)
		frameworks/
			pomona/	-> handles all roots connectivity stuff
	build/ -- the build directory (includes a core.js that can be run at non-root levels)
	
the main.js and core.js are on a project level. Apps (or seeds) also have
core.js's.

The default core.js would look something like:
exports.seed = Roots.AutoSeed.extend({
	// AutoSeed constructor requires a path.
	// in essence, automatically creates "signal handlers" named for each seed.
});

main.js does require("core") and asks for "seed", which it creates with
.create(theFolderWithCoreInIt)

main.js adds the seed as a Thestral responding to a publicly-accessible
handler (such as the Firenze long-polling server with a Dudley receiver).
In this way, the seed can receive events, or signals, from the client.

main.js also starts sc-server, and possibly eventually has sc-server as
a JavaScript-based HTTP server component within itself.


*/
