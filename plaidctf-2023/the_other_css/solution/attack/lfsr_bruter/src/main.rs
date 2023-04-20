#![allow(dead_code, unused_imports)]

use std::collections::BTreeSet;

use clap::Parser;
use indicatif::ProgressBar;
use rayon::prelude::*;

#[derive(Parser, Debug)]
struct Args {
    /// Number of bits in LFSR_A
    #[clap(long)]
    num_bits_a: usize,
    /// Taps for LFSR_A
    #[clap(long)]
    taps_a: u64,
    /// Whether LFSR_A is inverted
    #[clap(long)]
    inverted_a: bool,
    /// Number of bits in LFSR_B
    #[clap(long)]
    num_bits_b: usize,
    /// Taps for LFSR_B
    #[clap(long)]
    taps_b: u64,
    /// Whether LFSR_B is inverted
    #[clap(long)]
    inverted_b: bool,
    /// Enables parallelism over all machine cores (useful only for larger bit sizes)
    #[clap(long)]
    parallel: bool,
    /// Expected output
    #[clap(required = true)]
    expected: Vec<u8>,
}

fn main() {
    let args = Args::parse();

    let valid_input_states = recover(args);

    if valid_input_states.is_empty() {
        println!("unsat");
    } else {
        println!("sat");
        for (st_a, st_b) in &valid_input_states {
            println!("{} {}", st_a, st_b);
        }
    }
}

fn recover(args: Args) -> BTreeSet<(u64, u64)> {
    assert!(args.num_bits_a <= args.num_bits_b);

    // Just stuff to force all the sanity checks to run on the number of bits and taps
    let _ = LfsrTappedOut::new(args.num_bits_a, 0, args.taps_a);
    let _ = LfsrTappedOut::new(args.num_bits_b, 0, args.taps_b);

    let reversal_split_num_bytes = (args.num_bits_b / 8) as usize;
    assert!(
        args.expected.len() > reversal_split_num_bytes,
        "Require sufficiently many bytes to run attack"
    );
    let mid_b_guess_bit_count = args.num_bits_b as usize - (8 * reversal_split_num_bytes);

    eprintln!(
        "[i] Have {} bits of expected output",
        args.expected.len() * 8
    );
    eprintln!(
        "[i] REing LFSR_B from {} bits (+ {} bits guessed)",
        reversal_split_num_bytes * 8,
        mid_b_guess_bit_count
    );
    eprintln!(
        "[i] This leaves {} bits to perform checks",
        (args.expected.len() - reversal_split_num_bytes) * 8
    );

    let progressbar = ProgressBar::new(1 << args.num_bits_a);

    let solutions_from_init_a_guess = |init_a| {
        progressbar.inc(1);
        let lfsr_a = LfsrTappedOut::new(args.num_bits_a, init_a, args.taps_a);
        let bytes_a = lfsr_a
            .take(args.expected.len())
            .map(|x| if args.inverted_a { !x } else { x });
        let mut carry = 0;
        let bytes_b: Vec<u8> = args
            .expected
            .iter()
            .zip(bytes_a)
            .map(|(&exp, a)| {
                // a + b + carry == new_carry * 256 + exp
                let b = exp.wrapping_sub(a.wrapping_add(carry));
                let old_carry = carry;
                carry = (((a as u16) + (b as u16) + (old_carry as u16)) >= 256) as u8;
                debug_assert_eq!(
                    (a as u64) + (b as u64) + (old_carry as u64),
                    (carry as u64) * 256 + (exp as u64)
                );
                b
            })
            .map(|x| if args.inverted_b { !x } else { x })
            .collect();
        (0..1 << mid_b_guess_bit_count).filter_map(move |mid_b_guess| {
            let mid_b_state = {
                let mut st = mid_b_guess;
                for (i, &byte) in bytes_b.iter().take(reversal_split_num_bytes).enumerate() {
                    st += (byte as u64) << i * 8 + mid_b_guess_bit_count;
                }
                st
            };
            let lfsr_b = LfsrTappedOut::new(args.num_bits_b, mid_b_state, args.taps_b);
            if bytes_b
                .iter()
                .skip(reversal_split_num_bytes)
                .zip(lfsr_b)
                .all(|(&exp, res)| exp == res)
            {
                // We've found a good `mid_b_state`, backtrack it to a valid `init_b`
                let mut lfsr_b = LfsrTappedOut::new(args.num_bits_b, mid_b_state, args.taps_b);
                lfsr_b.reverse_bits(reversal_split_num_bytes * 8);
                let init_b = lfsr_b.state;
                Some((init_a, init_b))
            } else {
                // bad mid_b guess
                None
            }
        })
    };

    if args.parallel {
        (0..1 << args.num_bits_a)
            .into_par_iter()
            .flat_map_iter(solutions_from_init_a_guess)
            .collect()
    } else {
        (0..1 << args.num_bits_a)
            .flat_map(solutions_from_init_a_guess)
            .collect()
    }
}

// This `pow2` is just because for some absolutely weird unknown reason, the syntax highlighter
// throws a shit if I write this inline in the functions. Absolutely bonkers. Anyways, splitting
// this off this way will lead to the same generated assembly anyways (even if we we don't specify
// the `inline(always)`, but doing so makes me feel better), so we should be fine.
#[inline(always)]
fn pow2(x: u32) -> u8 {
    1 << x
}

fn expected_bits_to_bytes(bits: &str) -> Vec<u8> {
    // NOTE: This must stay in sync with the way that the LFSR converts bits to bytes

    let bits: Vec<char> = bits.chars().collect();
    bits.chunks_exact(8)
        .map(|c| {
            (0..8)
                .map(|i| {
                    assert!(c[i] == '0' || c[i] == '1');
                    if c[i] == '1' {
                        pow2(i as u32)
                    } else {
                        0
                    }
                })
                .sum()
        })
        .collect()
}

fn bytes_to_bits(bytes: &[u8]) -> Vec<bool> {
    // NOTE: This must stay in sync with the way that the LFSR converts bits -> bytes

    bytes
        .iter()
        .cloned()
        .map(|byte| (0..8).map(move |i| (byte & pow2(i)) != 0))
        .flatten()
        .collect()
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct LfsrTappedOut {
    state: u64,
    taps: u64,
    num_bits: usize,
}

impl LfsrTappedOut {
    fn new(num_bits: usize, state: u64, taps: u64) -> Self {
        assert!(num_bits < 64, "Only LFSRs upto 64 bits are supported");
        assert!(taps < (1 << num_bits), "Taps must fit into LFSR size");
        assert!(taps & 1 == 1, "Taps must be odd, to support state reversal");

        LfsrTappedOut {
            state,
            taps,
            num_bits,
        }
    }

    #[inline(always)]
    fn next_bit(&mut self) -> bool {
        let r = (self.state & self.taps).count_ones() % 2 == 1;
        self.state = (self.state >> 1) | ((r as u64) << (self.num_bits - 1));
        r
    }

    fn next_byte(&mut self) -> u8 {
        (0..8).map(|i| self.next_bit() as u8 * pow2(i)).sum()
    }

    fn reverse_bit(&mut self) {
        let r = (self.state >> (self.num_bits - 1)) & 1;
        self.state = self.state << 1;
        self.state = self.state | ((self.state & self.taps).count_ones() as u64 % 2 != r) as u64;
        self.state = self.state & ((1 << self.num_bits) - 1);
    }

    fn reverse_bits(&mut self, times: usize) {
        // same as just running `self.reverse_bits()` for `times` number of times, but this gives a
        // chance for vectorization to kick in.
        for _ in 0..times / 8 {
            for _ in 0..8 {
                self.reverse_bit();
            }
        }
        for _ in 0..times % 8 {
            self.reverse_bit();
        }
    }
}

impl Iterator for LfsrTappedOut {
    type Item = u8;

    fn next(&mut self) -> Option<Self::Item> {
        Some(self.next_byte())
    }
}

#[cfg(test)]
mod test {
    use crate::{bytes_to_bits, expected_bits_to_bytes, recover, Args, LfsrTappedOut};

    #[test]
    fn lfsr_snapshot_0() {
        let l = LfsrTappedOut::new(25, 0, 0x4001);
        let v = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    #[test]
    fn lfsr_snapshot_1() {
        let l = LfsrTappedOut::new(25, 1, 0x4001);
        let v = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, vec![1, 8, 64, 2, 2, 144, 132, 32, 36, 40]);
    }

    #[test]
    fn lfsr_snapshot_2() {
        let l = LfsrTappedOut::new(25, 1337, 0x4001);
        let v = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, vec![57, 205, 105, 60, 121, 26, 171, 170, 97, 91]);
    }

    #[test]
    fn lfsr_snapshot_3() {
        let l = LfsrTappedOut::new(25, 0x1ff, 0x4001);
        let v = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, vec![255, 249, 207, 129, 253, 115, 156, 24, 35, 32]);
    }

    #[test]
    fn lfsr_snapshot_4() {
        let l = LfsrTappedOut::new(33, 3, 0x23);
        let v = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, vec![2, 0, 0, 32, 6, 0, 0, 2, 10, 0]);
    }

    #[test]
    fn lfsr_snapshot_5() {
        let l = LfsrTappedOut::new(8, 3, 0x23);
        let v = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, vec![146, 103, 175, 213, 177, 140, 62, 32, 121, 246]);
    }

    #[test]
    fn lfsr_reversal_0() {
        let mut l = LfsrTappedOut::new(8, 3, 0x23);
        let orig_l = l.clone();
        let v = (&mut l).take(10).collect::<Vec<_>>();
        assert_ne!(l, orig_l);
        l.reverse_bits(80);
        assert_eq!(l, orig_l);
        let v2 = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, v2);
    }

    #[test]
    fn lfsr_reversal_1() {
        let mut l = LfsrTappedOut::new(25, 1337, 0x4001);
        let orig_l = l.clone();
        let v = (&mut l).take(10).collect::<Vec<_>>();
        assert_ne!(l, orig_l);
        l.reverse_bits(80);
        assert_eq!(l, orig_l);
        let v2 = l.take(10).collect::<Vec<_>>();
        assert_eq!(v, v2);
    }

    #[test]
    fn bits_bytes() {
        let orig_bytes = vec![123, 45, 67, 89];
        let bits = bytes_to_bits(&orig_bytes);
        dbg!(&bits);
        let bitstring: String = bits.iter().map(|&x| if x { '1' } else { '0' }).collect();
        dbg!(&bitstring);
        let bytes = expected_bits_to_bytes(&bitstring);
        assert_eq!(bytes, orig_bytes);
    }

    #[test]
    fn recover_snapshot_0() {
        let r = recover(Args {
            num_bits_a: 8,
            taps_a: 35,
            inverted_a: false,
            num_bits_b: 16,
            taps_b: 35,
            inverted_b: false,
            expected: vec![17, 150, 247, 149, 4, 4, 13, 100, 161, 5],
            parallel: false,
        });
        assert_eq!(r, [(23, 25)].into_iter().collect());
    }
}
