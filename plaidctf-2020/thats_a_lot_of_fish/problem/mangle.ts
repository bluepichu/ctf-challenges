import { readFileSync } from "fs";
import * as ts from "typescript";
import sr from "seedrandom";

sr("PPPPPPPPPP", { global: true });

Error.stackTraceLimit = Infinity;

const KEEP_STRINGS = ["length", "your input goes here"]
let names = readFileSync("names.txt").toString().split("\n");
let counter = 0;

function mangle(sf: ts.SourceFile, checker: ts.TypeChecker) {
	let map: Map<ts.Symbol, string> = new Map();
	let literalMap: Map<string, string> = new Map();

	function internal(node: ts.Node): ts.Node {
		switch (node.kind) {
			case ts.SyntaxKind.StringLiteral: {
				let text = (node as ts.StringLiteral).text;

				if (KEEP_STRINGS.some((str) => str === text)) {
					return node;
				}

				let ret = ts.createNode(ts.SyntaxKind.StringLiteral) as ts.StringLiteral;

				if (!literalMap.has(text)) {
					literalMap.set(text, names[counter++]);
				}
				ret.text = literalMap.get(text)!;
				return ret;
			}

			case ts.SyntaxKind.Identifier:
			case ts.SyntaxKind.TypeReference: {
				let symbol = checker.getSymbolAtLocation(node);

				if (symbol) {
					let literalText = (node as any).escapedText;

					if (literalText === "magikarp") {
						break; // skip the function argument
					}

					if (!map.has(symbol)) {
						map.set(symbol, names[counter++]);
					}

					if (!literalMap.has(literalText)) {
						literalMap.set(literalText, map.get(symbol)!);
					}

					(node as any).escapedText = map.get(symbol)!;
					node.pos = -1;
					node.end = -1;
				}

				break;
			}

			case ts.SyntaxKind.Block: {
				return node; // skip the decoder function
			}
		}

		return ts.visitEachChild(node, internal, (ts as any).nullTransformationContext);
	}

	return ts.visitNode(sf, internal);
}

const file = process.argv[2];
let sf = ts.createSourceFile(file, readFileSync(file).toString(), ts.ScriptTarget.ES2015, false);
let outputText: string = "";

const compilerHost: ts.CompilerHost = {
	getSourceFile: (fileName) => fileName === file ? sf : undefined,
	writeFile: (name, text) => {
		outputText = text;
	},
	getDefaultLibFileName: () => "lib.d.ts",
	useCaseSensitiveFileNames: () => false,
	getCanonicalFileName: fileName => fileName,
	getCurrentDirectory: () => "",
	getNewLine: () => "\n",
	fileExists: (fileName): boolean => fileName === file,
	readFile: () => "",
	directoryExists: () => true,
	getDirectories: () => []
};

let program = ts.createProgram([file], { removeComments: true }, compilerHost);
sf = mangle(sf, program.getTypeChecker());

let statements = [...sf.statements];

for (let i = 0; i < statements.length; i++) {
	let rnd = Math.floor(Math.random() * statements.length);

	let t = statements[statements.length - 1];
	statements[statements.length - 1] = statements[rnd];
	statements[rnd] = t;
}

sf.statements = ts.createNodeArray(statements);

console.error("Used", counter, "names");

let printer = ts.createPrinter({ removeComments: true });
console.log(printer.printFile(sf).replace(/[\s\n]+/g, " "));
