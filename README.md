libvorbis-js
============

Javascript ogg vorbis encoder.

Summary
-------

libvorbis-js is an Emscripten-based port of libogg and libvorbis from C to Javascript.
It makes it possible to encode audio data into ogg/vorbis format.

Current status (2013-12-09)
---------------------------

Early alpha. The code compiles and is able to write ogg headers properly. Not fully functional except if low-level api use is okay.
Still needs glue code to make it easier to work with
e.g. AudioBuffers or at least Float32Arrays. 

See post.js for a brief listing of the ported methods.

See test.js for a simple test which you can run using node js, e.g.

    make
    node test/test.js

TODO
----

 * Recreate a wav to vorbis encoding based on test/encoder_example.c - in particular, make the audio writing loop work
 * Create utility methods to make it easier to work with the library - encode(AudioBuffer src, float quality) : Blob
 * Add missing methods to post.js if it makes sense
 * Make it go faster

Contributions are very welcome!


More info
---------

Please use issue tracker or contact information on the github page:

https://github.com/bjornm/libvorbis-js

