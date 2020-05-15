class ClassGame extends ClassBase {
    constructor() {
        super();
        this._player = null;
        this._InitEvent();
        this._InitGuestSettings();
    }

    // ゲームの初期化処理
    _InitBoard() {
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
        this.now_guest = 0;
        this.is_start = false;
        this.pass_cnt = 0;
        this.last_put = null;
    }
    // 参加者情報設定初期化
    _InitGuestSettings() {
        this.guest_settings = [{}, {}];
    }
    // 参加者情報初期化
    _InitGuests() {
        let name1, npc1, name2, npc2;
        name1 = this.guest_settings[0].name || "プレイヤー１";
        npc1  = this.guest_settings[0].npc  || false;
        name2 = this.guest_settings[1].name || "プレイヤー２";
        npc2  = this.guest_settings[1].npc  || true;
        this.guests = [];
        this.guests[0] = {name: name1, color: null, is_npc: npc1};
        this.guests[1] = {name: name2, color: null, is_npc: npc2};
    }
    // イベントの初期化
    _InitEvent() {
        this.on("start", () => {
            console.log("game start");
            this.Start();
        });
        this.on("put", (event) => {
            let pos = event.detail;
            let color = this.guests[this.now_guest].color;
            console.log(color+": 横"+(+pos.col+1)+" 縦"+(+pos.rec+1));
            this.PutPiece(pos.rec, pos.col);
        });
        this.on("auto", () => {
            if (this.guests[this.now_guest].is_npc) {
                setTimeout(() => {
                    let st = this._GetGameStatus();
                    if (st.put_position.length) {
                        let pos = st.put_position[Math.floor(Math.random() * st.put_position.length)];
                        this.emit("put", {rec: pos.rec, col: pos.col});
                    }
                }, 1000);
            }
        });
        this.on("result", () => {
            console.log("game result");
            this.GameResult();
        });
    }

    // プレイヤーを割り当てる
    SetPlayer(player) {
        this._player = player;
    }
    // ゲーム設定
    SetGuestSettings(target, name, npc) {
        target = target ? 1: 0;
        this.guest_settings[target] = {name: name, npc: npc};
    }
    // ゲームを開始する
    Start() {
        this._InitBoard();
        this._InitGuests();
        let i;
        // 白黒判定
        let coin = Math.floor(Math.random() * 2);
        this.guests[coin].color = CNS.PIECE.BLACK;
        this.now_guest = coin;
        coin ^= 1;
        this.guests[coin].color = CNS.PIECE.WHITE;
        // バトル開始
        this.is_start = true;
        this._player.emit("update_board", {info: this._GetGameStatus()});
        this.emit("auto");
    }
    // コマを置く
    PutPiece(rec, col) {
        if (!this.is_start) {
            console.log("ゲームが開始されていないためコマを置けません。");
            return;
        }
        let i,pos;
        let color = this.guests[this.now_guest].color;
        let pieces = this._GetRevercePieceList(color, rec, col);
        if (!pieces.length) {
            throw new Error("置けない場所が指定されました。");
        }
        this.board_data[rec][col] = color;
        this.put_log.push({rec:rec, col:col});
        this.last_put = {rec:rec, col:col};
        for (i=0; i<pieces.length; i++) {
            pos = pieces[i];
            this.board_data[pos.rec][pos.col] = color;
        }
        this._NextTurn();
    }
    // ゲーム結果処理
    GameResult() {
        let st = this._GetGameStatus();
        this._player.emit("update_board", {info: st});
        this._player.emit("result", {info: st});
        this.is_start = false;
        setTimeout(() => {
            this.emit("start");
        }, 3500);
    }

    // プライベート
    // ターンを進める
    _NextTurn() {
        if (this.pass_cnt >= 2) {　// 終了判定
            this.emit("result");
            return;
        }
        this.now_guest ^= 1;
        if (this._IsPass()) {
            this.pass_cnt++;
            this._NextTurn();
        }else{
            this.pass_cnt = 0;
            this._player.emit("update_board", {info: this._GetGameStatus()});
            this.emit("auto");
        }
    }
    // ゲームの情報を取得する
    _GetGameStatus() {
        let res = {};
        let board_info = this._GetBoardInfo();
        res.put_position = this._GetPutPositionAll();
        res.now_color = this.guests[this.now_guest].color;
        res.my_name = this.guests[0].name;
        res.my_color = this.guests[0].color;
        res.my_score = board_info.score[this.guests[0].color];
        res.my_is_npc = !!this.guests[0].is_npc;
        res.op_name = this.guests[1].name;
        res.op_color = this.guests[1].color;
        res.op_score = board_info.score[this.guests[1].color];
        res.op_is_npc = !!this.guests[1].is_npc;
        res.board_data = board_info.board_data;
        res.last_put = this.last_put ? {rec:this.last_put.rec, col:this.last_put.col}: null;
        return res;
    }
    // 盤情報を取得する
    _GetBoardInfo() {
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
    _GetRevercePieceList(my_color, rec, col) {
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
    _GetPutPositionAll() {
        let rec,col,now_color;
        let res = [];
        now_color = this.guests[this.now_guest].color;
        for (rec=0; rec<this.board_data.length; rec++) {
            for (col=0; col<this.board_data[rec].length; col++) {
                if (this.board_data[rec][col] == CNS.PIECE.EMPTY) {
                    if (this._GetRevercePieceList(now_color, rec, col).length) {
                        res.push({rec:rec, col:col});
                    }
                }
            }
        }
        return res;
    }
    // パス判定
    _IsPass() {
        let rec,col,now_color;
        now_color = this.guests[this.now_guest].color;
        for (rec=0; rec<this.board_data.length; rec++) {
            for (col=0; col<this.board_data[rec].length; col++) {
                if (this.board_data[rec][col] == CNS.PIECE.EMPTY) {
                    if (this._GetRevercePieceList(now_color, rec, col).length) {
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