interface MonitorStats {
	commNodes: CommNodeStats[];
	logicNodes: LogicNodeStats[];
	queues: QueueStats[];
}

interface CommNodeStats {
	name: string;
}

interface LogicNodeStats {
	name: string;
	games: number;
}

interface QueueStats {
	name: string;
	length: number;
}