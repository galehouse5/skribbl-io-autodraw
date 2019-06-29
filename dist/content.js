!function(t){var e={};function n(r){if(e[r])return e[r].exports;var a=e[r]={i:r,l:!1,exports:{}};return t[r].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var a in t)n.d(r,a,function(e){return t[e]}.bind(null,a));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=7)}([function(t,e,n){"use strict";e.a=function(t){r&&console.log(`skribbl.io AutoDraw: ${t}`)};let r=!0},function(t,e,n){"use strict";n.d(e,"a",function(){return a}),n.d(e,"b",function(){return i});var r=n(0);function a(t,e){let n=Math.min(t.width/e.width,t.height/e.height),r=n*e.width,a=n*e.height;return o({width:r,height:a},t=>t.drawImage(e,0,0,r,a))}let o=function(t,e){Object(r.a)(`Scaling image to ${t.width} x ${t.height}...`);let n=document.createElement("canvas");n.width=t.width,n.height=t.height;let a=n.getContext("2d");return a.imageSmoothingEnabled=!1,e(a),a.getImageData(0,0,n.width,n.height)};function i(t){const e=document.createElement("canvas"),n=e.getContext("2d");return e.width=t.width,e.height=t.height,n.drawImage(t,0,0),e.toDataURL()}},function(t,e,n){"use strict";var r=n(3),a=n(4),o=n(5),i=t.exports={};i.diff=r.ciede2000,i.rgb_to_lab=a.rgb_to_lab,i.rgba_to_lab=a.rgba_to_lab,i.map_palette=o.map_palette,i.palette_map_key=o.palette_map_key,i.map_palette_lab=o.map_palette_lab,i.lab_palette_map_key=o.lab_palette_map_key,i.match_palette_lab=o.match_palette_lab,i.closest=function(t,e,n){var r=i.palette_map_key(t);return n=void 0!==n?n:{R:255,G:255,B:255},i.map_palette([t],e,"closest",n)[r]},i.furthest=function(t,e,n){var r=i.palette_map_key(t);return n=void 0!==n?n:{R:255,G:255,B:255},i.map_palette([t],e,"furthest",n)[r]},i.closest_lab=function(t,e){return i.match_palette_lab(t,e,!1)},i.furthest_lab=function(t,e){return i.match_palette_lab(t,e,!0)}},function(t,e){
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
e.ciede2000=function(t,e){var o=t.L,u=t.a,f=t.b,g=e.L,h=e.a,b=e.b,p=n(r(u,2)+r(f,2)),m=n(r(h,2)+r(b,2)),_=(p+m)/2,y=.5*(1-n(r(_,7)/(r(_,7)+r(25,7)))),v=(1+y)*u,w=(1+y)*h,O=n(r(v,2)+r(f,2)),j=n(r(w,2)+r(b,2)),x=d(f,v),A=d(b,w),C=g-o,E=j-O,M=function(t,e,n,r){if(t*e==0)return 0;if(l(r-n)<=180)return r-n;if(r-n>180)return r-n-360;if(r-n<-180)return r-n+360;throw new Error}(p,m,x,A),S=2*n(O*j)*i(s(M)/2),k=(o+g)/2,B=(O+j)/2,R=function(t,e,n,r){if(t*e==0)return n+r;if(l(n-r)<=180)return(n+r)/2;if(l(n-r)>180&&n+r<360)return(n+r+360)/2;if(l(n-r)>180&&n+r>=360)return(n+r-360)/2;throw new Error}(p,m,x,A),L=1-.17*a(s(R-30))+.24*a(s(2*R))+.32*a(s(3*R+6))-.2*a(s(4*R-63)),D=30*c(-r((R-275)/25,2)),G=n(r(B,7)/(r(B,7)+r(25,7))),P=1+.015*r(k-50,2)/n(20+r(k-50,2)),T=1+.045*B,I=1+.015*B*L,X=-2*G*i(s(2*D));return n(r(C/(1*P),2)+r(E/(1*T),2)+r(S/(1*I),2)+X*(E/(1*T))*(S/(1*I)))};var n=Math.sqrt,r=Math.pow,a=Math.cos,o=Math.atan2,i=Math.sin,l=Math.abs,c=Math.exp,u=Math.PI;function s(t){return t*(u/180)}function d(t,e){if(0===t&&0===e)return 0;var n=o(t,e)*(180/u);return n>=0?n:n+360}},function(t,e){
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
e.rgb_to_lab=r,e.rgba_to_lab=function(t,e){return r({R:(e=void 0!==e?e:{R:255,G:255,B:255}).R+(t.R-e.R)*t.A,G:e.G+(t.G-e.G)*t.A,B:e.B+(t.B-e.B)*t.A})};var n=Math.pow;Math.sqrt;function r(t){return function(t){var e=t.Y/100,r=t.Z/108.883,a=t.X/95.047;a=a>.008856?n(a,1/3):7.787*a+16/116;e=e>.008856?n(e,1/3):7.787*e+16/116;r=r>.008856?n(r,1/3):7.787*r+16/116;return{L:116*e-16,a:500*(a-e),b:200*(e-r)}}(function(t){var e=t.R/255,r=t.G/255,a=t.B/255;e>.04045?e=n((e+.055)/1.055,2.4):e/=12.92;r>.04045?r=n((r+.055)/1.055,2.4):r/=12.92;a>.04045?a=n((a+.055)/1.055,2.4):a/=12.92;return{X:.4124*(e*=100)+.3576*(r*=100)+.1805*(a*=100),Y:.2126*e+.7152*r+.0722*a,Z:.0193*e+.1192*r+.9505*a}}(t))}},function(t,e,n){
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
e.map_palette=function(t,e,n,r){var a={};r=void 0!==r?r:{R:255,G:255,B:255},n=n||"closest";for(var i=0;i<t.length;i+=1){for(var l=t[i],u=void 0,s=void 0,d=0;d<e.length;d+=1){var f=e[d],g=c(l,f,r);null==u||"closest"===n&&g<s?(u=f,s=g):"furthest"===n&&g>s&&(u=f,s=g)}a[o(l)]=u}return a},e.map_palette_lab=function(t,e,n){for(var r={},a="furthest"===n,o=0;o<t.length;o+=1){var c=t[o];r[i(c)]=l(c,e,a)}return r},e.match_palette_lab=l,e.palette_map_key=o,e.lab_palette_map_key=i;var r=n(3).ciede2000,a=n(4);function o(t){var e="R"+t.R+"B"+t.B+"G"+t.G;return"A"in t&&(e=e+"A"+t.A),e}function i(t){return"L"+t.L+"a"+t.a+"b"+t.b}function l(t,e,n){for(var a,o,i=e[0],l=r(t,i),c=1,u=e.length;c<u;c+=1)a=e[c],o=r(t,a),(!n&&o<l||n&&o>l)&&(i=a,l=o);return i}function c(t,e,n){var o=a.rgb_to_lab,i=a.rgb_to_lab,l=function(t){return a.rgba_to_lab(t,n)};return"A"in t&&(o=l),"A"in e&&(i=l),t=o(t),e=i(e),r(t,e)}},,function(t,e,n){"use strict";n.r(e);var r=n(2),a=n.n(r),o=n(1),i=n(0);const l=o.a;const c=document.getElementById("containerCanvas"),u=document.getElementById("buttonClearCanvas"),s=function(t){let e=function(e){let n=t.getBoundingClientRect();return{x:e.x*n.width/800+n.x,y:e.y*n.height/600+n.y}},n=function(t,e){return new MouseEvent(t,{bubbles:!0,clientX:e.x,clientY:e.y,button:0})};return{size:{width:800,height:600},draw:function(r){let a=e(r[0]);t.dispatchEvent(n("mousedown",a));for(let a=1;a<r.length;a++){let o=e(r[a]);t.dispatchEvent(n("mousemove",o))}let o=e(r[r.length-1]);t.dispatchEvent(n("mouseup",o))}}}(document.getElementById("canvasGame")),d=function(t){let e=Array.prototype.slice.call(t.querySelectorAll(".colorItem")),n=e.map(t=>(function(t){let e=t.substring(4,t.length-1).split(", ");return{r:parseInt(e[0]),g:parseInt(e[1]),b:parseInt(e[2])}})(t.style.backgroundColor)),r=new Map(e.map(t=>[t.style.backgroundColor,t])),a=Array.prototype.slice.call(t.querySelectorAll(".brushSize")),o={2.9:a.find(t=>"0"===t.getAttribute("data-size")),7:a.find(t=>"0.15"===t.getAttribute("data-size")),19:a.find(t=>"0.45"===t.getAttribute("data-size")),39:a.find(t=>"1"===t.getAttribute("data-size"))},i=t.querySelector("#buttonClearCanvas"),l=Array.prototype.slice.call(t.querySelectorAll("[data-tool]")),c=l.find(t=>"pen"===t.getAttribute("data-tool")),u=l.find(t=>"fill"===t.getAttribute("data-tool"));return{getColors:()=>n,setColor:t=>{let e=function(t){return`rgb(${t.r}, ${t.g}, ${t.b})`}(t);r.get(e).click()},getPenDiameters:()=>[2.9,7,19,39],setPenDiameter:t=>{o[t].click()},clear:()=>{i.click()},setPenTool:()=>{c.click()},setFillTool:()=>{u.click()},isEnabled:()=>"none"!==t.style.display}}(document.querySelector(".containerToolbar")),f=function(t,e){const n=function(t){let e=t.map(t=>a.a.rgb_to_lab({R:t.r,G:t.g,B:t.b}));return{getClosestColor:function(n,r){let o=JSON.stringify(n);if(o in r)return r[o];let i=a.a.rgb_to_lab({R:n.r,G:n.g,B:n.b}),l=Number.MAX_VALUE,c=null;for(let n=0;n<e.length;n++){let r=a.a.diff(i,e[n]);r>=l||(l=r,c=t[n])}return r[o]=c,c}}}(e.getColors()),r={width:t.size.width/2.9,height:t.size.height/2.9};return{draw:function(a){const o=l(r,a);Object(i.a)("Generating draw commands...");let c=[];const u=function(t){const e=t.data,r={},a=[];let o=0,i=null,l=0;for(let c=0;c<t.height;c++){for(let u=0;u<t.width;u++){const t={r:e[l+0],g:e[l+1],b:e[l+2]},s=n.getClosestColor(t,r);null!=i?(i!=s&&(a.push({y:c,startX:o,endX:u-1,color:i}),o=u,i=s),l+=4):i=s}a.push({y:c,startX:o,endX:t.width-1,color:i}),o=0,i=null,l+=4}return a}(o),s=function(t){const e={};for(const n of t){const t=JSON.stringify(n.color);e[t]=(e[t]||0)+1}const n=Object.keys(e).reduce((t,n)=>e[t]>e[n]?t:n);return JSON.parse(n)}(u);var d;c=c.concat((d=s,[function(){e.setFillTool(),e.setColor(d),t.draw([{x:0,y:0},{x:0,y:0}])}]));const f=u.filter(t=>JSON.stringify(t.color)!=JSON.stringify(s)).sort(()=>.5-Math.random()).sort((t,e)=>{const n=t.endX-t.startX,r=e.endX-e.startX;return n>r?-1:n==r?0:1});let g={x:(r.width-o.width)/2+.5,y:(r.height-o.height)/2+.5};return c=c.concat(function(n,r){const a=[];for(const o of n)a.push(function(){e.setPenTool(),e.setColor(o.color),e.setPenDiameter(2.9),t.draw([{x:2.9*(o.startX+r.x),y:2.9*(o.y+r.y)},{x:2.9*(o.endX+r.x),y:2.9*(o.y+r.y)}])});return a}(f,g)),Object(i.a)(`${c.length} commands generated.`),c}}}(s,d);let g=[];const h=function(t){Object(i.a)("Clearing canvas..."),d.clear(),setTimeout(function(){Object(i.a)(`Drawing ${t.width} x ${t.height} image...`),function(t,e,n){const r=function(){return t.length?n&&n()?Object(i.a)("Processing stopped."):(t.shift()(),t.length%100==0&&t.length>0&&Object(i.a)(`${t.length} commands remaining to process.`),void setTimeout(r,e||0)):Object(i.a)("Processing finished.")};Object(i.a)(`Processing ${t.length} commands...`),r()}(g=g.concat(f.draw(t)),10,()=>!d.isEnabled())},150)},b=function(t,e){Object(i.a)(`Loading image: ${t}...`),chrome.runtime.sendMessage({contentScriptQuery:"loadImageDataUrl",url:t},t=>{const n=new Image;n.src=t,e(n)})};!function(t,e,n){let r=null;t.addEventListener("dragover",function(t){t.preventDefault(),null===r?e(t):window.clearTimeout(r),r=window.setTimeout(function(){n(t),r=null},100)})}(document,function(){d.isEnabled()&&document.body.classList.add("dragging")},function(){document.body.classList.remove("dragging")}),document.body.addEventListener("drop",function(t){if(t.preventDefault(),!c.contains(t.target))return;if(!d.isEnabled())return Object(i.a)("Can't draw right now.");Object(i.a)("Processing dropped content...");const e=((n=t.dataTransfer).files.length&&n.files[0].type.startsWith("image/")?URL.createObjectURL(n.files[0]):null)||function(t){let e=t.getData("text/html");if(!e)return null;let n=document.createElement("div");n.innerHTML=e;let r=n.firstChild;return r&&/^img$/i.test(r.tagName)?r.getAttribute("src"):null}(t.dataTransfer);var n;if(!e)return Object(i.a)("Dropped content not recognized.");b(e,h)}),u.addEventListener("click",function(){g.length&&(Object(i.a)("Clearing commands..."),g.length=0,Object(i.a)("Drawing stopped."))}),function(){Object(i.a)("Initializing overlay...");const t=document.createElement("div");t.id="autoDrawOverlay",t.innerText="Drop image here to auto draw!",c.appendChild(t)}()}]);