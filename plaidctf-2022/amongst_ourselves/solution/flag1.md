After downloading the file via the task, run the following in the console:

```js
const data = FileTransferController.downloadMap.get([...FileTransferController.downloadMap.keys()][0]);
const dl = document.createElement("a");
dl.href = "data:binary/octet-stream;base64," + btoa(data);
dl.setAttribute("download", "sus");
dl.click();
```

This will download a file called `sus` with the appropriate content.  Running `file` on this file produces the following:

```
/Users/bluepichu/Downloads/sus: pcapng capture file - version 1.0
```

Opening the file in Wireshark, we can see that it contains a many range requests for parts of a PNG.  From the reponses to these requests, we can reconstruct the original PNG and get the flag.  (See `flag1.py`.)
