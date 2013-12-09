EMCC_OPTS:=-O1 -s LINKABLE=1 -s ASM_JS=0
OGG_URL:="http://downloads.xiph.org/releases/ogg/libogg-1.3.1.tar.gz"
VORBIS_URL:="http://downloads.xiph.org/releases/vorbis/libvorbis-1.3.3.tar.gz"
CLOSCOMP_URL:=''
VORBIS:=libvorbis-1.3.3
OGG:=libogg-1.3.1

all: dist/libvorbis.min.js

dist/libvorbis.js: $(OGG) $(VORBIS) pre.js post.js
	emcc $(EMCC_OPTS) --pre-js pre.js --post-js post.js $(OGG)/install/lib/libogg.a $(VORBIS)/lib/.libs/libvorbis.a $(VORBIS)/lib/.libs/libvorbisenc.a -o $@

dist/libvorbis.min.js: dist/libvorbis.js closcomp
	java -jar closcomp/compiler.jar $< --language_in ECMASCRIPT5 --js_output_file $@

closcomp: closcomp.tar.gz
    mkdir $@ && \
    cd $@ && \
	tar xzvf ../$@.tar.gz
	
closcomp.tar.gz:
	test -e "$@" || wget -O closcomp.tar.gz https://closure-compiler.googlecode.com/files/compiler-20131014.tar.gz

$(VORBIS): $(VORBIS).tar.gz
	tar xzvf $@.tar.gz && \
	cd $@ && \
	echo sed -i "" '''s/as_fn_error $$? "Ogg >= 1.0/echo "Ogg >= 1.0/g''' && \
	sed -i "" 's/as_fn_error $$? "Ogg >= 1.0/echo "Ogg >= 1.0/g' configure && \
	sed -i "" "s/-O20/-O2/g" configure && \
	sed -i "" "s/-O4/-O3/g" configure && \
	emconfigure ./configure --build=x86_64 --disable-oggtest --with-ogg-includes=`pwd`/../$(OGG)/install/include/ --with-ogg-libraries=`pwd`/../$(OGG)/install/lib/ && \
	emmake make
	
$(OGG): $(OGG).tar.gz
	tar xzvf $@.tar.gz && \
	cd $@ && \
	sed -i "" "s/-O20/-O2/g" configure && \
	sed -i "" "s/-O4/-O3/g" configure && \
	emconfigure ./configure --prefix=`pwd`/install && \
	emmake make && \
	emmake make install

$(OGG).tar.gz:
	test -e "$@" || wget $(OGG_URL)

$(VORBIS).tar.gz:
	test -e "$@" || wget $(VORBIS_URL)

clean:
	$(RM) -rf $(VORBIS) $(OGG)

distclean: clean
	$(RM) $(VORBIS).tar.gz $(OGG).tar.gz

