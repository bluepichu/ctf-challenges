# Solution by nneonneo
mov si, 99/jz .mov/
  .l:/call .r/mov ax, si/call .a/mov
  ax, 21514/nop/nop/mov
  bx, 27489/nop/nop/mov
  bp, 28271/nop/nop/mov
  cx, 8293/call .mov/
  mov ax, 8293/mov
  bx, 28516/mov
  cx, 28279/nop/nop/nop/mov
  bp, 8236/call .mov/
  mov bp, 8308/mov
  ax, 24944/nop/nop/mov
  bx, 29555/mov
  cx, 26912/call .mov/nop/nop/mov
  ax, 29281/nop/nop/mov
  cx, 25710/nop/mov
  bx, 30063/nop/mov
  bp, 10/dec dx/call .mov/
  dec si/call .r/nop/mov
  al, 10/mov dl, 1/mov
  dl, 1/call .mov/test si, si/jnz .l/mov
  ax, ax/hlt/.a:/aam/mov
  di, ax/test ah, ah/mov
  al, ah/jz .m/call .e/.m:/mov
  ax, di/call .e/mov
  ax, 25120/mov
  cx, 27764/nop/nop/mov
  bp, 29541/mov
  ax, ax/nop/nop/mov
  bx, 29807/nop/mov
  dx, 8/cmp si, 1/jnz .t/mov
  dx, 7/.t:/call .mov/nop/nop/nop/nop/nop/mov
  ax, 28448/nop/nop/mov
  bx, 8294/nop/nop/nop/mov
  cx, 25954/nop/nop/mov
  bp, 29285/mov
  dx, 8/call .mov/ret/.b:/mov
  ax, 28448/mov
  cx, 26740/nop/nop/mov
  bx, 8302/mov
  bp, 8293/call .mov/
  mov ax, 24951/nop/mov
  cl, 10/nop/nop/mov
  dx, 5/nop/nop/nop/mov
  bx, 27756/nop/call .mov/
  ret/.r:/nop/nop/nop/nop/mov
  ax, si/call .a/call .b/mov
  ax, ax/ret/.e:/nop/nop/nop/mov
  dx, 1/add al, 48/.mov:/
  push bp/push cx/push bx/mov
  ax, ax/push ax/mov ecx, esp/mov
  ax, 4/nop/nop/nop/mov
  bx, 1/int 128/mov
  ax, ax/add esp, 8/ret/jmp .mov
