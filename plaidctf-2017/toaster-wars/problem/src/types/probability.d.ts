/**
 * Represents a probability distribution.
 */
type Distribution = BinomialDistribution | UniformDistribution;

/**
 * Represents a binomial distribution.
 */
interface BinomialDistribution {
	type: "binomial";
	n: number;
	p: number;
}

/**
 * Represents a uniform distribution.
 */
interface UniformDistribution {
	type: "uniform";
	a: number;
	b: number;
}