var owl = require("./dobby/owl"), dobby = require("./dobby/core"), sys = require("sys");

var dolores = new dobby.Dolores();
var pig = new owl.Pig(dolores);

// right now, just testing out Pig.
var responder = {
	"/my/path": function(){
		sys.print("/my/path\n");
	},
	"/my/path2": function(){
		sys.print("/my/path2\n");
	},
	"/my/path3": function(){
		sys.print("/my/path3\n");
	},
	
	update: function(sender, path, message){
		this[path]();
	}
};

dolores.delegate(pig);

sys.print("TEST\n");
//pig.connect("/my/path", responder, "/my/path");
var id = dolores.register(responder);
dolores.update(responder, "::connect", id + "->" + "/my/path3");
dolores.update(responder, "/my/path","Hi");
dolores.update(responder, "/my/path2","Hi");
dolores.update(responder, "/my/path","Hi");
dolores.update(responder, "/my/path3","Hi");

sys.print("DONE\n");