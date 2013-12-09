// libogg and libvorbis function wrappers


CModule = Module;
return {
	ogg_stream_init: Module.cwrap('ogg_stream_init', 'number', ['number', 'number']),
	ogg_stream_destroy: Module.cwrap('ogg_stream_destroy', 'number', ['number']),
	ogg_stream_packetin: Module.cwrap('ogg_stream_packetin', 'number', ['number', 'number']),
	ogg_stream_pageout: Module.cwrap('ogg_stream_pageout', 'number', ['number', 'number']),
	
	vorbis_version_string: Module.cwrap('vorbis_version_string', 'string'),
	
	vorbis_info_init: Module.cwrap('vorbis_info_init', 'number', ['number']),
	vorbis_analysis_init: Module.cwrap('vorbis_analysis_init', 'number', ['number', 'number']),
	vorbis_analysis_headerout: Module.cwrap('vorbis_analysis_headerout', 'number', ['number', 'number', 'number', 'number', 'number']),
	vorbis_block_init: Module.cwrap('vorbis_block_init', 'number', ['number', 'number']),
	vorbis_analysis_buffer: Module.cwrap('vorbis_analysis_buffer', 'number', ['number', 'number']),
	vorbis_analysis_wrote: Module.cwrap('vorbis_analysis_wrote', 'number', ['number', 'number']),
	vorbis_analysis_blockout: Module.cwrap('vorbis_analysis_blockout', 'number', ['number', 'number']),
	vorbis_analysis: Module.cwrap('vorbis_analysis', 'number', ['number', 'number']),
	vorbis_bitrate_addblock: Module.cwrap('vorbis_bitrate_addblock', 'number', ['number']),
	vorbis_bitrate_flushpacket: Module.cwrap('vorbis_bitrate_flushpacket', 'number', ['number', 'number']),
	
	vorbis_encode_init_vbr: Module.cwrap('vorbis_encode_init_vbr', 'number', ['number', 'number', 'number']),
	
	
/*
 SAMPLE CODE FROM libmp3lame-js SHOWING HOW TO SHUFFLE DATA BETWEEN JS AND EMSCRIPTEN-COMPILED CODE

	encode_buffer_ieee_float: function(handle, channel_l, channel_r) {
		var outbuf = _malloc(BUFSIZE);
		var inbuf_l = _malloc(channel_l.length * 4);
		var inbuf_r = _malloc(channel_r.length * 4);
		for (var i=0;i<channel_l.length;i++) {
			setValue(inbuf_l + (i*4), channel_l[i], 'float');
		}
		for (var i=0;i<channel_r.length;i++) {
			setValue(inbuf_r + (i*4), channel_r[i], 'float');
		}
		var nread = Module.ccall('lame_encode_buffer_ieee_float', 'number', [ 'number', 'number', 'number', 'number', 'number', 'number' ], [ handle, inbuf_l, inbuf_r, channel_l.length, outbuf, BUFSIZE ]);
		var arraybuf = new ArrayBuffer(nread);
		var retdata = new Uint8Array(arraybuf);
		retdata.set(HEAPU8.subarray(outbuf, outbuf + nread));
		_free(outbuf);
		_free(inbuf_l);
		_free(inbuf_r);
		return { size: nread, data: retdata };
	},

	encode_flush: function(handle) {
		var outbuf = _malloc(BUFSIZE);
		var nread = Module.ccall('lame_encode_flush', 'number', [ 'number', 'number', 'number' ], [ handle, outbuf, BUFSIZE ]);
		var arraybuf = new ArrayBuffer(nread);
		var retdata = new Uint8Array(arraybuf);
		retdata.set(HEAPU8.subarray(outbuf, outbuf + nread));
		_free(outbuf);
		return { size: nread, data: retdata };
	},
	*/
};

})();

