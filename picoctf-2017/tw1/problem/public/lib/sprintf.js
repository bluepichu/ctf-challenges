(function(d){var b={not_string:/[^s]/,number:/[diefg]/,json:/[j]/,not_json:/[^j]/,text:/^[^\x25]+/,modulo:/^\x25{2}/,placeholder:/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,key:/^([a-z_][a-z_\d]*)/i,key_access:/^\.([a-z_][a-z_\d]*)/i,index_access:/^\[(\d+)\]/,sign:/^[\+\-]/};function f(){var h=arguments[0],g=f.cache;if(!(g[h]&&g.hasOwnProperty(h))){g[h]=f.parse(h)}return f.format.call(null,g[h],arguments)}f.format=function(r,q){var v=1,t=r.length,n="",w,h=[],o,l,p,j,s,u,m=true,g="";for(o=0;o<t;o++){n=a(r[o]);if(n==="string"){h[h.length]=r[o]}else{if(n==="array"){p=r[o];if(p[2]){w=q[v];for(l=0;l<p[2].length;l++){if(!w.hasOwnProperty(p[2][l])){throw new Error(f("[sprintf] property '%s' does not exist",p[2][l]))}w=w[p[2][l]]}}else{if(p[1]){w=q[p[1]]}else{w=q[v++]}}if(a(w)=="function"){w=w()}if(b.not_string.test(p[8])&&b.not_json.test(p[8])&&(a(w)!="number"&&isNaN(w))){throw new TypeError(f("[sprintf] expecting number but found %s",a(w)))}if(b.number.test(p[8])){m=w>=0}switch(p[8]){case"b":w=w.toString(2);break;case"c":w=String.fromCharCode(w);break;case"d":case"i":w=parseInt(w,10);break;case"j":w=JSON.stringify(w,null,p[6]?parseInt(p[6]):0);break;case"e":w=p[7]?w.toExponential(p[7]):w.toExponential();break;case"f":w=p[7]?parseFloat(w).toFixed(p[7]):parseFloat(w);break;case"g":w=p[7]?parseFloat(w).toPrecision(p[7]):parseFloat(w);break;case"o":w=w.toString(8);break;case"s":w=((w=String(w))&&p[7]?w.substring(0,p[7]):w);break;case"u":w=w>>>0;break;case"x":w=w.toString(16);break;case"X":w=w.toString(16).toUpperCase();break}if(b.json.test(p[8])){h[h.length]=w}else{if(b.number.test(p[8])&&(!m||p[3])){g=m?"+":"-";w=w.toString().replace(b.sign,"")}else{g=""}s=p[4]?p[4]==="0"?"0":p[4].charAt(1):" ";u=p[6]-(g+w).length;j=p[6]?(u>0?c(s,u):""):"";h[h.length]=p[5]?g+w+j:(s==="0"?g+j+w:j+g+w)}}}}return h.join("")};f.cache={};f.parse=function(g){var j=g,k=[],m=[],l=0;while(j){if((k=b.text.exec(j))!==null){m[m.length]=k[0]}else{if((k=b.modulo.exec(j))!==null){m[m.length]="%"}else{if((k=b.placeholder.exec(j))!==null){if(k[2]){l|=1;var n=[],i=k[2],h=[];if((h=b.key.exec(i))!==null){n[n.length]=h[1];while((i=i.substring(h[0].length))!==""){if((h=b.key_access.exec(i))!==null){n[n.length]=h[1]}else{if((h=b.index_access.exec(i))!==null){n[n.length]=h[1]}else{throw new SyntaxError("[sprintf] failed to parse named argument key")}}}}else{throw new SyntaxError("[sprintf] failed to parse named argument key")}k[2]=n}else{l|=2}if(l===3){throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")}m[m.length]=k}else{throw new SyntaxError("[sprintf] unexpected placeholder")}}}j=j.substring(k[0].length)}return m};var e=function(h,g,i){i=(g||[]).slice(0);i.splice(0,0,h);return f.apply(null,i)};function a(g){return Object.prototype.toString.call(g).slice(8,-1).toLowerCase()}function c(g,h){return Array(h+1).join(g)}if(typeof exports!=="undefined"){exports.sprintf=f;exports.vsprintf=e}else{d.sprintf=f;d.vsprintf=e;if(typeof define==="function"&&define.amd){define(function(){return{sprintf:f,vsprintf:e}})}}})(typeof window==="undefined"?this:window);