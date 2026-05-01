const fs = require('fs');
const path = require('path');
const UnionMixer = require('./Mixer');

const SAVE_PATH = path.join(__dirname, '../data/unions.json');

class UnionManager {
    constructor() {
        this.unions = new Map();
        this._load();
    }

    _load() {
        if (!fs.existsSync(SAVE_PATH)) return;
        try {
            const raw = JSON.parse(fs.readFileSync(SAVE_PATH, 'utf8'));
            for (const [id, data] of Object.entries(raw)) {
                this.unions.set(id, {
                    id,
                    mixer: new UnionMixer(),
                    guilds: new Set(data.guilds || []),
                    players: new Map(),
                    createdAt: data.createdAt,
                });
                console.log(`[Union] Loaded: ${id} (guilds: ${(data.guilds || []).join(', ') || 'none'})`);
            }
        } catch (e) {
            console.error('[Union] Failed to load:', e.message);
        }
    }

    _save() {
        const dir = path.dirname(SAVE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const obj = {};
        for (const [id, data] of this.unions) {
            obj[id] = {
                id,
                createdAt: data.createdAt,
                guilds: [...data.guilds],
            };
        }
        fs.writeFileSync(SAVE_PATH, JSON.stringify(obj, null, 2), 'utf8');
    }

    create(unionId) {
        if (this.unions.has(unionId)) return null;
        const union = {
            id: unionId,
            mixer: new UnionMixer(),
            guilds: new Set(),
            players: new Map(),
            createdAt: new Date().toISOString(),
        };
        this.unions.set(unionId, union);
        this._save();
        console.log(`[Union] Created: ${unionId}`);
        return union;
    }

    get(unionId) {
        return this.unions.get(unionId) || null;
    }


    getByGuild(guildId) {
        for (const union of this.unions.values()) {
            if (union.guilds.has(guildId)) return union;
        }
        return null;
    }

    delete(unionId) {
        if (!this.unions.has(unionId)) return false;
        this.unions.delete(unionId);
        this._save();
        console.log(`[Union] Deleted: ${unionId}`);
        return true;
    }
}

module.exports = new UnionManager();