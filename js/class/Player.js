class ClassPlayer extends ClassBase {
    constructor(name, is_npc) {
        super();
        this.name = name;
        this.is_npc = is_npc;
        this._initRoom();
        this.conn = null;
    }

    // 接続部屋情報初期化
    _initRoom() {
        this.room_id = null;
        this.player_id = null;
        this.color = null;
    }
    // NPC
}