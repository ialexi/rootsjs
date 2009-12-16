If you want to watch me develop Dobby and Roots on node.js, this is the place.
But I really mean watch. I have _nothing_ working yet.

THIS CODE IS ONLINE MERELY SO I CAN SHARE IT BETWEEN MY 2 COMPUTERS!!!


Some miscellaneous notes:
I think the server infrastructure for Comet will be Dobby. Dobby will not be
SproutCore specific, but will be a _part_ of Roots, which _will_ be SproutCore
specific.

Just a thought. I have to actually make Dobby/Roots in node.js first.


Individual Portions:
dobby/
	The Dobby files. While dobby.js, responsible for running Dobby OR Roots,
	is in the root, all of Dobby's specific source files are in their own directory.

roots/
	The Roots-specific files. No idea what this is, but I have some thoughts.


Roots
-----
Dobby is meant for push. You can use it with any server-side framework. Roots,
perhaps, can be its own server-side framework. If I do it right (not necessarily
likely) then pieces of roots will be usable even if you _do_ use some other
server-side framework.

This is all likely some crazy idea that will never actually work, so don't mind me!
These are just notes regarding said idea that will likely never work!
You have been warned!

First thoughts: 
Main concept:
Instead of thinking of URLs like the following:
/contacts
/groups
/contact/127
/group/3

As resources to be _fetched_, they are different paths to connect to. Connections are
long-lived, and as soon as you connect, all information associated with the path will
be sent to you; and, as more information becomes available (updates to information already
sent _or_ information that simply took awhile to fetch) it will be sent along as well.

Server mainly does three things:
a) Model
b) Authentication
c) Tasks

In Roots, everything is handled via signals, updates, pushes, whatever you want to
call them. Firenze has both incoming and outgoing HTTP connections (it uses a Dudley
instance for the incoming), and relays incoming messages _not_ to Dolores, but to 
Roots. Roots routes the messages to specific Roots applications.

A Roots application will handle signals, often relaying them to other roots applications.
For instance, an authentication application would handle authentication; a tasks app would
handle running tasks (in threads of via a queue or whatever); a model application would
both serve models and updates to them.

An example of how a model application may work:
	* You have a database (perhaps set up using a SproutCore model...)
	* Clients send signal ::attach with a path as its message
	  (no UID since they are sending it _directly_ to a Dudley that _knows_ their ID)
	* Roots model stores this request in a queue.
	* Roots model sends myapp/is_authenticated signal to authentication server w/ID
	  If they are on the same machine, this happens without going over IP, so is instant.
	  As in, it doesn't even touch networking code.
	* Roots model receives signal myapp/authenticated (with appropriate ID)
	* Roots processes all entires in the queue for that ID
	* Roots would likely cache authentication state and listen for updates on that state.

If this idea _does_ happen, I think there'd be some base classes for authentication, task running,
etc.

Also, one should be able to set up the server in minutes. An application in a couple more.
I just want to keep this idea in mind as I recreate Dobby; if anyone can help with server-side
SproutCore, that would be wonderful, too.

Scratch notes to myself, with many require-errors:

/* CAN I GET SPROUTCORE ON THE SERVER BECAUSE THAT WOULD BE COOL! */
// main.js

var Dolores = require("dobby").Dolores;
var Owl = require("dobby/owl");
var root = require("core").root; // the root responder

/* Your organizer */
var dolores = Dolores.create({
	delegate: "pig".w(),
	pig: Owl.Hedwig.create()
});

/* Your handler (you edit in core.js) */
var firenze = Firenze.create({
	host: "localhost",
	port: 8008,
	dolores: dolores,
	allowIncoming: YES,
	responder: root
});



// core.js
var Seed = require("roots").Seed;
var Contacts = require("contacts");
exports.Root = Seed.Create({ // seeds are root paths; like a root view, they
	// tell all their children who the root is.
	// a seed may contain a seed, but the child seed will not be able to talk
	// to the parent seed under most circumstances (in short, the child seed
	// will be a completely individual app, unable to access the parent's paths
	// implicitly).
	//
	// the implicit access is like this: Contacts.Contacts can ask for "authenticate";
	// that will call the seed and ask for its "authenticate"
	
	// names beginning with : are event names?
	":authenticate": Contacts.Authentication.create(),
	":contacts": Contacts.Contacts.create(),
	":groups": Contacts.Groups.create()
});

// contacts.js
exports.Authentication = require("./roots/authenticate").Authentication
exports.Contacts = require("./roots/contacts").Contacts;
exports.Groups = require("./roots/groups").Groups;

// contacts/authenticate.js
exports.Authentication = roots.Auth.extend({
	messagesAreJSON: YES, // this is default?
	
	// regular expression results sent as arguments...
	":authenticated/([a-zA-Z0-9\-_]+)": function(iq, path, message, theid){
		iq.connect(path); // iq is our own. The sender object, etc., must be
		// accessed via iq.sender, iq.id, etc., I suppose
		
		if (this.authenticated[theid]) this.seed("authenticated", path, true);
	},
	":authenticate": function(iq, path, message){
		// assuming it checks out
		if (message.username == "willow" && message.password == "xander") {
			this.seed("authenticated", path, true);
		}
	},
	":deauthenticate": function(){
		this.seed("authenticated", path, false); // for those who cache it, obviously.
	},
	
	"::force-authenticate": function(iq, path, message){
		if (!iq.secure) return;
	}
	
	// built-in: "::connect", etc.
});

// contacts/contacts.js
// vein? artery? Whatever it is called, it is a model transport.
exports.Contacts = roots.Vein.extend({
	model: require("models/contact").Contact,
	requiresAuthentication: YES,
	
	// these are default-ish?
	authenticatedPath: "authenticated",
	":": function(iq, path, message){
		if (iq.needsAuthentication) {
			// add request to client's queue
			iq.queue("auth", "", 30); // let that queue remain for up to 30 seconds...
			
			// we have to wait, but ...
			// really, should be relatively direct (especially if everything is on the same
			// server, because then it won't even have to leave)
			this.seed(this.authenticatedPath + "/" + iq.id);
			return;
		}
		
		iq.connect(""); // in our dispatch
		
		// not sure if this should work some other way;
		// would like to separate DB from model-server; should it be implemented
		// as message handler too? Might not be too tricky...
		
		// if this were distributed, we could probably dispatch this to a bunch of
		// db servers, and let them respond back whenever.
		var result = this.store.query(this.model);
		result.callback(function(result){
			// one way to do it (perhaps best way, perhaps not...)
			result.forEach(function(i){ iq.update("", i); });
		});
	},
	
	":authenticated/([a-zA-Z0-9\-_])": function(iq, path, message, theid){
		this.authenticated(theid, message);
	},
	
	authenticated: function(who, message){
		var iq = this.iq(who);
		if (message === true){
			iq.needsAuthentication = false;
			iq.processQueue("auth"); // handle queued entries
		}
	}
});



The thing about Roots objects is that they aren't dealing with receiving signals; they
are instead dealing with receiving attach signals. In this case, _sender_ takes on a special
meaning, and is named to Inquisitor, or iq for short. It is a special object that is OURS;
it has convenience functions like "connect" that really call "connect" on ourselves with 
it as an argument.

While Dobby is pure message-sending, and Pig and other owls are pure relay, these pieces each
keep their own associations separate from the pure relay. The pure relay keeps track of who gets
what message, and is good for generic server. Might it be higher performance to make each path
its own dispatcher? This allows tree-like structure. Also, since these are all, basically, dispatchers,
it still doesn't matter if parts are on different servers. If the :authenticated request came from
another server, the iq is, say, a Dudley instance connected to a Dudley on another server (or
something weird like that). The :authenticate message, etc., can be connected to other servers
individually as needed; or, I suppose, other servers could connect themselves if it was somehow allowed.

The problem with allowing it is that _anyone_ can usually send authenticator, etc., messages, as they are
part of the web-facing app. To get around that, there'd have to be some way to register the servers
separately. Possible, but I'm not sure how.

One way: each Roots object has two incoming tracks (at least): trusted and untrusted. They are called
Receivers (the root objects are called responders, and have at least two receivers). So, the responder
Authentication might have a secure-track "connect" instruction. 

secure is through ::? At least, that's the current dobby-esque way.


BLAH BLAH BLAH I AM WEIRD I KEEP TALKING NONSENSE HAH HAH SOB.