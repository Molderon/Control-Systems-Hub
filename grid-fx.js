/* grid-fx.js — cycling background grid modes */
(function () {
    'use strict';

    const canvas = document.getElementById('grid-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // CSS grid elements — hidden during hex mode
    const gridLinesEl = document.querySelector('.grid-lines');
    const gridGlowEl  = document.querySelector('.grid-glow');

    let W, H, t = 0, modeT = 0, modeIdx = 0, lastTs = 0, lastDt = 0.016;

    /* New mode state */
    let golGrid = null, golNextGrid = null, golCols = 0, golRows = 0, golTick = 0;
    let sierpPt = null;
    /* New mode state — Industry/Robots/Twins/OS/CodeHumor */
    let cobotItems = null;
    let osBranches = null, osStars = [];
    let cppGraphNodes = null, cppMemGrid = null;

    let currentModeDuration = 40 + Math.random() * 60;  // 40–100 s for first mode
    let restDuration = 5 + Math.random() * 10;           // 5–15 s for first rest
    let restPhase    = false;   // true = canvas clear, CSS square grid visible
    // Shuffle-deck picker: each mode plays exactly once per cycle before any repeats
    let modeDeck = [];
    let lastPlayedIdx = -1;
    const FADE = 1.44;
    const DIM  = 0.70;

    const ac  = a => `rgba(0,255,255,${a})`;
    const ac2 = a => `rgba(255,0,255,${a})`;
    const wh  = a => `rgba(180,220,255,${a})`;
    const amb = a => `rgba(255,185,0,${a})`;
    const grn = a => `rgba(57,255,20,${a})`;

    const eio  = x => x < 0.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
    const lerp = (a,b,v) => a+(b-a)*v;

    /* ══════════════════════════════════════════════════════════════════════════
       SHARED HELPERS
    ══════════════════════════════════════════════════════════════════════════ */
    function drawTerminalPanel(PX, PY, PW, PH, headerText) {
        const HDR = 28;
        ctx.fillStyle = 'rgba(0,8,10,0.18)';
        ctx.fillRect(PX, PY, PW, PH);
        ctx.strokeStyle = ac(0.22); ctx.lineWidth = 1;
        ctx.strokeRect(PX, PY, PW, PH);
        ctx.strokeStyle = ac(0.44); ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(PX,PY+18); ctx.lineTo(PX,PY); ctx.lineTo(PX+18,PY);
        ctx.moveTo(PX+PW-18,PY+PH); ctx.lineTo(PX+PW,PY+PH); ctx.lineTo(PX+PW,PY+PH-18);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,255,255,0.055)';
        ctx.fillRect(PX, PY, PW, HDR);
        ctx.fillStyle = ac(0.48);
        ctx.font = '700 8px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
        ctx.fillText(headerText, PX+8, PY+17);
        if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = ac(0.52); ctx.fillText('█', PX+PW-16, PY+17); }
        return HDR;
    }

    function drawLogLines(log, modeT, PX, PY, PW, PH, HDR) {
        const LH = 13;
        const maxLines = Math.floor((PH - HDR - 16) / LH);
        const vis = log.filter(l => l.at <= modeT && l.k !== 'sep');
        const shown = vis.slice(Math.max(0, vis.length - maxLines));
        ctx.save();
        ctx.beginPath(); ctx.rect(PX+2, PY+HDR, PW-4, PH-HDR-14); ctx.clip();
        shown.forEach((line, i) => {
            ctx.font = '8px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
            ctx.fillStyle = line.k==='cmd' ? ac(0.42) : line.k==='hi' ? ac(0.55) : line.k==='ok' ? grn(0.52) : wh(0.26);
            ctx.fillText(line.s, PX+8, PY+HDR+(i+1)*LH);
        });
        ctx.restore();
        return shown.length;
    }

    function arrowHead(x,y,dx,dy,color) {
        ctx.fillStyle=color; ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x-dy*4-dx*8,y+dx*4-dy*8);
        ctx.lineTo(x+dy*4-dx*8,y-dx*4-dy*8);
        ctx.fill();
    }

    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x+r,y); c.lineTo(x+w-r,y);
        c.quadraticCurveTo(x+w,y,x+w,y+r);
        c.lineTo(x+w,y+h-r);
        c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
        c.lineTo(x+r,y+h);
        c.quadraticCurveTo(x,y+h,x,y+h-r);
        c.lineTo(x,y+r);
        c.quadraticCurveTo(x,y,x+r,y);
        c.closePath();
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE A : EMBEDDED COMPILE  (right-side terminal)
    ══════════════════════════════════════════════════════════════════════════ */
    const CLOG = [
        { at:  0.0,  k:'cmd', s:'> arm-none-eabi-gcc 10.3.1' },
        { at:  0.6,  k:'cmd', s:'> cmake --build . --target ctrl-fw' },
        { at:  1.2,  k:'dim', s:'[  0%] src/main.c.obj' },
        { at:  1.55, k:'dim', s:'[  8%] src/gpio_drv.c.obj' },
        { at:  1.85, k:'dim', s:'[ 16%] src/uart_hal.c.obj' },
        { at:  2.10, k:'hi',  s:'[ 24%] src/pid_ctrl.c.obj' },
        { at:  2.35, k:'dim', s:'[ 32%] src/sensor_hal.c.obj' },
        { at:  2.60, k:'dim', s:'[ 40%] src/pwm_drv.c.obj' },
        { at:  2.85, k:'dim', s:'[ 48%] src/adc_dma.c.obj' },
        { at:  3.10, k:'dim', s:'[ 56%] src/i2c_bus.c.obj' },
        { at:  3.35, k:'hi',  s:'[ 64%] src/rtos_tasks.c.obj' },
        { at:  3.60, k:'hi',  s:'[ 72%] src/kalman_filt.c.obj' },
        { at:  3.90, k:'hi',  s:'[ 80%] src/ctrl_loop.c.obj' },
        { at:  4.45, k:'cmd', s:'[ 88%] Linking: ctrl-fw.elf' },
        { at:  5.40, k:'ok',  s:'[100%] Build complete.' },
        { at:  5.65, k:'sep', s:'' },
        { at:  5.80, k:'cmd', s:'Memory region    Used    Size   %' },
        { at:  6.05, k:'hi',  s:'FLASH:          48532  1048576  4.6%' },
        { at:  6.30, k:'hi',  s:'RAM:             8944   196608  4.5%' },
        { at:  6.55, k:'dim', s:'CCMRAM:              0   65536  0.0%' },
        { at:  7.00, k:'sep', s:'' },
        { at:  7.15, k:'cmd', s:'> openocd -f stm32f4discovery.cfg \\' },
        { at:  7.50, k:'cmd', s:'  -c "program ctrl-fw.elf verify reset"' },
        { at:  8.00, k:'ok',  s:'JTAG: STM32F407VGTx  [FOUND]' },
        { at:  8.30, k:'dim', s:'Target voltage: 3.28V' },
        { at:  8.60, k:'hi',  s:'Flashing \u2192 0x08000000...' },
        { at: 12.60, k:'ok',  s:'Verify: PASS' },
        { at: 13.00, k:'ok',  s:'Target reset.' },
        { at: 13.30, k:'sep', s:'' },
        { at: 13.50, k:'ok',  s:'[BOOT] STM32F407 @ 168 MHz' },
        { at: 14.00, k:'dim', s:'[INIT] AHB/APB clocks ... OK' },
        { at: 14.50, k:'dim', s:'[INIT] UART2 115200 8N1 ... OK' },
        { at: 15.00, k:'dim', s:'[INIT] SPI1 10 MHz CS=PA4 ... OK' },
        { at: 15.50, k:'hi',  s:'[INIT] PID Kp=2.0 Ki=0.4 Kd=0.1 ... OK' },
        { at: 16.00, k:'hi',  s:'[MAIN] ctrl-loop @ 1 kHz  \u25b6' },
    ];

    function drawEmbeddedCompile(t, modeT) {
        const PW=Math.min(306,W*0.27), PX=W-38-PW, PY=H*0.06, PH=H*0.87;
        const HDR = drawTerminalPanel(PX, PY, PW, PH, 'STM32F407 :: arm-none-eabi-gcc');
        const LH = 13, shown = drawLogLines(CLOG, modeT, PX, PY, PW, PH, HDR);

        if (modeT >= 8.6 && modeT <= 12.6) {
            const prog = Math.min(1, (modeT-8.6)/4.0);
            const barY = PY+HDR+(shown+1)*LH, barW = PW-20;
            ctx.fillStyle = ac(0.10); ctx.fillRect(PX+8,barY,barW,9);
            ctx.fillStyle = ac(0.45); ctx.fillRect(PX+8,barY,barW*prog,9);
            ctx.fillStyle = grn(0.48); ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='right';
            ctx.fillText(`${(prog*100).toFixed(0)}%`, PX+PW-6, barY+8);
        }
        if (modeT >= 16.02) {
            const age = modeT-16.02;
            const e = 2.2*Math.exp(-0.30*age)*Math.sin(t*2.3+0.4);
            const u = 1.9*e+0.35*Math.cos(t*1.56);
            const y = 1.5*(1-Math.exp(-0.28*age))*Math.sin(t*1.86+0.7);
            const lY = PY+HDR+(shown+1)*LH;
            ctx.fillStyle=ac(0.42); ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(`[CTRL] e=${e>=0?'+':''}${e.toFixed(3)}  u=${u>=0?'+':''}${u.toFixed(3)}  y=${y>=0?'+':''}${y.toFixed(3)}`, PX+8, lY);
        }

        const tlX=38,tlY=70,tlW=200,tlH=74;
        ctx.fillStyle='rgba(0,8,10,0.14)'; ctx.fillRect(tlX,tlY,tlW,tlH);
        ctx.strokeStyle=ac(0.18); ctx.lineWidth=1; ctx.strokeRect(tlX,tlY,tlW,tlH);
        ctx.strokeStyle=ac(0.36); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(tlX,tlY+13); ctx.lineTo(tlX,tlY); ctx.lineTo(tlX+13,tlY); ctx.stroke();
        ctx.fillStyle=ac(0.38); ctx.font='700 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('// BOARD INFO', tlX+6, tlY+11);
        [['Board','STM32F407 Discovery'],['MCU','Cortex-M4 @ 168 MHz'],['FLASH','1024 KB   RAM: 192 KB'],['Compiler','arm-none-eabi-gcc 10']].forEach(([k,v],i)=>{
            const ly=tlY+23+i*12; ctx.fillStyle=ac(0.26); ctx.fillText(k+':',tlX+6,ly); ctx.fillStyle=wh(0.24); ctx.fillText(v,tlX+54,ly);
        });
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE B : GDB DEBUG SESSION  (right-side terminal)
    ══════════════════════════════════════════════════════════════════════════ */
    const GLOG = [
        { at:  0.0,  k:'cmd', s:'> arm-none-eabi-gdb ctrl-fw.elf' },
        { at:  0.7,  k:'cmd', s:'(gdb) target remote localhost:3333' },
        { at:  1.4,  k:'ok',  s:'0x08000178 in Reset_Handler ()' },
        { at:  2.0,  k:'cmd', s:'(gdb) monitor reset halt' },
        { at:  2.5,  k:'dim', s:'target state: halted' },
        { at:  3.0,  k:'dim', s:'PC: 0x08000178  CPSR: 0x01000000' },
        { at:  3.6,  k:'cmd', s:'(gdb) break pid_ctrl.c:42' },
        { at:  4.1,  k:'ok',  s:'Breakpoint 1 at 0x0800234c: line 42' },
        { at:  4.6,  k:'cmd', s:'(gdb) break sensor_hal.c:87' },
        { at:  5.1,  k:'ok',  s:'Breakpoint 2 at 0x08003a10: line 87' },
        { at:  5.6,  k:'cmd', s:'(gdb) continue' },
        { at:  6.8,  k:'hi',  s:'Breakpoint 1, pid_update()' },
        { at:  7.1,  k:'dim', s:'  42: pid->err = setpoint - input;' },
        { at:  7.5,  k:'cmd', s:'(gdb) print pid->err' },
        { at:  7.9,  k:'hi',  s:'$1 = 0.15500000119  [float]' },
        { at:  8.3,  k:'cmd', s:'(gdb) print pid->integral' },
        { at:  8.7,  k:'hi',  s:'$2 = 0.62099998474  [float]' },
        { at:  9.1,  k:'cmd', s:'(gdb) x/8xw 0x20000200' },
        { at:  9.6,  k:'dim', s:'0x20000200:  3f000000  3dcccccd' },
        { at:  9.9,  k:'dim', s:'0x20000208:  3c23d70a  3f4ccccd' },
        { at: 10.3,  k:'cmd', s:'(gdb) step' },
        { at: 10.8,  k:'dim', s:'  43: output = Kp*err + Ki*intgrl;' },
        { at: 11.3,  k:'cmd', s:'(gdb) print pid->output' },
        { at: 11.7,  k:'hi',  s:'$3 = 0.69000005722  [float]' },
        { at: 12.1,  k:'cmd', s:'(gdb) continue' },
        { at: 13.2,  k:'hi',  s:'Breakpoint 2, sensor_read()' },
        { at: 13.5,  k:'dim', s:'  87: raw = ADC1->DR & 0x0FFF;' },
        { at: 13.9,  k:'cmd', s:'(gdb) info registers r0 r1 r2' },
        { at: 14.3,  k:'dim', s:'r0  0x00000d4b  3403' },
        { at: 14.5,  k:'dim', s:'r1  0x20000200  536871424' },
        { at: 14.7,  k:'dim', s:'r2  0x00000000  0' },
        { at: 15.1,  k:'cmd', s:'(gdb) continue' },
        { at: 16.0,  k:'ok',  s:'[Running at 168 MHz ...]' },
    ];

    function drawGDB(t, modeT) {
        const PW=Math.min(306,W*0.27), PX=W-38-PW, PY=H*0.06, PH=H*0.87;
        const HDR = drawTerminalPanel(PX, PY, PW, PH, 'STM32F407 :: arm-none-eabi-gdb');
        const shown = drawLogLines(GLOG, modeT, PX, PY, PW, PH, HDR);

        if (modeT >= 16.02) {
            const LH = 13;
            const r0 = (0xd4b + Math.floor(Math.sin(t*1.1)*40)) & 0xffff;
            const r1 = 0x20000200;
            const r2 = Math.floor((Math.cos(t*0.9)*0.5+0.5)*0xff);
            const lY = PY+HDR+(shown+1)*LH;
            ctx.fillStyle=wh(0.28); ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(`r0  0x${r0.toString(16).padStart(8,'0')}  ${r0}`, PX+8, lY);
            ctx.fillText(`r1  0x${r1.toString(16).padStart(8,'0')}`, PX+8, lY+LH);
            ctx.fillStyle=ac(0.42);
            ctx.fillText(`r2  0x${r2.toString(16).padStart(8,'0')}  ${r2}`, PX+8, lY+LH*2);
        }

        const tlX=38,tlY=70,tlW=200,tlH=86;
        ctx.fillStyle='rgba(0,8,10,0.14)'; ctx.fillRect(tlX,tlY,tlW,tlH);
        ctx.strokeStyle=ac(0.18); ctx.lineWidth=1; ctx.strokeRect(tlX,tlY,tlW,tlH);
        ctx.strokeStyle=ac(0.36); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(tlX,tlY+13); ctx.lineTo(tlX,tlY); ctx.lineTo(tlX+13,tlY); ctx.stroke();
        ctx.fillStyle=ac(0.38); ctx.font='700 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('// CALL STACK', tlX+6, tlY+11);
        ['#0  pid_update()','#1  ctrl_loop_tick()','#2  TIM2_IRQHandler()','#3  ?? (NVIC)'].forEach((f,i)=>{
            const ly=tlY+23+i*14;
            ctx.fillStyle=i===0?ac(0.45):wh(i===1?0.22:0.14);
            ctx.font=(i===0?'700 ':'')+'7px "JetBrains Mono",monospace';
            ctx.fillText(f, tlX+6, ly);
        });
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE C : NETWORK TOPOLOGY  (peripheral band)
    ══════════════════════════════════════════════════════════════════════════ */
    let topoNodes=null, topoEdges=null, topoPackets=[];

    function peripheralXY() {
        const q=Math.floor(Math.random()*4);
        if(q===0) return [W*0.03+Math.random()*W*0.94, H*0.03+Math.random()*H*0.24];
        if(q===1) return [W*0.03+Math.random()*W*0.94, H*0.73+Math.random()*H*0.24];
        if(q===2) return [W*0.02+Math.random()*W*0.18, H*0.23+Math.random()*H*0.54];
        return             [W*0.80+Math.random()*W*0.18, H*0.23+Math.random()*H*0.54];
    }

    function initTopo() {
        topoNodes=[];
        const sL=['api.ctrl-sys','db.main:5432','mesh.ctrl'];
        const rL=['rtr-0A','rtr-1F','rtr-2C','rtr-3B','rtr-4D'];
        let si=0,ri=0;
        for(let i=0;i<20;i++){
            const type=i<3?'server':i<8?'router':'client';
            const [x,y]=peripheralXY();
            topoNodes.push({x,y,type,label:type==='server'?sL[si++]:type==='router'?rL[ri++]:`node-${(i-8).toString(16).toUpperCase()}`,phase:Math.random()*Math.PI*2});
        }
        topoEdges=[];
        const thr=Math.min(W,H)*0.33;
        for(let i=0;i<topoNodes.length;i++)
            for(let j=i+1;j<topoNodes.length;j++){
                const dx=topoNodes[i].x-topoNodes[j].x,dy=topoNodes[i].y-topoNodes[j].y;
                if(Math.sqrt(dx*dx+dy*dy)<thr) topoEdges.push([i,j]);
            }
        topoPackets=[];
    }

    function drawTopology(t) {
        if(!topoNodes) initTopo();
        if(topoEdges.length&&Math.random()<0.04){
            const e=topoEdges[Math.floor(Math.random()*topoEdges.length)];
            topoPackets.push({edge:e,p:0,speed:0.13+Math.random()*0.28,rev:Math.random()<0.5});
        }
        topoPackets.forEach(pk=>{pk.p+=lastDt*pk.speed;});
        topoPackets=topoPackets.filter(pk=>pk.p<1);
        topoEdges.forEach(([i,j])=>{
            const a=topoNodes[i],b=topoNodes[j];
            ctx.strokeStyle=ac(0.09); ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        });
        topoPackets.forEach(pk=>{
            const[i,j]=pk.edge;
            const a=pk.rev?topoNodes[j]:topoNodes[i],b=pk.rev?topoNodes[i]:topoNodes[j];
            ctx.fillStyle=ac2(0.52);
            ctx.fillRect(lerp(a.x,b.x,pk.p)-2.5,lerp(a.y,b.y,pk.p)-2.5,5,5);
        });
        topoNodes.forEach(n=>{
            const pulse=Math.sin(t*0.84+n.phase)*0.5+0.5;
            const r=n.type==='server'?7:n.type==='router'?5:3.5;
            ctx.fillStyle=n.type==='server'?ac(0.58):n.type==='router'?wh(0.40):ac(0.26);
            ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill();
            if(n.type!=='client'){
                ctx.strokeStyle=ac((1-pulse)*0.10); ctx.lineWidth=1;
                ctx.beginPath(); ctx.arc(n.x,n.y,r+pulse*22,0,Math.PI*2); ctx.stroke();
                ctx.fillStyle=n.type==='server'?ac(0.26):wh(0.20);
                ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='left';
                ctx.fillText(n.label,n.x+r+5,n.y+3);
            }
        });
        ctx.font='8px "JetBrains Mono",monospace'; ctx.fillStyle=ac(0.22); ctx.textAlign='right';
        ctx.fillText(`NODES  ${topoNodes.length}`,W-48,H-56);
        ctx.fillText(`EDGES  ${topoEdges.length}`,W-48,H-44);
        ctx.fillText(`PKT/s  ${topoPackets.length}`,W-48,H-32);
        ctx.textAlign='left';
    }

    /* MODE D : ADAPTIVE PID + NEURAL NETWORK */
    function drawBlockDiagram(t, modeT) {
        // Layout
        const loopY = H * 0.28, fbY = H * 0.44;
        const sumX = W*0.13, sumR = 16, BH = H*0.085;
        const pidX1=W*0.24, pidX2=W*0.52, pidMX=(pidX1+pidX2)/2;
        const plX1 =W*0.62, plX2=W*0.83,  plMX=(plX1+plX2)/2;
        const outX =W*0.90;
        const nnCX = pidMX, nnY = H*0.62, nnW = pidX2-pidX1, nnH = H*0.18;

        // Simulated adaptive gains
        const Kp = 2.00 + 0.26*Math.sin(t*0.38);
        const Ki = 0.40 + 0.11*Math.sin(t*0.55+1.1);
        const Kd = 0.10 + 0.05*Math.sin(t*0.47+2.3);
        const settle = Math.min(1, modeT/22);
        const yOut = settle*(1-Math.exp(-0.38*(t%10)))*Math.sin(t*1.15+0.2)*(1-settle*0.45);
        const eVal = -yOut*0.32, eDot = -yOut*0.12, eInt = yOut*0.18;

        // Background
        ctx.fillStyle='rgba(0,255,255,0.010)';
        ctx.fillRect(W*0.04, H*0.06, W*0.92, H*0.88);

        // r(t) input
        ctx.strokeStyle=ac(0.28); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(W*0.04,loopY); ctx.lineTo(sumX-sumR-2,loopY); ctx.stroke();
        arrowHead(sumX-sumR-2,loopY,1,0,ac(0.28));
        ctx.fillStyle=ac(0.28); ctx.font='9px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('r(t)',W*0.08,loopY-8);

        // Summing junction
        ctx.strokeStyle=ac(0.40); ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(sumX,loopY,sumR,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle=ac(0.38); ctx.font='bold 13px serif'; ctx.textAlign='center';
        ctx.fillText('+',sumX-6,loopY+4);
        ctx.fillStyle=ac2(0.32); ctx.fillText('−',sumX+6,loopY+5);

        // error line
        ctx.strokeStyle=ac(0.28); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(sumX+sumR,loopY); ctx.lineTo(pidX1-2,loopY); ctx.stroke();
        arrowHead(pidX1-2,loopY,1,0,ac(0.28));
        ctx.fillStyle=ac(0.26); ctx.font='9px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('e(t)',(sumX+sumR+pidX1)*0.5,loopY-8);

        // ADAPTIVE PID block
        ctx.strokeStyle=ac(0.42); ctx.lineWidth=1.5;
        ctx.strokeRect(pidX1,loopY-BH/2,pidX2-pidX1,BH);
        ctx.fillStyle='rgba(0,255,255,0.038)';
        ctx.fillRect(pidX1,loopY-BH/2,pidX2-pidX1,BH);
        ctx.fillStyle=ac(0.60); ctx.font='700 10px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('ADAPTIVE PID',pidMX,loopY-6);
        ctx.font='7px "JetBrains Mono",monospace';
        ctx.fillStyle=ac(0.42);  ctx.fillText(`Kp=${Kp.toFixed(3)}`,pidMX-42,loopY+9);
        ctx.fillStyle=amb(0.55); ctx.fillText(`Ki=${Ki.toFixed(3)}`,pidMX,    loopY+9);
        ctx.fillStyle=ac2(0.45); ctx.fillText(`Kd=${Kd.toFixed(3)}`,pidMX+42, loopY+9);

        // u(t) line
        ctx.strokeStyle=ac(0.28); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(pidX2,loopY); ctx.lineTo(plX1-2,loopY); ctx.stroke();
        arrowHead(plX1-2,loopY,1,0,ac(0.28));
        ctx.fillStyle=ac(0.26); ctx.font='9px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('u(t)',(pidX2+plX1)*0.5,loopY-8);

        // Plant block
        ctx.strokeStyle=wh(0.38); ctx.lineWidth=1.5;
        ctx.strokeRect(plX1,loopY-BH/2,plX2-plX1,BH);
        ctx.fillStyle='rgba(180,220,255,0.025)';
        ctx.fillRect(plX1,loopY-BH/2,plX2-plX1,BH);
        ctx.fillStyle=wh(0.55); ctx.font='700 10px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('PLANT',plMX,loopY-6);
        ctx.fillStyle=wh(0.28); ctx.font='7px "JetBrains Mono",monospace';
        ctx.fillText('G(s)=1/(s²+2ζs+ω²)',plMX,loopY+9);

        // Output
        ctx.strokeStyle=wh(0.28); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(plX2,loopY); ctx.lineTo(outX,loopY); ctx.stroke();
        ctx.fillStyle=wh(0.55); ctx.beginPath(); ctx.arc(outX,loopY,4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=wh(0.30); ctx.font='9px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('y(t)',outX+8,loopY+4);

        // Feedback loop
        ctx.strokeStyle=ac2(0.28); ctx.lineWidth=1.4; ctx.setLineDash([4,8]);
        ctx.beginPath();
        ctx.moveTo(outX,loopY); ctx.lineTo(outX,fbY);
        ctx.lineTo(sumX,fbY);   ctx.lineTo(sumX,loopY+sumR+2);
        ctx.stroke(); ctx.setLineDash([]);
        arrowHead(sumX,loopY+sumR+2,0,1,ac2(0.28));
        ctx.fillStyle=ac2(0.22); ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('feedback',(outX+sumX)*0.5,fbY+12);

        // Signal dots on loop
        const LP=[[W*0.04,loopY],[sumX-sumR,loopY],[sumX+sumR,loopY],[pidX1,loopY],
                  [pidX2,loopY],[plX1,loopY],[plX2,loopY],[outX,loopY],
                  [outX,fbY],[sumX,fbY],[sumX,loopY+sumR]];
        const nSeg=LP.length-1;
        for(let d=0;d<3;d++){
            const ph=(t*0.45+d/3)%1, rs=ph*nSeg, si=Math.floor(rs);
            if(si>=nSeg) continue;
            const sf=rs-si, [ax,ay]=LP[si], [bx,by]=LP[si+1];
            ctx.fillStyle=si>=8?ac2(0.65):si>=6?wh(0.70):ac(0.70);
            ctx.beginPath(); ctx.arc(lerp(ax,bx,sf),lerp(ay,by,sf),3.5,0,Math.PI*2); ctx.fill();
        }

        // NEURAL NETWORK ADAPTIVE BLOCK (below PID)
        ctx.fillStyle='rgba(255,0,255,0.035)';
        roundRect(ctx,nnCX-nnW/2,nnY-nnH/2,nnW,nnH,5); ctx.fill();
        ctx.strokeStyle=ac2(0.38); ctx.lineWidth=1.5;
        roundRect(ctx,nnCX-nnW/2,nnY-nnH/2,nnW,nnH,5); ctx.stroke();
        ctx.fillStyle=ac2(0.58); ctx.font='700 9px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('NEURAL ADAPT',nnCX,nnY-nnH/2+13);

        const iX=nnCX-nnW/2+18, hX=nnCX, oX=nnCX+nnW/2-18;
        const iYs=[nnY-nnH*0.28, nnY, nnY+nnH*0.28];
        const hYs=[nnY-nnH*0.32, nnY-nnH*0.10, nnY+nnH*0.10, nnY+nnH*0.32];
        const oYs=[nnY-nnH*0.22, nnY, nnY+nnH*0.22];
        const iLbls=['e(t)','ė(t)','∫e']; const oLbls=['ΔKp','ΔKi','ΔKd'];
        const iVals=[eVal, eDot, eInt];
        const bpFlash = Math.sin(t*Math.PI/5) > 0.75;

        iYs.forEach((iy,ii) => hYs.forEach((hy,hi) => {
            const w=Math.sin(t*0.14+ii*1.3+hi*0.9)*0.4+0.5;
            ctx.strokeStyle=ac2(bpFlash?0.30:0.06+w*0.09); ctx.lineWidth=0.8;
            ctx.beginPath(); ctx.moveTo(iX+5,iy); ctx.lineTo(hX-5,hy); ctx.stroke();
        }));
        hYs.forEach((hy,hi) => oYs.forEach((oy,oi) => {
            const w=Math.sin(t*0.17+hi*0.8+oi*1.4)*0.4+0.5;
            ctx.strokeStyle=ac2(bpFlash?0.32:0.07+w*0.11); ctx.lineWidth=0.8;
            ctx.beginPath(); ctx.moveTo(hX+5,hy); ctx.lineTo(oX-5,oy); ctx.stroke();
        }));

        iYs.forEach((iy,i)=>{
            const act=Math.min(1,Math.abs(iVals[i])/0.4);
            ctx.fillStyle=ac(0.18+act*0.38);
            ctx.beginPath(); ctx.arc(iX,iy,5,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=ac(0.50); ctx.lineWidth=1; ctx.stroke();
            ctx.fillStyle=ac(0.38); ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='right';
            ctx.fillText(iLbls[i],iX-7,iy+2);
        });
        hYs.forEach((hy,i)=>{
            const act=(Math.sin(t*0.28+i*1.1)+1)*0.5;
            ctx.fillStyle=ac2(0.10+act*0.26);
            ctx.beginPath(); ctx.arc(hX,hy,5,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=ac2(bpFlash?0.62:0.30); ctx.lineWidth=1; ctx.stroke();
        });
        const deltas=[Kp-2.0, Ki-0.4, Kd-0.10];
        oYs.forEach((oy,i)=>{
            const act=Math.min(1,Math.abs(deltas[i])*5);
            ctx.fillStyle=amb(0.18+act*0.38);
            ctx.beginPath(); ctx.arc(oX,oy,5,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=amb(0.55); ctx.lineWidth=1; ctx.stroke();
            ctx.fillStyle=amb(0.48); ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(oLbls[i],oX+7,oy+2);
        });

        ctx.strokeStyle=amb(0.22); ctx.lineWidth=1; ctx.setLineDash([2,5]);
        [[0,pidMX-42,loopY+BH/2],[1,pidMX,loopY+BH/2],[2,pidMX+42,loopY+BH/2]].forEach(([i,gx,gy])=>{
            ctx.beginPath(); ctx.moveTo(oX,oYs[i]); ctx.lineTo(gx,gy); ctx.stroke();
        });
        ctx.strokeStyle=ac(0.15); ctx.setLineDash([2,4]);
        ctx.beginPath(); ctx.moveTo(sumX+sumR,loopY); ctx.lineTo(sumX+sumR,nnY);
        ctx.lineTo(nnCX-nnW/2,nnY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle=amb(0.24); ctx.font='7px "JetBrains Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('gain adaptation',nnCX,nnY-nnH/2-7);
        if(bpFlash){
            ctx.fillStyle=ac2(0.48); ctx.font='700 7px "JetBrains Mono",monospace';
            ctx.fillText('▶ BACKPROP',nnCX,nnY+nnH/2+13);
        }

        // Oscilloscope (right side)
        const scX=W*0.62, scY=H*0.52, scW=W*0.29, scH=H*0.24;
        ctx.fillStyle='rgba(0,255,255,0.022)'; ctx.fillRect(scX,scY,scW,scH);
        ctx.strokeStyle=ac(0.18); ctx.lineWidth=1; ctx.strokeRect(scX,scY,scW,scH);
        ctx.fillStyle=ac(0.22); ctx.font='700 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('RESPONSE  y(t)',scX+6,scY+11);
        const smid=scY+scH*0.5;
        ctx.strokeStyle=ac(0.10); ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(scX+4,smid); ctx.lineTo(scX+scW-4,smid); ctx.stroke();
        ctx.strokeStyle=grn(0.55); ctx.lineWidth=1.5;
        ctx.beginPath();
        for(let xi=0;xi<=scW-10;xi+=2){
            const ts=(xi/(scW-10))*12;
            const env=Math.exp(-0.32*ts)*(1-settle*0.68);
            const y=smid-((1-env)+env*Math.sin(ts*1.2)*0.8-0.5)*scH*0.48;
            xi===0?ctx.moveTo(scX+5+xi,y):ctx.lineTo(scX+5+xi,y);
        }
        ctx.stroke();
        ctx.fillStyle=grn(0.30); ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='right';
        ctx.fillText(`settle=${(settle*100).toFixed(0)}%`,scX+scW-6,scY+scH-6);
        ctx.fillStyle=wh(0.28); ctx.textAlign='right';
        ctx.fillText(`y=${yOut.toFixed(3)}  e=${eVal.toFixed(3)}`,W-36,H*0.88);
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE E : GRADIENT DESCENT
    ══════════════════════════════════════════════════════════════════════════ */
    const lossF=(w1,w2)=>w1*w1+5*Math.pow(w2-0.25*w1,2);
    const gradF=(w1,w2)=>{const z=w2-0.25*w1;return[2*w1-2.5*z,10*z];};
    let gdPaths=null;

    function initGrad(){
        const gd=[[2.4,1.8]];
        for(let i=0;i<80;i++){const[w1,w2]=gd[gd.length-1],[g1,g2]=gradF(w1,w2);gd.push([w1-0.08*g1,w2-0.08*g2]);}
        const sgd=[[2.4,1.8]];
        for(let i=0;i<80;i++){const[w1,w2]=sgd[sgd.length-1],[g1,g2]=gradF(w1,w2);sgd.push([w1-0.12*(g1+(Math.random()-0.5)*0.42),w2-0.12*(g2+(Math.random()-0.5)*0.42)]);}
        const mom=[[2.4,1.8]];let v1=0,v2=0;
        for(let i=0;i<80;i++){const[w1,w2]=mom[mom.length-1],[g1,g2]=gradF(w1,w2);v1=0.85*v1+0.15*g1;v2=0.85*v2+0.15*g2;mom.push([w1-0.18*v1,w2-0.18*v2]);}
        gdPaths={gd,sgd,mom};
    }

    function drawGradientDescent(t,modeT){
        if(!gdPaths) initGrad();
        const MG=38,pw=Math.min(320,W*0.30),ph=Math.min(240,H*0.34);
        const px1=W-MG-pw,py2=H-MG,py1=py2-ph;
        const toS=(w1,w2)=>[px1+(w1+3)/6*pw,py2-(w2+2.5)/5*ph];
        ctx.fillStyle='rgba(0,8,10,0.14)';ctx.fillRect(px1,py1,pw,ph);
        ctx.strokeStyle=ac(0.18);ctx.lineWidth=1;ctx.strokeRect(px1,py1,pw,ph);
        ctx.strokeStyle=ac(0.34);ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(px1,py1+15);ctx.lineTo(px1,py1);ctx.lineTo(px1+15,py1);
        ctx.moveTo(px1+pw-15,py2);ctx.lineTo(px1+pw,py2);ctx.lineTo(px1+pw,py2-15);ctx.stroke();
        const[ox,oy]=toS(0,0);
        ctx.strokeStyle=ac(0.12);ctx.lineWidth=1;ctx.setLineDash([2,6]);
        ctx.beginPath();ctx.moveTo(px1,oy);ctx.lineTo(px1+pw,oy);ctx.moveTo(ox,py1);ctx.lineTo(ox,py2);ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle=ac(0.20);ctx.font='8px "JetBrains Mono",monospace';ctx.textAlign='center';
        ctx.fillText('\u03b81',px1+pw-7,oy-6);ctx.fillText('\u03b82',ox+9,py1+11);
        [0.3,0.9,2.0,3.8,6.2,9.5].forEach((k,ci)=>{
            const r1=Math.sqrt(k),r2=Math.sqrt(k/5);
            ctx.strokeStyle=ac(ci<2?0.26:ci<4?0.14:0.07);ctx.lineWidth=ci<2?1.0:0.7;
            ctx.beginPath();
            for(let s=0;s<=100;s++){const th=(s/100)*Math.PI*2;const[sx,sy]=toS(r1*Math.cos(th),0.25*r1*Math.cos(th)+r2*Math.sin(th));s===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);}
            ctx.closePath();ctx.stroke();
        });
        const[mx,my]=toS(0,0);
        ctx.fillStyle=ac(0.62);ctx.beginPath();ctx.arc(mx,my,4,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=ac(0.22);ctx.lineWidth=1;ctx.setLineDash([2,5]);
        ctx.beginPath();ctx.arc(mx,my,9,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        const steps=Math.floor(Math.min(1,modeT/(MODE_DURATION*0.65))*79);
        [{pts:gdPaths.gd,c:ac(0.48),lw:1.6},{pts:gdPaths.sgd,c:ac2(0.36),lw:1.2},{pts:gdPaths.mom,c:amb(0.42),lw:1.6}].forEach(({pts,c,lw})=>{
            if(steps<1)return;ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.beginPath();
            for(let i=0;i<=steps&&i<pts.length;i++){const[sx,sy]=toS(pts[i][0],pts[i][1]);i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);}
            ctx.stroke();
            const h=pts[Math.min(steps,pts.length-1)],[hx,hy]=toS(h[0],h[1]);
            ctx.fillStyle=c;ctx.beginPath();ctx.arc(hx,hy,3.5,0,Math.PI*2);ctx.fill();
        });
        ctx.fillStyle=ac(0.26);ctx.font='700 8px "JetBrains Mono",monospace';ctx.textAlign='left';
        ctx.fillText('// GRAD DESCENT',px1+5,py1-6);
        const lcX=38,lcY=72,lcW=132,lcH=68;
        ctx.fillStyle='rgba(0,8,10,0.14)';ctx.fillRect(lcX,lcY,lcW,lcH);
        ctx.strokeStyle=ac(0.14);ctx.lineWidth=1;ctx.strokeRect(lcX,lcY,lcW,lcH);
        ctx.fillStyle=ac(0.22);ctx.font='7px "JetBrains Mono",monospace';ctx.textAlign='left';
        ctx.fillText('LOSS vs ITER',lcX+3,lcY-4);
        const L0=lossF(gdPaths.gd[0][0],gdPaths.gd[0][1]);
        [{pts:gdPaths.gd,c:ac(0.42)},{pts:gdPaths.sgd,c:ac2(0.28)},{pts:gdPaths.mom,c:amb(0.36)}].forEach(({pts,c})=>{
            ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();
            for(let i=0;i<=steps&&i<pts.length;i++){const lv=lossF(pts[i][0],pts[i][1]);const cx2=lcX+(i/79)*lcW,cy2=lcY+lcH-(lv/L0)*lcH*0.90;i===0?ctx.moveTo(cx2,cy2):ctx.lineTo(cx2,cy2);}
            ctx.stroke();
        });
        [[ac(0.34),'GD'],[ac2(0.24),'SGD'],[amb(0.30),'MOM']].forEach(([c,l],i)=>{
            ctx.fillStyle=c;ctx.fillRect(lcX+2,lcY+lcH+5+i*10,8,5);
            ctx.fillStyle=ac(0.20);ctx.font='7px "JetBrains Mono",monospace';
            ctx.fillText(l,lcX+13,lcY+lcH+10+i*10);
        });
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE F : ROCKETRY / TRAJECTORY  (bottom-left, brighter)
    ══════════════════════════════════════════════════════════════════════════ */
    function drawRocketry(t){
        const ox=W*0.08,oy=H*0.88,sx=W*0.52,sy=H*0.36;
        ctx.setLineDash([3,10]);ctx.lineWidth=1;
        for(let i=1;i<=4;i++){
            const y=oy-(i/4)*sy;ctx.strokeStyle=ac(0.07);ctx.beginPath();ctx.moveTo(ox,y);ctx.lineTo(ox+sx,y);ctx.stroke();
            ctx.fillStyle=ac(0.17);ctx.font='8px "JetBrains Mono",monospace';ctx.textAlign='right';ctx.fillText(`${i*125} km`,ox-6,y+4);
        }
        ctx.setLineDash([]);
        ctx.strokeStyle=ac(0.30);ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(ox,oy+10);ctx.lineTo(ox,oy-sy-20);ctx.moveTo(ox-10,oy);ctx.lineTo(ox+sx+20,oy);ctx.stroke();
        ctx.fillStyle=ac(0.30);
        [[ox,oy-sy-20,0,-1],[ox+sx+20,oy,1,0]].forEach(([x,y,dx,dy])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-dy*5-dx*9,y+dx*5-dy*9);ctx.lineTo(x+dy*5-dx*9,y-dx*5-dy*9);ctx.fill();});
        ctx.strokeStyle=ac(0.15);ctx.lineWidth=1;ctx.fillStyle=ac(0.19);ctx.font='8px "JetBrains Mono",monospace';ctx.textAlign='center';
        for(let i=0;i<=5;i++){const x=ox+(i/5)*sx;ctx.beginPath();ctx.moveTo(x,oy-4);ctx.lineTo(x,oy+4);ctx.stroke();ctx.fillText(`T+${i*72}s`,x,oy+15);}
        ctx.fillText('TIME (s)',ox+sx*0.5,oy+29);
        ctx.save();ctx.translate(ox-44,oy-sy*0.5);ctx.rotate(-Math.PI/2);ctx.fillText('ALT (km)',0,0);ctx.restore();
        ctx.strokeStyle=ac(0.36);ctx.lineWidth=2;ctx.beginPath();
        for(let i=0;i<=100;i++){const xn=i/100,yn=4*xn*(1-xn);i===0?ctx.moveTo(ox+xn*sx,oy-yn*sy):ctx.lineTo(ox+xn*sx,oy-yn*sy);}ctx.stroke();
        ctx.strokeStyle=ac2(0.22);ctx.lineWidth=1.4;ctx.setLineDash([5,8]);ctx.beginPath();
        for(let i=0;i<=100;i++){const xn=i/100,yn=3.4*Math.pow(xn,0.75)*Math.pow(1-xn,1.25);i===0?ctx.moveTo(ox+xn*sx,oy-yn*sy):ctx.lineTo(ox+xn*sx,oy-yn*sy);}ctx.stroke();ctx.setLineDash([]);
        const rp=(t*0.045)%1,rx=ox+rp*sx,ry=oy-4*rp*(1-rp)*sy;
        ctx.fillStyle=ac(0.62);ctx.beginPath();ctx.arc(rx,ry,5,0,Math.PI*2);ctx.fill();
        const slope=4*(1-2*rp),ang=Math.atan2(-slope*sy/sx,1),vLen=32;
        ctx.strokeStyle=ac2(0.36);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-Math.cos(ang)*vLen,ry-Math.sin(ang)*vLen);ctx.stroke();
        const tip={x:rx-Math.cos(ang)*vLen,y:ry-Math.sin(ang)*vLen};
        ctx.fillStyle=ac2(0.36);ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(tip.x+Math.cos(ang+0.52)*8,tip.y+Math.sin(ang+0.52)*8);ctx.lineTo(tip.x+Math.cos(ang-0.52)*8,tip.y+Math.sin(ang-0.52)*8);ctx.fill();
        const apx=ox+0.5*sx,apy=oy-sy;
        ctx.strokeStyle=ac(0.14);ctx.lineWidth=1;ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(apx,oy);ctx.lineTo(apx,apy);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=ac(0.26);ctx.font='8px "JetBrains Mono",monospace';ctx.textAlign='left';ctx.fillText('APOGEE',apx+5,apy+11);
        ctx.fillStyle=ac(0.24);ctx.textAlign='right';
        ctx.fillText('\u0394v  =  3.200 km/s',W-48,62);ctx.fillText('ISP =  450.0 s',W-48,74);ctx.fillText('m\u2080  =  12400 kg',W-48,86);
        ctx.textAlign='left';
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE G : NEURAL NETWORK FORWARD PASS  (ML/DL)
    ══════════════════════════════════════════════════════════════════════════ */
    const NLOG = [
        { at:  0.0, k:'cmd', s:'> python train.py --lr 0.001' },
        { at:  0.8, k:'dim', s:'Init weights (He normal)' },
        { at:  1.4, k:'dim', s:'Dataset: 60000 samples loaded' },
        { at:  2.0, k:'hi',  s:'Epoch  1/40  loss=2.301 acc=11%' },
        { at:  2.8, k:'hi',  s:'Epoch  4/40  loss=1.843 acc=38%' },
        { at:  3.6, k:'hi',  s:'Epoch  8/40  loss=1.220 acc=62%' },
        { at:  4.4, k:'ok',  s:'Epoch 12/40  loss=0.891 acc=74%' },
        { at:  5.2, k:'ok',  s:'Epoch 16/40  loss=0.670 acc=81%' },
        { at:  6.2, k:'ok',  s:'Epoch 20/40  loss=0.513 acc=85%' },
        { at:  7.2, k:'ok',  s:'Epoch 24/40  loss=0.404 acc=88%' },
        { at:  8.4, k:'ok',  s:'Epoch 28/40  loss=0.330 acc=90%' },
        { at: 10.0, k:'ok',  s:'Epoch 32/40  loss=0.278 acc=91%' },
        { at: 12.0, k:'ok',  s:'Epoch 36/40  loss=0.240 acc=92%' },
        { at: 14.0, k:'ok',  s:'Epoch 40/40  loss=0.211 acc=93%' },
        { at: 14.8, k:'sep', s:'' },
        { at: 15.0, k:'cmd', s:'> model.eval()' },
        { at: 15.6, k:'hi',  s:'Test acc: 91.4%  val_loss: 0.234' },
        { at: 16.2, k:'ok',  s:'Saving: ctrl_net_v3.pt' },
    ];

    function drawNeuralNet(t, modeT) {
        // Network area: left 52% of screen, vertically centred
        const LAYERS = [3, 5, 4, 2];
        const LNAMES = ['INPUT', 'HIDDEN\u2081', 'HIDDEN\u2082', 'OUTPUT'];
        const NX = W*0.06, NY = H*0.14, NW = W*0.46, NH = H*0.72;
        const colW = NW / (LAYERS.length - 1);

        // Node positions
        const nodes = LAYERS.map((count, li) => {
            const x = NX + li * colW;
            return Array.from({length: count}, (_, ni) => ({
                x, y: NY + NH * (ni + 1) / (count + 1)
            }));
        });

        // Forward pass wave: cycles every 3.5s
        const passPhase = (modeT % 3.5) / 3.5;
        const activeLayer = Math.floor(passPhase * (LAYERS.length + 1));

        // Connections
        for (let li = 0; li < LAYERS.length - 1; li++) {
            nodes[li].forEach(a => {
                nodes[li+1].forEach(b => {
                    const w = Math.abs(Math.sin((a.y + b.y) * 0.027 + li * 1.4));
                    const alpha = (li < activeLayer) ? w * 0.24 : 0.06;
                    ctx.strokeStyle = w > 0.5 ? ac(alpha) : ac2(alpha * 0.7);
                    ctx.lineWidth = 0.7;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                });
            });
        }

        // Neurons
        nodes.forEach((layer, li) => {
            layer.forEach((n, ni) => {
                const act = Math.sin(t * (1.2 + ni * 0.3) + li * 1.1) * 0.5 + 0.5;
                const isActive = li <= activeLayer;
                const r = li === 0 ? 6 : li === LAYERS.length - 1 ? 8 : 5;
                const col = li === LAYERS.length - 1 ? ac2 : ac;

                if (isActive) {
                    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.5);
                    g.addColorStop(0, col(act * 0.18));
                    g.addColorStop(1, col(0));
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI*2); ctx.fill();
                }

                ctx.strokeStyle = isActive ? col(0.42 + act * 0.38) : wh(0.14);
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.stroke();

                if (isActive) {
                    ctx.fillStyle = col(act * 0.15);
                    ctx.fill();
                }
            });

            // Layer label
            ctx.fillStyle = ac(0.20); ctx.font = '700 7px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
            ctx.fillText(LNAMES[li], layer[0].x, NY - 10);
        });

        // Right terminal
        const PW = Math.min(260, W*0.22), PX = W-36-PW, PY = H*0.06, PH = H*0.87;
        const HDR = drawTerminalPanel(PX, PY, PW, PH, 'CTRL-NET :: torch-train');
        drawLogLines(NLOG, modeT, PX, PY, PW, PH, HDR);

        // Live stats at bottom
        if (modeT > 2.0) {
            const epoch = Math.min(40, Math.floor((modeT / MODE_DURATION) * 40));
            const loss  = (2.3 * Math.exp(-0.09 * epoch) + 0.18).toFixed(3);
            const acc   = Math.min(93, Math.round((1 - Math.exp(-0.12 * epoch)) * 100));
            ctx.font = '700 8px "JetBrains Mono",monospace'; ctx.textAlign = 'left';
            ctx.fillStyle = ac(0.28);   ctx.fillText(`EPOCH: ${epoch}/40`, NX, H*0.92);
            ctx.fillStyle = ac2(0.26);  ctx.fillText(`LOSS: ${loss}`, NX+90, H*0.92);
            ctx.fillStyle = grn(0.26);  ctx.fillText(`ACC: ${acc}%`, NX+185, H*0.92);
        }
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE H : FINITE STATE MACHINE  (control-loop FSM spread across screen)
    ══════════════════════════════════════════════════════════════════════════ */
    const FSM_STATES = [
        { id:'IDLE',      rx:0.10, ry:0.18 },
        { id:'INIT',      rx:0.45, ry:0.07 },
        { id:'CTRL_RUN',  rx:0.84, ry:0.18 },
        { id:'MONITOR',   rx:0.88, ry:0.72 },
        { id:'FAULT',     rx:0.52, ry:0.90 },
        { id:'SAFE_HALT', rx:0.10, ry:0.72 },
    ];
    // [from, to, label]
    const FSM_EDGES = [
        [0,1,'start()'], [1,2,'hw_ok()'], [2,3,'tick()'],
        [3,2,'ok()'], [3,4,'error()'], [4,5,'estop()'],
        [5,0,'reset()'], [2,5,'E_STOP'],
    ];
    const FSM_SEQ = [0,1,2,3,2,3,4,5,0,1,2,3,4,5,0];

    function drawFSM(t, modeT) {
        const sX = s => s.rx * W, sY = s => s.ry * H;

        // Current state from timeline
        const seqStep = Math.floor(modeT / 2.5);
        const transT  = eio((modeT % 2.5) / 2.5);
        const curIdx  = FSM_SEQ[seqStep % FSM_SEQ.length];
        const nxtIdx  = FSM_SEQ[(seqStep + 1) % FSM_SEQ.length];
        const curEdge = FSM_EDGES.find(([a,b]) => a === curIdx && b === nxtIdx);

        // Edges
        FSM_EDGES.forEach(([ai, bi, lbl]) => {
            const a = FSM_STATES[ai], b = FSM_STATES[bi];
            const isActive = curEdge && curEdge[0] === ai && curEdge[1] === bi;
            ctx.strokeStyle = isActive ? ac(0.36) : ac(0.09);
            ctx.lineWidth   = isActive ? 1.4 : 0.8;
            ctx.setLineDash(isActive ? [] : [4,10]);
            ctx.beginPath(); ctx.moveTo(sX(a), sY(a)); ctx.lineTo(sX(b), sY(b)); ctx.stroke();
            ctx.setLineDash([]);

            // Arrow on target node edge
            const dx = sX(b)-sX(a), dy = sY(b)-sY(a), len = Math.hypot(dx,dy);
            const ndx = dx/len, ndy = dy/len, offR = 34;
            arrowHead(sX(b)-ndx*offR, sY(b)-ndy*offR, ndx, ndy, isActive ? ac(0.36) : ac(0.09));

            // Label midpoint
            ctx.fillStyle = isActive ? ac(0.28) : ac(0.09);
            ctx.font = '7px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
            ctx.fillText(lbl, (sX(a)+sX(b))/2, (sY(a)+sY(b))/2 - 5);
        });

        // Animated packet on active edge
        if (curEdge) {
            const [ai, bi] = curEdge;
            const px = lerp(sX(FSM_STATES[ai]), sX(FSM_STATES[bi]), transT);
            const py = lerp(sY(FSM_STATES[ai]), sY(FSM_STATES[bi]), transT);
            ctx.fillStyle = ac(0.75);
            ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill();
        }

        // State nodes
        const BW = 64, BH = 26;
        FSM_STATES.forEach((s, i) => {
            const sx2 = sX(s), sy2 = sY(s);
            const isCur  = i === curIdx;
            const isNext = i === nxtIdx;

            if (isCur) {
                const g = ctx.createRadialGradient(sx2, sy2, 0, sx2, sy2, 50);
                g.addColorStop(0, ac(0.10)); g.addColorStop(1, ac(0));
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(sx2, sy2, 50, 0, Math.PI*2); ctx.fill();
            }

            ctx.fillStyle   = isCur ? 'rgba(0,255,255,0.06)' : 'rgba(0,8,10,0.14)';
            ctx.strokeStyle = isCur ? ac(0.52) : isNext ? ac(0.24) : ac(0.12);
            ctx.lineWidth   = isCur ? 1.5 : 1;
            roundRect(ctx, sx2-BW/2, sy2-BH/2, BW, BH, 4);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = isCur ? ac(0.82) : isNext ? ac(0.34) : ac(0.18);
            ctx.font = (isCur ? '700 ' : '') + '8px "JetBrains Mono",monospace';
            ctx.textAlign = 'center';
            ctx.fillText(s.id, sx2, sy2 + 3);
        });

        ctx.fillStyle = ac(0.20); ctx.font = '700 8px "JetBrains Mono",monospace'; ctx.textAlign = 'left';
        ctx.fillText('// CTRL-LOOP FSM', 46, H-32);
        ctx.fillStyle = ac(0.15); ctx.font = '7px "JetBrains Mono",monospace';
        ctx.fillText(`ACTIVE: ${FSM_STATES[curIdx].id}`, 46, H-20);
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE I : KALMAN FILTER  (state estimation visualisation)
    ══════════════════════════════════════════════════════════════════════════ */
    let kalmanMeas = null;

    function initKalman() {
        kalmanMeas = [];
        for (let i = 0; i <= 200; i++) {
            const xn    = i / 200;
            const truth = Math.sin(xn * Math.PI * 3) * 0.80 + xn * 0.30;
            kalmanMeas.push({ xn, truth, meas: truth + (Math.random()-0.5)*0.55 });
        }
    }

    function drawKalman(t, modeT) {
        if (!kalmanMeas) initKalman();

        // Plot area: right half, vertically centred
        const PX=W*0.48, PY=H*0.12, PW=W*0.46, PH=H*0.55;

        ctx.fillStyle='rgba(0,8,10,0.15)'; ctx.fillRect(PX,PY,PW,PH);
        ctx.strokeStyle=ac(0.18); ctx.lineWidth=1; ctx.strokeRect(PX,PY,PW,PH);
        ctx.strokeStyle=ac(0.38); ctx.lineWidth=1.4;
        ctx.beginPath();
        ctx.moveTo(PX,PY+16); ctx.lineTo(PX,PY); ctx.lineTo(PX+16,PY);
        ctx.moveTo(PX+PW-16,PY+PH); ctx.lineTo(PX+PW,PY+PH); ctx.lineTo(PX+PW,PY+PH-16);
        ctx.stroke();
        ctx.fillStyle=ac(0.42); ctx.font='700 8px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('KALMAN FILTER :: state estimation', PX+8, PY+14);

        const PL=PX+24, PR=PX+PW-14, PT=PY+28, PB=PY+PH-26;
        const pw2=PR-PL, ph2=PB-PT;

        // Grid
        ctx.strokeStyle=ac(0.07); ctx.lineWidth=1; ctx.setLineDash([2,8]);
        ctx.beginPath();
        for(let i=1;i<=4;i++){const gy=PT+ph2*i/4;ctx.moveTo(PL,gy);ctx.lineTo(PR,gy);}
        ctx.stroke(); ctx.setLineDash([]);

        const toP = (xn,yn) => [PL+xn*pw2, PB-((yn+1)/2.2)*ph2];
        const showN = Math.floor(Math.min(1, modeT/(MODE_DURATION*0.85)) * kalmanMeas.length);

        // Ground truth
        ctx.strokeStyle=wh(0.22); ctx.lineWidth=1.5; ctx.beginPath();
        kalmanMeas.slice(0,showN).forEach((p,i)=>{const[px2,py2]=toP(p.xn,p.truth);i===0?ctx.moveTo(px2,py2):ctx.lineTo(px2,py2);});
        ctx.stroke();

        // Noisy measurements
        kalmanMeas.slice(0,showN).forEach((p,i)=>{
            if(i%4!==0)return;
            const[px2,py2]=toP(p.xn,p.meas);
            ctx.fillStyle=ac2(0.30); ctx.beginPath(); ctx.arc(px2,py2,2,0,Math.PI*2); ctx.fill();
        });

        // Kalman estimate (1-D, Q=0.01, R=0.09)
        if (showN > 1) {
            let xe=kalmanMeas[0].meas, Pe=1.0;
            const Q=0.01, R=0.09;
            const est=[{xn:kalmanMeas[0].xn, e:xe, P:Pe}];
            for(let i=1;i<showN;i++){
                Pe+=Q;
                const K=Pe/(Pe+R);
                xe+=K*(kalmanMeas[i].meas-xe);
                Pe*=(1-K);
                est.push({xn:kalmanMeas[i].xn, e:xe, P:Pe});
            }

            // Uncertainty band
            ctx.fillStyle=ac(0.04); ctx.beginPath();
            est.forEach((p,i)=>{const[px2,py2]=toP(p.xn,p.e+Math.sqrt(p.P)*1.5);i===0?ctx.moveTo(px2,py2):ctx.lineTo(px2,py2);});
            for(let i=est.length-1;i>=0;i--){const[px2,py2]=toP(est[i].xn,est[i].e-Math.sqrt(est[i].P)*1.5);ctx.lineTo(px2,py2);}
            ctx.closePath(); ctx.fill();

            // Estimate line
            ctx.strokeStyle=ac(0.52); ctx.lineWidth=1.8; ctx.beginPath();
            est.forEach((p,i)=>{const[px2,py2]=toP(p.xn,p.e);i===0?ctx.moveTo(px2,py2):ctx.lineTo(px2,py2);});
            ctx.stroke();

            const lP=est[est.length-1].P;
            ctx.fillStyle=ac(0.28); ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='right';
            ctx.fillText(`K = ${(lP/(lP+R)).toFixed(4)}`, PR, PB+14);
            ctx.fillText(`P = ${lP.toFixed(4)}`, PR-90, PB+14);
        }

        // Legend
        [[wh(0.30),'\u2501 truth'],[ac2(0.28),'\u2022 measured'],[ac(0.50),'\u2501 k\u00e2lman']].forEach(([c,l],i)=>{
            ctx.fillStyle=c; ctx.font='7px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(l, PX+i*100, PY+PH+12);
        });

        // Left info panel
        const iX=38, iY=H*0.22, iW=160, iH=72;
        ctx.fillStyle='rgba(0,8,10,0.14)'; ctx.fillRect(iX,iY,iW,iH);
        ctx.strokeStyle=ac(0.14); ctx.lineWidth=1; ctx.strokeRect(iX,iY,iW,iH);
        ctx.strokeStyle=ac(0.30); ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(iX,iY+12); ctx.lineTo(iX,iY); ctx.lineTo(iX+12,iY); ctx.stroke();
        ctx.fillStyle=ac(0.32); ctx.font='700 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('// KF PARAMS', iX+5, iY+10);
        [['Q (proc noise)','0.0100'],['R (meas noise)','0.0900'],['x\u2080 (init state)','0.0000'],['P\u2080 (init cov)','1.0000']].forEach(([k,v],i)=>{
            ctx.fillStyle=ac(0.20); ctx.fillText(k+':',iX+5,iY+22+i*11);
            ctx.fillStyle=wh(0.24); ctx.textAlign='right'; ctx.fillText(v,iX+iW-6,iY+22+i*11); ctx.textAlign='left';
        });
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE J : SERVICE MESH / DEVOPS CONTAINER STACK
    ══════════════════════════════════════════════════════════════════════════ */
    const SVC = [
        { name:'nginx',       port:':443',  st:'ok'   },
        { name:'ctrl-api',    port:':8080', st:'ok'   },
        { name:'msg-broker',  port:':5672', st:'ok'   },
        { name:'db-primary',  port:':5432', st:'ok'   },
        { name:'db-replica',  port:':5432', st:'warn' },
        { name:'monitor',     port:':9090', st:'ok'   },
    ];
    const SVC_E = [[0,1],[1,2],[1,3],[2,3],[3,4],[1,5],[0,5]];
    let svcPkt = [];

    function drawDockerStack(t, modeT) {
        const CW=Math.min(188,W*0.16), CH=36, GAP=20;
        const totalH = SVC.length*CH+(SVC.length-1)*GAP;
        const PX = W-38-CW, startY = (H-totalH)/2;
        const np = SVC.map((_,i)=>({ x:PX+CW/2, y:startY+i*(CH+GAP)+CH/2 }));

        // Packets
        if(Math.random()<0.06){
            const e=SVC_E[Math.floor(Math.random()*SVC_E.length)];
            svcPkt.push({e,p:0,sp:0.28+Math.random()*0.36,rv:Math.random()<0.35});
        }
        svcPkt.forEach(pk=>{pk.p+=lastDt*pk.sp;});
        svcPkt=svcPkt.filter(pk=>pk.p<1);

        // Edges
        SVC_E.forEach(([ai,bi])=>{
            const a=np[ai],b=np[bi];
            ctx.strokeStyle=ac(0.10); ctx.lineWidth=1; ctx.setLineDash([3,9]);
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
            ctx.setLineDash([]);
        });

        // Packets
        svcPkt.forEach(pk=>{
            const [ai,bi]=pk.e, a=pk.rv?np[bi]:np[ai], b=pk.rv?np[ai]:np[bi];
            ctx.fillStyle=ac2(0.48);
            ctx.beginPath(); ctx.arc(lerp(a.x,b.x,pk.p),lerp(a.y,b.y,pk.p),2.5,0,Math.PI*2); ctx.fill();
        });

        // Containers
        SVC.forEach((svc,i)=>{
            const{x,y}=np[i], bx=x-CW/2, by=y-CH/2;
            ctx.fillStyle='rgba(0,8,10,0.18)';
            ctx.strokeStyle=svc.st==='warn'?amb(0.30):ac(0.20);
            ctx.lineWidth=1;
            roundRect(ctx,bx,by,CW,CH,3); ctx.fill(); ctx.stroke();

            ctx.fillStyle=svc.st==='ok'?grn(0.72):amb(0.72);
            ctx.beginPath(); ctx.arc(bx+10,y,3.5,0,Math.PI*2); ctx.fill();

            ctx.fillStyle=svc.st==='warn'?amb(0.58):ac(0.52);
            ctx.font='700 8px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(svc.name,bx+20,y-4);
            ctx.fillStyle=wh(0.22); ctx.font='7px "JetBrains Mono",monospace';
            ctx.fillText(svc.port,bx+20,y+8);
        });

        // Left: compose snippet panel
        const dX=38, dY=H*0.14, dW=204, dH=118;
        ctx.fillStyle='rgba(0,8,10,0.14)'; ctx.fillRect(dX,dY,dW,dH);
        ctx.strokeStyle=ac(0.14); ctx.lineWidth=1; ctx.strokeRect(dX,dY,dW,dH);
        ctx.strokeStyle=ac(0.28); ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(dX,dY+12); ctx.lineTo(dX,dY); ctx.lineTo(dX+12,dY); ctx.stroke();
        ctx.fillStyle=ac(0.30); ctx.font='700 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('// compose.yml', dX+5, dY+11);
        ['services:','  ctrl-api:','    image: ctrl/api:latest','    replicas: 2','  db-primary:','    image: postgres:15','    volumes: [pgdata:/var/lib]','  monitor:','    image: prom/prometheus:v2',].forEach((l,i)=>{
            ctx.fillStyle=(!l.startsWith('  '))?ac(0.28):wh(0.18);
            ctx.font='7px "JetBrains Mono",monospace';
            ctx.fillText(l,dX+5,dY+23+i*9.8);
        });

        ctx.fillStyle=ac(0.20); ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='right';
        ctx.fillText(`SVCS  ${SVC.length}`,W-48,H-56);
        ctx.fillText(`PKT/s ${svcPkt.length}`,W-48,H-44);
        ctx.fillText(`MESH  UP`,W-48,H-32);
        ctx.textAlign='left';
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE 11 — HEX GRID
    ══════════════════════════════════════════════════════════════════════════ */
    function drawHexGrid(t) {
        const S = 28; // hex radius (pointy-top)
        const HW = Math.sqrt(3) * S;
        const HH = 2 * S;
        const cols = Math.ceil(W / HW) + 3;
        const rows = Math.ceil(H / (HH * 0.75)) + 3;
        const drift = (t * 5) % HW;

        ctx.lineWidth = 0.5;

        for (let r = -1; r < rows; r++) {
            for (let c = -1; c < cols; c++) {
                const cx = c * HW + (r % 2 === 0 ? 0 : HW / 2) - drift;
                const cy = r * HH * 0.75;
                const dx = cx - W * 0.5, dy = cy - H * 0.5;
                const dist = Math.sqrt(dx*dx + dy*dy) / (Math.sqrt(W*W + H*H) * 0.5);
                const pulse = Math.sin(dist * 7 - t * 1.1) * 0.5 + 0.5;
                ctx.strokeStyle = ac(0.028 + pulse * 0.077);
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = Math.PI / 6 + (Math.PI / 3) * i;
                    const vx = cx + S * Math.cos(a), vy = cy + S * Math.sin(a);
                    i === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }

        // Orbiting bright hexagon highlights
        for (let i = 0; i < 4; i++) {
            const ang = t * 0.18 + i * Math.PI / 2;
            const rad = Math.min(W, H) * 0.22;
            const hcx = W * 0.5 + Math.cos(ang) * rad;
            const hcy = H * 0.5 + Math.sin(ang) * rad * 0.55;
            const col = Math.round((hcx + drift) / HW), row = Math.round(hcy / (HH * 0.75));
            const scx = col * HW + (row % 2 === 0 ? 0 : HW / 2) - drift;
            const scy = row * HH * 0.75;
            ctx.strokeStyle = ac(0.36);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const a = Math.PI / 6 + (Math.PI / 3) * j;
                const vx = scx + S * Math.cos(a), vy = scy + S * Math.sin(a);
                j === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
            }
            ctx.closePath();
            ctx.stroke();
            const g = ctx.createRadialGradient(scx, scy, 0, scx, scy, S);
            g.addColorStop(0, ac(0.05)); g.addColorStop(1, ac(0));
            ctx.fillStyle = g; ctx.fill();
        }
        ctx.lineWidth = 1;
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE 12 — SIERPIŃSKI TRIANGLE (Chaos Game)
    ══════════════════════════════════════════════════════════════════════════ */
    function drawSierpinski(t) {
        const pad  = Math.min(W, H) * 0.06;
        const midX = W * 0.5;
        const topY = pad;
        const botY = H - pad;
        const halfW = (H - 2 * pad) * Math.sqrt(3) / 2;

        // Triangle vertices
        const V = [
            [midX,           topY],
            [midX - halfW,   botY],
            [midX + halfW,   botY],
        ];

        // Warm-up chaos game for this frame's starting point
        if (!sierpPt) {
            sierpPt = { x: Math.random(), y: Math.random() };
            for (let i = 0; i < 30; i++) {
                const v = V[Math.floor(Math.random() * 3)];
                sierpPt.x = (sierpPt.x + v[0]) / 2;
                sierpPt.y = (sierpPt.y + v[1]) / 2;
            }
        }

        // Draw outline triangle faintly
        ctx.strokeStyle = ac(0.08);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(V[0][0], V[0][1]);
        ctx.lineTo(V[1][0], V[1][1]);
        ctx.lineTo(V[2][0], V[2][1]);
        ctx.closePath();
        ctx.stroke();

        // Chaos game: 7000 points per frame, batched in single path
        const ITERS = 7000;
        let { x, y } = sierpPt;

        // Colour varies slowly with time
        const hue = (t * 8) % 60; // oscillates accent vs accent2
        ctx.fillStyle = hue < 30 ? ac(0.38) : ac2(0.28);
        ctx.beginPath();
        for (let i = 0; i < ITERS; i++) {
            const v = V[Math.floor(Math.random() * 3)];
            x = (x + v[0]) / 2;
            y = (y + v[1]) / 2;
            ctx.rect(x - 0.8, y - 0.8, 1.6, 1.6);
        }
        ctx.fill();

        sierpPt = { x, y };

        // Vertex glow dots
        for (let i = 0; i < 3; i++) {
            const pulse = Math.sin(t * 1.2 + i * 2.09) * 0.5 + 0.5;
            const g = ctx.createRadialGradient(V[i][0], V[i][1], 0, V[i][0], V[i][1], 30);
            g.addColorStop(0, ac(0.12 * pulse));
            g.addColorStop(1, ac(0));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(V[i][0], V[i][1], 30, 0, Math.PI * 2); ctx.fill();
        }

        // Info panel
        const PX = W - 218, PY = 58;
        drawTerminalPanel(PX, PY, 198, 68, 'SIERPINSKI-CHAOS');
        ctx.font = '9px "JetBrains Mono",monospace';
        ctx.fillStyle = ac(0.42);
        ctx.textAlign = 'left';
        ctx.fillText(`pts/frame: ${ITERS}`, PX + 10, PY + 36);
        ctx.fillText(`rule: midpoint / 3 verts`, PX + 10, PY + 50);
        ctx.fillText(`dim ≈ 1.585`, PX + 10, PY + 64);
        ctx.lineWidth = 1;
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE 13 — GAUSSIAN DISTRIBUTION  N(0, 1)
    ══════════════════════════════════════════════════════════════════════════ */
    function drawGaussian(t) {
        const PX = W * 0.10, PY = H * 0.13, PW = W * 0.80, PH = H * 0.58;
        const baseline = PY + PH;
        const xMin = -4.3, xMax = 4.3;
        const PDF_MAX = 1 / Math.sqrt(2 * Math.PI);
        const pdf = x => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        const cx2 = x => PX + (x - xMin) / (xMax - xMin) * PW;
        const cy2 = y => baseline - (y / PDF_MAX) * PH * 0.84;

        // Sigma bands — website palette: outer purple, mid magenta, inner cyan
        const pur = a => `rgba(124,58,237,${a})`;
        const BANDS = [
            { s: 3, fill: pur, alpha: 0.030, pct: '99.7%' },
            { s: 2, fill: ac2, alpha: 0.040, pct: '95.4%' },
            { s: 1, fill: ac,  alpha: 0.055, pct: '68.3%' },
        ];
        BANDS.forEach(({ s, fill, alpha }) => {
            ctx.fillStyle = fill(alpha);
            ctx.beginPath();
            ctx.moveTo(cx2(-s), cy2(0));
            for (let xi = -s; xi <= s; xi += 0.04) ctx.lineTo(cx2(xi), cy2(pdf(xi)));
            ctx.lineTo(cx2(s), cy2(0));
            ctx.closePath(); ctx.fill();
        });

        // Ghost area fill under full curve
        ctx.fillStyle = wh(0.022);
        ctx.beginPath();
        ctx.moveTo(cx2(xMin), cy2(0));
        for (let xi = xMin; xi <= xMax; xi += 0.05) ctx.lineTo(cx2(xi), cy2(pdf(xi)));
        ctx.lineTo(cx2(xMax), cy2(0));
        ctx.closePath(); ctx.fill();

        // Bell curve — outer glow in cyan, crisp line in cyan
        [{ lw: 5, col: ac(0.045) }, { lw: 1.4, col: ac(0.55) }].forEach(({ lw, col }) => {
            ctx.strokeStyle = col; ctx.lineWidth = lw;
            ctx.beginPath();
            for (let xi = xMin; xi <= xMax; xi += 0.04) {
                const px2 = cx2(xi), py2 = cy2(pdf(xi));
                xi <= xMin + 0.04 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
            }
            ctx.stroke();
        });

        // X-axis
        ctx.strokeStyle = wh(0.18); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PX - 8, baseline); ctx.lineTo(PX + PW + 8, baseline); ctx.stroke();

        // Tick marks and axis labels
        ctx.font = '9px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
        [-3,-2,-1,0,1,2,3].forEach(xi => {
            const tx = cx2(xi);
            ctx.strokeStyle = wh(0.12); ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(tx, baseline); ctx.lineTo(tx, baseline + 5); ctx.stroke();
            ctx.fillStyle = wh(0.28);
            ctx.fillText(xi === 0 ? '\u03bc' : `${xi > 0 ? '+' : ''}${xi}\u03c3`, tx, baseline + 17);
        });

        // Sigma boundary dashes + percentage labels — magenta dashes, cyan labels
        BANDS.forEach(({ s, pct }) => {
            ctx.strokeStyle = ac2(0.18); ctx.lineWidth = 0.7; ctx.setLineDash([3, 7]);
            [-s, s].forEach(xi => {
                ctx.beginPath();
                ctx.moveTo(cx2(xi), baseline - 2); ctx.lineTo(cx2(xi), cy2(pdf(xi)) - 5);
                ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.fillStyle = ac(0.50); ctx.font = '8px "JetBrains Mono",monospace';
            ctx.textAlign = 'left';
            ctx.fillText(pct, cx2(s) + 5, cy2(pdf(s)) - 8);
        });

        // Travelling dot along the curve
        const phase = (t * 0.14) % 1;
        const dotXi = xMin + phase * (xMax - xMin);
        const dotX2 = cx2(dotXi), dotY2 = cy2(pdf(dotXi));
        const gDot = ctx.createRadialGradient(dotX2, dotY2, 0, dotX2, dotY2, 9);
        gDot.addColorStop(0, ac(0.85)); gDot.addColorStop(1, ac(0));
        ctx.fillStyle = gDot;
        ctx.beginPath(); ctx.arc(dotX2, dotY2, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = ac(0.80);
        ctx.beginPath(); ctx.arc(dotX2, dotY2, 2.5, 0, Math.PI * 2); ctx.fill();

        // Terminal info panel
        const iX = W - 220, iY = 60;
        drawTerminalPanel(iX, iY, 196, 92, 'GAUSSIAN-DIST');
        ctx.font = '9px "JetBrains Mono",monospace'; ctx.fillStyle = ac(0.40); ctx.textAlign = 'left';
        ctx.fillText('X ~ N(\u03bc, \u03c3\u00b2)', iX + 10, iY + 36);
        ctx.fillText('f(x)=e^(-x\u00b2/2)/\u221a2\u03c0', iX + 10, iY + 50);
        ctx.fillStyle = wh(0.35);
        ctx.fillText('\u03bc=0   \u03c3=1', iX + 10, iY + 64);
        ctx.fillText('E[X]=0   Var[X]=1', iX + 10, iY + 78);
        ctx.lineWidth = 1;

        ctx.fillStyle = ac2(0.18); ctx.font = '7px "JetBrains Mono",monospace'; ctx.textAlign = 'left';
        ctx.fillText('// STANDARD NORMAL DISTRIBUTION', PX, baseline + 34);
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE 14 — GAME OF LIFE (Gosper Glider Gun)
    ══════════════════════════════════════════════════════════════════════════ */
    const GOSPER_GUN = [
        [24,0],[22,1],[24,1],
        [12,2],[13,2],[20,2],[21,2],[34,2],[35,2],
        [11,3],[15,3],[20,3],[21,3],[34,3],[35,3],
        [0,4],[1,4],[10,4],[16,4],[20,4],[21,4],
        [0,5],[1,5],[10,5],[14,5],[16,5],[17,5],[22,5],[24,5],
        [10,6],[16,6],[24,6],
        [11,7],[15,7],
        [12,8],[13,8],
    ];

    function initGOL() {
        const CELL = 9;
        golCols = Math.floor(W / CELL);
        golRows = Math.floor(H / CELL);
        golGrid     = new Uint8Array(golCols * golRows);
        golNextGrid = new Uint8Array(golCols * golRows);
        golTick = 0;
        const placements = [
            [3, 3],
            [Math.floor(golCols * 0.5), Math.floor(golRows * 0.55)],
        ];
        for (const [ox, oy] of placements) {
            for (const [gc, gr] of GOSPER_GUN) {
                const c = ox + gc, r = oy + gr;
                if (c >= 0 && c < golCols && r >= 0 && r < golRows)
                    golGrid[r * golCols + c] = 1;
            }
        }
    }

    function stepGOL() {
        for (let r = 0; r < golRows; r++) {
            for (let c = 0; c < golCols; c++) {
                let n = 0;
                for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    n += golGrid[((r+dr+golRows)%golRows)*golCols + (c+dc+golCols)%golCols];
                }
                const alive = golGrid[r*golCols+c];
                golNextGrid[r*golCols+c] = (alive && (n===2||n===3)) || (!alive && n===3) ? 1 : 0;
            }
        }
        const tmp = golGrid; golGrid = golNextGrid; golNextGrid = tmp;
    }

    function drawGameOfLife(t, modeT) {
        const CELL = 9;
        if (!golGrid) initGOL();

        golTick++;
        if (golTick % 8 === 0) stepGOL();

        // Draw live cells
        ctx.fillStyle = ac(0.6);
        let alive = 0;
        for (let r = 0; r < golRows; r++) {
            for (let c = 0; c < golCols; c++) {
                if (golGrid[r*golCols+c]) {
                    alive++;
                    ctx.fillRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2);
                }
            }
        }

        // Subtle grid lines (lighter than cells)
        ctx.strokeStyle = ac(0.035);
        ctx.lineWidth = 0.3;
        for (let r = 0; r <= golRows; r++) {
            ctx.beginPath(); ctx.moveTo(0, r*CELL); ctx.lineTo(W, r*CELL); ctx.stroke();
        }
        for (let c = 0; c <= golCols; c++) {
            ctx.beginPath(); ctx.moveTo(c*CELL, 0); ctx.lineTo(c*CELL, H); ctx.stroke();
        }

        // Info panel
        const PX = W - 215, PY = 58;
        drawTerminalPanel(PX, PY, 195, 72, 'CONWAY-GOL');
        ctx.font = '9px "JetBrains Mono",monospace';
        ctx.fillStyle = grn(0.5);
        ctx.textAlign = 'left';
        ctx.fillText(`gen: ${Math.floor(golTick/8)}`, PX + 10, PY + 38);
        ctx.fillText(`alive: ${alive}`, PX + 10, PY + 52);
        ctx.fillText(`rule: B3/S23`, PX + 10, PY + 66);
        ctx.lineWidth = 1;
    }



    /* ══════════════════════════════════════════════════════════════════════════
       MODE 17 — COLLABORATIVE ROBOTS  (green safety, amber items, cyan arms)
    ══════════════════════════════════════════════════════════════════════════ */
    function drawCollabRobots(t, modeT) {
        // Professional UR5-style cobot: 4-segment arm, workspace zones, path preview
        const baseX = W*0.50, baseY = H*0.68;
        const L=[88,72,52,28]; // segment lengths

        // Smooth pick-place cycle using keyframe angles (radians)
        // Home → Pick → Inspect → Place → Home
        const CYCLE=12, ct2=(t*1.0)%CYCLE;
        const KF=[
            {t:0,  a:[-0.48,-1.05, 0.70, 0.40]},  // Home
            {t:2.5,a:[-1.10,-0.62, 0.85, 0.22]},  // Pick (left)
            {t:4.0,a:[-1.10,-0.62, 0.85, 0.22]},  // Hold
            {t:5.5,a:[-0.55,-0.95, 0.40, 0.60]},  // Inspect (raised)
            {t:7.5,a:[ 0.55,-0.82, 0.62, 0.30]},  // Place (right)
            {t:9.0,a:[ 0.55,-0.82, 0.62, 0.30]},  // Hold
            {t:10.5,a:[-0.48,-1.05, 0.70, 0.40]}, // Home
            {t:12, a:[-0.48,-1.05, 0.70, 0.40]},
        ];
        // Find surrounding keyframes
        let kA=KF[0],kB=KF[1];
        for(let i=0;i<KF.length-1;i++){
            if(ct2>=KF[i].t&&ct2<KF[i+1].t){kA=KF[i];kB=KF[i+1];break;}
        }
        const blend=kA.t===kB.t?0:eio((ct2-kA.t)/(kB.t-kA.t));
        const angs=kA.a.map((a,i)=>lerp(a,kB.a[i],blend));

        // Forward kinematics — compute joint positions
        const joints=[{x:baseX,y:baseY}];
        let cumAng=0;
        angs.forEach((a,i)=>{
            cumAng+=a;
            const prev=joints[joints.length-1];
            joints.push({x:prev.x+Math.cos(cumAng)*L[i], y:prev.y+Math.sin(cumAng)*L[i]});
        });
        const tip=joints[joints.length-1];

        // Determine operation state
        const isHolding=(ct2>=3.5&&ct2<4.5)||(ct2>=8.5&&ct2<9.5);
        const atPick=ct2>=2.2&&ct2<5;
        const atPlace=ct2>=7.2&&ct2<10;

        // Workspace zone arcs (from base)
        const zones=[
            {r:H*0.55, col:ac2, label:'RESTRICTED'},
            {r:H*0.42, col:amb, label:'CAUTION'},
            {r:H*0.28, col:grn, label:'SAFE'},
        ];
        zones.forEach(z=>{
            ctx.strokeStyle=z.col(0.12); ctx.lineWidth=1;
            ctx.setLineDash([4,8]);
            ctx.beginPath(); ctx.arc(baseX,baseY,z.r,Math.PI,Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle=z.col(0.15); ctx.font='6px "JetBrains Mono",monospace';
            ctx.textAlign='left';
            ctx.fillText(z.label,baseX-z.r+4,baseY-z.r*0.08);
        });

        // Reach envelope arc
        const reach=L.reduce((s,v)=>s+v,0);
        ctx.strokeStyle=ac(0.08); ctx.lineWidth=1; ctx.setLineDash([2,6]);
        ctx.beginPath(); ctx.arc(baseX,baseY,reach,Math.PI,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);

        // Path preview (dotted arc for planned trajectory)
        ctx.strokeStyle=ac(0.18); ctx.lineWidth=1; ctx.setLineDash([3,5]);
        ctx.beginPath();
        for(let i=0;i<=40;i++){
            const st2=(i/40)*CYCLE, cf2=st2%CYCLE;
            let ka2=KF[0],kb2=KF[1];
            for(let j=0;j<KF.length-1;j++){if(cf2>=KF[j].t&&cf2<KF[j+1].t){ka2=KF[j];kb2=KF[j+1];break;}}
            const bl2=ka2.t===kb2.t?0:eio((cf2-ka2.t)/(kb2.t-ka2.t));
            const ag2=ka2.a.map((a,idx)=>lerp(a,kb2.a[idx],bl2));
            let cx2=baseX,cy2=baseY,ca2=0;
            ag2.forEach((a,idx)=>{ca2+=a;cx2+=Math.cos(ca2)*L[idx];cy2+=Math.sin(ca2)*L[idx];});
            i===0?ctx.moveTo(cx2,cy2):ctx.lineTo(cx2,cy2);
        }
        ctx.stroke(); ctx.setLineDash([]);

        // Draw arm segments
        joints.slice(0,-1).forEach((_,i)=>{
            const j1=joints[i], j2=joints[i+1];
            const thick=[5,4,3,2.5][i];
            ctx.strokeStyle=ac(0.65-(i*0.08)); ctx.lineWidth=thick;
            ctx.beginPath(); ctx.moveTo(j1.x,j1.y); ctx.lineTo(j2.x,j2.y); ctx.stroke();
        });

        // Joint circles with angle labels
        joints.slice(0,-1).forEach((j,i)=>{
            ctx.fillStyle=i===0?ac(0.35):ac(0.22);
            ctx.beginPath(); ctx.arc(j.x,j.y,[9,7,6,5][i],0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=ac(0.55); ctx.lineWidth=1.2; ctx.stroke();
            // Joint angle arc indicator
            const ang=angs[i];
            ctx.strokeStyle=ac(0.25); ctx.lineWidth=1; ctx.beginPath();
            ctx.arc(j.x,j.y,[14,12,10,8][i], -Math.PI/2, -Math.PI/2+ang); ctx.stroke();
            // Angle label
            if(i<3){
                ctx.fillStyle=ac(0.28); ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(`J${i+1}:${(ang*180/Math.PI).toFixed(0)}°`,j.x,j.y-[16,14,12][i]);
            }
        });

        // Base mount
        ctx.fillStyle=ac(0.25); ctx.fillRect(baseX-18,baseY,36,10);
        ctx.strokeStyle=ac(0.50); ctx.lineWidth=1.5; ctx.strokeRect(baseX-18,baseY,36,10);
        ctx.fillStyle=ac(0.12); ctx.fillRect(baseX-28,baseY+10,56,6);

        // End effector / gripper
        const gripOpen=!isHolding;
        const gAng=Math.atan2(joints[3].y-joints[4].y, joints[3].x-joints[4].x)+Math.PI;
        const gPerp2=gAng+Math.PI/2;
        const gOpen=gripOpen?10:4;
        ctx.strokeStyle=ac(0.72); ctx.lineWidth=2;
        [-1,1].forEach(side=>{
            const px2=tip.x+Math.cos(gPerp2)*gOpen*side, py2=tip.y+Math.sin(gPerp2)*gOpen*side;
            ctx.beginPath(); ctx.moveTo(px2,py2);
            ctx.lineTo(px2+Math.cos(gAng)*14,py2+Math.sin(gAng)*14); ctx.stroke();
        });

        // Workpiece indicators (pick/place fixtures)
        const fixtures=[
            {x:baseX-W*0.24, y:baseY-10, label:'PICK'},
            {x:baseX+W*0.24, y:baseY-10, label:'PLACE'},
        ];
        fixtures.forEach(fx=>{
            const isActive=(fx.label==='PICK'&&atPick)||(fx.label==='PLACE'&&atPlace);
            ctx.strokeStyle=isActive?grn(0.60):wh(0.20); ctx.lineWidth=1.5;
            ctx.beginPath(); roundRect(ctx,fx.x-16,fx.y-8,32,16,3); ctx.stroke();
            ctx.fillStyle=isActive?grn(0.15):wh(0.04);
            roundRect(ctx,fx.x-16,fx.y-8,32,16,3); ctx.fill();
            ctx.fillStyle=isActive?grn(0.65):wh(0.28);
            ctx.font='700 7px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(fx.label,fx.x,fx.y+4);
        });

        // Force/torque readout at tip
        const Ftip=12+Math.sin(t*2.3)*3;
        ctx.strokeStyle=ac(isHolding?0.55:0.20); ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(tip.x,tip.y,8,0,Math.PI*2); ctx.stroke();
        if(isHolding){
            ctx.fillStyle=grn(0.50); ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(`${Ftip.toFixed(1)}N`,tip.x+11,tip.y+3);
        }

        // Coordinate frame at base
        ctx.strokeStyle=ac(0.30); ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.lineTo(baseX+22,baseY); ctx.stroke();
        arrowHead(baseX+22,baseY,1,0,ac(0.30));
        ctx.strokeStyle=grn(0.30);
        ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.lineTo(baseX,baseY-22); ctx.stroke();
        arrowHead(baseX,baseY-22,0,-1,grn(0.30));
        ctx.fillStyle=ac(0.25); ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('X',baseX+24,baseY+4);
        ctx.fillStyle=grn(0.25); ctx.fillText('Y',baseX+4,baseY-24);

        // Terminal panel
        const PW=Math.min(258,W*0.22), PH=118, PX2=38, PY2=H-PH-48;
        const HDR=drawTerminalPanel(PX2,PY2,PW,PH,'UR5 // COBOT STATUS');
        const op=atPick?'PICKING':atPlace?'PLACING':isHolding?'HOLDING':'TRANSIT';
        drawLogLines([
            {at:0.0,k:'cmd',s:'> PROGRAM: pick_place.urp'},
            {at:0.5,k:'ok', s:`OP: ${op}`},
            {at:1.0,k:'hi', s:`TCP: (${(tip.x-baseX).toFixed(0)},${(baseY-tip.y).toFixed(0)})mm`},
            {at:1.5,k:'dim',s:`J1:${(angs[0]*57.3).toFixed(1)} J2:${(angs[1]*57.3).toFixed(1)}`},
            {at:2.0,k:'dim',s:`J3:${(angs[2]*57.3).toFixed(1)} J4:${(angs[3]*57.3).toFixed(1)}`},
            {at:2.5,k:'ok', s:`F=${Ftip.toFixed(1)}N  SAFETY: OK`},
        ],modeT,PX2,PY2,PW,PH,HDR);
    }


/* ══════════════════════════════════════════════════════════════════════════
       MODE 20 — CODE HUMOR  (6 sub-scenes, 72 s cycle)
       Scene 0 — C++ topo deadlock  (15 s, pink/cyan threads)
       Scene 1 — C++ heap leak      (10 s, amber→red cells)
       Scene 2 — Python indentation (12 s, cyan lines + green snake)
       Scene 3 — Rust borrow check  (14 s, amber BC, cyan vs pink)
       Scene 4 — Ruby magic         (12 s, pink sparkles)
       Scene 5 — Lua tables         (9 s, green TABLE morph)
    ══════════════════════════════════════════════════════════════════════════ */
    function drawCodeHumor(t, modeT) {
        const SDUR = [15, 10, 12, 14, 12, 9];
        const CYCLE = SDUR.reduce((a,b) => a+b, 0); // 72 s
        const ct = modeT % CYCLE;
        let scene = 0, sceneT = ct, cum = 0;
        for (let i = 0; i < SDUR.length; i++) {
            if (ct < cum + SDUR[i]) { scene = i; sceneT = ct - cum; break; }
            cum += SDUR[i];
        }

        // ── Scene 0: C++ Topo + Threads ──────────────────────────────────────
        if (scene === 0) {
            if (!cppGraphNodes) {
                const cx = W * 0.50, cy = H * 0.40;
                cppGraphNodes = [
                    {id:'A', x:cx-150, y:cy-100},
                    {id:'B', x:cx+150, y:cy-100},
                    {id:'C', x:cx-90,  y:cy},
                    {id:'D', x:cx,     y:cy},        // contested
                    {id:'E', x:cx+90,  y:cy},
                    {id:'F', x:cx,     y:cy+100},
                ];
            }
            const gn = cppGraphNodes;
            const edges = [[0,2],[0,3],[1,3],[1,4],[2,5],[3,5],[4,5]];
            // Draw edges
            edges.forEach(([fi,ti]) => {
                const f = gn[fi], to = gn[ti];
                ctx.strokeStyle = wh(0.14); ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(to.x, to.y); ctx.stroke();
                const dx = to.x-f.x, dy = to.y-f.y, d = Math.hypot(dx,dy);
                arrowHead(to.x-dx/d*13, to.y-dy/d*13, dx/d, dy/d, wh(0.18));
            });

            // 4 threads — paths through DAG, edge takes 3.5 s each
            const paths    = [[0,2,5],[0,3,5],[1,3,5],[1,4,5]];
            const tCols    = [ac, ac2, amb, grn];
            const tLabels  = ['T0','T1','T2','T3'];
            const tOffsets = [0, 0.7, 1.3, 2.0];
            const edgeDur  = 3.4;
            let deadlock = false;
            const tPos = paths.map((path, ti) => {
                const elapsed = sceneT - tOffsets[ti];
                if (elapsed <= 0) return null;
                const prog = elapsed / edgeDur;
                const ei = Math.min(Math.floor(prog), path.length - 2);
                const ef = Math.min(1, prog - ei);
                const fN = gn[path[ei]], tN = gn[path[ei + 1] ?? path[ei]];
                const atNode = ef > 0.92 ? path[ei + 1] ?? path[ei] : path[ei];
                return {x: lerp(fN.x, tN.x, ef), y: lerp(fN.y, tN.y, ef), atNode, ti};
            });
            // Deadlock: T1 and T2 both at D (node 3)
            const atD = tPos.filter(p => p && p.atNode === 3);
            if (atD.length >= 2) deadlock = true;

            // Nodes
            gn.forEach((n, i) => {
                const contested = i === 3 && deadlock;
                ctx.fillStyle = contested ? ac2(0.22) : wh(0.07);
                ctx.strokeStyle = contested ? ac2(0.65) : wh(0.28);
                ctx.lineWidth = contested ? 2 : 1;
                roundRect(ctx, n.x-20, n.y-14, 40, 28, 4); ctx.fill(); ctx.stroke();
                ctx.fillStyle = contested ? ac2(0.90) : wh(0.52);
                ctx.font = '700 9px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(n.id, n.x, n.y+4);
            });

            // Thread runners
            tPos.forEach(p => {
                if (!p) return;
                const frozen = deadlock && p.atNode === 3;
                const ox = frozen ? (p.ti === 1 ? -11 : 11) : 0;
                ctx.fillStyle = tCols[p.ti](0.78);
                ctx.beginPath(); ctx.arc(p.x + ox, p.y, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = wh(0.80); ctx.font='700 7px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(tLabels[p.ti], p.x + ox, p.y + 3);
            });

            // Deadlock explosion + std::terminate()
            if (deadlock && sceneT > 6.5) {
                const dlAge = sceneT - 6.5;
                const pulse = Math.sin(dlAge * 5.5) * 0.38 + 0.50;
                ctx.strokeStyle = ac2(pulse * 0.58);
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(gn[3].x, gn[3].y, 25 + dlAge * 4.5, 0, Math.PI * 2); ctx.stroke();
                if (dlAge > 2.2) {
                    ctx.fillStyle = ac2(Math.min(1, dlAge - 2.2) * 0.78);
                    ctx.font = '700 12px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
                    ctx.fillText('std::terminate()', W * 0.5, H * 0.72);
                }
            }
            const PW=Math.min(258,W*0.22),PH=102,PX2=38,PY2=H-PH-48;
            const HDR=drawTerminalPanel(PX2,PY2,PW,PH,'C++ // TOPO+THREADS');
            drawLogLines([
                {at:0.0,k:'cmd',s:'> std::execution::par'},
                {at:0.8,k:'cmd',s:'thread_pool.submit(topo)'},
                {at:2.0,k:'hi', s:'T1, T2 → node D: LOCK'},
                {at:4.5,k:'dim',s:'waiting for mutex...'},
                {at:6.5,k:'hi', s:'DEADLOCK DETECTED'},
                {at:8.5,k:'cmd',s:'std::terminate()  ☠'},
            ], sceneT, PX2, PY2, PW, PH, HDR);
        }

        // ── Scene 1: C++ Heap Leak ────────────────────────────────────────────
        else if (scene === 1) {
            const cols = 14, rows = 7;
            const cw = Math.min(38, (W - 120) / cols), ch = 26;
            const gx = (W - cols * cw) * 0.5, gy = H * 0.28;
            if (!cppMemGrid) {
                cppMemGrid = Array.from({length: cols * rows}, (_, i) => ({
                    state: 'free',
                    age: Math.random() * 6,
                    isLeak: Math.random() < 0.28,
                    allocAt: 0.4 + Math.random() * 4,
                }));
            }
            cppMemGrid.forEach((cell, i) => {
                const elapsed = sceneT - cell.allocAt;
                if (elapsed > 0 && cell.state === 'free') cell.state = 'alloc';
                if (cell.state === 'alloc' && !cell.isLeak && elapsed > 2.5) cell.state = 'freed';
                if (cell.state === 'alloc' && cell.isLeak && elapsed > 5.5) cell.state = 'leak';
            });
            // Draw cells
            cppMemGrid.forEach((cell, i) => {
                const cx2 = gx + (i % cols) * cw, cy2 = gy + Math.floor(i / cols) * ch;
                const col = cell.state==='free'?wh(0.07):cell.state==='alloc'?ac(0.35):cell.state==='freed'?grn(0.28):ac2(0.50);
                ctx.fillStyle = col; ctx.fillRect(cx2+1, cy2+1, cw-3, ch-3);
                ctx.strokeStyle = cell.state==='leak'?ac2(0.60):wh(0.10); ctx.lineWidth=0.8;
                ctx.strokeRect(cx2+1, cy2+1, cw-3, ch-3);
                if (cell.state==='leak') {
                    ctx.fillStyle = ac2(0.50); ctx.font='7px "JetBrains Mono",monospace';
                    ctx.textAlign='center'; ctx.fillText('LEAK', cx2+cw*0.5, cy2+ch*0.6);
                }
            });
            // Heap bar
            const leakCount = cppMemGrid.filter(c=>c.state==='leak').length;
            const allocCount= cppMemGrid.filter(c=>c.state==='alloc'||c.state==='leak').length;
            const barW=180, barX=(W-barW)*0.5, barY=gy+rows*ch+20;
            ctx.fillStyle=wh(0.08); ctx.fillRect(barX,barY,barW,12);
            const fillW = barW * Math.min(1, allocCount/(cols*rows));
            const fillCol = leakCount>4?ac2(0.55):amb(0.60);
            ctx.fillStyle=fillCol; ctx.fillRect(barX,barY,fillW,12);
            ctx.strokeStyle=wh(0.18); ctx.lineWidth=1; ctx.strokeRect(barX,barY,barW,12);
            ctx.fillStyle=wh(0.35); ctx.font='7px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(`HEAP ${Math.round(fillW/barW*100)}%`, barX+barW*0.5, barY-6);
            // SEGFAULT flash
            if (leakCount > 14 || sceneT > 8.5) {
                const flA = Math.sin(t * 8) * 0.4 + 0.45;
                ctx.fillStyle = ac2(flA * 0.18); ctx.fillRect(0,0,W,H);
                ctx.fillStyle = ac2(flA); ctx.font='700 14px "JetBrains Mono",monospace';
                ctx.textAlign='center'; ctx.fillText('SEGFAULT', W*0.5, H*0.78);
            }
            const PW=Math.min(258,W*0.22),PH=100,PX2=38,PY2=H-PH-48;
            const HDR=drawTerminalPanel(PX2,PY2,PW,PH,'C++ // HEAP AUDIT');
            drawLogLines([
                {at:0,  k:'cmd',s:'> valgrind ./app'},
                {at:0.6,k:'dim',s:'definitely lost: ?'},
                {at:2.0,k:'hi', s:`leaks: ${leakCount} blocks`},
                {at:4.0,k:'dim',s:'// TODO: call delete'},
                {at:7.0,k:'cmd',s:'// (written 2008)'},
                {at:8.5,k:'hi', s:'SEGFAULT ☠'},
            ], sceneT, PX2, PY2, PW, PH, HDR);
        }

        // ── Scene 2: Python Indentation ──────────────────────────────────────
        else if (scene === 2) {
            const lineCount = 8, lineH = 28;
            const baseX = W * 0.22, baseY = H * 0.22;
            const INDENTS = [0, 1, 1, 2, 2, 1, 2, 3]; // spaces * 16px
            const snippets = ['def solve():', '  if x > 0:', '    for i in range(n):', '      result = compute(i)',
                              '      yield result', '  elif x == 0:', '    return base_case()', '      pass ← 💀'];
            // Chaos trigger every ~4s
            const chaos = Math.sin(sceneT * Math.PI / 4 + 0.5) < -0.6;
            const chaosAmt = chaos ? Math.abs(Math.sin(sceneT * 6)) * 18 : 0;

            for (let li = 0; li < lineCount; li++) {
                const indent = INDENTS[li] * 18;
                const isBad = li === 7;
                const y = baseY + li * lineH + (chaos ? (Math.random()-0.5)*chaosAmt : 0);
                const x = baseX + indent + (isBad && !chaos ? 6 : 0); // misaligned
                // Indent block
                for (let d = 0; d < INDENTS[li]; d++) {
                    ctx.fillStyle = ['rgba(0,255,255,0.10)','rgba(255,0,255,0.08)','rgba(57,255,20,0.07)'][d % 3];
                    ctx.fillRect(baseX + d*18, y - 3, 16, lineH - 6);
                }
                ctx.fillStyle = isBad ? ac2(0.70) : ac(0.55);
                ctx.font = `${isBad?'700':''} 8px "JetBrains Mono",monospace`; ctx.textAlign = 'left';
                ctx.fillText(snippets[li], x, y + 12);
            }

            // Panic flash on chaos
            if (chaos) {
                ctx.fillStyle = ac2(0.08 + Math.abs(Math.sin(sceneT*7))*0.08);
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = ac2(0.55); ctx.font='700 11px "JetBrains Mono",monospace';
                ctx.textAlign='center'; ctx.fillText('IndentationError', W*0.5, H*0.76);
            }

            // Snake (sine wave, green, unbothered)
            ctx.strokeStyle = grn(0.58); ctx.lineWidth = 3;
            ctx.beginPath();
            const snakeOff = t * 55;
            for (let x = 0; x <= W; x += 6) {
                const sy2 = H * 0.80 + Math.sin((x + snakeOff) * 0.022) * 18;
                x === 0 ? ctx.moveTo(x, sy2) : ctx.lineTo(x, sy2);
            }
            ctx.stroke();
            // Snake head
            const hx = (snakeOff * 0.7) % W, hy = H*0.80 + Math.sin((hx+snakeOff)*0.022)*18;
            ctx.fillStyle = grn(0.75); ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = wh(0.80); ctx.font='7px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('🐍', hx, hy+3);

            const PW=Math.min(258,W*0.22),PH=100,PX2=38,PY2=H-PH-48;
            const HDR=drawTerminalPanel(PX2,PY2,PW,PH,'PYTHON // INDENT');
            drawLogLines([
                {at:0.0,k:'cmd',s:'> python solve.py'},
                {at:0.6,k:'dim',s:'...running...'},
                {at:3.5,k:'hi', s:'IndentationError:'},
                {at:4.2,k:'cmd',s:'unexpected indent'},
                {at:4.8,k:'dim',s:'# snake: unbothered'},
            ], sceneT, PX2, PY2, PW, PH, HDR);
        }

        // ── Scene 3: Rust Borrow Checker ──────────────────────────────────────
        else if (scene === 3) {
            const RES_X = W * 0.50, RES_Y = H * 0.40;
            const P1_X = W * 0.20, P1_Y = H * 0.40;
            const P2_X = W * 0.80, P2_Y = H * 0.40;
            const BC_Y = H * 0.24;
            // Phase: P1 owns for first 7s, transfer at 7s, P2 owns for rest
            const p1owns = sceneT < 7;
            const ownerX = p1owns ? P1_X : P2_X;

            // Resource box
            ctx.fillStyle = wh(0.10); roundRect(ctx, RES_X-28, RES_Y-18, 56, 36, 5); ctx.fill();
            ctx.strokeStyle = p1owns ? ac(0.55) : ac2(0.55); ctx.lineWidth = 2;
            roundRect(ctx, RES_X-28, RES_Y-18, 56, 36, 5); ctx.stroke();
            ctx.fillStyle = wh(0.55); ctx.font='700 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('data', RES_X, RES_Y+4);

            // Ownership arrow
            const ownA = eio(Math.min(1, Math.abs(sceneT - 7) / 1.2));
            ctx.strokeStyle = p1owns ? ac(0.50 * ownA) : ac2(0.50 * ownA); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(ownerX, p1owns ? P1_Y : P2_Y);
            ctx.lineTo(RES_X, RES_Y); ctx.stroke();
            ctx.fillStyle = p1owns ? ac(0.35) : ac2(0.35); ctx.font='7px "JetBrains Mono",monospace';
            ctx.textAlign='center';
            ctx.fillText('owns', (ownerX + RES_X)*0.5, (p1owns?P1_Y:P2_Y + RES_Y)*0.5 - 6);

            // P1 node (cyan)
            ctx.fillStyle = ac(0.20); ctx.strokeStyle = ac(0.60); ctx.lineWidth = 2;
            roundRect(ctx, P1_X-28, P1_Y-18, 56, 36, 5); ctx.fill(); ctx.stroke();
            ctx.fillStyle = p1owns ? ac(0.80) : ac(0.35); ctx.font='700 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(p1owns ? '✓ OWNER' : 'process_a', P1_X, P1_Y+4);

            // P2 node (pink) — blocked red barrier when trying to mutate
            const p2blocked = sceneT < 7 && sceneT > 1.5;
            ctx.fillStyle = ac2(0.18); ctx.strokeStyle = p2blocked ? ac2(0.65) : ac2(0.55); ctx.lineWidth = 2;
            roundRect(ctx, P2_X-28, P2_Y-18, 56, 36, 5); ctx.fill(); ctx.stroke();
            ctx.fillStyle = p2blocked ? ac2(0.80) : (p1owns ? ac2(0.55) : ac2(0.80));
            ctx.font='700 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(p2blocked ? '✗ BLOCKED' : (p1owns ? 'process_b' : '✓ OWNER'), P2_X, P2_Y+4);

            // P2 tries to reach resource — red barrier
            if (p2blocked) {
                const barX = (P2_X + RES_X) * 0.5;
                ctx.fillStyle = ac2(0.18); ctx.fillRect(barX-4, P2_Y-30, 8, 60);
                ctx.strokeStyle = ac2(0.55); ctx.lineWidth = 1.5;
                ctx.strokeRect(barX-4, P2_Y-30, 8, 60);
            }

            // Borrow Checker entity (amber, top center)
            const bcPulse = Math.sin(t * 1.8) * 0.08 + 0.22;
            ctx.fillStyle = amb(bcPulse); roundRect(ctx, W*0.5-50, BC_Y-18, 100, 36, 6); ctx.fill();
            ctx.strokeStyle = amb(0.65); ctx.lineWidth = 2; roundRect(ctx, W*0.5-50, BC_Y-18, 100, 36, 6); ctx.stroke();
            ctx.fillStyle = amb(0.80); ctx.font='700 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('BORROW CHECKER', W*0.5, BC_Y+4);
            // Watchlines from BC to nodes
            [P1_X, P2_X].forEach(nx => {
                ctx.strokeStyle = amb(0.18); ctx.lineWidth = 1; ctx.setLineDash([3,5]);
                ctx.beginPath(); ctx.moveTo(W*0.5, BC_Y+18); ctx.lineTo(nx, P1_Y-18); ctx.stroke();
                ctx.setLineDash([]);
            });

            const PW=Math.min(258,W*0.22),PH=105,PX2=38,PY2=H-PH-48;
            const HDR=drawTerminalPanel(PX2,PY2,PW,PH,'RUST // BORROW CHECK');
            drawLogLines([
                {at:0.0,k:'cmd',s:'> cargo build'},
                {at:0.5,k:'hi', s:'error[E0502]:'},
                {at:1.2,k:'dim',s:'cannot borrow `data`'},
                {at:1.9,k:'dim',s:'as mutable — borrowed'},
                {at:2.6,k:'cmd',s:'as immutable here'},
                {at:6.5,k:'ok', s:'ownership transferred'},
                {at:7.5,k:'ok', s:'cargo build — OK ✓'},
            ], sceneT, PX2, PY2, PW, PH, HDR);
        }

        // ── Scene 4: Ruby on Rails Magic ─────────────────────────────────────
        else if (scene === 4) {
            const items = [
                {label:'Model',    x:W*0.26, y:H*0.26, born:0.5},
                {label:'Table',    x:W*0.50, y:H*0.26, born:1.2},
                {label:'Controller',x:W*0.74,y:H*0.26, born:1.9},
                {label:'View',     x:W*0.38, y:H*0.50, born:2.6},
                {label:'Route',    x:W*0.62, y:H*0.50, born:3.3},
            ];
            // Version flip at 6s → reconnect chaos
            const v7 = sceneT > 6.5;
            const links = [[0,1],[1,2],[0,3],[2,4],[3,4]];

            // Connections (drawn before boxes)
            links.forEach(([a,b]) => {
                const ia = items[a], ib = items[b];
                if (sceneT < ia.born || sceneT < ib.born) return;
                const age = Math.min(sceneT - Math.max(ia.born,ib.born), 1);
                ctx.strokeStyle = v7 ? ac2(0.20 + Math.sin(t*2.2+(a+b))*0.12) : ac2(0.35 * age);
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                if (v7) {
                    // Chaos — connections wobble
                    const ox = Math.sin(t*1.5+a*1.3)*14, oy = Math.cos(t*1.8+b*0.9)*14;
                    ctx.moveTo(ia.x+ox, ia.y+oy); ctx.lineTo(ib.x-ox, ib.y-oy);
                } else {
                    ctx.moveTo(ia.x, ia.y); ctx.lineTo(ib.x, ib.y);
                }
                ctx.stroke();
            });

            // Boxes
            items.forEach(item => {
                if (sceneT < item.born) return;
                const age = Math.min((sceneT - item.born) / 0.35, 1);
                const ox = v7 ? Math.sin(t*1.4+item.x*0.01)*8 : 0;
                const oy = v7 ? Math.cos(t*1.6+item.y*0.01)*6 : 0;
                // Sparkle on spawn
                if (age < 1) {
                    for (let s = 0; s < 5; s++) {
                        const sa = (s/5)*Math.PI*2, sr = (1-age)*28;
                        ctx.fillStyle = ac2(age * 0.55);
                        ctx.beginPath(); ctx.arc(item.x+Math.cos(sa)*sr, item.y+Math.sin(sa)*sr, 2.5, 0, Math.PI*2); ctx.fill();
                    }
                }
                ctx.fillStyle = ac2(0.12 * age);
                roundRect(ctx, item.x+ox-36, item.y+oy-14, 72, 28, 5); ctx.fill();
                ctx.strokeStyle = ac2(0.55 * age); ctx.lineWidth = 1.5;
                roundRect(ctx, item.x+ox-36, item.y+oy-14, 72, 28, 5); ctx.stroke();
                ctx.fillStyle = ac2(0.80 * age); ctx.font='700 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(item.label, item.x+ox, item.y+oy+4);
            });

            // ✨ magic sparks drifting
            for (let i = 0; i < 12; i++) {
                const sp = (i/12 + t*0.18) % 1;
                const sx = W*0.1 + sp*(W*0.8), sy = H*0.7 + Math.sin(sp*Math.PI*4+t)*22;
                ctx.fillStyle = ac2(0.20 + Math.sin(sp*6.3)*0.15);
                ctx.font='9px sans-serif'; ctx.textAlign='center';
                ctx.fillText('✦', sx, sy);
            }

            // Version label
            ctx.fillStyle = ac2(0.38); ctx.font='700 10px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(v7?'Rails 7 — Reconfiguring…':'Rails 6 — Convention > Config', W*0.5, H*0.72);

            const PW=Math.min(258,W*0.22),PH=100,PX2=38,PY2=H-PH-48;
            const HDR=drawTerminalPanel(PX2,PY2,PW,PH,'RUBY // RAILS MAGIC');
            drawLogLines([
                {at:0.0,k:'cmd',s:'> rails generate scaffold'},
                {at:0.8,k:'ok', s:'create  app/models/'},
                {at:1.5,k:'ok', s:'create  app/controllers/'},
                {at:2.2,k:'ok', s:'create  app/views/'},
                {at:3.0,k:'ok', s:'✦ magic complete'},
                {at:6.5,k:'hi', s:'gem update rails → 7'},
                {at:7.2,k:'dim',s:'convention changed 🙃'},
            ], sceneT, PX2, PY2, PW, PH, HDR);
        }

        // ── Scene 5: Lua – The Table That Does Everything ─────────────────────
        else if (scene === 5) {
            const TX = W * 0.50, TY = H * 0.38;
            const ROLES = ['[ ] ARRAY','{ } MAP',': METHOD','require MODULE'];
            const ROLE_COLS = [grn, ac, amb, ac2];
            const roleIdx = Math.floor(sceneT / 2.1) % ROLES.length;
            const roleT   = (sceneT % 2.1) / 2.1;

            // Central TABLE box
            const boxA = 0.85 + Math.sin(t * 1.2) * 0.08;
            ctx.fillStyle = grn(0.18 * boxA); roundRect(ctx, TX-50, TY-22, 100, 44, 7); ctx.fill();
            ctx.strokeStyle = grn(0.65 * boxA); ctx.lineWidth = 2.5; roundRect(ctx, TX-50, TY-22, 100, 44, 7); ctx.stroke();
            ctx.fillStyle = grn(0.90); ctx.font='700 11px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('TABLE', TX, TY+5);

            // Role label morphing
            const roleA = eio(Math.min(1, roleT * 4)) * eio(Math.min(1, (1-roleT) * 4));
            ctx.fillStyle = ROLE_COLS[roleIdx](0.70 * roleA);
            ctx.font='700 9px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(ROLES[roleIdx], TX, TY + 38);

            // Orbiting satellite labels
            const orbits = ['arr[1]','map.key','obj:fn()','pkg.exports','arr[2]','nil?'];
            orbits.forEach((lbl, i) => {
                const ang = t * (0.38 + i*0.04) + i * Math.PI * 2 / orbits.length;
                const rx2 = TX + Math.cos(ang) * (90 + i*6), ry2 = TY + Math.sin(ang) * (52 + i*3);
                ctx.fillStyle = grn(0.30 + Math.sin(ang)*0.12);
                ctx.font='7px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(lbl, rx2, ry2);
                // Dotted orbit line to center
                ctx.strokeStyle = grn(0.12); ctx.lineWidth=0.8; ctx.setLineDash([2,4]);
                ctx.beginPath(); ctx.moveTo(TX, TY); ctx.lineTo(rx2, ry2); ctx.stroke();
                ctx.setLineDash([]);
            });

            const PW=Math.min(258,W*0.22),PH=100,PX2=38,PY2=H-PH-48;
            const HDR=drawTerminalPanel(PX2,PY2,PW,PH,'LUA // TABLES');
            drawLogLines([
                {at:0.0,k:'cmd',s:'> lua app.lua'},
                {at:0.5,k:'dim',s:'t = {}  -- array?'},
                {at:1.5,k:'dim',s:'t = {}  -- map?'},
                {at:2.5,k:'dim',s:'t = {}  -- object?'},
                {at:3.5,k:'hi', s:'t = {}  -- yes.'},
                {at:4.5,k:'ok', s:'arrays start at 1 🙂'},
            ], sceneT, PX2, PY2, PW, PH, HDR);
        }
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MODE DEFINITIONS
    ══════════════════════════════════════════════════════════════════════════ */
    const MODE_LABELS = [
        'EMBEDDED-COMPILE','GDB-DEBUG','NET-TOPOLOGY',
        'PID-ADAPTIVE-NN','GRAD-DESCENT','TRAJECTORY',
        'NEURAL-NET','FSM-DIAGRAM','KALMAN-FILTER','SVC-MESH',
        'HEX-GRID','SIERPINSKI-CHAOS','GAUSSIAN-DIST','CONWAY-GOL',
        'COBOT-UR5','CODE-HUMOR',
    ];
    const MODES = [
        drawEmbeddedCompile, drawGDB, drawTopology,
        drawBlockDiagram, drawGradientDescent, drawRocketry,
        drawNeuralNet, drawFSM, drawKalman, drawDockerStack,
        drawHexGrid, drawSierpinski, drawGaussian, drawGameOfLife,
        drawCollabRobots, drawCodeHumor,
    ];
    const N = MODES.length;

    function drawModeLabel(modeT, idx) {
        const norm=modeT/currentModeDuration, half=FADE/currentModeDuration;
        const a=norm<half?eio(norm/half):norm>1-half?eio((1-norm)/half):1;
        ctx.globalAlpha=a*0.15;
        ctx.font='8px "JetBrains Mono",monospace'; ctx.fillStyle=ac(1); ctx.textAlign='left';
        ctx.fillText(`[${idx+1}/${N}]  ${MODE_LABELS[idx]}`, 46, H-32);
        for(let i=0;i<N;i++){
            ctx.fillStyle=i===idx?ac(1):wh(0.22);
            ctx.beginPath(); ctx.arc(46+i*9,H-20,2,0,Math.PI*2); ctx.fill();
        }
    }

    /* ── CSS grid visibility (hidden during hex canvas mode) ───────────────── */
    const HEX_IDX = 10; // index of drawHexGrid in MODES
    function setCSSGridVisible(show) {
        if (gridLinesEl) gridLinesEl.style.opacity = show ? '' : '0';
        if (gridGlowEl)  gridGlowEl.style.opacity  = show ? '' : '0';
    }

    /* ── Mode picker (Fisher-Yates shuffle deck) ────────────────────────────── */
    function pickNextMode() {
        if (modeDeck.length === 0) {
            // Refill: every mode appears exactly once per cycle
            modeDeck = Array.from({length: N}, (_, i) => i);
            // Fisher-Yates shuffle
            for (let i = modeDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [modeDeck[i], modeDeck[j]] = [modeDeck[j], modeDeck[i]];
            }
            // Prevent the new deck's first card from being the same as the last played
            if (modeDeck.length > 1 && modeDeck[modeDeck.length - 1] === lastPlayedIdx) {
                const swapIdx = Math.floor(Math.random() * (modeDeck.length - 1));
                [modeDeck[swapIdx], modeDeck[modeDeck.length - 1]] =
                    [modeDeck[modeDeck.length - 1], modeDeck[swapIdx]];
            }
        }
        const chosen = modeDeck.pop();
        lastPlayedIdx = chosen;
        return chosen;
    }

    /* ── Render loop ────────────────────────────────────────────────────────── */
    function resize() {
        W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight;
        topoNodes=null; gdPaths=null; kalmanMeas=null; svcPkt=[];
        golGrid=null;
        sierpPt=null;
        cobotItems=null; osBranches=null; osStars=[];
        cppGraphNodes=null; cppMemGrid=null;
    }

    function frame(ts) {
        const dt=Math.min((ts-lastTs)/1000,0.05);
        lastTs=ts; lastDt=dt; t+=dt; modeT+=dt;

        const phaseDuration = restPhase ? restDuration : currentModeDuration;
        if (modeT >= phaseDuration) {
            modeT=0;
            if (!restPhase) {
                restPhase=true;
                restDuration=5+Math.random()*10;   // 5–15 s interval
                setCSSGridVisible(true);            // restore CSS grid during rest
            } else {
                restPhase=false;
                currentModeDuration=20+Math.random()*280;   // 20 s – 5 min
                modeIdx=pickNextMode();
                setCSSGridVisible(modeIdx !== HEX_IDX); // hide CSS grid under hex mode
                topoNodes=null; gdPaths=null; kalmanMeas=null; svcPkt=[];
                golGrid=null;
                sierpPt=null;
            }
        }

        ctx.clearRect(0,0,W,H);
        if (!restPhase) {
            ctx.save(); ctx.globalAlpha=eio(Math.min(1,modeT/FADE))*eio(Math.min(1,(currentModeDuration-modeT)/FADE))*DIM;
            MODES[modeIdx](t, modeT);
            ctx.restore();
            ctx.save(); drawModeLabel(modeT, modeIdx); ctx.restore();
        }
        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    modeIdx = pickNextMode(); // random first mode on every page load
    resize();
    // 8-second startup delay before canvas animations begin
    setTimeout(() => {
        requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(frame); });
    }, 8000);
}());
