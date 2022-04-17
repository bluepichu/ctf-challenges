import pyshark

cap = pyshark.FileCapture("../problem/misc/file-transfer/out.pcap")

data = b"\x00" * 467371

print(len(cap))
for i, packet in enumerate(cap):
	print(i)
	if hasattr(packet, "http"):
		if hasattr(packet.http, "response"):
			for header in packet.http.response_line.all_fields:
				if header.showname_key == "Content-Range":
					start_str, end_str = header.showname_value.split("/")[0][6:].split("-")
					start = int(start_str)
					end = int(end_str)
					data = data[:start] + packet.http.file_data.binary_value + data[end+1:]
					break

with open("flag1.png", "wb") as f:
	f.write(data)
