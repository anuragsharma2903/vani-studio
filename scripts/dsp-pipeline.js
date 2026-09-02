/**
 * Vani Studio Pro - Content-Aware DSP Audio Processing Pipeline
 * Distinguishes between Speech (spoken philosophy) and Music (Kirtan/harmonium)
 * to apply optimal dynamic compression and spectral noise reduction.
 */

class AudioDSPPipeline {
  constructor() {
    this.speechProfile = {
      highpass: 75,
      lowpass: 8000,
      noiseReductionDb: 10,
      dynamicNormalize: true,
      bitrate: '24k',
      sampleRate: 22050,
      channels: 1
    };

    this.musicProfile = {
      highpass: 30,
      lowpass: 18000,
      noiseReductionDb: 4,
      dynamicNormalize: false,
      bitrate: '128k',
      sampleRate: 44100,
      channels: 2
    };
  }

  generateFFmpegArgs(inputPath, outputPath, profileType = 'speech') {
    const p = profileType === 'music' ? this.musicProfile : this.speechProfile;
    const filterChain = [
      `highpass=f=${p.highpass}`,
      `lowpass=f=${p.lowpass}`,
      `afftdn=nr=${p.noiseReductionDb}:nf=-25`,
      p.dynamicNormalize ? 'dynaudnorm=f=150:g=15' : 'loudnorm=I=-16:TP=-1.5:LRA=11'
    ].join(', ');

    return [
      '-i', inputPath,
      '-af', filterChain,
      '-b:a', p.bitrate,
      '-ar', p.sampleRate.toString(),
      '-ac', p.channels.toString(),
      '-y',
      outputPath
    ];
  }

  analyzeAudioProfile(durationSec, title) {
    if (/kirtan|bhajan|aarti|song|mangala/i.test(title)) {
      return 'music';
    }
    return 'speech';
  }
}

module.exports = { AudioDSPPipeline };

if (require.main === module) {
  const dsp = new AudioDSPPipeline();
  const args = dsp.generateFFmpegArgs('input.mp3', 'output_voice_hd.mp3', 'speech');
  console.log('Voice HD Filtergraph:\n', args.join(' '));
  const musicArgs = dsp.generateFFmpegArgs('kirtan.mp3', 'output_kirtan_hd.mp3', 'music');
  console.log('\nMusic / Kirtan Filtergraph:\n', musicArgs.join(' '));
}
