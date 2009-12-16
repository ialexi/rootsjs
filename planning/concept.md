This is all a crazy idea. Don't get all excited. Consider it me playing around,
but if you find it interesting, tell me, and maybe it will go somewhere.

Signals
-------
Dobby and Roots are based around the concept of signals. Almost all interaction
between pieces are passed through signals—from checking authentication to
subscribing users to channels to anything else in between.

So, how does this work, really? Almost every object in Dobby (the standalone Comet
server) and Roots (the primarily but not exclusively SproutCore-intended framework
built on top of Dobby) follow the following API: {
	update: function(sender, path, message)
}

Where sender is some object deemed "responsible" for the message (if any), "path"
is what kind of message was sent, and "message" is the contents of the message.

Each of the objects that follow this paradigm are called a Thestral.

For example, one Thestral (named Dolores) keeps track of all other Thestrals and
gives them ids. These ids are necessary so that the Thestrals can be tracked by
other portions—for instance, by Pig, which maps paths to Thestrals (for instance,
to subscribe Thestral instances to events).

How do you tell Pig to connect (subscribe) a Thestral to a path? You send a message:
	my_pig.update(this, "::connect", thethestral.id + "->" + "the/path");

The major benefit is that this works across servers, too (you could quite easily
pipe one part of Dobby on one server into another part of Dobby on another server,
making scaling quite possible).

To truly understand what the signaling looks like, read Dobby's source code. It
is really short and sweet (just like its namesake).


Roots
-----
Roots takes the concept of signaling a step further. It replaces the concept of
URIs and URLs with stream URIs, tentatively formed like this:
	a/resource/identifier@www.example.com/some/service

In Roots, signals are used to attach clients to streams. When a client attempts
to connect to the above stream URI, for instance, it may do the following:
- Connect to the Dobby server at www.example.com/some/service
- send signal ::attach with message a/resource/identifier

Roots receives this attach signal, and treats it specially.

Roots sends and handles two types of signals:
- Command signals
- Update signals

Commands signals deal with stream URIs; Update signals are sent _over_ those same
URIs. For instance, a command signal may attach a client to a stream, and then,
over that stream, updates will be sent.


Seeds
----------
Handling all the signals by hand would be too tasking in most situations, so
roots handles them for you. The only direct signals you set up are for commands.


You set up other signals by defining resources. For example, an authentication module
might be implemented something like this (if it were being written from scratch and not
inheriting from Roots.Auth):
	{
		signals: [
			["^authenticate/([0-9]+)$", "authenticate"],
			["^deauthenticate/([0-9]+)$", "deauthenticate"] // allows regexp
			
			// as we were saying about implicit signals:
			// ["^authenticated/::attach$", "_attach_authenticated"],
			// ["^authenticated/([0-9]+)$", "received_authenticated"]
		],
		resources: [ // handled by ::attach signal
			["^authenticated/([0-9]+)$", "authenticated", "receive_authenticated"]
		],
		
		seed: [ // explicit proxying to another seed (very common practice)
			["^a/pattern/(.*)", "a_seed"]
		],
		
		a_seed: My.Seed.extend({  }),
		
		// authenticated: called on first connect. subsequent updates sent whenever.
		authenticated: function(iq, path, message, user_id) { // note how the regexp pattern gets inserted here
			if (iq.authenticated) {
				iq.update({thestralId: iq.id, authenticated:true}); // iq.update sends update directly to client.
			}
			iq.connect("authenticated");
		},
		
		// authenticate _comes from_ the sender
		authenticate: function(iq, path, message, user_id) {
			if (message.password = "my_secret" && user_id == 12) iq.authenticated = true;
			this.seed?(path); // we want to let EVERYONE who is listening to this know.
			// but what should the function name be?
		},
		
		// can receive from other servers, for instance
		receive_authenticated: function(iq, path, message) {
			// what is iq here? it is the sender of the signal
			if (iq.trusted) { // something special I should go into more later
				// note that this updates both logged in AND logged out
				this.iqFor(message.thestralId).authenticated = message.authenticated;
				this.seed(path, message);
			}
		}
	}

iq
-----
Note "iq" in the above example. It stands for Inquisitor.

Inquisitors are special objects created by Roots seeds which represent the
requestor for a resource or the sender of a command; in general, they are a
per-seed wrapper for a Thestral, and are stored in a map in the seed instance
between Thestral ids and iq instances.

iqs define a few basic commands, mostly to connect and disconnect the Thestrals to paths handled
by the Seed and to update the Thestral directly.

The Seeds themselves are a bit like Pig, in that they have built-in functionality
to connect Thestrals to paths. They can then send to all listeners using the function
seed().

Roots
-----
If they need to actually reach a specific other type of seed—one that isn't listening—they probably
need to relay the signal they want to send (or attach request they wish to send) through the most
recent Application Root. For instance, if the "contacts/groups" resource wanted to check if a user was
authenticated, it should send a resource to the "contacts/authentication/authenticated" signal. 
Only issue: contacts does not know it is named "contacts." It really needs a relative path.

So, the base "contacts" signal handler is not a normal Seed, but a special kind called a Root.
By calling this.root(), you can send a signal directly to the next root object up. So,
in our example, "groups" would roughly call 
	this.root("authenticated/authentication/authenticated/::connect")

It wouldn't be exactly like that, of course—attaching to other seeds is handled in a different
to-be-decided manner.


JSON Model Protocol
-------------------
The JSON model protocol is meant to standardize how data is sent across the wire so
it can be interpreted easily. Even when using Roots, it is not necessary to follow this protocol.

There will inevitably be extensions to this protocol, but the basics are:
- You send raw JSON structures to either a) add new items or b) update existing items.
- You send an empty JSON structure with just ID and key DELETE=true to delete.

Other thoughts: perhaps it would be nice to have a guideline for how to send arrays that need
to be fetched from the server and such.

Benefits: because you are only listening to objects come across, there is no challenge to making
the interface load data as it becomes available (for instance, if the data is on another server).

You could connect to your server at tweets@my.example.com/my/twitter/thing, and it would connect
to Twitter. You could connect to a thousand different ones of these, and it could take ten minutes
to respond to them all, but it would be able to do them all asynchronously because it would not be
making one thousand separate but simultaneous HTTP requests (the only HTTP requests would be
epiphenomenons, created as a side effect, not as the actual goal). If request 500 returns before
request 330? Not a problem, because the server is doing all of the requests and can return the
data as needed, in pieces.

I think there is also some potential for some serious map/reduce voodoo here (why have the
database layer do it, as is getting popular? Why not make the app layer do it, and do it
both on the client _and_ the server? If all the code is JavaScript, you don't even have
to rewrite anything.)

Compatibility
-------------
It should be easy to write Roots apps that merely act as a go-between for an existing back-end
and the client. It should also be possible to skip Roots completely in this process (using
Dobby as a pure Comet server). And it should be possible, of course, to mix and match at will.

It would be really neat if you could use some specific Seed or Root to relay to another back-end
like a Ruby back-end or a Django back-end. These would just supply their own HTTP API, and
would push updates to Roots while Roots calls GET and POST and such for updates. I am unsure
how this would work, though; would it simply send messages through these GET and POST? Would it
translate to a more traditional REST-based architecture?

Pomona
-------
Pomona will have a few things:
- The basic connect-to-Dobby interface
- The more interesting connect-to-Roots interface (has attach handlers)
- The even more interesting DataSource generator
  Gist: you tell it the models it will receive and send on what attach path. That's it.
  As long as the JSON protocol for that works, you are in business.


