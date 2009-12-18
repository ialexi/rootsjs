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

Root.extend({
	"/": "ignore", // calls ignore function
	"/auth": MyApp.Auth.extend({ // MyApp.Auth is a resource, a seed, or a root
		
	}),
	"/echo": function(iq, path, message) {
		iq.update(this, path, message);
		this.send(this, "echoed", message); // sends to all listeners on path "echoed"
	},
	
	"/echoed": { // structure is interpreted as Roots.Resource automatically
		mayAttach: YES, //defaults to yes; this may also be a function.
		sendInitialData: function(iq, path){ // parameters from regexp are added in args, too.
			iq.send("data"); // sends directly.
			// or:
			// someDataBaseCall().callback(function(result){ iq.send(result) });
		},
		
		receiveData: function(iq, path) {
			if (iq.trusted || iq.authenticated) { 
				// handshaking between iq spawner and this root set trusted
				// or, it can be authenticated
				
				// database stuff handled here
				
				this.seed(this, "echoed", message); // seed goes to the nearest
				// seed (Roots are Seeds) and sends a message from there.
				// so, this does updates
			}
		}
	}
});

// Resource is a specific thing which may be attached to. It is a subclass of Seed.
// Root is a Root Seed—really used primarily as a reference point (so resources or seeds
// can call root() and such).
// Seed is the basic unit.

// if you have a SC model set up, here's what you should need to do:
Root.extend({
	// requiresAuth simply checks if the user _is_ authenticated.
	// for more, you'd have to use permission-stuff, which takes more code.
	// the default way, though, is still super-easy: permissionSet: "contact"
	// it is when you need more control that things get interesting.
	
	// attachments do the "right thing" when it comes to auth; they won't connect the
	// user until they have been verified, but they queue the request and check for
	// authention. Basically, they check iq.authenticated, and if it is false, they
	// send the "authenticated" signal to check; they will get back either a yes or now,
	// and process the queue appropriately. If the user authenticates within a certain time
	// period (the timeout of the queue), the attachments will be made and initial data sent.
	
	// all perfectly async.
	"/contacts": Roots.ModelResource({ model: Contact, requiresAuth: YES }),
	"/groups": Roots.ModelResource({ model: Group, requiresAuth: YES }),
	"/auth": Roots.SimpleAuth({ model: User }), // could instead have auth that checks other servers.
	
	dataSource: Roots.DB.SomeDataSource() // document-based would "just work"
	// no table adding/removing, etc., even.
	// others may require syncing and such.
});

// realize that the amount of code on the server, in this case, is about 7 lines.
// the amount of code on the client in this case would likewise be about 7 lines:
My.DataSource = Pomona.RootsSource.extend({
	server: "/contacts/", // the path to the Firenze/Dudley server instance (for HTTP)
	models: {
		"/contacts": My.Contact,
		"/groups": My.Group
	}
});