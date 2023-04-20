# Solution by nneonneo
pop eax/pop eax/pop esi/clc/.dx:/
pop edi/.a:/dec dx /mov [esi], dx/
mov ebp, 99/call .x/
add ecx, eax/wait/wait/wait/
test eax, eax/nop/nop/nop/nop/
jne .a/jmp .i/.x:/nop/nop/nop/
push ebx/push esi/nop/nop/
mov eax, ebp/wait/
cmp esi, edi/cld/
je .h/cld/cld/cld/cld/cld/cld/
mov ebx, [esi+4]/cld/
test ebx, ebx/wait/
je .g/jmp .f/.e:/nop/nop/
mov ebx, [ebx]/nop/nop/nop/nop/
test ebx, ebx/nop/nop/
je .g/.f:/wait/wait/wait/
mov esi, [ebx+4]/nop/
mov eax, [esi+4]/nop/
test eax, eax/mov eax, [esi+4]/nop/
jle .e/wait/wait/
mov esi, [esi]/nop/nop/
cmp [esi], dx/je .e/nop/nop/nop/
mov [esi], dx/nop/nop/nop/nop/
push ebp/wait/wait/wait/
cmp eax, ebp/jge .n/cli/
mov ebp, eax/.n:/call .x/cli/
pop ebp/test eax, eax/cli/cli/cli/
jle .e/wait/wait/wait/
nop/nop/nop/nop/nop/nop/nop/
mov ebp, [ebx+4]/nop/nop/
sub [ebp + 4], eax/nop/nop/
nop/wait/wait/wait/wait/wait/
mov ebx, [esi+4]/stc/
pop esi/push esi/.o:/stc/
test ebx, ebx/je .h/stc/stc/
nop/wait/wait/wait/wait/wait/
nop/nop/nop/nop/nop/nop/nop/
mov ebp, [ebx+4]/nop/nop/
cmp [ebp], esi/nop/nop/nop/
je .p/wait/wait/wait/wait/
mov ebx, [ebx]/cmp eax, 2/
jmp .o/std/std/std/std/cmp eax, 2/
.p:/sti/sti/sti/sti/sti/sti/cmp eax, 5/
add [ebp + 4], eax /cmp eax, 5/
jmp .h /nop/nop/nop/nop/nop/
.g: /nop/nop/nop/nop/nop/nop/nop/nop/
xor eax, eax /nop/nop/nop/nop/nop/
.h: /wait/wait/wait/wait/wait/
pop esi /nop/nop/nop/nop/
pop ebx /nop/nop/nop/nop/nop/nop/
ret /nop/nop/nop/nop/nop/nop/nop/
.i:/mov eax, ecx/wait/
