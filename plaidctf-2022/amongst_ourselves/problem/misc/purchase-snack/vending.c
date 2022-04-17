#include <stdio.h>
#include <stdlib.h>
#include <time.h>

const char* snacks[] = {
	"Potato Chips",
	"Chocolate Bar",
	"Chocolate Candy",
	"Cookies",
	"Peanut Butter Cups"
};

void vend(int positions[12]);
void print_flag();

int main() {
	srand(time(NULL));

	int positions[12] = {0, 1, 2, 3, 4, -1, -1, -1, -1, -1, -1, -1};

	for (int i = 11; i > 0; i--) {
		int j = rand() % i;
		int temp = positions[i];
		positions[i] = positions[j];
		positions[j] = temp;
	}

	for (int i = 0; i < 12; i++) {
		if (positions[i] >= 0) {
			printf(">%c%c\t%s\n", (char)('A' + i / 4), '1' + (i % 4), snacks[positions[i]]);
		}
	}

	printf("<\n");
	fflush(stdout);

	while (1) {
		vend(positions);
	}

	return 0;
}

void vend(int positions[12]) {
	char input[3];

	if (scanf("%s", input) == EOF) {
		exit(0);
	}

	int row = input[0] - 'A';
	int col = input[1] - '1';

	if (row < 0 || row > 2 || col < 0 || col > 3) {
		printf(":Invalid code\n");
		fflush(stdout);
		return;
	}

	int index = row * 4 + col;

	if (positions[index] < 0) {
		printf(":Sold out\n");
		fflush(stdout);
		return;
	}

	printf(":Vending\n");
	printf("!%s\n", snacks[positions[index]]);
	fflush(stdout);
}

void print_flag() {
	printf(":%s\n", getenv("FLAG"));
	fflush(stdout);
}
