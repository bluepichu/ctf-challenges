#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int run();
int post_calibration(int value);

int main() {
	srand(time(NULL));

	int success = 0;

	while (success == 0) {
		success = run();
	}

	int post_calibration_loop = 1;

	while (post_calibration_loop) {
		post_calibration_loop = post_calibration(success);
	}

	return 0;
}

int run() {
	int pattern[5];
	int sum = 0;

	while (sum == 0) {
		for (int i = 0; i < 5; i++) {
			pattern[i] = rand() % 9;
			sum += pattern[i];
		}
	}

	for (int i = 0; i < 5; i++) {
		printf(":Calibrating (%d/5)...\n", i + 1);
		putchar('>');

		for (int j = 0; j <= i; j++) {
			putchar('1' + pattern[j]);
		}

		putchar('\n');
		fflush(stdout);

		for (int j = 0; j <= i; j++) {
			char ch = getchar();

			if (ch == EOF) {
				exit(0);
			}

			char input = ch - '1';

			if (input != pattern[j]) {
				printf(":Calibration failure\n");
				fflush(stdout);
				return 0;
			}
		}
	}

	printf(":Calibration success\n");
	printf("!\n");
	fflush(stdout);
	return 10 + sum;
}

int post_calibration(int value) {
	char buffer[7];

	for (int i = 0; i < 7; i++) {
		buffer[i] = 0;
	}

	while (1) {
		for (int i = 0; i < 6; i++) {
			buffer[i] = buffer[i + 1];
		}

		char ch = getchar();

		if (ch == EOF) {
			exit(0);
		}

		buffer[6] = ch - '1';

		if (buffer[0] == 5 && buffer[1] == 5 && buffer[2] == 5 && buffer[3] == 2 && buffer[4] == 1 && buffer[5] == 2 && buffer[6] == 1) {
			break;
		}
	}

	int remaining = value;

	while (1) {
		if (remaining < 10) {
			printf(">%d\n", remaining);
			fflush(stdout);
			return 1;
		}

		int choice = random() % 9 + 1;
		printf(">%d\n", choice);
		fflush(stdout);
		remaining -= choice;

		char ch = getchar();

		if (ch == EOF) {
			exit(0);
		}

		choice = ch - '0';

		if (1 <= choice && choice <= 9) {
			remaining -= choice;

			if (remaining == 0) {
				printf(":%s\n", getenv("FLAG"));
				fflush(stdout);
				return 0;
			}
		}
	}
}
