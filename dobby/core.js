/*globals exports Dobby */
if (!exports) exports = {};
if (!Dobby) Dobby = exports;

Dobby.Dolores = function(settings) {
	// load settings
	if (!settings) settings = {};
	if (!settings.id) settings.id = "dolores-js";
	
	// self
	this.id = settings.id;
	
	// thestrals
	this.thestrals = {}; // the map of thestrals
	this.delegates = []; // the collection of thestrals to get all dolores updates.
	this._currentId = 0; // to increment
	
	// statuses
	this.thestralCount = 0;
	this.messagesSent = 0;
};

Dobby.Dolores.prototype = {
	update: function(sender, path, message) {
		var delegates = this.delegates, idx, len = delegates.length;
		for (idx = 0; idx < len; idx++) {
			// we don't want to be held accountable; we're just the messenger;
			// they shouldn't shoot us! So, send whoever sent the message to us as the sender.
			delegates[idx].update(sender, path, message);
		}
		this.messagesSent++;
	},
	
	/*
	  Thestral Management
	*/
	getNextId: function() {
		var id = this.id + "-"; // prefix id with our server name so it can't conflict with other servers.

		// generate random portion for security
		var characters = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";		
		for (var i = 0; i < 32; i++) {
			var r = Math.floor(Math.random() * characters.length);
			id += characters[r];
		}
		
		// and for extra collision-prevention safety (if a 2.27265788 * 10^57 isn't safe enough)
		// add an incrementing number
		id += (++this._currentId);
	},
	
	register: function(thestral) {
		// thestrals are dangerous and uncontrolled beasts! They must be registered with Dolores!
		thestral.id = this.getNextId();
		this.thestrals[thestral.id] = thestral;
		
		// send alert that we have connected a thestral
		this.thestralCount++;
		this.update(this, "::register", thestral.id);
		
		// and return the id
		return thestral.id;
	},
	
	getThestralById: function(id) {
		return this.thestrals[id]; // JavaScript will return undefined for us :)
	},
	
	unregister: function(id) {
		var thestral = this.thestrals[id];
		if (!thestral) return;
		
		delete this.thestrals[id];
		this.update(this, "::unregister", thestral.id);
	},
	
	/* Administrative */
	delegate: function(toWho) {
		this.delegates.push(toWho);
	}
};