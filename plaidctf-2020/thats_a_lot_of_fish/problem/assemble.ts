import * as fs from "fs-extra";

type Prog = number | { label: string, baseIndex?: number, pointer?: boolean };
type Op = { src: string, inst: Prog[] };

let opcodes: { [key: string]: { args: string, code: number } } = {
	"hlt": { args: "o", code: 0 },
	"mov": { args: "oo", code: 1 },
	"add": { args: "oo", code: 2 },
	"mul": { args: "oo", code: 3 },
	"and": { args: "oo", code: 4 },
	"or": { args: "oo", code: 5 },
	"xor": { args: "oo", code: 6 },
	"cmp": { args: "oo", code: 7 },
	"neg": { args: "oo", code: 8 },
	"jal": { args: "l", code: 9 },
	"jz": { args: "lo", code: 10 },
	"lpush": { args: "ooo", code: 11 },
	"lpoll": { args: "ooo", code: 12 },
	"trunc": { args: "oo", code: 13 },
	"call": { args: "o", code: 14 },
	"ret": { args: "", code: 15 },
}

function getOperand(arg: string, baseIndex: number) {
	if (arg.startsWith("@")) {
		return { label: arg.substring(1) };
	} else if (arg.startsWith("~")) {
		return { label: arg.substring(1), baseIndex };
	} else if (arg.startsWith("#")) {
		// constant
		let value = parseInt(arg.substring(1));
		return (value << 2) | 0b00;
	} else if (arg.startsWith("[r")) {
		// register pointer
		let value = parseInt(arg.substring(2, arg.length - 1));
		return (value << 2) | 0b11;
	} else if (arg.startsWith("[@")) {
		// constant pointer to label
		return { label: arg.substring(2, arg.length -1), pointer: true };
	} else if (arg.startsWith("[")) {
		// constant pointer
		let value = parseInt(arg.substring(1, arg.length - 1));
		return (value << 2) | 0b10;
	} else {
		// register
		let value = parseInt(arg.substring(1));
		return (value << 2) | 0b01;
	}
}

async function run(file: string) {
	let data = (await fs.readFile(file)).toString();
	let prog: Op[] = [];
	let labels: { [key: string]: number } = {};
	let lines = data.split("\n");

	for (let l = 0; l < lines.length; l++) {
		let line = lines[l].split(";")[0].trim();

		if (line.length !== 0) {
			let op: Op = { src: line, inst: [] };
			prog.push(op);

			if (line.indexOf(":") >= 0) {
				let [label, ...rest] = line.split(/:\s+/);
				line = rest.join(": ");

				labels[label] = prog.reduce((a, b) => a + b.inst.length, 0);
			}

			let [opcode, ...parts] = line.split(/\s+/);
			let args = parts.join(" ").split(/,\s+/);

			if (opcode !== "!" && !(opcode in opcodes)) {
				throw new Error(`invalid opcode '${opcode}' on line ${l + 1}`);
			}

			if (opcode === "!") {
				op.inst.push(parseInt(args[0]));
				continue;
			}

			op.inst.push(opcodes[opcode].code);

			for (let i = 0; i < opcodes[opcode].args.length; i++) {
				// console.log(args[i]);
				switch (opcodes[opcode].args[i]) {
					case "o": {
						op.inst.push(getOperand(args[i], prog.reduce((a, b) => a + b.inst.length, 0) + opcodes[opcode].args.length - i))
						break;
					}

					case "l": {
						op.inst.push(getOperand(args[i], prog.reduce((a, b) => a + b.inst.length, 0) + opcodes[opcode].args.length - i));
						break;
					}
				}
			}
		}
	}

	console.log(labels);

	function fixLabels(item: Prog) {
		if (typeof item === "number") {
			return item;
		} else {
			let relative = labels[item.label] - (item.baseIndex ?? 0);
			return (relative & 0xffff) << 2 | (item.pointer ? 0b10 : 0b00);
		}
	}

	function toBits(num: number) {
		let ret: number[] = [];

		while (num > 0) {
			ret.push(num % 2);
			num /= 2;
			num = Math.floor(num);
		}

		return ret;
	}

	let fixed = prog.map((op) => ({ ...op, inst: op.inst.map(fixLabels).map(toBits) }));

	if (process.env["DEBUG"]) {
		console.log("[");
		let pc = 0;
		for (let op of fixed) {
			console.log(("\t" + op.inst.map((inst) => JSON.stringify(inst)).join(",") + ",").padEnd(60), "//", pc.toString().padStart(4), op.src);
			pc += op.inst.length;
		}
		console.log("]");
	} else {
		console.log(JSON.stringify(fixed.map((op) => op.inst).reduce((a, b) => a.concat(b), [])));
	}
}

run(process.argv[2]);
