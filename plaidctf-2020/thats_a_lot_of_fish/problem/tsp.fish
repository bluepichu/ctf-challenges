tot: ! 0
tmp: ! 0
input: ! 0 ; this is filled in by the caller
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0
! 0

; check that the cycle has the form [0, 9, ..., 0]

entrypoint: mov r0, [@input]
mov r1, @input
add r1, [@n]
mov r1, [r1]
cmp r0, r1
cmp r1, #0
add r0, r1
mov r1, @input
add r1, #1
mov r1, [r1]
cmp r1, #9
add r0, r1
jz ~cycle_ok, r0
hlt #2

; check the weight of the submitted path

; for i in range [0, n]

cycle_ok: mov r0, #0
loopi: mov r1, r0
cmp r1, [@n]
jz ~loopi_exit, r1

; add ans[ind] to set
mov r1, r0
add r1, @input
lpush #0, [r1], r0

; delta = abs(data[ans[ind]][0] - data[ans[ind + 1]][0])

mov r1, r0
call @get_x
mov r2, r1
mov r1, r0
add r1, #1
call @get_x
call @abs_diff
add [@tot], r1

; delta += abs(data[ind][1] - data[ind + 1][1])

mov r1, r0
call @get_y
mov r2, r1
mov r1, r0
add r1, #1
call @get_y
call @abs_diff
add [@tot], r1

add r0, #1
jal ~loopi

loopi_exit: mov r0, [@ans]
mov r1, [@tot]
cmp r0, r1
jz ~weight_ok, r0
hlt #1

weight_ok: mov r0, #1
lpoll r1, r2, #0

loopj: mov r3, r0
cmp r3, [@n]
jz ~loopj_exit, r3
lpoll r2, r3, #0
cmp r1, r2
jz ~fail, r1
mov r1, r2
add r0, #1
jal ~loopj

fail: hlt #3
loopj_exit: hlt #0



; HELPFUL FUNCTIONS

; r1 <- x(inp[r1])

get_x: add r1, @input
mov r1, [r1]
mul r1, #2
add r1, @data
mov r1, [r1]
ret

; r1 <- y(inp[r1])

get_y: add r1, @input
mov r1, [r1]
mul r1, #2
add r1, #1
add r1, @data
mov r1, [r1]
ret

; r1 <- diff(r1, r2)

abs_diff: neg r1, r1
add r1, r2
trunc r1, r1
mov r2, r1
and r2, #32768
cmp r2, #0
jz ~abs_diff_pos, r2
neg r1, r1
trunc r1, r1
abs_diff_pos: ret




; DATA N SUCH

n: ! 16
ans: ! 1136
data: ! 9
! 218
! 240
! 218
! 193
! 238
! 169
! 202
! 186
! 208
! 195
! 137
! 141
! 128
! 128
! 90
! 161
! 199
! 69
! 249
! 210
! 162
! 242
! 67
! 3
! 79
! 200
! 90
! 152
! 82
! 183
! 253