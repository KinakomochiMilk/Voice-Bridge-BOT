const { Mixer } = require('audio-mixer');
const { PassThrough } = require('stream');

class UnionMixer {
    constructor() {

        this.inputs = new Map();

        this.outputMixers = new Map();
    }

    _getOrCreateOutputMixer(guildId) {
        if (!this.outputMixers.has(guildId)) {
            this.outputMixers.set(guildId, new Mixer({
                channels: 2,
                bitDepth: 16,
                sampleRate: 48000,
                clearInterval: 250
            }));
        }
        return this.outputMixers.get(guildId);
    }

    addInput(userId, stream, sourceGuildId) {
        if (this.inputs.has(userId)) {
            this.removeInput(userId);
        }

        console.log(`[Mixer] Adding input: ${userId.slice(-4)} (guild: ${sourceGuildId.slice(-4)})`);


        const mixerInputs = new Map();

        for (const [guildId, outputMixer] of this.outputMixers) {
            if (guildId === sourceGuildId) continue;
            const mixerInput = outputMixer.input({ volume: 100 });
            stream.pipe(mixerInput);
            mixerInputs.set(guildId, mixerInput);
        }

        this.inputs.set(userId, { sourceGuildId, stream, mixerInputs });
    }

    removeInput(userId) {
        if (!this.inputs.has(userId)) return;
        const { mixerInputs } = this.inputs.get(userId);

        for (const [guildId, mixerInput] of mixerInputs) {
            const outputMixer = this.outputMixers.get(guildId);
            if (outputMixer) outputMixer.removeInput(mixerInput);
            mixerInput.destroy?.();
        }

        this.inputs.delete(userId);
        console.log(`[Mixer] Removed input: ${userId.slice(-4)}`);
    }


    getStream(guildId) {
        const outputMixer = this._getOrCreateOutputMixer(guildId);
        const pt = new PassThrough();
        outputMixer.pipe(pt);
        console.log(`[Mixer] Stream created for guild: ${guildId.slice(-4)}`);
        return pt;
    }


    removeGuild(guildId) {
        if (this.outputMixers.has(guildId)) {
            this.outputMixers.delete(guildId);
            console.log(`[Mixer] Output mixer removed for guild: ${guildId.slice(-4)}`);
        }
    }
}

module.exports = UnionMixer;
