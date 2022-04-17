#! /bin/bash

# Add hostname to /etc/hosts
echo "127.0.0.1 internal.storage.shelld" >> /etc/hosts

# Start HTTP server
npx http-server -p 80 &
NODE_PID=$!

# Wait for HTTP server to start
until curl -s http://internal.storage.shelld/sus.png; do
	sleep 1
done

# Start tcpdump
mkdir /out
tcpdump -i lo -U -w /out/tcpdump.pcap &
TCPDUMP_PID=$!

# Wait for tcpdump
sleep 5

# Download random fragments of the file
size=$(stat -c %s /files/sus.png)
chunksize=4096
for i in {1..1000}; do
	rand=$(openssl rand 4 | od -DAn)
	start=$(($rand % ($size - $chunksize)))
	end=$(($start + $chunksize - 1))
	if [ $i -eq 250 ]; then
		start=0
		end=$(($chunksize - 1))
	fi
	curl -H "Range: bytes=$start-$end" http://internal.storage.shelld/sus.png -o /dev/null
done

# Stop tcpdump
kill $TCPDUMP_PID
wait $TCPDUMP_PID

# Wait to be killed
wait $NODE_PID
