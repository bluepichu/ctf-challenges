from __future__ import annotations
from typing import (
    Any,
    Callable,
    Deque,
    Generic,
    Optional,
    TypeVar,
    Iterable,
    Union,
    Tuple,
    cast,
)
import itertools

State = TypeVar("State")
State2 = TypeVar("State2")
Symbol = TypeVar("Symbol")


# A class that implements a non-deterministic finite automaton.
class NFA(Generic[State, Symbol]):

    _allowed_symbols: Callable[[], set[Symbol]]
    _allowed_states: Callable[[], set[State]]
    _allowed_transitions: Callable[[State, Symbol], set[State]]
    _start_states: Callable[[], set[State]]
    _state_is_accepting: Callable[[State], bool]

    _current_states: set[State]

    def __init__(
        self,
        allowed_symbols: Callable[[], set[Symbol]],
        allowed_states: Callable[[], set[State]],
        allowed_transitions: Callable[[State, Symbol], set[State]],
        start_states: Callable[[], set[State]],
        state_is_accepting: Callable[[State], bool],
    ):
        self._allowed_symbols = allowed_symbols
        self._allowed_states = allowed_states
        self._allowed_transitions = allowed_transitions
        self._start_states = start_states
        self._state_is_accepting = state_is_accepting
        self.reset()

    def clone(self) -> NFA[State, Symbol]:
        res = NFA(
            allowed_symbols=self._allowed_symbols,
            allowed_states=self._allowed_states,
            allowed_transitions=self._allowed_transitions,
            start_states=self._start_states,
            state_is_accepting=self._state_is_accepting,
        )
        res._current_states = self._current_states.copy()
        return res

    def step(self, symbol: Symbol):
        new_states = set()
        for state in self._current_states:
            new_states.update(self._allowed_transitions(state, symbol))
        self._current_states = new_states

    def stepped(self, symbol: Symbol) -> NFA[State, Symbol]:
        clone = self.clone()
        clone.step(symbol)
        return clone

    def is_in_accepting(self) -> bool:
        return any(self._state_is_accepting(state) for state in self._current_states)

    def reset(self):
        self._current_states = self._start_states()

    def accepts(self, symbols: Iterable[Symbol]) -> bool:
        self.reset()
        for symbol in symbols:
            self.step(symbol)
        return self.is_in_accepting()

    def union(
        self, other: NFA[State2, Symbol]
    ) -> NFA[Tuple[int, Union[State, State2]], Symbol]:
        assert self._allowed_symbols() == other._allowed_symbols()

        def start_states() -> set[Tuple[int, Union[State, State2]]]:
            return {(0, state) for state in self._start_states()}.union(
                {(1, state) for state in other._start_states()}
            )

        def is_accepting(state: Tuple[int, Union[State, State2]]) -> bool:
            if state[0] == 0:
                return self._state_is_accepting(cast(State, state[1]))
            else:
                assert state[0] == 1
                return other._state_is_accepting(cast(State2, state[1]))

        def allowed_states() -> set[Tuple[int, Union[State, State2]]]:
            return {(0, state) for state in self._allowed_states()}.union(
                {(1, state) for state in other._allowed_states()}
            )

        def allowed_transitions(
            state: Tuple[int, Union[State, State2]], symbol: Symbol
        ) -> set[Tuple[int, Union[State, State2]]]:
            if state[0] == 0:
                return {
                    (0, state)
                    for state in self._allowed_transitions(
                        cast(State, state[1]), symbol
                    )
                }
            else:
                assert state[0] == 1
                return {
                    (1, state)
                    for state in other._allowed_transitions(
                        cast(State2, state[1]), symbol
                    )
                }

        prod = NFA(
            allowed_symbols=self._allowed_symbols,
            allowed_states=allowed_states,
            allowed_transitions=allowed_transitions,
            start_states=start_states,
            state_is_accepting=is_accepting,
        )
        return prod

    def concatenate(self, other: NFA[State, Symbol]) -> NFA[State, Symbol]:
        assert self._allowed_symbols() == other._allowed_symbols()
        assert (
            self._allowed_states().intersection(other._allowed_states())
            == other._start_states()
        )
        assert (
            set(filter(self._state_is_accepting, self._allowed_states()))
            == other._start_states()
        ), f"The start states of the second NFA must be the accepting states of the first NFA. Received {self.str_no_pretty()} and {other.str_no_pretty()}"

        def allowed_states() -> set[State]:
            return self._allowed_states().union(other._allowed_states())

        def self_allowed_transitions(state: State, symbol: Symbol) -> set[State]:
            if state in self._allowed_states() and symbol in self._allowed_symbols():
                return self._allowed_transitions(state, symbol)
            else:
                return set()

        def other_allowed_transitions(state: State, symbol: Symbol) -> set[State]:
            if state in other._allowed_states() and symbol in other._allowed_symbols():
                return other._allowed_transitions(state, symbol)
            else:
                return set()

        def allowed_transitions(state: State, symbol: Symbol) -> set[State]:
            self_allowed = self_allowed_transitions(state, symbol)
            other_allowed = other_allowed_transitions(state, symbol)
            return self_allowed.union(other_allowed)

        return NFA(
            allowed_symbols=self._allowed_symbols,
            allowed_states=allowed_states,
            allowed_transitions=allowed_transitions,
            start_states=self._start_states,
            state_is_accepting=other._state_is_accepting,
        )

    # An optimization on union, that avoids blowing up the type of the states.
    #
    # Only works if the two NFAs have disjoint sets of states, except for the
    # start states which must be exactly the same.
    def alternation(self, other: NFA[State, Symbol]) -> NFA[State, Symbol]:
        if self._allowed_symbols() == other._allowed_symbols():
            allowed_symbols = self._allowed_symbols
        else:

            def allowed_symbols() -> set[Symbol]:
                return self._allowed_symbols().union(other._allowed_symbols())

        assert self._start_states() == other._start_states()
        assert (
            self._allowed_states().intersection(other._allowed_states())
            == self._start_states()
        )

        def allowed_states():
            return self._allowed_states().union(other._allowed_states())

        def self_allowed_transitions(state: State, symbol: Symbol) -> set[State]:
            if state in self._allowed_states() and symbol in self._allowed_symbols():
                return self._allowed_transitions(state, symbol)
            else:
                return set()

        def other_allowed_transitions(state: State, symbol: Symbol) -> set[State]:
            if state in other._allowed_states() and symbol in other._allowed_symbols():
                return other._allowed_transitions(state, symbol)
            else:
                return set()

        def allowed_transitions(state: State, symbol: Symbol) -> set[State]:
            self_allowed = self_allowed_transitions(state, symbol)
            other_allowed = other_allowed_transitions(state, symbol)
            return self_allowed.union(other_allowed)

        def state_is_accepting(state: State) -> bool:
            return self._state_is_accepting(state) or other._state_is_accepting(state)

        return NFA(
            allowed_symbols=allowed_symbols,
            allowed_states=allowed_states,
            allowed_transitions=allowed_transitions,
            start_states=self._start_states,
            state_is_accepting=state_is_accepting,
        )

    def convert_to_dfa(self) -> NFA[frozenset[State], Symbol]:
        def allowed_symbols() -> set[Symbol]:
            return self._allowed_symbols()

        def powerset(iterable: Iterable[State]) -> set[frozenset[State]]:
            s = list(iterable)
            return {
                frozenset(combo)
                for i in range(len(s) + 1)
                for combo in itertools.combinations(s, i)
            }

        def allowed_states() -> set[frozenset[State]]:
            return {frozenset(state) for state in powerset(self._allowed_states())}

        def allowed_transitions(
            state: frozenset[State], symbol: Symbol
        ) -> set[frozenset[State]]:
            result = set()
            for s in state:
                result.update(self._allowed_transitions(s, symbol))
            return {frozenset(result)}

        def state_is_accepting(state: frozenset[State]) -> bool:
            return any(self._state_is_accepting(state_) for state_ in state)

        dfa = NFA(
            allowed_symbols=allowed_symbols,
            allowed_states=allowed_states,
            allowed_transitions=allowed_transitions,
            start_states=lambda: {frozenset(self._start_states())},
            state_is_accepting=state_is_accepting,
        )
        return dfa

    def complement(self) -> NFA[frozenset[State], Symbol]:
        dfa = self.convert_to_dfa()
        old_state_is_accepting = dfa._state_is_accepting
        dfa._state_is_accepting = lambda state: not old_state_is_accepting(state)
        return dfa

    def accepts_no_string(self) -> bool:
        return not any(
            self._state_is_accepting(state) for state in self._reachable_states()
        )

    def all_accepted_strings(self, max_len: Optional[int] = None) -> list[list[Symbol]]:
        if self.accepts_no_string():
            return []
        if max_len is not None and max_len < 0:
            return []
        result: list[list[Symbol]] = []
        if self.is_in_accepting():
            result.append([])
        for symbol in self._allowed_symbols():
            s = self.stepped(symbol)
            for suffix in s.all_accepted_strings(
                max_len - 1 if max_len is not None else None
            ):
                result.append([symbol] + suffix)
        return result

    def _reachable_states(self) -> set[State]:
        reachable_states = set(self._current_states)
        queue = Deque(self._current_states)
        while queue:
            state = queue.popleft()
            for symbol in self._allowed_symbols():
                for next_state in self._allowed_transitions(state, symbol):
                    if next_state not in reachable_states:
                        reachable_states.add(next_state)
                        queue.append(next_state)
        return reachable_states

    def _remove_dead_states(self) -> NFA[State, Symbol]:
        reachable_states = self._reachable_states()

        def allowed_states():
            return reachable_states

        def allowed_transitions(state, symbol):
            return self._allowed_transitions(state, symbol).intersection(
                reachable_states
            )

        def state_is_accepting(state):
            return self._state_is_accepting(state)

        return NFA(
            allowed_symbols=self._allowed_symbols,
            allowed_states=allowed_states,
            allowed_transitions=allowed_transitions,
            start_states=self._start_states,
            state_is_accepting=state_is_accepting,
        )

    def optimized(self) -> NFA[int, Symbol]:
        s = self._remove_dead_states()
        states = list(s._start_states()) + list(s._allowed_states() - s._start_states())

        def st(state):
            return states.index(state)

        transitions = {}
        for symbol in self._allowed_symbols():
            for state in states:
                transitions[(st(state), symbol)] = set(
                    map(st, s._allowed_transitions(state, symbol))
                )

        def start_states():
            return {st(state) for state in s._start_states()}

        def allowed_states():
            return set(range(len(states)))

        def allowed_transitions(state, symbol):
            return transitions[state, symbol]

        accepting_states = set(
            map(st, filter(s._state_is_accepting, s._allowed_states()))
        )

        def state_is_accepting(state):
            return state in accepting_states

        return NFA(
            allowed_symbols=self._allowed_symbols,
            allowed_states=allowed_states,
            allowed_transitions=allowed_transitions,
            start_states=start_states,
            state_is_accepting=state_is_accepting,
        )

    def find_intersection(self, other: NFA[Any, Symbol]) -> list[list[Symbol]]:
        t1 = self.complement().optimized()
        t2 = other.complement().optimized()
        t3 = t1.union(t2)
        t4 = t3.complement().optimized()
        return t4.all_accepted_strings()

    def str_no_pretty(self) -> str:
        return f"""
            NFA(
                allowed_symbols={self._allowed_symbols()},
                allowed_states={self._allowed_states()},
                allowed_transitions=lambda ~~ TODO,
                start_states={self._start_states()},
                state_is_accepting=lambda ~~ {set(filter(self._state_is_accepting, self._allowed_states()))},
            )
        """

    def __str__(self) -> str:
        states = list(self._start_states()) + list(
            self._allowed_states() - self._start_states()
        )

        def st(state):
            return states.index(state)

        accepting_states = set(
            map(st, filter(self._state_is_accepting, self._allowed_states()))
        )
        transitions = {
            (st(state), symbol): set(map(st, self._allowed_transitions(state, symbol)))
            for state in self._allowed_states()
            for symbol in self._allowed_symbols()
        }
        nfa_str = f"""
            \u2248NFA(
                allowed_symbols     = {self._allowed_symbols()},
                allowed_states      = {list(range(len(states)))},
                transitions         = {transitions},
                start_states        = {list(map(st, self._start_states()))},
                accepting_states    = {accepting_states},
                current_states      = {list(map(st, self._current_states))},
            )
        """
        return (
            nfa_str
            # hack to make frozensets and sets print nicely
            .replace("frozenset({", "{")
            .replace("})", "}")
            .replace("frozenset()", "{}")
            .replace("set()", "{}")
            # hack to make true/false cleaner
            .replace("True", "⊤")
            .replace("False", "⊥")
        )

    def __repr__(self) -> str:
        return str(self)


class RegexChunk(Generic[Symbol]):
    _kind: str
    _subnodes: list[RegexChunk[Symbol]]
    _literal: Optional[Symbol]

    def __init__(
        self,
        kind: str,
        subnodes: list[RegexChunk[Symbol]] = [],
        literal: Optional[Symbol] = None,
    ):
        self._kind = kind
        self._subnodes = subnodes
        self._literal = literal

    @staticmethod
    def empty() -> RegexChunk[Symbol]:
        return RegexChunk("empty")

    @staticmethod
    def literal(literal: Symbol) -> RegexChunk[Symbol]:
        return RegexChunk(kind="literal", literal=literal)

    @staticmethod
    def concat(*subnodes: RegexChunk[Symbol]) -> RegexChunk[Symbol]:
        return RegexChunk(kind="concat", subnodes=list(subnodes))

    @staticmethod
    def union(*subnodes: RegexChunk[Symbol]) -> RegexChunk[Symbol]:
        return RegexChunk(kind="union", subnodes=list(subnodes))

    @staticmethod
    def optional(subnode: RegexChunk[Symbol]) -> RegexChunk[Symbol]:
        return RegexChunk.union(subnode, RegexChunk.empty())

    def _to_nfa(
        self,
        start_states: set[int],
        fresh_state: int,
        potential_literals: set[Symbol],
    ) -> tuple[NFA[int, Symbol], set[int], int]:
        assert all(fresh_state > s for s in start_states)

        if self._kind == "empty":

            def allowed_transitions(state: int, symbol: Symbol) -> set[int]:
                _ = (state, symbol)  # silence unused variable warning
                return set()

            return (
                NFA(
                    allowed_symbols=lambda: set(),
                    allowed_states=lambda: start_states,
                    allowed_transitions=allowed_transitions,
                    start_states=lambda: start_states,
                    state_is_accepting=lambda state: state in start_states,
                ),
                start_states,
                fresh_state,
            )

        if self._kind == "literal":
            st0s = start_states
            st1 = fresh_state
            fresh_state += 1
            return (
                NFA(
                    allowed_symbols=lambda: potential_literals,
                    allowed_states=lambda: st0s.union({st1}),
                    allowed_transitions=lambda st, symbol: (
                        {st1} if st in st0s and symbol == self._literal else set()
                    ),
                    start_states=lambda: st0s,
                    state_is_accepting=lambda state: state == st1,
                ),
                {st1},
                fresh_state,
            )

        if self._kind == "concat":
            nfa, accepting_states, fresh_state = self._subnodes[0]._to_nfa(
                start_states, fresh_state, potential_literals
            )
            for subnode in self._subnodes[1:]:
                subnfa, accepting_states, fresh_state = subnode._to_nfa(
                    accepting_states, fresh_state, potential_literals
                )
                nfa = nfa.concatenate(subnfa)
            return nfa, accepting_states, fresh_state

        if self._kind == "union":
            nfa, accepting_states, fresh_state = self._subnodes[0]._to_nfa(
                start_states, fresh_state, potential_literals
            )
            for subnode in self._subnodes[1:]:
                subnfa, acc, fresh_state = subnode._to_nfa(
                    start_states, fresh_state, potential_literals
                )
                nfa = nfa.alternation(subnfa)
                accepting_states |= acc
            return nfa, accepting_states, fresh_state

        raise ValueError(f"Unknown kind {self._kind}")

    def to_nfa(self, potential_literals: set[Symbol]) -> NFA[int, Symbol]:
        nfa, _, _ = self._to_nfa(
            start_states={0}, fresh_state=1, potential_literals=potential_literals
        )
        return nfa

    def _potential_literals(self) -> set[Symbol]:
        if self._kind == "empty":
            return set()
        if self._kind == "literal":
            assert self._literal is not None
            return {self._literal}
        if self._kind == "concat":
            return set.union(
                *(subnode._potential_literals() for subnode in self._subnodes)
            )
        if self._kind == "union":
            return set.union(
                *(subnode._potential_literals() for subnode in self._subnodes)
            )
        raise ValueError(f"Unknown kind {self._kind}")

    def possibilities_in_intersection(
        self, other: RegexChunk[Symbol]
    ) -> list[list[Symbol]]:
        potential_literals = self._potential_literals().union(
            other._potential_literals()
        )
        s = self.to_nfa(potential_literals)
        o = other.to_nfa(potential_literals)
        return s.find_intersection(o)
