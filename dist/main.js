!function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(r,o,function(e){return t[e]}.bind(null,o));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=4)}([function(t,e,n){"use strict";var r=n(1),o=n(2),a=n(3),i=t.exports={};i.diff=r.ciede2000,i.rgb_to_lab=o.rgb_to_lab,i.rgba_to_lab=o.rgba_to_lab,i.map_palette=a.map_palette,i.palette_map_key=a.palette_map_key,i.map_palette_lab=a.map_palette_lab,i.lab_palette_map_key=a.lab_palette_map_key,i.match_palette_lab=a.match_palette_lab,i.closest=function(t,e,n){var r=i.palette_map_key(t);return n=void 0!==n?n:{R:255,G:255,B:255},i.map_palette([t],e,"closest",n)[r]},i.furthest=function(t,e,n){var r=i.palette_map_key(t);return n=void 0!==n?n:{R:255,G:255,B:255},i.map_palette([t],e,"furthest",n)[r]},i.closest_lab=function(t,e){return i.match_palette_lab(t,e,!1)},i.furthest_lab=function(t,e){return i.match_palette_lab(t,e,!0)}},function(t,e){
/**
 * @author Markus Ekholm
 * @copyright 2012-2016 (c) Markus Ekholm <markus at botten dot org >
 * @license Copyright (c) 2012-2016, Markus Ekholm
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the author nor the
 *      names of its contributors may be used to endorse or promote products
 *      derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL MARKUS EKHOLM BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
e.ciede2000=function(t,e){var a=t.L,c=t.a,f=t.b,g=e.L,h=e.a,p=e.b,m=n(r(c,2)+r(f,2)),b=n(r(h,2)+r(p,2)),_=(m+b)/2,y=.5*(1-n(r(_,7)/(r(_,7)+r(25,7)))),v=(1+y)*c,w=(1+y)*h,A=n(r(v,2)+r(f,2)),C=n(r(w,2)+r(p,2)),x=d(f,v),E=d(p,w),M=g-a,k=C-A,S=function(t,e,n,r){if(t*e==0)return 0;if(l(r-n)<=180)return r-n;if(r-n>180)return r-n-360;if(r-n<-180)return r-n+360;throw new Error}(m,b,x,E),B=2*n(A*C)*i(s(S)/2),O=(a+g)/2,P=(A+C)/2,R=function(t,e,n,r){if(t*e==0)return n+r;if(l(n-r)<=180)return(n+r)/2;if(l(n-r)>180&&n+r<360)return(n+r+360)/2;if(l(n-r)>180&&n+r>=360)return(n+r-360)/2;throw new Error}(m,b,x,E),G=1-.17*o(s(R-30))+.24*o(s(2*R))+.32*o(s(3*R+6))-.2*o(s(4*R-63)),T=30*u(-r((R-275)/25,2)),L=n(r(P,7)/(r(P,7)+r(25,7))),X=1+.015*r(O-50,2)/n(20+r(O-50,2)),$=1+.045*P,D=1+.015*P*G,I=-2*L*i(s(2*T));return n(r(M/(1*X),2)+r(k/(1*$),2)+r(B/(1*D),2)+I*(k/(1*$))*(B/(1*D)))};var n=Math.sqrt,r=Math.pow,o=Math.cos,a=Math.atan2,i=Math.sin,l=Math.abs,u=Math.exp,c=Math.PI;function s(t){return t*(c/180)}function d(t,e){if(0===t&&0===e)return 0;var n=a(t,e)*(180/c);return n>=0?n:n+360}},function(t,e){
/**
 * @author Markus Ekholm
 * @copyright 2012-2016 (c) Markus Ekholm <markus at botten dot org >
 * @license Copyright (c) 2012-2016, Markus Ekholm
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the author nor the
 *      names of its contributors may be used to endorse or promote products
 *      derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL MARKUS EKHOLM BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
e.rgb_to_lab=r,e.rgba_to_lab=function(t,e){return r({R:(e=void 0!==e?e:{R:255,G:255,B:255}).R+(t.R-e.R)*t.A,G:e.G+(t.G-e.G)*t.A,B:e.B+(t.B-e.B)*t.A})};var n=Math.pow;Math.sqrt;function r(t){return function(t){var e=t.Y/100,r=t.Z/108.883,o=t.X/95.047;o=o>.008856?n(o,1/3):7.787*o+16/116;e=e>.008856?n(e,1/3):7.787*e+16/116;r=r>.008856?n(r,1/3):7.787*r+16/116;return{L:116*e-16,a:500*(o-e),b:200*(e-r)}}(function(t){var e=t.R/255,r=t.G/255,o=t.B/255;e>.04045?e=n((e+.055)/1.055,2.4):e/=12.92;r>.04045?r=n((r+.055)/1.055,2.4):r/=12.92;o>.04045?o=n((o+.055)/1.055,2.4):o/=12.92;return{X:.4124*(e*=100)+.3576*(r*=100)+.1805*(o*=100),Y:.2126*e+.7152*r+.0722*o,Z:.0193*e+.1192*r+.9505*o}}(t))}},function(t,e,n){
/**
 * @author Markus Ekholm
 * @copyright 2012-2016 (c) Markus Ekholm <markus at botten dot org >
 * @license Copyright (c) 2012-2016, Markus Ekholm
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the author nor the
 *      names of its contributors may be used to endorse or promote products
 *      derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL MARKUS EKHOLM BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
e.map_palette=function(t,e,n,r){var o={};r=void 0!==r?r:{R:255,G:255,B:255},n=n||"closest";for(var i=0;i<t.length;i+=1){for(var l=t[i],c=void 0,s=void 0,d=0;d<e.length;d+=1){var f=e[d],g=u(l,f,r);null==c||"closest"===n&&g<s?(c=f,s=g):"furthest"===n&&g>s&&(c=f,s=g)}o[a(l)]=c}return o},e.map_palette_lab=function(t,e,n){for(var r={},o="furthest"===n,a=0;a<t.length;a+=1){var u=t[a];r[i(u)]=l(u,e,o)}return r},e.match_palette_lab=l,e.palette_map_key=a,e.lab_palette_map_key=i;var r=n(1).ciede2000,o=n(2);function a(t){var e="R"+t.R+"B"+t.B+"G"+t.G;return"A"in t&&(e=e+"A"+t.A),e}function i(t){return"L"+t.L+"a"+t.a+"b"+t.b}function l(t,e,n){for(var o,a,i=e[0],l=r(t,i),u=1,c=e.length;u<c;u+=1)o=e[u],a=r(t,o),(!n&&a<l||n&&a>l)&&(i=o,l=a);return i}function u(t,e,n){var a=o.rgb_to_lab,i=o.rgb_to_lab,l=function(t){return o.rgba_to_lab(t,n)};return"A"in t&&(a=l),"A"in e&&(i=l),t=a(t),e=i(e),r(t,e)}},function(t,e,n){"use strict";n.r(e);var r=n(0),o=n.n(r),a=function(t){i&&console.log(`skribbl.io AutoDraw: ${t}`)};let i=!0;let l=function(t,e){a(`Scaling image to ${t.width} x ${t.height}...`);let n=document.createElement("canvas");n.width=t.width,n.height=t.height;let r=n.getContext("2d");return r.imageSmoothingEnabled=!1,e(r),r.getImageData(0,0,n.width,n.height)};function u(t){return new Promise((e,n)=>{const r=new Image;r.crossOrigin="Anonymous",r.onload=function(){(r.height===r.width===0?n:e)(r)},r.onerror=n,a(`Attempting to load image: ${t}...`),r.src=t})}const c=function(t,e){let n=Math.min(t.width/e.width,t.height/e.height),r=n*e.width,o=n*e.height;return l({width:r,height:o},t=>t.drawImage(e,0,0,r,o))};const s=document.getElementById("containerCanvas"),d=document.getElementById("buttonClearCanvas"),f=function(t){let e=function(e){let n=t.getBoundingClientRect();return{x:e.x*n.width/800+n.x,y:e.y*n.height/600+n.y}},n=function(t,e){return new MouseEvent(t,{bubbles:!0,clientX:e.x,clientY:e.y,button:0})};return{size:{width:800,height:600},draw:function(r){let o=e(r[0]);t.dispatchEvent(n("mousedown",o));for(let o=1;o<r.length;o++){let a=e(r[o]);t.dispatchEvent(n("mousemove",a))}let a=e(r[r.length-1]);t.dispatchEvent(n("mouseup",a))}}}(document.getElementById("canvasGame")),g=function(t){let e=Array.prototype.slice.call(t.querySelectorAll(".colorItem")),n=e.map(t=>(function(t){let e=t.substring(4,t.length-1).split(", ");return{r:parseInt(e[0]),g:parseInt(e[1]),b:parseInt(e[2])}})(t.style.backgroundColor)),r=new Map(e.map(t=>[t.style.backgroundColor,t])),o=Array.prototype.slice.call(t.querySelectorAll(".brushSize")),a={2.9:o.find(t=>"0"===t.getAttribute("data-size")),7:o.find(t=>"0.15"===t.getAttribute("data-size")),19:o.find(t=>"0.45"===t.getAttribute("data-size")),39:o.find(t=>"1"===t.getAttribute("data-size"))},i=t.querySelector("#buttonClearCanvas"),l=Array.prototype.slice.call(t.querySelectorAll("[data-tool]")),u=l.find(t=>"pen"===t.getAttribute("data-tool")),c=l.find(t=>"fill"===t.getAttribute("data-tool"));return{getColors:()=>n,setColor:t=>{let e=function(t){return`rgb(${t.r}, ${t.g}, ${t.b})`}(t);r.get(e).click()},getPenDiameters:()=>[2.9,7,19,39],setPenDiameter:t=>{a[t].click()},clear:()=>{i.click()},setPenTool:()=>{u.click()},setFillTool:()=>{c.click()},isEnabled:()=>"none"!==t.style.display}}(document.querySelector(".containerToolbar")),h=function(t,e){const n=function(t){let e=t.map(t=>o.a.rgb_to_lab({R:t.r,G:t.g,B:t.b}));return{getClosestColor:function(n,r){let a=JSON.stringify(n);if(a in r)return r[a];let i=o.a.rgb_to_lab({R:n.r,G:n.g,B:n.b}),l=Number.MAX_VALUE,u=null;for(let n=0;n<e.length;n++){let r=o.a.diff(i,e[n]);r>=l||(l=r,u=t[n])}return r[a]=u,u}}}(e.getColors()),r={width:t.size.width/2.9,height:t.size.height/2.9};return{draw:function(o){const i=c(r,o);a("Generating draw commands...");let l=[];const u=function(t){const e=t.data,r={},o=[];let a=0,i=null,l=0;for(let u=0;u<t.height;u++){for(let c=0;c<t.width;c++){const t={r:e[l+0],g:e[l+1],b:e[l+2]},s=n.getClosestColor(t,r);null!=i?(i!=s&&(o.push({y:u,startX:a,endX:c-1,color:i}),a=c,i=s),l+=4):i=s}o.push({y:u,startX:a,endX:t.width-1,color:i}),a=0,i=null,l+=4}return o}(i),s=function(t){const e={};for(const n of t){const t=JSON.stringify(n.color);e[t]=(e[t]||0)+1}const n=Object.keys(e).reduce((t,n)=>e[t]>e[n]?t:n);return JSON.parse(n)}(u);var d;l=l.concat(function(){console.log(`skribbl.io AutoDraw: Sending dummy command.`)});l=l.concat((d=s,[function(){e.setFillTool(),e.setColor(d),t.draw([{x:0,y:0},{x:0,y:0}])}]));const f=u.filter(t=>JSON.stringify(t.color)!=JSON.stringify(s)).sort(()=>.5-Math.random()).sort((t,e)=>{const n=t.endX-t.startX,r=e.endX-e.startX;return n>r?-1:n==r?0:1});let g={x:(r.width-i.width)/2+.5,y:(r.height-i.height)/2+.5};return l=l.concat(function(n,r){const o=[];for(const a of n)o.push(function(){e.setPenTool(),e.setColor(a.color),e.setPenDiameter(2.9),t.draw([{x:2.9*(a.startX+r.x),y:2.9*(a.y+r.y)},{x:2.9*(a.endX+r.x),y:2.9*(a.y+r.y)}])});return o}(f,g)),a(`${l.length} commands generated.`),l}}}(f,g);let p=[];const m=function(t){a("Clearing canvas..."),g.clear(),setTimeout(function(){a(`Drawing ${t.width} x ${t.height} image...`),function(t,e,n){const r=function(){return t.length?n&&n()?a("Processing stopped."):(t.shift()(),t.length%100==0&&t.length>0&&a(`${t.length} commands remaining to process.`),void setTimeout(r,e||0)):a("Processing finished.")};a(`Processing ${t.length} commands...`),r()}(p=p.concat(h.draw(t)),10,()=>!g.isEnabled())},150)};!function(t,e,n){let r=null;t.addEventListener("dragover",function(t){t.preventDefault(),null===r?e(t):window.clearTimeout(r),r=window.setTimeout(function(){n(t),r=null},100)})}(document,function(){g.isEnabled()&&document.body.classList.add("dragging")},function(){document.body.classList.remove("dragging")}),document.body.addEventListener("drop",function(t){if(t.preventDefault(),!s.contains(t.target))return;if(!g.isEnabled())return a("Can't draw right now.");a("Processing dropped content...");const e=((n=t.dataTransfer).files.length&&n.files[0].type.startsWith("image/")?URL.createObjectURL(n.files[0]):null)||function(t){let e=t.getData("text/html");if(!e)return null;let n=document.createElement("div");n.innerHTML=e;let r=n.firstChild;return r&&/^img$/i.test(r.tagName)?r.getAttribute("src"):null}(t.dataTransfer);var n;if(!e)return a("Dropped content not recognized.");u(e).catch(()=>u("https://yacdn.org/serve/"+e)).catch(()=>u("https://cors-anywhere.herokuapp.com/"+e)).then(m).catch(()=>a(`Couldn't load image: ${e}. Sorry :(`))}),d.addEventListener("click",function(){p.length&&(a("Clearing commands..."),p.length=0,a("Drawing stopped."))}),function(){a("Initializing overlay...");const t=document.createElement("div");t.id="autoDrawOverlay",t.innerText="Drop image here to auto draw!",s.appendChild(t)}()}]);
