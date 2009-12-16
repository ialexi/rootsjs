// Pig needs an object like Dolores that implements getThestralById;
// it should return an object with an update(sender, path, message)
// member function (such objects are called Thestrals).
/*globals exports*/
var sys = require("sys");
if (!exports) exports = {};
var Pomona = exports;

exports._curent_guid = 0; // everyone ++(this)'s, so it is really easy to check if(guid)

exports.Pig = function(dolores) {
	this.dolores = dolores;
	this.paths = {}; // paths["path"] = set; set = { first: null, set: {}, length: 0 };
	// set entry = { next: (another entry), previous: (another entry), target: target, action: action }
};

exports.Pig.prototype.update = function(sender, path, message) {
	if (path == "::connect" || path == "::disconnect") {
		var parts = message.split("->");
		
		// check validity of the statement.
		if (parts.length != 2) return;
		
		// extract id  + connection path
		var id = parts[0];
		var connectPath = parts[1];
		
		// get thestral by the id
		var thestral = this.dolores.getThestralById(id);
		
		// make sure we actually got something
		if (!thestral) return;
		
		// now, connect
		if (path == "::connect") this._connect(connectPath, ":thestral:" + id, thestral, "update");
		
		// or, disconnect
		else this._disconnect(connectPath, ":thestral:" + id);
		
		// don't stop; we should still relay the instruction to any listening.
	} else if (path == "::gone") {
		this.gone(message);
	}
	
	// make sure the path is being listened to
	var paths = this.paths[path];
	if (!paths) return;
	
	var item = paths.first;
	while (item) {
		if (typeof item.action == "string") {
			item.target[item.action].call(item.target, sender, path, message);
		} else {
			item.action.call(item.target, sender, path, message);
		}
		
		item = item.next;
	}
};

/**
	Maps a path to a target and method using a specified hash.
	This is implemented separately from connect because the ::connect
	signal listener should create a hash based on Thestral id rather
	than a guid for the object.
*/
exports.Pig.prototype._connect = function(path, hash, target, action) {
	// add the path to our registry if it doesn't exist
	if (!this.paths[path]) this.registerPath(path);
	
	// get the set
	var set = this.paths[path];
	
	// see if this entry is already in the set ; if so, return immediately
	if (set.set[hash]) return;
	
	// create a handle (set entry)
	var handle = { "target": target, "action": action, "previous": null, "next": set.first };
	
	// insert into set
	if (set.first) set.first.previous = handle;
	set.first = handle;
	set.length += 1;
	set.set[hash] = handle;
};

exports.Pig.prototype._disconnect = function(path, hash) {
	// if it is not a path, get rid of it.
	if (!this.paths[path]) return;
	
	// get set
	var set = this.paths[path];
	if (!set.set[hash]) return; // if it is't there, no need to remove!
	
	// get handle
	var handle = set.set[hash];
	
	// now, juggle!
	if (set.first === handle) set.first = handle.next; // first item, special case
	if (handle.previous) handle.previous.next = handle.next;
	if (handle.next) handle.next.previous = handle.previous;
	delete set.set[hash];
	
	// unregister if needed
	set.length -= 1;
	if (set.length <= 0) {
		this.unregisterPath(path);
	}
};

exports.Pig.prototype.registerPath = function(path) {
	if (this.paths[path]) throw "Path already exists!"; // this SHOULD never happen—but some insurance, please :)
	this.paths[path] = { first: null, set: {}, length: 0 };
};

exports.Pig.prototype.unregisterPath = function(path) {
	if (!this.paths[path]) throw "Path doesn't exist!"; // this SHOULD never happen...
	delete this.paths[path];
};

/**
connect: Connects a path to a target object+method combo. 

Behind the scenes, it creates a hash based on a guid for the target object and
either the method name (if it is a string), or a guid for the method. This allows quick
removal and addition of the connection.
*/
exports.Pig.prototype.connect = function(path, target, action) {
	// update guids if needed
	if (!target.__pig_guid) target.__pig_guid = "guid-" + (++(exports.Pig.__pig_guid));
	if (typeof action != "string" && !action.__pig_guid) action.__pig_guid = ++exports.Pig.__pig_guid;
	
	var hash = target.__pig_guid + "::" + (typeof action == "string" ? action : action.__pig_guid);
	this._connect(path, hash, target, action);
};

exports.Pig.prototype.disconnect = function(path, target, action) {
	if (!target.__pig_guid) return; // no guid, then it is not connected.
	if (typeof action != "string" && !action.__pig_guid) return; // same as above
	
	var hash = target.__pig_guid + "::" + (typeof action == "string" ? action : action.__pig_guid);
	this._disconnect(path, hash);
};
