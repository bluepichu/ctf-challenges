import asyncio
from css.io_manager import ReaderWriter, IOManager

class RemotePlayer:
	address: str
	port: int

	def __init__(self, address: str, port: int):
		self.address = address
		self.port = port

	async def start(self, rw: ReaderWriter) -> None:
		reader, writer = await asyncio.open_connection(self.address, self.port)
		print("connection opened")
		await asyncio.gather(
			self._pipe_outbound(rw.reader, writer),
			self._pipe_inbound(reader, rw.writer),
		)


	async def _pipe_outbound(self, manager: IOManager, writer: asyncio.StreamWriter):
		while True:
			chunk = await manager.queue.get()
			print("writing out", len(chunk))
			if chunk is None:
				break
			writer.write(chunk)
			await writer.drain()
		writer.close()

	async def _pipe_inbound(self, reader: asyncio.StreamReader, manager: IOManager):
		while True:
			data = await reader.read(1024)
			print("reading in", len(data))
			if len(data) == 0:
				break
			await manager.write(data)
		await manager.queue.put(None)
