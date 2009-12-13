// Pig needs an object like Dolores that implements getThestralById;
// it should return an object with an update(sender, path, message)
// member function (such objects are called Thestrals).
/*globals exports*/
if (!exports) exports = {};
var Pomona = exports;

exports.Pig = function(dolores) {
	this.dolores = dolores;
	this.paths = {}; // path->Thestrals
	this.listeners = {}; // thestral ids->paths
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
		if (path == "::connect") this._connect(connectPath, id, thestral, "update");
		
		// or, disconnect
		else this.disconnect(connectPath, id);
		
		// don't stop; we should still relay the instruction to any listening.
	} else if (path == "::gone") {
		this.gone(message);
	}
	
	// make sure the path is being listened to
	var paths = this.paths[path];
	if (!paths) return;
	
	// update all
	var idx, len = paths.length;
	for (idx = 0; idx < len; idx++) {
		paths[idx].update(self, path, message);
	}
};

/**
	Maps a path to a target and method using a specified hash.
	This is implemented separately from connect because the ::connect
	signal listener should create a hash based on Thestral id rather
	than a guid for the object.
*/
exports.Pig.prototype._connect = function(path, hash, target, method) {
	
};

exports.Pig.prototype._disconnect(path, hash) {
	
};

exports.Pig.prototype.connect = function(id, thestral, path) {
	// make sure the list exists
	if (!this.paths[path]) this.paths[path] = [];
	
	// make sure the listener's list exists
	if (!this.listeners[id]) this.listeners[id] = [];
	
	// add both to both
	this.paths[id].push(thestral);
	this.listeners[id].push(path);
};

exports.Pig.prototype.disconnect = function(id, thestral, path) {
	
};
