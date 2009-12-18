Roots
=====
Roots is a crazy idea I'm having for a server-side possibly SproutCore-based
web framework.

It abandons the traditional concept of "HTTP" and "Comet"; they are only ends
to a means. Instead, it defines a generic interface which can be used over
many different protocols (HTTP and Comet protocols included).

Ingredients
-----------
Roots is based around signals.


Scaling Concepts
================
Roots should be made to work across many servers for scaling.

Assume a CouchDB back-end; here's how it may work:

Each server has a CouchDB instance. For backup purposes, some servers replicate others.
Servers that replicate each other are called a Node—they should be recognized as one
server—they merely have multiple machines.

When data is added to the store, a node is picked to store it on.
This selection process could happen through simple hardware load balancing,
but a statistical process (which has least data) might be wiser.

The complete ids for records in Roots are two-part: id @ node (the actual storage
of these ids, however, can be as one string, as two integers (the second a reference
to a server id), or many other things).

There are too many ways for this to work. One way involves queries being treated as
special resources that, when you access them, are relayed across all "Data Server"
instances. They'd receive targeted updates and all of that jazz; only problem is that
you _must_ make sure these queries are cleaned up.