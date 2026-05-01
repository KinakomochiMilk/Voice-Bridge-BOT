const { 
    EndBehaviorType, 
    createAudioPlayer, 
    createAudioResource, 
    StreamType,
    AudioPlayerStatus,
    NoSubscriberBehavior
} = require('@discordjs/voice');
const prism = require('prism-media');

class VoiceHandler {
    static handleIncoming(connection, union) {
    const receiver = connection.receiver;
    const activeUsers = new Map();
    const guildId = connection.joinConfig.guildId;

    receiver.speaking.on('start', (userId) => {
        if (activeUsers.has(userId)) {
            const old = activeUsers.get(userId);
            old.opusStream.destroy();
            old.decoder.destroy();
            union.mixer.removeInput(userId);
            activeUsers.delete(userId);
        }

        const opusStream = receiver.subscribe(userId, {
            end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 }
        });

        const decoder = new prism.opus.Decoder({
            rate: 48000,
            channels: 2,
            frameSize: 960
        });

        opusStream.pipe(decoder);

        decoder.once('data', (chunk) => {
            console.log(`[PCM] Decoded for user ${userId.slice(-4)}: ${chunk.length} bytes`);
        });

        decoder.on('error', (err) => {
            console.warn(`[Decoder] Skipping bad frame (${userId.slice(-4)}): ${err.message}`);
        });


        union.mixer.addInput(userId, decoder, guildId);
        activeUsers.set(userId, { opusStream, decoder });

        opusStream.once('end', () => {
            console.log(`[VoiceHandler] Stream ended: ${userId.slice(-4)}`);
            union.mixer.removeInput(userId);
            decoder.destroy();
            activeUsers.delete(userId);
        });

        opusStream.once('error', (err) => {
            console.error(`[OpusStream Error] ${err.message}`);
            union.mixer.removeInput(userId);
            decoder.destroy();
            activeUsers.delete(userId);
        });
    });
}

static handleOutgoing(connection, union) {
    const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
    });
    const guildId = connection.joinConfig.guildId;

    connection.subscribe(player);

    const playResource = () => {

        const resource = createAudioResource(union.mixer.getStream(guildId), {
            inputType: StreamType.Raw,
        });

        resource.playStream.on('error', (err) => {
            console.error(`[Resource Error] ${err.message}`);
        });

        player.play(resource);
    };

    playResource();

    player.on('stateChange', (old, newState) => {
        console.log(`[Player] ${old.status} → ${newState.status}`);
        if (newState.status === AudioPlayerStatus.Idle) {
            console.log('[Player] Idle detected, restarting resource...');
            setTimeout(playResource, 100);
        }
    });

    player.on('error', (err) => {
        console.error(`[Player Error] ${err.message}`);
        setTimeout(playResource, 100);
    });
}
}

module.exports = VoiceHandler;