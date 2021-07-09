# How to deploy

Unfortunately, since we're working with the ancient a.out format, which hasn't had support by default in the Linux kernel for ages, you'll need to load a _patched_ copy `ia32_aout` kernel module.  Once you've done that successfully, there's a simple deploy script that should bring everything up.

## Building and installing the kernel module

First things first: ZMAGIC binaries map address 0, so we need to tell the OS that doing so is ok.  Run `sysctl -w vm.mmap_min_addr="0"` to do this.

The source for the kernel module is located in the `ia32_aout` directory.  You _must_ use a machine running version 5.3 of the linux kernel (specifically, this problem was tested on `5.3.0-45-generic`).  Run `uname -r` to check if you're compatible.

1. `apt install -y 5.3.0-45-generic build-essential make`
2. In the `ia32_aout` directory: `make`
3. `sudo insmod ia32_aout.ko`

The last step should exit cleanly, and you should then be able to succesfully load a.out binaries.  A simple test for this is to run `./netscape` from the `worker` directory.  If you get an error about loading `/lib/ld.so`, then you have **succeeded**.  If you get `Exec format error`, then something went wrong and the kernel module wasn't successfully loaded.  If you get a segfault, then the module loaded but I goofed somewhere, so yell loudly at me.

## Starting the problem

If the above succeeded, all you need to do is run `deploy.sh`.  It will automatically build the containers and launch them when ready.

(Note that simply running `docker-compose up` will _not_ work as the `bttf-worker` container needs to be built as well.)

## Notes about the `bttf-worker` container

This section is not needed to run the problem, it's just documentation on how I got this problem to run under Docker in case we need to do something like this again in the future.

My original implementation for the worker used a userspace loader for the binary and worked fine in my testing environment, but failed outside of it.  This is because it was actually using the kernel module for loading `/lib/ld.so`, but using the userspace loader (via `binfmt_misc`) to load the main binary.  The logical solution then seemed to be to implement a library loader within my userspace loader, but it turns out that `binfmt_misc` doesn't have any way of specifying this, nor did I want to try doing some janky capturing of the `uselib` syscall, so I was going to need a kernel module _anyway_, at which point it seemed like it might be easier to just patch the existing one.

Turns out the only thing wrong with the existing `ia32_aout` module is that it didn't map the text section as executable.  That's it.  It just segfaulted immediately because it wasn't allowed to execute any of the code.

From there it's mostly a matter of putting `ld.so` and `libc.so.4` in the right places, but another issue pops up when running under Docker: under a standard configuration the `uselib` syscall will return `EPERM`.  This is because Docker's default seccomp setting prohibits `uselib`.  The simple workaround to this is to provide your own `seccomp.json` that allows `uselib`; the one I use for the worker is exactly the default except that `uselib` is added to the whitelist.

With all of this working, the only major remaining issue is that Netscape is expecting an X display to connect to.  In the worker we use `Xvfb` to make a virtual display.

## References

I got the Netscape binary from [1], `ld.so` from [2], and `libc.so.4.7.6` from [3].  The key to finding really old binaries, it turns out, is to just search `"name of software" ftp` on Google and use Wayback Machine when you hit 404s.  It's honestly magical.

[1] https://web.archive.org/web/20050315183042if_/http://ftp.die.net:80/mirror/browsers/linux/netscape.i486-unknown-linux.B096.tar.Z
[2] https://www.ibiblio.org/pub/Linux/libs/ld.so-1.5.3.tar.gz
[3] https://www.ibiblio.org/pub/Linux/libs/oldlibs/libc.so.4.7.6.gz
