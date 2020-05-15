class ClassPlayer extends ClassBase {
    constructor() {
        super();
        this._game = null;
        this._InitEvent();
    }

    // イベントの初期化
    _InitEvent() {
        this.on("update_board", () => {
            let info = event.detail.info;
            ViewGame.updateBoard(info.board_data);
            ViewGame.resetMarks();
            if (info.now_color == info.my_color) {
                if (!info.my_is_npc) {
                    ViewGame.updateValidMarks(info.put_position);
                }
            } else {
                if (!info.op_is_npc) {
                    ViewGame.updateValidMarks(info.put_position);
                }
            }
            ViewGame.myName = info.my_name + (info.my_is_npc ? "(NPC)": "");
            ViewGame.myColor = info.my_color;
            ViewGame.myNum = info.my_score;
            ViewGame.opName = info.op_name + (info.op_is_npc ? "(NPC)": "");
            ViewGame.opColor = info.op_color;
            ViewGame.opNum = info.op_score;
            let a_status = info.my_color == info.now_color ? "my_status": "op_status";
            let w_status = a_status != "my_status" ? "my_status": "op_status";
            document.getElementById(a_status).className = a_status+" active";
            document.getElementById(w_status).className = w_status;
            if (info.last_put !== null) {
                ViewGame.updateLastPutMark(info.last_put);
            }
            ViewGame.message = (info.my_color == info.now_color ? info.my_name: info.op_name)+" のターン";
        });
        this.on("result", () => {
            let info = event.detail.info;
            let msg = "";
            if (info.my_score > info.op_score) {
                msg = info.my_name+"の勝ち";
            } else if (info.my_score < info.op_score) {
                msg = info.op_name+"の勝ち";
            } else {
                msg = "引き分け";
            }
            ViewGame.message = msg;
        });
        document.getElementById("othello").addEventListener("select_square", (event) => {
            let pos = event.detail;
            if (ViewGame.getMarkElement(pos.rec, pos.col).className == "mark_v") {
                this._game.emit("put", pos);
            }
        });
    }

    // ゲームを割り当てる
    SetGame(game) {
        this._game = game;
    }
    // ゲームを開始する
    StartGame() {
        this._game.emit("start");
    }
}