var ViewGame = ViewGame || (() => {
    let Obj = {
        set myName(name) {
            document.getElementById("my_status").querySelector("[name=name]").innerHTML = name;
        },
        set myColor(color) {
            let piece, elem;
            piece = document.createElement("div");
            piece.className = "piece_"+color;
            elem = document.getElementById("my_status").querySelector("[name=color]");
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
            elem.appendChild(piece);
        },
        set myNum(num) {
            document.getElementById("my_status").querySelector("[name=num]").innerHTML = num;
        },
        set opName(name) {
            document.getElementById("op_status").querySelector("[name=name]").innerHTML = name;
        },
        set opColor(color) {
            let piece, elem;
            piece = document.createElement("div");
            piece.className = "piece_"+color;
            elem = document.getElementById("op_status").querySelector("[name=color]");
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
            elem.appendChild(piece);
        },
        set opNum(num) {
            document.getElementById("op_status").querySelector("[name=num]").innerHTML = num;
        },
        set message(msg) {
            document.getElementById("message_box").innerHTML = msg;
        }
    };

    // ゲーム画面を作成する
    Obj.createGameView = (id) => {
        let othello = document.getElementById(id);
        othello.appendChild(Obj.createStatusWindow(true));
        othello.appendChild(Obj.createBoard());
        othello.appendChild(Obj.createStatusWindow(false));
        othello.appendChild(Obj.createMessageBox());
    }
    // ステータスウインドウを作成する
    Obj.createStatusWindow = (is_opponent) => {
        let pref = is_opponent ? "op": "my";
        let window, name, color, piece, num;
        window = document.createElement("div");
        window.id = pref + "_status";
        window.className = pref + "_status";
        name = document.createElement("div");
        name.setAttribute("name", "name");
        name.className = pref + "_name";
        window.appendChild(name);
        color = document.createElement("div");
        color.setAttribute("name", "color");
        color.className = pref + "_color";
        window.appendChild(color);
        num = document.createElement("div");
        num.setAttribute("name", "num");
        num.className = pref + "_num";
        window.appendChild(num);
        return window;
    }
    // オセロ盤を作成する
    Obj.createBoard = () => {
        let board,frame, record, square, piece, mark;
        // 盤
        board = document.createElement("div");
        board.id = "board";
        board.className = "board";
        // 枠
        frame = document.createElement("div");
        frame.id = "frame";
        frame.className = "frame";
        board.appendChild(frame);
        // 行
        for (var rec=0; rec<CNS.BOARD.RECORD_SIZE; rec++) {
            record = document.createElement("div");
            record.id = "rec"+rec;
            record.className = "record";
            // 列
            for (var col=0; col<CNS.BOARD.COLUMN_SIZE; col++) {
                // マス
                square = document.createElement("div");
                square.setAttribute("name", "col"+col);
                square.dataset.col = col;
                square.dataset.rec = rec;
                square.className = "square";
                square.addEventListener("click", ((rec, col, event) => {
                    let ce = new CustomEvent("select_square", {bubbles:true, detail:{rec:rec, col:col}});
                    event.currentTarget.dispatchEvent(ce);
                }).bind(null, rec, col));
                // コマ
                piece = document.createElement("div");
                piece.className = "piece_e";
                square.appendChild(piece);
                // マーカー
                mark = document.createElement("div");
                mark.className = "mark_e";
                square.appendChild(mark);
                record.appendChild(square);
            }
            frame.appendChild(record);
        }
        return board;
    }
    // メッセージボックスを作成する
    Obj.createMessageBox = () => {
        let message;
        message = document.createElement("div");
        message.id = "message_box";
        message.className = "message_box";
        message.addEventListener("message", (e) => {Obj.message = e.message});
        return message;
    }
    // 指定の位置のコマエレメント取得
    // 無ければnull
    Obj.getPieceElement = (rec, col) => {
        let recelem = document.getElementById("rec"+rec);
        if (recelem === null) {
            return null;
        }
        let square = recelem.querySelector("[name=col"+col+"]");
        if (square === null) {
            return null;
        }
        return square.children[0];
    }
    // 指定の位置のマークエレメント取得
    // 無ければnull
    Obj.getMarkElement = (rec, col) => {
        let recelem = document.getElementById("rec"+rec);
        if (recelem === null) {
            return null;
        }
        let square = recelem.querySelector("[name=col"+col+"]");
        if (square === null) {
            return null;
        }
        return square.children[1];
    }
    // 盤の更新
    Obj.updateBoard = (board_data) => {
        let rec, col;
        for (rec=0; rec<board_data.length; rec++) {
            for (col=0; col<board_data[rec].length; col++) {
                Obj.getPieceElement(rec, col).className = "piece_"+board_data[rec][col];
            }
        }
    }
    // マークのリセット
    Obj.resetMarks = () => {
        let rec, col;
        for (rec=0; rec<CNS.BOARD.RECORD_SIZE; rec++) {
            for (col=0; col<CNS.BOARD.COLUMN_SIZE; col++) {
                Obj.getMarkElement(rec, col).className = "mark_e";
            }
        }
    }
    // 置ける場所マーク
    Obj.updateValidMarks = (pos_list) => {
        let i;
        for (i=0; i<pos_list.length; i++) {
            Obj.getMarkElement(pos_list[i].rec, pos_list[i].col).className = "mark_v";
        }
    }
    // 最後に置いた場所マーク
    Obj.updateLastPutMark = (pos) => {
        Obj.getMarkElement(pos.rec, pos.col).className = "mark_l";
    }

    return Obj;
})();