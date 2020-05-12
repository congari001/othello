class ClassGame extends ClassBase {
    constructor(room_id) {
        super();
        this.room_id = room_id;
        this._initBoard();
        this._initPlayer();
    }

    // ゲームの初期化処理
    _initBoard() {
        this.board_data = [
            ["e","e","e","e","e","e","e","e"],
            ["e","e","e","e","e","e","e","e"],
            ["e","e","e","e","e","e","e","e"],
            ["e","e","e","w","b","e","e","e"],
            ["e","e","e","b","w","e","e","e"],
            ["e","e","e","e","e","e","e","e"],
            ["e","e","e","e","e","e","e","e"],
            ["e","e","e","e","e","e","e","e"]
        ];
        this.put_log = [];
        this.turn = 1;
        this.now_color = "b";
        this.is_start = false;
        this.pass_cnt = 0;
        this.last_put = null;
    }
    // プレイヤーの初期化
    _initPlayer() {
        this.players = [];
    }
    // 参加する
    Entry(name, user) {
        var is_npc = ! user;
        var player = new ClassPlayer(name, is_npc);
        if (player.getClassName() != "ClassPlayer") {
            throw new Error("プレイヤークラスを指定してください。");
        }
        if (this.players.length >= 2) {
            throw new Error("プレイヤーはこれ以上参加できません。");
        }
        player.room_id = this.room_id;
        this.players.push(player);
        if (user) {
            user.roomIn("room-"+this.room_id);
        }
        return player;
    }
    // ゲームをリセットする
    Restart() {
        this._initBoard();
        this.Start();
    }
    // ゲームを開始する
    Start() {
        if (this.is_start) {
            return;
        }
        if (this.players.length < 2) {
            for (let i=0; i < 2-this.players.length; i++) {
                this.Entry("NPC:"+(i+1));
            }
        }
        let i;
        // 白黒判定
        let coin = Math.floor(Math.random() * 2);
        this.players[coin].player_id = coin;
        this.players[coin].color = CNS.PIECE.BLACK;
        coin ^= 1;
        this.players[coin].player_id = coin;
        this.players[coin].color = CNS.PIECE.WHITE;
        // バトル開始
        this.is_start = true;
        // 対戦画面初期化
        let info = this.GetGameStatus();
        this.emit("update_board", {info: info}, {room: "room-"+this.room_id});
    }
    // 現在のターンのプレイヤーを返す
    GetNowPlayer() {
        if (!this.is_start) {
            throw new Error("ゲームが開始されていないため現在のターンのプレイヤーを取得できません。");
        }
        return this.players.filter((player)=>player.color==this.now_color)[0];
    }
    GetWaitPlayer() {
        if (!this.is_start) {
            throw new Error("ゲームが開始されていないため待機中のプレイヤーを取得できません。");
        }
        return this.players.filter((player)=>player.color!=this.now_color)[0];
    }
    // コマを置く
    PutPiece(rec, col) {
        if (!this.is_start) {
            throw new Error("ゲームが開始されていないため現在のターンのプレイヤーを取得できません。");
        }
        let i,pos;
        let my_player = this.GetNowPlayer();
        let my_color = my_player.color;
        let pieces = this.GetRevercePieceList(my_color, rec, col);
        if (!pieces.length) {
            throw new Error("置けない場所が指定されました。");
        }
        this.board_data[rec][col] = my_color;
        this.put_log.push({rec:rec, col:col});
        this.last_put = {rec:rec, col:col};
        for (i=0; i<pieces.length; i++) {
            pos = pieces[i];
            this.board_data[pos.rec][pos.col] = my_color;
        }
        this.NextTurn();
    }
    // ターンを進める
    NextTurn() {
        if (this.pass_cnt >= 2) {　// 終了判定
            let info = this.GetGameStatus();
            this.emit("update_board", {info: info}, {room: "room-"+this.room_id});
            this.emit("result", {info: info}, {room: "room-"+this.room_id});
            this.is_start = false;
            setTimeout(() => {
                this.Restart();
            }, 3500);
            return;
        }
        this.turn++;
        this.now_color = this.GetWaitPlayer().color;
        if (this.IsPass()) {
            this.pass_cnt++;
            this.NextTurn();
            return;
        }
        this.pass_cnt = 0;
        let info = this.GetGameStatus();
        this.emit("update_board", {info: info}, {room: "room-"+this.room_id});
    }
    // ゲームの情報を取得する
    GetGameStatus() {
        let res = {};
        let board_info = this.GetBoardInfo();
        res.put_position = this.GetPutPositionAll();
        res.now_color = this.now_color;
        res.my_name = this.players[0].name;
        res.my_color = this.players[0].color;
        res.my_score = board_info.score[this.players[0].color];
        res.my_is_npc = !!this.players[0].is_npc;
        res.op_name = this.players[1].name;
        res.op_color = this.players[1].color;
        res.op_score = board_info.score[this.players[1].color];
        res.op_is_npc = !!this.players[1].is_npc;
        res.board_data = board_info.board_data;
        res.last_put = this.last_put ? {rec:this.last_put.rec, col:this.last_put.col}: null;
        return res;
    }
    // 盤情報を取得する
    GetBoardInfo() {
        let board_data = [];
        let score = {w:0, b:0};
        let rec,col,piece;
        for (rec=0; rec<this.board_data.length; rec++) {
            board_data[rec] = [];
            for (col=0; col<this.board_data[rec].length; col++) {
                piece = this.board_data[rec][col];
                board_data[rec][col] = piece;
                if (typeof score[piece] !== "undefined") {
                    score[piece]++;
                }
            }
        }
        return {
            board_data: board_data,
            score: score
        };
    }
    // 指定の位置の裏返せるコマ情報を取得する
    GetRevercePieceList(my_color, rec, col) {
        let x,y;
        const dirs = [-1,0,1];
        let list = [];
        let tmp;
        for (x=0; x<dirs.length; x++) {
            for (y=0; y<dirs.length; y++) {
                tmp = this._GetRevercePieceLineList(my_color, rec, col, dirs[y], dirs[x]);
                list = list.concat(tmp);
            }
        }
        return list;
    }
    // 置ける位置を全て取得する
    GetPutPositionAll() {
        let rec,col;
        let res = [];
        for (rec=0; rec<this.board_data.length; rec++) {
            for (col=0; col<this.board_data[rec].length; col++) {
                if (this.board_data[rec][col] == CNS.PIECE.EMPTY) {
                    if (this.GetRevercePieceList(this.now_color, rec, col).length) {
                        res.push({rec:rec, col:col});
                    }
                }
            }
        }
        return res;
    }
    // パス判定
    IsPass() {
        let rec,col;
        for (rec=0; rec<this.board_data.length; rec++) {
            for (col=0; col<this.board_data[rec].length; col++) {
                if (this.board_data[rec][col] == CNS.PIECE.EMPTY) {
                    if (this.GetRevercePieceList(this.now_color, rec, col).length) {
                        return false;
                    }
                }
            }
        }
        return true;
    }


    // 指定の位置のコマ情報を取得する
    _GetPiece(rec, col) {
        if (typeof this.board_data[rec] === "undefined") {
            return null;
        }
        if (typeof this.board_data[rec][col] === "undefined") {
            return null;
        }
        return this.board_data[rec][col];
    }
    // 一直線上の裏返せるコマの位置情報を取得する
    _GetRevercePieceLineList(my_color, rec, col, dir_y, dir_x) {
        rec-=0;
        col-=0;
        let op_color = my_color === CNS.PIECE.WHITE? CNS.PIECE.BLACK: CNS.PIECE.WHITE;
        let list = [];
        let piece;
        let last_piece = null;
        // エラーチェック
        if ([CNS.PIECE.WHITE,CNS.PIECE.BLACK].filter(c => c===my_color).length === 0) {
            console.log("指定のcolor["+my_color+"]は無効です。");
            return null;
        }
        if (dir_y == 0 && dir_x == 0) {
            //console.log("方向が指定されていません。");
            return list;
        }
        piece = this._GetPiece(rec, col);
        if ([CNS.PIECE.WHITE,CNS.PIECE.BLACK].filter(c => c===piece).length !== 0) {
            //console.log("置けない位置rec["+rec+"]col["+col+"]が指定されました。");
            return list;
        }
        // 裏返せるコマがあるかチェック
        while (piece = this._GetPiece(rec+=dir_y, col+=dir_x)) {
            last_piece = piece;
            if (last_piece != op_color) {
                break;
            }
            list.push({"rec": rec, "col": col});
        }
        return last_piece == my_color ? list: [];
    }
}