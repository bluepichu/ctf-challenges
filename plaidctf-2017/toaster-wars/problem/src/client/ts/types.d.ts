type Processable = LogEvent | { type: "done", move: boolean, state: StateUpdate };
type Thenable = PromiseLike<any>;