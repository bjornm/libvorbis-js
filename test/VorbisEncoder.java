package com.soundtrap.util.vorbis;

import com.soundtrap.util.wav.WavFile;
import org.apache.log4j.Logger;
import org.xiph.libogg.ogg_packet;
import org.xiph.libogg.ogg_page;
import org.xiph.libogg.ogg_stream_state;
import org.xiph.libvorbis.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Based on the example code part of vorbis-java-1.0-beta source
 */
public class VorbisEncoder {
    private Logger m_logger = Logger.getLogger(getClass());

    private vorbisenc encoder;

    private ogg_stream_state os;    // take physical pages, weld into a logical stream of packets

    private ogg_page og;    // one SoundGen bitstream page.  Vorbis packets are inside
    private ogg_packet op;    // one raw packet of data for decode

    private vorbis_info vi;    // struct that stores all the static vorbis bitstream settings

    private vorbis_comment vc;    // struct that stores all the user comments

    private vorbis_dsp_state vd;    // central working state for the packet->PCM decoder
    private vorbis_block vb;    // local working space for packet->PCM decode

    private int READ = 1024;

    private int page_count = 0;
    private int block_count = 0;

    /**
     * Encodes a was into an ogg / vorbis
     * @param waveInputStream The wav input
     * @param oggOutputStream The ogg output
     * @param baseQuality Desired quality level from -0.1 to 1.0 (lo to hi).
     * @throws IOException
     */
    public void encode(InputStream waveInputStream, OutputStream oggOutputStream, double baseQuality) throws IOException {
        long startTime = System.currentTimeMillis();
        boolean eos = false;

        WavFile wavFile = WavFile.openWavFile(waveInputStream);
        final int origChannels = wavFile.getNumChannels();
        // TODO: fix mono support in libvorbis.
        final int numberOfChannels = 2;
        vi = new vorbis_info();

        encoder = new vorbisenc();

        if (!encoder.vorbis_encode_init_vbr(vi, numberOfChannels, (int)wavFile.getSampleRate(), (float)baseQuality)) {
            throw new RuntimeException("Failed to Initialize vorbisenc");
        }

        vc = new vorbis_comment();
        vc.vorbis_comment_add_tag("ENCODER", "Java Vorbis Encoder");

        vd = new vorbis_dsp_state();

        if (!vd.vorbis_analysis_init(vi)) {
            throw new RuntimeException("Failed to Initialize vorbis_dsp_state");
        }

        vb = new vorbis_block(vd);

        java.util.Random generator = new java.util.Random();  // need to randomize seed
        os = new ogg_stream_state(generator.nextInt(256));

        //m_logger.debug("Writing header.");
        ogg_packet header = new ogg_packet();
        ogg_packet header_comm = new ogg_packet();
        ogg_packet header_code = new ogg_packet();

        vd.vorbis_analysis_headerout(vc, header, header_comm, header_code);

        os.ogg_stream_packetin(header); // automatically placed in its own page
        os.ogg_stream_packetin(header_comm);
        os.ogg_stream_packetin(header_code);

        og = new ogg_page();
        op = new ogg_packet();

        long totalBytes = 0;
        while (!eos) {
            if (!os.ogg_stream_flush(og))
                break;

            oggOutputStream.write(og.header, 0, og.header_len);
            oggOutputStream.write(og.body, 0, og.body_len);
            //m_logger.debug(".");
        }
        //m_logger.debug("Done with header.");

        //m_logger.debug("Encoding.");
        int[][] readBuffer;
        readBuffer = new int[numberOfChannels][];
        for(int i = 0; i < numberOfChannels; i++) {
            readBuffer[i] = new int[READ];
        }
        while (!eos) {
            int i;
            int framesRead = wavFile.readFrames(readBuffer, READ);
            if (origChannels == 1) {
                // TODO: For now, upmixing mono to stereo. Should really handle mono natively
                System.arraycopy(readBuffer[0], 0, readBuffer[1], 0, READ);
            }
            totalBytes += framesRead * numberOfChannels * 2;

            int break_count = 0;

            if (framesRead == 0) {
                // end of file.  this can be done implicitly in the mainline,
                // but it's easier to see here in non-clever fashion.
                // Tell the library we're at end of stream so that it can handle
                // the last frame and mark end of stream in the output properly

                vd.vorbis_analysis_wrote(0);
            } else {
                // data to toHex

                // expose the buffer to submit data
                float[][] buffer = vd.vorbis_analysis_buffer(READ);

                // uninterleave samples
                for (i = 0; i < framesRead; i++) {
                    for(int c = 0; c < numberOfChannels; c++) {
                        buffer[c][vd.pcm_current + i] = readBuffer[c][i] / 32768.f;
                    }
//                    buffer[0][vd.pcm_current + i] = ((readbuffer[i * 4 + 1] << 8) | (0x00ff & (int) readbuffer[i * 4])) / 32768.f;
//                    buffer[1][vd.pcm_current + i] = ((readbuffer[i * 4 + 3] << 8) | (0x00ff & (int) readbuffer[i * 4 + 2])) / 32768.f;
                }

                // tell the library how much we actually submitted
                vd.vorbis_analysis_wrote(i);
            }

            // vorbis does some data preanalysis, then divvies up blocks for more involved
            // (potentially parallel) processing.  Get a single block for encoding now

            while (vb.vorbis_analysis_blockout(vd)) {
                // analysis, assume we want to use bitrate management
                vb.vorbis_analysis(null);
                vb.vorbis_bitrate_addblock();

                while (vd.vorbis_bitrate_flushpacket(op)) {

                    // weld the packet into the bitstream
                    os.ogg_stream_packetin(op);

                    // write out pages (if any)
                    while (!eos) {

                        if (!os.ogg_stream_pageout(og)) {
                            break_count++;
                            break;
                        }

                        oggOutputStream.write(og.header, 0, og.header_len);
                        oggOutputStream.write(og.body, 0, og.body_len);

                        // this could be set above, but for illustrative purposes, I do
                        // it here (to show that vorbis does know where the stream ends)
                        if (og.ogg_page_eos() > 0) {
                            eos = true;
                        }
                    }
                }
            }
            //m_logger.debug(".");
        }

        wavFile.close();
        oggOutputStream.flush();
        oggOutputStream.close();

        long duration = System.currentTimeMillis() - startTime;
        m_logger.debug("Encoded " + (totalBytes / 1024 / 1024) + " MB wav to ogg in " + (duration / 1000) + " s");
    }
}