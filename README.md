libvorbis-js
============

Javascript ogg vorbis encoder.

Summary
-------

libvorbis-js is an Emscripten-based port of libogg and libvorbis from C to Javascript.
It makes it possible to encode audio data into ogg/vorbis format.

Current status (2013-12-09)
---------------------------

Compiles but no happy case written yet. Probably does not work yet but you can always
try to call the methods and see.

See post.js for a brief listing of the ported methods.

See test.js for a simple test which you can run using node js, e.g.

    make
    node test/test.js

TODO
----

 * Verify that the compilation works by calling some methods
 * Recreate a wav to vorbis encoding based on test/encoder_example.c
 * Create utility methods to make it easier to work with the library
 * Add missing methods to post.js if it makes sense
 * Make it go faster
 * Make it use TypedArrays, Blobs or other suitable HTML5 data types

Contributions are very welcome!


More info
---------

Please use issue tracker or contact information on the github page:

https://github.com/bjornm/libvorbis-js

