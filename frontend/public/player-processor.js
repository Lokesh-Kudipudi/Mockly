class PCMPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.queueOffset = 0;
    this.ended = false;
    this.notified = false;

    this.port.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === "chunk") {
        const buffer = payload instanceof ArrayBuffer ? payload : payload.buffer;
        if (buffer) {
          this.queue.push(new Int16Array(buffer));
        }
      } else if (type === "end") {
        this.ended = true;
      } else if (type === "reset") {
        this.queue = [];
        this.queueOffset = 0;
        this.ended = false;
        this.notified = false;
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) {
      return true;
    }

    const channel = output[0];
    let offset = 0;

    while (offset < channel.length) {
      if (this.queue.length === 0) {
        channel.fill(0, offset);
        break;
      }

      const current = this.queue[0];
      const available = current.length - this.queueOffset;
      const toCopy = Math.min(available, channel.length - offset);

      for (let i = 0; i < toCopy; i += 1) {
        channel[offset + i] = current[this.queueOffset + i] / 32768;
      }

      this.queueOffset += toCopy;
      offset += toCopy;

      if (this.queueOffset >= current.length) {
        this.queue.shift();
        this.queueOffset = 0;
      }
    }

    if (this.ended && this.queue.length === 0 && !this.notified) {
      this.notified = true;
      this.port.postMessage({ type: "drained" });
    }

    return true;
  }
}

registerProcessor("pcm-player", PCMPlayerProcessor);
