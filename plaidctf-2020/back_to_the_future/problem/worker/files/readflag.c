#include <fcntl.h>
#include <unistd.h>

char buf[1024];

int main() {
	int fd = open("/flag", O_RDONLY);
	int len = read(fd, buf, 1024);
	write(1, buf, len);
	close(fd);
	return 0;
}
