declare module "promised-mongo" {
	interface Connection {
		[collection: string]: Queryable;
	}

	interface Queryable {
		findOne(obj: any): Promise<any>;
	}

	export default function connect(dbPath: string, collections: string[]): Connection;
}