// processor.js
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 512;
    this.rmsSum = 0;
    this.rmsCount = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0]; // Mono audio

      for (let i = 0; i < channelData.length; i++) {
        let sample = channelData[i];
        sample = Math.max(-1, Math.min(1, sample));
        this.buffer.push(sample * 0x7fff); // Convert to int16 range
        this.rmsSum += sample * sample;
        this.rmsCount += 1;
      }

      if (this.buffer.length >= 512) {
        const chunk = new Int16Array(this.buffer.slice(0, 512));
        const rms =
          this.rmsCount > 0 ? Math.sqrt(this.rmsSum / this.rmsCount) : 0;
        this.port.postMessage(
          {
            type: "chunk",
            payload: chunk.buffer,
            rms,
          },
          [chunk.buffer],
        );
        this.buffer = this.buffer.slice(512); // Keep overflow if any
        this.rmsSum = 0;
        this.rmsCount = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
