require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const UnionManager = require('./src/UnionManager');
const VoiceHandler = require('./src/VoiceHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

const ffmpegPath = path.join(__dirname, 'ffmpeg.exe');
if (fs.existsSync(ffmpegPath)) {
    process.env.FFMPEG_PATH = ffmpegPath;
    console.log(`[System] ffmpeg found and locked: ${ffmpegPath}`);
} else {
    console.error(`[Fatal Error] ffmpeg.exe が見つかりません: ${ffmpegPath}`);
}

const commands = [
    {
        name: 'create_union',
        description: 'ユニオンを作成します',
        options: [{ name: 'id', type: 3, description: '任意のID（空欄で自動生成）', required: false }]
    },
    {
        name: 'union_join',
        description: 'このサーバーをユニオンに参加登録します',
        options: [{ name: 'id', type: 3, description: 'ユニオンID', required: true }]
    },
    {
        name: 'union_leave',
        description: 'このサーバーをユニオンから脱退します',
        options: [{ name: 'id', type: 3, description: 'ユニオンID', required: true }]
    },
    {
        name: 'vc_join',
        description: 'BOTをVCに呼びます（先にunion_joinが必要）',
    },
    {
        name: 'vc_leave',
        description: 'BOTをVCから退出させます',
    }
];

client.on('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ ${client.user.tag} is ready!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;


    await interaction.deferReply();

    try {
        if (interaction.commandName === 'create_union') {
            const id = interaction.options.getString('id') || Math.random().toString(36).substring(2, 8);
            const union = UnionManager.create(id);
            if (!union) {
                return interaction.editReply(`⚠️ ユニオン \`${id}\` は既に存在します`);
            }
            await interaction.editReply(`✅ ユニオンを作成しました: \`${id}\``);
        }

        if (interaction.commandName === 'union_join') {
            const id = interaction.options.getString('id');
            const union = UnionManager.get(id);
            if (!union) {
                return interaction.editReply(`❌ ユニオン \`${id}\` が存在しません。先に \`/create_union\` で作成してください`);
            }
            const guildId = interaction.guild.id;
            if (union.guilds.has(guildId)) {
                return interaction.editReply(`⚠️ このサーバーは既にユニオン \`${id}\` に参加済みです`);
            }
            union.guilds.add(guildId);
            UnionManager._save();
            await interaction.editReply(`✅ このサーバーをユニオン \`${id}\` に登録しました！次に \`/vc_join\` でBOTをVCに呼んでください`);
        }

        if (interaction.commandName === 'union_leave') {
            const id = interaction.options.getString('id');
            const union = UnionManager.get(id);
            if (!union) {
                return interaction.editReply(`❌ ユニオン \`${id}\` が存在しません`);
            }
            const guildId = interaction.guild.id;
            if (!union.guilds.has(guildId)) {
                return interaction.editReply(`⚠️ このサーバーはユニオン \`${id}\` に参加していません`);
            }

            const connection = getVoiceConnection(guildId);
            if (connection) connection.destroy();
            union.players.delete(guildId);
            union.guilds.delete(guildId);
            UnionManager._save();
            await interaction.editReply(`👋 ユニオン \`${id}\` から脱退しました`);
        }

        if (interaction.commandName === 'vc_join') {
            const channel = interaction.member.voice.channel;
            if (!channel) return interaction.editReply('VCに入ってください！');

            const guildId = interaction.guild.id;
            const union = UnionManager.getByGuild(guildId);
            if (!union) {
                return interaction.editReply(`❌ このサーバーはどのユニオンにも参加していません。先に \`/union_join\` を実行してください`);
            }
            if (union.players.has(guildId)) {
                return interaction.editReply(`⚠️ BOTは既にVCに接続済みです`);
            }

            union.mixer._getOrCreateOutputMixer(guildId);

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            VoiceHandler.handleIncoming(connection, union);
            VoiceHandler.handleOutgoing(connection, union);
            union.players.set(guildId, true);

            await interaction.editReply(`🚀 ユニオン \`${union.id}\` のVCに接続しました！`);
        }

        if (interaction.commandName === 'vc_leave') {
            const guildId = interaction.guild.id;
            const union = UnionManager.getByGuild(guildId);
            if (!union) {
                return interaction.editReply(`❌ このサーバーはどのユニオンにも参加していません`);
            }
            if (!union.players.has(guildId)) {
                return interaction.editReply(`⚠️ BOTはVCに接続していません`);
            }

            const connection = getVoiceConnection(guildId);
            if (connection) connection.destroy();
            union.players.delete(guildId);

            await interaction.editReply(`👋 VCから退出しました`);
        }

    } catch (err) {
        console.error('[Command Error]', err);
        await interaction.editReply('❌ エラーが発生しました').catch(() => {});
    }
});

client.login(process.env.DISCORD_TOKEN);