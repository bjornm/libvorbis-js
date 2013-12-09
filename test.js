var fs = require('fs');
eval(fs.readFileSync('dist/libvorbis.js')+'');

console.log(Vorbis.vorbis_version_string());
var vorbis_info = CModule._malloc(4096);
Vorbis.vorbis_info_init(vorbis_info);
Vorbis.vorbis_encode_init_vbr(vorbis_info, 2, 44100, 0.6);
console.log("version: " + CModule.getValue(vorbis_info, CModule.i32));
console.log("channels: " + CModule.getValue(vorbis_info + 4, CModule.i32));
console.log("rate: " + CModule.getValue(vorbis_info + 8, CModule.i64));
console.log("br: " + CModule.getValue(vorbis_info + 16, CModule.i64));
console.log("br: " + CModule.getValue(vorbis_info + 24, CModule.i64));
console.log("br: " + CModule.getValue(vorbis_info + 32, CModule.i64));
console.log("br: " + CModule.getValue(vorbis_info + 40, CModule.i64));

