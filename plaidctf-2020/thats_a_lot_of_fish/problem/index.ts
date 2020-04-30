type State = { "pc": Num, "prog": Num[], "reg": Registers, "t": Trees, "stack": Num[] };

type True = true;
type False = false;
type Any = any;
type Never = True & False;

type Finite<T extends Any[]> = {
	"a0": True;
	"a1": Finite<Tail<T>>;
	"a2": False;
}[
	T extends [] ? "a0" :
	T extends (infer E)[] ? (E[] extends T ? "a2" : "a1") :
	"a1"
]
type Head<T extends Any[]> = ((...args: T) => void) extends ((arg: infer T1, ...args: infer T2) => void) ? T1 : Never;
type Tail<T extends Any[]> = ((...args: T) => void) extends ((arg: infer T1, ...args: infer T2) => void) ? T2 : Never;
type Cons<A, B extends Any[]> = Parameters<(a: A, ...b: Force<B>) => void>;
type Force<T> = { [K in keyof T]: T[K] };
type DeepForce<T> = { [K in keyof T]: DeepForce<T[K]> };
type Reverse<T extends Any[]> = ReverseConcat<T, []>;
type Concat<T extends Any[], S extends Any[]> = ReverseConcat<Reverse<T>, S>;
type ReverseConcat<T extends Any[], S extends Any[]> = {
	"b0": S;
	"b1": ((...args: T) => void) extends ((hd: infer H, ...tl: infer I) => void) ? ReverseConcat<I, Cons<H, S>> : Never;
	"b2": [];
}[
	Finite<T> extends False ? "b2" :
	T extends [] ? "b0" :
	"b1"
];
type Get<T, K> = K extends keyof T ? T[K] : Never;
type Equal<T, S> = T extends S ? (S extends T ? True : False) : False;

type Append<A, B extends Any[]> = Reverse<Cons<A, Reverse<B>>>;

type Bit = 0 | 1;
type Num = Bit[];

type Alt<Arr extends Any[], R extends Any[] = []> = {
	"c0": R;
	"c1":
		((...args: Arr) => void) extends ((a: infer A, b: infer B, ...c: infer C) => void) ? Alt<C, Append<A, R>> :
		((...args: Arr) => void) extends ((a: infer A, ...c: infer C) => void) ? Append<A, R> :
		Never;
	"c2": Never;
}[
	Finite<Arr> extends False ? "c2" :
	[] extends Arr ? "c0" :
	"c1"
];

type Index<Arr extends Any[], I extends Num> = {
	"d0": ((...args: I) => void) extends ((hd: infer Hd, ...tl: infer Tl) => void) ? (Tl extends Num ? Index<Alt<Arr>, Tl> : Never) : Never;
	"d1": ((...args: I) => void) extends ((hd: infer Hd, ...tl: infer Tl) => void) ? (Tl extends Num ? Index<Alt<Tail<Arr>>, Tl> : Never) : Never;
	"d2": Arr[0];
	"d3": Never;
}[
	Finite<I> extends False ? "d3" :
	I extends [] ?  "d2" :
	I[0] extends 0 ? "d0" :
	"d1"
];

type Zero = [0, 0];
type One = [1, 0];
type Two = [0, 1];
type Three = [1, 1];

type BAdd = [[[Zero, One], [One, Two]], [[One, Two], [Two, Three]]];

type Not<N extends Num, R extends Num = []> = {
	"e-1": Never;
	"e0": Not<Tail<N>, Append<1, R>>;
	"e1": Not<Tail<N>, Append<0, R>>;
	"e2": R;
}[
	Finite<N> extends False ? "e-1" :
	N extends [] ? "e2" :
	N[0] extends 0 ? "e0" :
	"e1"
];

type Add<A extends Num, B extends Num, C extends Bit = 0, R extends Num = []> = {
	"f-1": Never;
	"f0": BAdd[Head<A>][Head<B>][C] extends [infer Res, infer Car] ? (
		Car extends Bit ? Add<Tail<A>, Tail<B>, Car, Append<Res, R>> : Never
	) : Never;
	"f1": Add<[0], B, C, R>;
	"f2": Add<A, [0], C, R>;
	"f3": C extends 0 ? R : Append<C, R>;
}[
	Finite<A> extends False ? "f-1" :
	Finite<B> extends False ? "f-1" :
	A extends [] ? (B extends [] ? "f3" : "f1") :
	B extends [] ? "f2" :
	"f0"
];

type Negate<N extends Num> =
	And<N, SIXTEEN_BITS> extends infer A ?
		Not<AsNum<A>> extends infer B ?
			Add<AsNum<B>, [1]>
		: Never
	: Never;

type Mul<A extends Num, B extends Num, R extends Num = []> = {
	"g-1": Never;
	"g0": Mul<Tail<A>, Cons<0, B>, R>;
	"g1": Mul<Tail<A>, Cons<0, B>, Add<B, R>>;
	"g2": R;
}[
	Finite<A> extends False ? "g-1" :
	A extends [] ? "g2" :
	A[0] extends 0 ? "g0" :
	"g1"
];

type Eq<A extends Num, B extends Num> = {
	"h-1": False;
	"h0": A[0] extends B[0] ? (B[0] extends A[0] ? Eq<Tail<A>, Tail<B>> : False) : False;
	"h1": Eq<[0], B>;
	"h2": Eq<A, [0]>;
	"h3": True;
}[
	Finite<A> extends False ? "h-1" :
	Finite<B> extends False ? "h-1" :
	A extends [] ? (B extends [] ? "h3" : "h1") :
	B extends [] ? "h2" :
	"h0"
];

type Lt<A extends Num, B extends Num, R extends boolean = False> = {
	"i-1": Never;
	"i0": Equal<Head<A>, Head<B>> extends True ? Lt<Tail<A>, Tail<B>, R> :
	Head<A> extends 1 ? Lt<Tail<A>, Tail<B>, False> :
	Lt<Tail<A>, Tail<B>, True>;
	"i1": Lt<[0], B, R>;
	"i2": Lt<A, [0], R>;
	"i3": R;
}[
	Finite<A> extends False ? "i-1" :
	Finite<B> extends False ? "i-1" :
	A extends [] ? (B extends [] ? "i3" : "i1") :
	B extends [] ? "i2" :
	"i0"
];

type Bitwise<A extends Num, B extends Num, C extends [[Bit, Bit], [Bit, Bit]], R extends Num = []> = {
	"j-1": Never;
	"j0": Bitwise<Tail<A>, Tail<B>, C, Append<C[Head<A>][Head<B>], R>>;
	"j1": Bitwise<[0], B, C, R>;
	"j2": Bitwise<A, [0], C, R>;
	"j3": R;
}[
	Finite<A> extends False ? "j-1" :
	Finite<B> extends False ? "j-1" :
	A extends [] ? (B extends [] ? "j3" : "j1") :
	B extends [] ? "j2" :
	"j0"
];

type And<A extends Num, B extends Num> = Bitwise<A, B, [[0, 0], [0, 1]]>;
type Or<A extends Num, B extends Num> = Bitwise<A, B, [[0, 1], [1, 1]]>;
type Xor<A extends Num, B extends Num> = Bitwise<A, B, [[0, 1], [1, 0]]>;
type XNor<A extends Num, B extends Num> = Bitwise<A, B, [[1, 0], [0, 1]]>;

type Min<A extends Num, B extends Num> = Lt<A, B> extends True ? A : B;

type Tree = undefined | { "left": Tree, "right": Tree, "key": Num, "value": Num, "s": Num };

type Incr<N extends Num> = Add<N, [1]>;

type MkTree<Key extends Num, Value extends Num, A extends Tree, B extends Tree> = {
	"left": Lt<A extends { "s": infer AN } ? AN : Zero, B extends { "s": infer BN } ? BN : Zero> extends True ? B : A;
	"right": Lt<A extends { "s": infer AN } ? AN : Zero, B extends { "s": infer BN } ? BN : Zero> extends True ? A : B;
	"key": Key;
	"value": Value;
	"s": Incr<Min<A extends { "s": infer AN } ? AN : Zero, B extends { "s": infer BN } ? BN : Zero>>;
};

type RebuildTree<R extends [Num, Num, Tree][], T extends Tree> = {
	"k-1": Never;
	"k0": T;
	"k1": RebuildTree<Tail<R>, MkTree<Head<R>[0], Head<R>[1], Head<R>[2], T>>;
}[
	Finite<R> extends False ? "k-1" :
	R extends [] ? "k0" :
	"k1"
];

type AsNum<T> = T extends Num ? T : Never;
type AsTree<T> = T extends Tree ? T : Never;

type LeftistMerge<A extends Tree, B extends Tree, R extends [Num, Num, Tree][] = []> = {
	"l0": RebuildTree<R, B>;
	"l1": RebuildTree<R, A>;
	"l2": B extends { "right": infer T, "left": infer L, "key": infer K, "value": infer V } ? LeftistMerge<AsTree<T>, A, Cons<[AsNum<K>, AsNum<V>, AsTree<L>], R>> : Never;
	"l3": A extends { "right": infer T, "left": infer L, "key": infer K, "value": infer V } ? LeftistMerge<AsTree<T>, B, Cons<[AsNum<K>, AsNum<V>, AsTree<L>], R>> : Never;
}[
	A extends { "key": infer AK } ? (
		AK extends Num ? (
			B extends { "key": infer BK } ? (
				BK extends Num ? (
					Lt<BK, AK> extends True ? "l2" : "l3"
				) : "l1"
			) : "l1"
		) : "l0"
	) : "l0"
];

type LeftistAdd<T extends Tree, K extends Num, V extends Num> = LeftistMerge<T, MkTree<K, V, undefined, undefined>>;
type LeftistPoll<T extends Tree> = T extends { "key": infer K, "value": infer V, "left": infer L, "right": infer R } ? [K, V, LeftistMerge<AsTree<L>, AsTree<R>>] : Never;

type Registers = [Num, Num, Num, Num];
type Trees = [Tree | undefined, Tree | undefined];

type OrZero<B> = B extends Never | undefined ? 0 : B;

type GetOper<S extends State, Oper extends Num> = [
	[
		// addressing mode 0: immediate
		Tail<Tail<Oper>>,

		// addressing mode 1: register
		Index<S["reg"], Tail<Tail<Oper>>>
	],
	[
		// addressing mode 2: const ptr
		Index<S["prog"], Tail<Tail<Oper>>>,

		// addressing mode 3: reg ptr
		Index<S["prog"], Index<S["reg"], Tail<Tail<Oper>>>>
	]
][OrZero<Index<Oper, [1]>>][OrZero<Index<Oper, []>>];

type ArrSet<Arr extends Any[], Ind extends Num, Val, Cur extends Num = [], Res extends Any[] = []> = {
	"m-1": Never;
	"m0": ArrSet<Tail<Arr>, Ind, Val, Incr<Cur>, Append<Arr[0], Res>>;
	"m1": Concat<Append<Val, Res>, Tail<Arr>>;
	"m2": Res;
}[
	Finite<Arr> extends False ? "m-1" :
	Finite<Ind> extends False ? "m-1" :
	Eq<Ind, Cur> extends True ? "m1" :
	Arr extends [] ? "m2" :
	"m0"
];

type SetPc<S extends State, Pc> = { "prog": S["prog"], "pc": Pc, "reg": S["reg"], "t": S["t"], "stack": S["stack"] };
type SetStack<S extends State, Stack> = { "prog": S["prog"], "pc": S["pc"], "reg": S["reg"], "t": S["t"], "stack": Stack };

type SetOper<S extends State, Oper extends Num, Val extends Num> = [
	[
		// addressing mode 0: immediate
		// you can't set an immedaite...
		Never,

		// addressing mode 1: register
		{ "prog": S["prog"], "pc": S["pc"], "reg": ArrSet<S["reg"], Tail<Tail<Oper>>, Val>, "t": S["t"], "stack": S["stack"] }
	],
	[
		// addressing mode 2: const ptr
		{ "prog": ArrSet<S["prog"], Tail<Tail<Oper>>, Val>, "pc": S["pc"], "reg": S["reg"], "t": S["t"], "stack": S["stack"] },

		// addressing mode 3: reg ptr
		{ "prog": ArrSet<S["prog"], Index<S["reg"], Tail<Tail<Oper>>>, Val>, "pc": S["pc"], "reg": S["reg"], "t": S["t"], "stack": S["stack"] },
	]
][OrZero<Index<Oper, [1]>>][OrZero<Index<Oper, []>>];

type GetTree<S extends State, I extends Num> = Index<S["t"], I>;

type SetTree<S extends State, I extends Num, Val extends Tree | undefined> = {
	"prog": S["prog"];
	"pc": S["pc"];
	"reg": S["reg"];
	"t": ArrSet<S["t"], I, Val>;
	"stack": S["stack"];
};

type SIXTEEN_BITS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

type Step<S extends State> =
	// opcode 0 = hlt src
	| (Eq<Index<S["prog"], S["pc"]>, []> extends False ? Never :
		GetOper<S, Index<S["prog"], Incr<S["pc"]>>>
	)

	// opcode 1 = mov dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [1]> extends False ? Never :
		(
			GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>> extends infer V
			? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, AsNum<V>>, Incr<Incr<Incr<S["pc"]>>>>
			: Never
		)
	)

	// opcode 2 = add dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [0, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<S["pc"]>>>, GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>] extends [infer V1, infer V2]
			? (
				Add<AsNum<V1>, AsNum<V2>> extends infer V
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, AsNum<V>>, Incr<Incr<Incr<S["pc"]>>>>
				: Never
			)
			: Never
		)
	)

	// opcode 3 = mul dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [1, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<S["pc"]>>>, GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>] extends [infer V1, infer V2]
			? (
				Mul<AsNum<V1>, AsNum<V2>> extends infer V
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, AsNum<V>>, Incr<Incr<Incr<S["pc"]>>>>
				: Never
			)
			: Never
		)
	)

	// opcode 4 = and dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [0, 0, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<S["pc"]>>>, GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>] extends [infer V1, infer V2]
			? (
				And<AsNum<V1>, AsNum<V2>> extends infer V
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, Trim<AsNum<V>>>, Incr<Incr<Incr<S["pc"]>>>>
				: Never
			)
			: Never
		)
	)

	// opcode 5 = or dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [1, 0, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<S["pc"]>>>, GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>] extends [infer V1, infer V2]
			? (
				Or<AsNum<V1>, AsNum<V2>> extends infer V
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, AsNum<V>>, Incr<Incr<Incr<S["pc"]>>>>
				: Never
			)
			: Never
		)
	)

	// opcode 6 = xor dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [0, 1, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<S["pc"]>>>, GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>] extends [infer V1, infer V2]
			? (
				Xor<AsNum<V1>, AsNum<V2>> extends infer V
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, Trim<AsNum<V>>>, Incr<Incr<Incr<S["pc"]>>>>
				: Never
			)
			: Never
		)
	)

	// opcode 7 = cmp dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [1, 1, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<S["pc"]>>>, GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>] extends [infer V1, infer V2]
			? (
				Eq<AsNum<V1>, AsNum<V2>> extends True
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, []>, Incr<Incr<Incr<S["pc"]>>>>
				: SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, [1]>, Incr<Incr<Incr<S["pc"]>>>>
			)
			: Never
		)
	)

	// opcode 8 = neg dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [0, 0, 0, 1]> extends False ? Never :
		(
			GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>> extends infer V1
			? (
				Negate<AsNum<V1>> extends infer V
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, Trim<AsNum<V>>>, Incr<Incr<Incr<S["pc"]>>>>
				: Never
			)
			: Never
		)
	)

	// opcode 9 = jal amt
	| (Eq<Index<S["prog"], S["pc"]>, [1, 0, 0, 1]> extends False ? Never :
		GetOper<S, Index<S["prog"], Incr<S["pc"]>>> extends infer V1
		? (And<Add<AsNum<V1>, Incr<Incr<S["pc"]>>>, SIXTEEN_BITS> extends infer P ? SetPc<S, Trim<AsNum<P>>> : Never)
		: Never
	)

	// opcode 10 = jz amt, src
	| (Eq<Index<S["prog"], S["pc"]>, [0, 1, 0, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<S["pc"]>>>, GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>] extends [infer V1, infer V2]
			? (
				Eq<AsNum<V2>, []> extends True
				? (And<Add<AsNum<V1>, Incr<Incr<Incr<S["pc"]>>>>, SIXTEEN_BITS> extends infer P ? SetPc<S, Trim<AsNum<P>>> : Never)
				: SetPc<S, Incr<Incr<Incr<S["pc"]>>>>
			)
			: Never
		)
	)

	// opcode 11 = lpush dst, ksrc, vsrc
	| (Eq<Index<S["prog"], S["pc"]>, [1, 1, 0, 1]> extends False ? Never :
		(
			[
				GetOper<S, Index<S["prog"], Incr<S["pc"]>>>,
				GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>>,
				GetOper<S, Index<S["prog"], Incr<Incr<Incr<S["pc"]>>>>>
			] extends [infer V1, infer V2, infer V3]
			? (
				LeftistAdd<GetTree<S, AsNum<V1>>, AsNum<V2>, AsNum<V3>> extends infer T ?
				(
					T extends Tree ? (
						SetTree<S, AsNum<V1>, T> extends infer SS
						? (SS extends State ? SetPc<SS, Incr<Incr<Incr<Incr<S["pc"]>>>>> : Never)
						: Never
					) : Never
				)
				: Never
			)
			: Never
		)
	)

	// opcode 12 = lpoll kdst, vdst, src
	| (Eq<Index<S["prog"], S["pc"]>, [0, 0, 1, 1]> extends False ? Never :
		(
			[GetOper<S, Index<S["prog"], Incr<Incr<Incr<S["pc"]>>>>>] extends [infer V3]
			? (
				LeftistPoll<GetTree<S, AsNum<V3>>> extends [infer K, infer V, infer T] ? (
					SetTree<
						SetOper<
							SetOper<S, Index<S["prog"], Incr<S["pc"]>>, AsNum<K>>,
							Index<S["prog"], Incr<Incr<S["pc"]>>>,
							AsNum<V>
						>,
						AsNum<V3>,
						AsTree<T>
					> extends infer SS
					? (SS extends State ? SetPc<SS, Incr<Incr<Incr<Incr<S["pc"]>>>>> : Never)
					: Never
				) : Never
			)
			: Never
		)
	)

	// opcode 13 = trunc dst, src
	| (Eq<Index<S["prog"], S["pc"]>, [1, 0, 1, 1]> extends False ? Never :
		(
			GetOper<S, Index<S["prog"], Incr<Incr<S["pc"]>>>> extends infer V1
			? (
				And<SIXTEEN_BITS, AsNum<V1>> extends infer V
				? SetPc<SetOper<S, Index<S["prog"], Incr<S["pc"]>>, Trim<AsNum<V>>>, Incr<Incr<Incr<S["pc"]>>>>
				: Never
			)
			: Never
		)
	)

	// opcode 14 = call dst
	| (Eq<Index<S["prog"], S["pc"]>, [0, 1, 1, 1]> extends False ? Never :
		(
			GetOper<S, Index<S["prog"], Incr<S["pc"]>>> extends infer V
			? (
				SetPc<SetStack<S, Cons<Incr<Incr<S["pc"]>>, S["stack"]>>, V>
			)
			: Never
		)
	)

	// opcode 15 = ret
	| (Eq<Index<S["prog"], S["pc"]>, [1, 1, 1, 1]> extends False ? Never :
		SetPc<SetStack<S, Tail<S["stack"]>>, Head<S["stack"]>>
	)
	;

type Exec<S extends State> = (
	Step<S> extends infer T ?
	{
		"n-1": Never;
		"n0": T extends Num ? NumToNumber<T> : Never;
		"n1": T extends State ? Exec<T> : Never;
	}[
		T extends Never ? "n-1" :
		T extends Num ? "n0" :
		"n1"
	]
	: Never
);

type StepN<S extends State, N extends Num, I extends Num = []> = {
	"o-1": Never;
	"o0": S;
	"o1": Step<S> extends infer T ? (
		T extends Never ? Never :
		T extends Num ? T :
		T extends State ? StepN<T, N, Incr<I>> :
		Never
	) : Never;
}[
	Finite<N> extends False ? "o-1" :
	Eq<N, I> extends True ? "o0" :
	"o1"
];

type StepUntil<S extends State, N extends Num> = {
	"p-1": Never;
	"p0": S;
	"p1": Step<S> extends infer T ? (
		T extends Never ? Never :
		T extends Num ? T :
		T extends State ? StepUntil<T, N> :
		Never
	) : Never;
}[
	Finite<N> extends False ? "p-1" :
	Eq<N, S["pc"]> extends True ? "p0" :
	"p1"
];

type StepUntilFail<S extends State> = (
	Step<S> extends infer T ?
	{
		"n-1": S;
		"n0": T extends Num ? NumToNumber<T> : Never;
		"n1": T extends State ? StepUntilFail<T> : Never;
	}[
		T extends Never ? "n-1" :
		T extends Num ? "n0" :
		"n1"
	]
	: Never
);

type NumToLen<N extends Num, P extends Any[] = [0], R extends Any[] = []> = ({
	"q-1": { "length": Never };
	"q0": ((...args: N) => void) extends ((hd: infer Hd, ...tl: infer Tl) => void) ? NumToLen<AsNum<Tl>, ReverseConcat<P, P>, R> : Never;
	"q1": ((...args: N) => void) extends ((hd: infer Hd, ...tl: infer Tl) => void) ? NumToLen<AsNum<Tl>, ReverseConcat<P, P>, ReverseConcat<P, R>> : Never;
	"q2": R;
}[
	Finite<N> extends False ? "q-1" :
	N extends [] ? "q2" :
	N[0] extends 0 ? "q0" :
	"q1"
]);

type NumToNumber<N extends Num> = NumToLen<Trim<N>>["length"];
type Trim<N extends Num> = TrimRev<Reverse<N>>;
type TrimRev<N extends Num> = {
	"r0": TrimRev<Tail<N>>;
	"r1": Reverse<N>;
	"r2": [];
}[
	N extends [] ? "r2" :
	Head<N> extends 0 ? "r0" :
	"r1"
];

type St<Prog extends Num[]> = {
	"prog": Prog,
	"pc": [1, 1, 0, 0, 1],
	"reg": [[], [], [], []],
	"t": [undefined, undefined],
	"stack": []
};

type ValidInputNum = Num & { "length": 4 };
type ValidInput = [ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum, ValidInputNum];

type DeepWritable<T> = { -readonly [P in keyof T]: DeepWritable<T[P]> };
type ProgChk<I extends ValidInput> = Exec<St<Init<I>>> extends 0 ? Any : Never;
type Init<I extends Num[]> = Concat<
		Cons<[], Cons<[], I>>,
		[
			[1],[1],[0,1,0,1],                                          //   19 entrypoint: mov r0, [@input]
			[1],[1,0,1],[0,0,0,1],                                      //   22 mov r1, @input
			[0,1],[1,0,1],[0,1,0,0,1,0,1,1,1,1],                        //   25 add r1, [@n]
			[1],[1,0,1],[1,1,1],                                        //   28 mov r1, [r1]
			[1,1,1],[1],[1,0,1],                                        //   31 cmp r0, r1
			[1,1,1],[1,0,1],[],                                         //   34 cmp r1, #0
			[0,1],[1],[1,0,1],                                          //   37 add r0, r1
			[1],[1,0,1],[0,0,0,1],                                      //   40 mov r1, @input
			[0,1],[1,0,1],[0,0,1],                                      //   43 add r1, #1
			[1],[1,0,1],[1,1,1],                                        //   46 mov r1, [r1]
			[1,1,1],[1,0,1],[0,0,1,0,0,1],                              //   49 cmp r1, #9
			[0,1],[1],[1,0,1],                                          //   52 add r0, r1
			[0,1,0,1],[0,0,0,1],[1],                                    //   55 jz ~cycle_ok, r0
			[],[0,0,0,1],                                               //   58 hlt #2
			[1],[1],[],                                                 //   60 cycle_ok: mov r0, #0
			[1],[1,0,1],[1],                                            //   63 loopi: mov r1, r0
			[1,1,1],[1,0,1],[0,1,0,0,1,0,1,1,1,1],                      //   66 cmp r1, [@n]
			[0,1,0,1],[0,0,1,0,0,1,1,1],[1,0,1],                        //   69 jz ~loopi_exit, r1
			[1],[1,0,1],[1],                                            //   72 mov r1, r0
			[0,1],[1,0,1],[0,0,0,1],                                    //   75 add r1, @input
			[1,1,0,1],[],[1,1,1],[1],                                   //   78 lpush #0, [r1], r0
			[1],[1,0,1],[1],                                            //   82 mov r1, r0
			[0,1,1,1],[0,0,1,0,1,0,1,1,0,1],                            //   85 call @get_x
			[1],[1,0,0,1],[1,0,1],                                      //   87 mov r2, r1
			[1],[1,0,1],[1],                                            //   90 mov r1, r0
			[0,1],[1,0,1],[0,0,1],                                      //   93 add r1, #1
			[0,1,1,1],[0,0,1,0,1,0,1,1,0,1],                            //   96 call @get_x
			[0,1,1,1],[0,0,0,0,0,1,1,0,1,1],                            //   98 call @abs_diff
			[0,1],[0,1],[1,0,1],                                        //  100 add [@tot], r1
			[1],[1,0,1],[1],                                            //  103 mov r1, r0
			[0,1,1,1],[0,0,1,0,1,0,0,0,1,1],                            //  106 call @get_y
			[1],[1,0,0,1],[1,0,1],                                      //  108 mov r2, r1
			[1],[1,0,1],[1],                                            //  111 mov r1, r0
			[0,1],[1,0,1],[0,0,1],                                      //  114 add r1, #1
			[0,1,1,1],[0,0,1,0,1,0,0,0,1,1],                            //  117 call @get_y
			[0,1,1,1],[0,0,0,0,0,1,1,0,1,1],                            //  119 call @abs_diff
			[0,1],[0,1],[1,0,1],                                        //  121 add [@tot], r1
			[0,1],[1],[0,0,1],                                          //  124 add r0, #1
			[1,0,0,1],[0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],            //  127 jal ~loopi
			[1],[1],[0,1,1,0,1,0,1,1,1,1],                              //  129 loopi_exit: mov r0, [@ans]
			[1],[1,0,1],[0,1],                                          //  132 mov r1, [@tot]
			[1,1,1],[1],[1,0,1],                                        //  135 cmp r0, r1
			[0,1,0,1],[0,0,0,1],[1],                                    //  138 jz ~weight_ok, r0
			[],[0,0,1],                                                 //  141 hlt #1
			[1],[1],[0,0,1],                                            //  143 weight_ok: mov r0, #1
			[0,0,1,1],[1,0,1],[1,0,0,1],[],                             //  146 lpoll r1, r2, #0
			[1],[1,0,1,1],[1],                                          //  150 loopj: mov r3, r0
			[1,1,1],[1,0,1,1],[0,1,0,0,1,0,1,1,1,1],                    //  153 cmp r3, [@n]
			[0,1,0,1],[0,0,0,0,1,0,1],[1,0,1,1],                        //  156 jz ~loopj_exit, r3
			[0,0,1,1],[1,0,0,1],[1,0,1,1],[],                           //  159 lpoll r2, r3, #0
			[1,1,1],[1,0,1],[1,0,0,1],                                  //  163 cmp r1, r2
			[0,1,0,1],[0,0,0,0,0,1],[1,0,1],                            //  166 jz ~fail, r1
			[1],[1,0,1],[1,0,0,1],                                      //  169 mov r1, r2
			[0,1],[1],[0,0,1],                                          //  172 add r0, #1
			[1,0,0,1],[0,0,1,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1],            //  175 jal ~loopj
			[],[0,0,1,1],                                               //  177 fail: hlt #3
			[],[],                                                      //  179 loopj_exit: hlt #0
			[0,1],[1,0,1],[0,0,0,1],                                    //  181 get_x: add r1, @input
			[1],[1,0,1],[1,1,1],                                        //  184 mov r1, [r1]
			[1,1],[1,0,1],[0,0,0,1],                                    //  187 mul r1, #2
			[0,1],[1,0,1],[0,0,0,1,1,0,1,1,1,1],                        //  190 add r1, @data
			[1],[1,0,1],[1,1,1],                                        //  193 mov r1, [r1]
			[1,1,1,1],                                                  //  196 ret
			[0,1],[1,0,1],[0,0,0,1],                                    //  197 get_y: add r1, @input
			[1],[1,0,1],[1,1,1],                                        //  200 mov r1, [r1]
			[1,1],[1,0,1],[0,0,0,1],                                    //  203 mul r1, #2
			[0,1],[1,0,1],[0,0,1],                                      //  206 add r1, #1
			[0,1],[1,0,1],[0,0,0,1,1,0,1,1,1,1],                        //  209 add r1, @data
			[1],[1,0,1],[1,1,1],                                        //  212 mov r1, [r1]
			[1,1,1,1],                                                  //  215 ret
			[0,0,0,1],[1,0,1],[1,0,1],                                  //  216 abs_diff: neg r1, r1
			[0,1],[1,0,1],[1,0,0,1],                                    //  219 add r1, r2
			[1,0,1,1],[1,0,1],[1,0,1],                                  //  222 trunc r1, r1
			[1],[1,0,0,1],[1,0,1],                                      //  225 mov r2, r1
			[0,0,1],[1,0,0,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],    //  228 and r2, #32768
			[1,1,1],[1,0,0,1],[],                                       //  231 cmp r2, #0
			[0,1,0,1],[0,0,0,1,1],[1,0,0,1],                            //  234 jz ~abs_diff_pos, r2
			[0,0,0,1],[1,0,1],[1,0,1],                                  //  237 neg r1, r1
			[1,0,1,1],[1,0,1],[1,0,1],                                  //  240 trunc r1, r1
			[1,1,1,1],                                                  //  243 abs_diff_pos: ret
			[0,0,0,0,1],                                                //  244 n: ! 16
			[0,0,0,0,1,1,1,0,0,0,1],                                    //  245 ans: ! 1136
			[1,0,0,1],                                                  //  246 data: ! 9
			[0,1,0,1,1,0,1,1],                                          //  247 ! 218
			[0,0,0,0,1,1,1,1],                                          //  248 ! 240
			[0,1,0,1,1,0,1,1],                                          //  249 ! 218
			[1,0,0,0,0,0,1,1],                                          //  250 ! 193
			[0,1,1,1,0,1,1,1],                                          //  251 ! 238
			[1,0,0,1,0,1,0,1],                                          //  252 ! 169
			[0,1,0,1,0,0,1,1],                                          //  253 ! 202
			[0,1,0,1,1,1,0,1],                                          //  254 ! 186
			[0,0,0,0,1,0,1,1],                                          //  255 ! 208
			[1,1,0,0,0,0,1,1],                                          //  256 ! 195
			[1,0,0,1,0,0,0,1],                                          //  257 ! 137
			[1,0,1,1,0,0,0,1],                                          //  258 ! 141
			[0,0,0,0,0,0,0,1],                                          //  259 ! 128
			[0,0,0,0,0,0,0,1],                                          //  260 ! 128
			[0,1,0,1,1,0,1],                                            //  261 ! 90
			[1,0,0,0,0,1,0,1],                                          //  262 ! 161
			[1,1,1,0,0,0,1,1],                                          //  263 ! 199
			[1,0,1,0,0,0,1],                                            //  264 ! 69
			[1,0,0,1,1,1,1,1],                                          //  265 ! 249
			[0,1,0,0,1,0,1,1],                                          //  266 ! 210
			[0,1,0,0,0,1,0,1],                                          //  267 ! 162
			[0,1,0,0,1,1,1,1],                                          //  268 ! 242
			[1,1,0,0,0,0,1],                                            //  269 ! 67
			[1,1],                                                      //  270 ! 3
			[1,1,1,1,0,0,1],                                            //  271 ! 79
			[0,0,0,1,0,0,1,1],                                          //  272 ! 200
			[0,1,0,1,1,0,1],                                            //  273 ! 90
			[0,0,0,1,1,0,0,1],                                          //  274 ! 152
			[0,1,0,0,1,0,1],                                            //  275 ! 82
			[1,1,1,0,1,1,0,1],                                          //  276 ! 183
			[1,0,1,1,1,1,1,1],                                          //  277 ! 253
	]>

// This function's body won't be mangled, so let's use some fish names that definitely aren't in the list :)
function f<I>(magikarp: I & (DeepWritable<I> extends infer Inp ? (Inp extends ValidInput ? ProgChk<Inp> : Never) : Never)) {
	let goldeen = (magikarp as any).map((x) => parseInt(x.join(""), 2).toString(16)).join("");
	let stunfisk = "";
	for (let i = 0; i < 1000000; i++) {
		stunfisk = require("crypto").createHash("sha512").update(stunfisk).update(goldeen).digest("hex");
	}
	let feebas = Buffer.from(stunfisk, "hex");
	let remoraid = Buffer.from("0ac503f1627b0c4f03be24bc38db102e39f13d40d33e8f87f1ff1a48f63a02541dc71d37edb35e8afe58f31d72510eafe042c06b33d2e037e8f93cd31cba07d7", "hex");
	for (var i = 0; i < 64; i++) {
        feebas[i] ^= remoraid[i];
    }
	console.log(feebas.toString("utf-8"));
}

f("your input goes here" as const);
