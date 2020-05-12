class ClassServer extends ClassBase {
    constructor() {
        super();
        this.users = null;
    }
    // 接続の受付を開始する
    // 指定したコンテンツに通信情報を受け渡すための準備をする
    listen(app) {
        let self = this;
        // ユーザー情報管理
        let _users = (() => {
            let _users = {};
            let _id = 0;
            let _obj = {};
            return {
                get: (id) => {
                    return _users[id] || null;
                },
                create: () => {
                    let id = ++_id;
                    _users[id] = {
                        id: id,
                        connector: null,
                        rooms: [],
                        roomIn: (room) => {
                            if (_users[id].rooms.filter(v => v==room).length === 0) {
                                _users[id].rooms.push(room);
                            }
                        },
                        roomOut: (room) => {
                            _rooms[id].rooms = (typeof room === "undefined") ? []: _rooms[id].rooms.filter(v => v!=room);
                        },
                    };
                    return _users[id];
                },
                roomIn: (id, room) => {
                    let user = _users[id] || null;
                    if (!user) {
                        return;
                    }
                    if (user.rooms.filter(v => v==room).length === 0) {
                        user.rooms.push(room);
                    }
                },
                roomUsers: (room) => {
                    let res = [];
                    Object.keys(_users).forEach((k) => {
                        if (_users[k].rooms.filter(v => v==room).length) {
                            res.push(_users[k]);
                        }
                    });
                    return res;
                },
                roomOut: (id, room) => {
                    let user = _users[id] || null;
                    if (!user) {
                        return;
                    }
                    user.rooms = (typeof room === "undefined") ? []: user.rooms.filter(v => v!=room);
                }
            };
        })();
        this.users = _users;
        this.app = app;
        // アプリのイベント発行処理上書き
        this.app.emit = (event_name, params, option) => {
            let room = option.room || null;
            let id = option.id || null;
            let users = [];
            let i,user;
            if (room !== null) {
                users = this.users.roomUsers(room);
            }
            if (id !== null) {
                users = users.filter(u=>u.id==id);
                user = this.users.get(id);
                if (!users.length && user) {
                    users.push(user);
                }
            }
            for (i=0; i<users.length; i++) {
                users[i].connector.emit(event_name, params);
            }
        }
        // 接続要求の受け付け
        this.on("session_request", (event) => {
            let id = event.detail.id;
            let connector = event.detail.connector;
            let user = id === null ? _users.create(): _users.get(id);
            if (user === null) {
                throw new Error("指定のID[ "+id+" ]はセッションが存在しません。");
            }
            user.connector = connector;
            user.connector.emit("session_request", {id:user.id});
        });
        // 接続の開始
        this.on("session_start", (event) => {
            //console.log("セッション開始");
        });
        // サーバーへのイベントをコンテンツに転送
        this.on("message", (event) => {
            let ev_name = event.detail.event;
            if (["message","session_start", "session_request"].filter(e=>ev_name === e).length) {
                throw new Error("指定のイベント名["+ev_name+"]は使えません。");
            }
            let id = event.detail.id;
            let user = _users.get(id);
            let ev_params = {};
            if (user === null) {
                throw new Error("指定のユーザーID["+id+"]は存在しません。");
            }
            ev_params.user = user;
            ev_params.params = event.detail.params;
            this.emit(ev_name, ev_params);
        });
    }
    // コネを得る
    getConnection() {
        let server = this;
        return (() => {
            let _id = null;
            let _connector = null;
            let _is_open = false;
            return {
                // 接続開始
                open: () => {
                    _connector = new ClassBase();
                    _connector.on("session_request", (event) => {
                        _id = event.detail.id;
                        server.emit("session_start");
                    });
                    server.emit("session_request", {id: _id, connector: _connector});
                },
                getId: () => {
                    return _id;
                },
                emit: (event_name, params) => {
                    let ev_params = {};
                    ev_params.event = event_name;
                    ev_params.params = params;
                    server.emit("message", {event: event_name, id:_id, params: params});
                },
                on: (event_name, func) => {
                    _connector.on(event_name, func);
                },
                off: (event_name, func) => {
                    _connector.off(event_name, func);
                },
            };
        })();
    }
}