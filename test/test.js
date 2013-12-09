var fs = require('fs');
eval(fs.readFileSync('dist/libvorbis.js')+'');

function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase();
}

function hexDump(mem, offset, length) {
	var s = "";
	for(var i = offset; i < offset + length; i++) {
		var v = CModule.getValue(mem + i, CModule.i8);
		if (v < 0) {
			v += 256;
		}
		s += toHex(v);
	}
	return s;
}

function assertZero(a, message) {
	if (a != 0) {
		throw new Error("assert failed " + message + " " + a);
	}
}

var ret;
console.log("vorbis_version_string: " + Vorbis.vorbis_version_string());

var channels = 2;
var sample_rate = 44100;
var quality = 0.6;
// initialize a vi
// see http://www.xiph.org/vorbis/doc/libvorbis/vorbis_info.html
var vi = CModule._malloc(256);
Vorbis.vorbis_info_init(vi);
ret = Vorbis.vorbis_encode_init_vbr(vi, channels, sample_rate, quality);
assertZero(ret, "vorbis_encode_init_vbr failed");
console.log("\nvorbis_info");
console.log("version: " + CModule.getValue(vi, 'i32'));
console.log("channels: " + CModule.getValue(vi + 4, 'i32'));
console.log("rate: " + CModule.getValue(vi + 8, 'i32'));
console.log("bitrate_upper: " + CModule.getValue(vi + 12, 'i32'));
console.log("bitrate_nominal: " + CModule.getValue(vi + 16, 'i32'));
console.log("bitrate_lower: " + CModule.getValue(vi + 20, 'i32'));
console.log("bitrate_window: " + CModule.getValue(vi + 24, 'i32'));
console.log("codec_setup: " + CModule.getValue(vi + 28, '*'));
//console.log("Raw dump: " + hexDump(vi, 0, 256));

// create a comment
var vc = CModule._malloc(256);
Vorbis.vorbis_comment_init(vc);
Vorbis.vorbis_comment_add_tag(vc, "ENCODER", "libvorbis.js");
console.log("\nvorbis_comment");
console.log("Tag query count: " + Vorbis.vorbis_comment_query_count(vc, "ENCODER"));
console.log("Tag value: " + Vorbis.vorbis_comment_query(vc, "ENCODER", 0));

// create dsp state
var vd = CModule._malloc(256);
ret = Vorbis.vorbis_analysis_init(vd, vi);
assertZero(ret, "vorbis_analysis_init");

// create block
var vb = CModule._malloc(256);
ret = Vorbis.vorbis_block_init(vd, vb);
assertZero(ret, "vb_init");

// init stream
var os = CModule._malloc(256);
var serial = (Math.random() * 9999999).toFixed(0);
console.log("Using serial " + serial);
ret = Vorbis.ogg_stream_init(os, serial);
assertZero(ret, "ogg_stream_init");

// write headers
var header = CModule._malloc(256);
var header_comm = CModule._malloc(256);
var header_code = CModule._malloc(256);
ret = Vorbis.vorbis_analysis_headerout(vd, vc, header, header_comm, header_code);
assertZero(ret, "vorbis_analysis_header_out");
console.log("Raw: " + hexDump(header_comm, 0, 200));

// packetin
ret = Vorbis.ogg_stream_packetin(os, header);
assertZero(ret, "ogg_stream_packetin");
ret = Vorbis.ogg_stream_packetin(os, header_comm);
assertZero(ret, "ogg_stream_packetin");
ret = Vorbis.ogg_stream_packetin(os, header_code);
assertZero(ret, "ogg_stream_packetin");

var og = CModule._malloc(256);
var op = CModule._malloc(256);

// TODO: enable writing of data to file. For now, goes as hex to stdout
function flushOggPage(og) {
	var header = CModule.getValue(og, '*');
	var header_len = CModule.getValue(og + 4, 'i64');
	var body = CModule.getValue(og + 8, '*');
	var body_len = CModule.getValue(og + 12, 'i64');
	console.log();
	console.log("FLUSHED_OGG_PAGE:");
	console.log(hexDump(header, 0, header_len));
	console.log(hexDump(body, 0, body_len));
}

var eos = false;
while(!eos){
	var result = Vorbis.ogg_stream_flush(os, og);
	if(result == 0) {
		break;
	}
	flushOggPage(og);
}

var READ = 1024;
var readBuffer;
// TODO: put actual, interleaved float audio data here
var src = new Float32Array(READ * 50);
var spos = 0;
while(!eos){
    var samples = Math.min(READ, src.length - spos);
    var frames = 0;
    if (samples > 0) {
    	readBuffer = src.subarray(spos, spos + samples);
	    spos += samples;
	    console.log("Read " + samples + " samples");
	    frames = samples / channels;
    }

    if(frames == 0){
      /* end of file.  this can be done implicitly in the mainline,
         but it's easier to see here in non-clever fashion.
         Tell the library we're at end of stream so that it can handle
         the last frame and mark end of stream in the output properly */
        Vorbis.vorbis_analysis_wrote(vd, 0);

    }else{
      /* data to encode */

      /* expose the buffer to submit data */
      var buffer = Vorbis.vorbis_analysis_buffer(vd, READ);

      /* uninterleave samples */
      var j = 0;
      for(var i = 0; i < frames; i++){
      	  for(var ch = 0; ch < channels; ch++) {
	    	var buffer_channel = CModule.getValue(buffer + ch * 4, '*');
    	  	CModule.setValue(buffer_channel + i * 4, readBuffer[j++], 'float');
    	}
      }

      /* tell the library how much we actually submitted */
      Vorbis.vorbis_analysis_wrote(vd, i);
    }

    /* vorbis does some data preanalysis, then divvies up blocks for
       more involved (potentially parallel) processing.  Get a single
       block for encoding now */
    while(Vorbis.vorbis_analysis_blockout(vd, vb) == 1){

      /* analysis, assume we want to use bitrate management */
      Vorbis.vorbis_analysis(vb, null);
      Vorbis.vorbis_bitrate_addblock(vb);

      while(Vorbis.vorbis_bitrate_flushpacket(vd, op)){

        /* weld the packet into the bitstream */
        Vorbis.ogg_stream_packetin(os, op);

        /* write out pages (if any) */
        while(!eos){
			var result = Vorbis.ogg_stream_flush(os, og);
			if(result == 0) {
				break;
			}
			flushOggPage(og);

          /* this could be set above, but for illustrative purposes, I do
             it here (to show that vorbis does know where the stream ends) */
          if(Vorbis.ogg_page_eos(og)) {
          	  eos = true;
          }
        }
      }
    }
  }

// cleanup
CModule._free(og);
CModule._free(os);
CModule._free(header_comm);
CModule._free(header_code);
Vorbis.vorbis_comment_clear(vc);
CModule._free(vd);
CModule._free(vc);
CModule._free(vi);

console.log('Done');