!function(t){var e={};function n(r){if(e[r])return e[r].exports;var a=e[r]={i:r,l:!1,exports:{}};return t[r].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var a in t)n.d(r,a,function(e){return t[e]}.bind(null,a));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=4)}([function(t,e,n){"use strict";var r=n(1),a=n(2),i=n(3),o=t.exports={};o.diff=r.ciede2000,o.rgb_to_lab=a.rgb_to_lab,o.rgba_to_lab=a.rgba_to_lab,o.map_palette=i.map_palette,o.palette_map_key=i.palette_map_key,o.map_palette_lab=i.map_palette_lab,o.lab_palette_map_key=i.lab_palette_map_key,o.match_palette_lab=i.match_palette_lab,o.closest=function(t,e,n){var r=o.palette_map_key(t);return n=void 0!==n?n:{R:255,G:255,B:255},o.map_palette([t],e,"closest",n)[r]},o.furthest=function(t,e,n){var r=o.palette_map_key(t);return n=void 0!==n?n:{R:255,G:255,B:255},o.map_palette([t],e,"furthest",n)[r]},o.closest_lab=function(t,e){return o.match_palette_lab(t,e,!1)},o.furthest_lab=function(t,e){return o.match_palette_lab(t,e,!0)}},function(t,e){
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
e.ciede2000=function(t,e){var i=t.L,c=t.a,g=t.b,h=e.L,d=e.a,p=e.b,m=n(r(c,2)+r(g,2)),b=n(r(d,2)+r(p,2)),_=(m+b)/2,v=.5*(1-n(r(_,7)/(r(_,7)+r(25,7)))),w=(1+v)*c,y=(1+v)*d,A=n(r(w,2)+r(g,2)),x=n(r(y,2)+r(p,2)),D=f(g,w),M=f(p,y),C=h-i,E=x-A,R=function(t,e,n,r){if(t*e==0)return 0;if(l(r-n)<=180)return r-n;if(r-n>180)return r-n-360;if(r-n<-180)return r-n+360;throw new Error}(m,b,D,M),$=2*n(A*x)*o(s(R)/2),k=(i+h)/2,B=(A+x)/2,L=function(t,e,n,r){if(t*e==0)return n+r;if(l(n-r)<=180)return(n+r)/2;if(l(n-r)>180&&n+r<360)return(n+r+360)/2;if(l(n-r)>180&&n+r>=360)return(n+r-360)/2;throw new Error}(m,b,D,M),I=1-.17*a(s(L-30))+.24*a(s(2*L))+.32*a(s(3*L+6))-.2*a(s(4*L-63)),O=30*u(-r((L-275)/25,2)),G=n(r(B,7)/(r(B,7)+r(25,7))),P=1+.015*r(k-50,2)/n(20+r(k-50,2)),z=1+.045*B,S=1+.015*B*I,j=-2*G*o(s(2*O));return n(r(C/(1*P),2)+r(E/(1*z),2)+r($/(1*S),2)+j*(E/(1*z))*($/(1*S)))};var n=Math.sqrt,r=Math.pow,a=Math.cos,i=Math.atan2,o=Math.sin,l=Math.abs,u=Math.exp,c=Math.PI;function s(t){return t*(c/180)}function f(t,e){if(0===t&&0===e)return 0;var n=i(t,e)*(180/c);return n>=0?n:n+360}},function(t,e){
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
e.map_palette=function(t,e,n,r){var a={};r=void 0!==r?r:{R:255,G:255,B:255},n=n||"closest";for(var o=0;o<t.length;o+=1){for(var l=t[o],c=void 0,s=void 0,f=0;f<e.length;f+=1){var g=e[f],h=u(l,g,r);null==c||"closest"===n&&h<s?(c=g,s=h):"furthest"===n&&h>s&&(c=g,s=h)}a[i(l)]=c}return a},e.map_palette_lab=function(t,e,n){for(var r={},a="furthest"===n,i=0;i<t.length;i+=1){var u=t[i];r[o(u)]=l(u,e,a)}return r},e.match_palette_lab=l,e.palette_map_key=i,e.lab_palette_map_key=o;var r=n(1).ciede2000,a=n(2);function i(t){var e="R"+t.R+"B"+t.B+"G"+t.G;return"A"in t&&(e=e+"A"+t.A),e}function o(t){return"L"+t.L+"a"+t.a+"b"+t.b}function l(t,e,n){for(var a,i,o=e[0],l=r(t,o),u=1,c=e.length;u<c;u+=1)a=e[u],i=r(t,a),(!n&&i<l||n&&i>l)&&(o=a,l=i);return o}function u(t,e,n){var i=a.rgb_to_lab,o=a.rgb_to_lab,l=function(t){return a.rgba_to_lab(t,n)};return"A"in t&&(i=l),"A"in e&&(o=l),t=i(t),e=o(e),r(t,e)}},function(t,e,n){"use strict";n.r(e);var r=n(0),a=n.n(r),i=function(t){o&&console.log(`skribbl.io AutoDraw: ${t}`)};let o=!0;var l=function(t){let e=function(e,n){let r=Math.max(e.width/t.width,e.height/t.height),a=r*t.width,i=r*t.height,o=(e.width-a)/2,l=(e.height-i)/2;n.drawImage(t,o,l,a,i)},n=function(e,n){let r=Math.min(e.width/t.width,e.height/t.height),a=r*t.width,i=r*t.height,o=(e.width-a)/2,l=(e.height-i)/2;n.drawImage(t,o,l,a,i)},r=function(t,e,n){let r=function(t){let e=document.createElement("canvas");return e.width=t.width,e.height=t.height,e}(e),a=r.getContext("2d");return a.imageSmoothingEnabled=!1,n&&function(t,e,n){e.fillStyle=`rgb(${n.r}, ${n.g}, ${n.b})`,e.fillRect(0,0,t.width,t.height)}(r,a,n),t(r,a),function(t,e){let n=e.getImageData(0,0,t.width,t.height);return n.getRgbObject=function(t){return{r:this.data[4*(t.x+t.y*this.width)+0],g:this.data[4*(t.x+t.y*this.width)+1],b:this.data[4*(t.x+t.y*this.width)+2]}},n}(r,a)};return{fillImageData:function(t,n){return i(`Normalizing image to ${t.width} x ${t.height} using fill transform...`),r(e,t,n)},fitImageData:function(t,e){return i(`Normalizing image to ${t.width} x ${t.height} using fit transform...`),r(n,t,e)}}};let u=document.getElementById("containerCanvas"),c=document.getElementById("buttonClearCanvas"),s=function(t){let e=t.getElementById("canvasGame"),n=function(t){let n=e.getBoundingClientRect();return{x:t.x*n.width/800+n.x,y:t.y*n.height/600+n.y}},r=function(t,e){return new MouseEvent(t,{bubbles:!0,clientX:e.x,clientY:e.y,button:0})};return{size:{width:800,height:600},draw:function(t){let a=n(t[0]);e.dispatchEvent(r("mousedown",a));for(let a=1;a<t.length;a++){let i=n(t[a]);e.dispatchEvent(r("mousemove",i))}let i=n(t[t.length-1]);e.dispatchEvent(r("mouseup",i))}}}(document),f=function(t){let e=Array.prototype.slice.call(t.querySelectorAll("[data-color]")),n=e.map(t=>(function(t){let e=t.substring(4,t.length-1).split(", ");return{r:parseInt(e[0]),g:parseInt(e[1]),b:parseInt(e[2])}})(t.style.backgroundColor)),r=new Map(e.map(t=>[t.style.backgroundColor,t])),a=Array.prototype.slice.call(t.querySelectorAll("[data-size]")),i={4:a.filter(t=>"0"===t.getAttribute("data-size"))[0],10:a.filter(t=>"0.15"===t.getAttribute("data-size"))[0],20:a.filter(t=>"0.45"===t.getAttribute("data-size"))[0],40:a.filter(t=>"1"===t.getAttribute("data-size"))[0]},o=t.getElementById("buttonClearCanvas"),l=Array.prototype.slice.call(t.querySelectorAll("[data-tool]")),u=l.filter(t=>"pen"===t.getAttribute("data-tool"))[0],c=l.filter(t=>"fill"===t.getAttribute("data-tool"))[0];return{getColors:()=>n,setColor:t=>{let e=function(t){return`rgb(${t.r}, ${t.g}, ${t.b})`}(t);r.get(e).click()},getPenDiameters:()=>[4,10,20,40],setPenDiameter:t=>{i[t].click()},clear:()=>{o.click()},setPenTool:()=>{u.click()},setFillTool:()=>{c.click()}}}(document),g=function(t,e){let n=function(t){let e=t.map(t=>a.a.rgb_to_lab({R:t.r,G:t.g,B:t.b}));return{getClosestColor:function(n,r){let i=JSON.stringify(n);if(i in r)return r[i];let o=a.a.rgb_to_lab({R:n.r,G:n.g,B:n.b}),l=Number.MAX_VALUE,u=null;for(let n=0;n<e.length;n++){let r=a.a.diff(o,e[n]);r>=l||(l=r,u=t[n])}return r[i]=u,u}}}(e.getColors()),r=function(r,a,i,o){let l=[],u=null,c=null,s=null,f=function(){let n=u,r=[c,s];l.push(function(){e.setPenTool(),e.setColor(n),e.setPenDiameter(a),t.draw(r)}),u=null,c=null,s=null},g=function(t){c=c||t,s=t};return o(function(t,e){let o=n.getClosestColor(r.getRgbObject({x:t,y:e}),i);u=u||o;let l={x:a/2+t*a,y:a/2+e*a};!function(t){return t.r===u.r&&t.g===u.g&&t.b===u.b}(o)?(f(),g(l)):g(l)}),u&&f(),l},o=function(t,e){let n=[],a={};for(let i=0;i<t.width;i++)n=n.concat(r(t,e,a,function(e){for(let n=0;n<t.height;n++)e(i,n)}));for(let i=0;i<t.height;i++)n=n.concat(r(t,e,a,function(e){for(let n=0;n<t.width;n++)e(n,i)}));return n};return{draw:function(n){let r=[];for(let a of e.getPenDiameters().filter(t=>t>4).sort().reverse()){let e={width:t.size.width/a,height:t.size.height/a},l=n.fitImageData(e,{r:255,g:255,b:255});i(`Generating draw commands for ${a}px pen...`);let u=o(l,a);i(`${u.length} commands generated.`),u.sort(function(){return.5-Math.random()}),r=r.concat(u)}return r}}}(s,f),h=[],d=function(){f.clear(),i(`Drawing ${this.width} x ${this.height} image...`);let t=l(this);!function(t,e){let n=function(){t.length?(t.shift()(),t.length%100==0&&t.length>0&&i(`${t.length} commands remaining to process.`),setTimeout(n,e||0)):i("Processing finished.")};i(`Processing ${t.length} commands...`),n()}(h=g.draw(t),10)};u.addEventListener("dragover",function(){u.classList.add("showAutoDrawOverlay"),event.preventDefault()}),u.addEventListener("dragleave",function(){u.classList.remove("showAutoDrawOverlay")}),u.addEventListener("drop",function(){i("Processing dropped content..."),u.classList.remove("showAutoDrawOverlay"),event.preventDefault();let t=((e=event.dataTransfer).files.length?e.files[0].type.startsWith("image/")?URL.createObjectURL(e.files[0]):(log("Dropped file isn't an image."),null):null)||function(t){let e=t.getData("text/html");if(!e)return null;let n=document.createElement("div");n.innerHTML=e;let r=n.firstChild;return r&&/^img$/i.test(r.tagName)?r.getAttribute("src"):(log("Dropped element isn't an image."),null)}(event.dataTransfer);var e;t?function(t,e){let n=new Image;n.onload=e,n.onerror=function(){i("Error loading image.")},i(`Loading image: ${t}...`),n.crossOrigin="Anonymous",n.src=t.startsWith("http")?"https://cors-anywhere.herokuapp.com/"+t:t}(t,d):i("Dropped content not recognized.")}),c.addEventListener("click",function(){h.length&&(i("Clearing commands..."),h.length=0,i("Drawing stopped."))}),i("Initializing overlay...");let p=document.createElement("p");p.id="autoDrawOverlay",p.innerText="Drop an image here to auto draw!",u.appendChild(p)}]);