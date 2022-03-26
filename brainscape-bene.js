// ==UserScript==
// @name        Brainscape Bene
// @namespace	https://www.brainscape.com/
// @version     1
// @description	Import/export your Brainscape decks from/into csv files without a Pro account.
// @author	    LucunJi
// @match		https://www.brainscape.com/l/dashboard/*/decks*
// @grant       none
// @require     https://code.jquery.com/jquery-3.6.0.min.js
// @license     MIT
// ==/UserScript==


/**
 * CSV library with MIT License: https://github.com/vanillaes/csv
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Evan Plaice <evanplaice@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function b(t,n,i=e=>e){let e=Object.create(null);e.options=n||{},e.reviver=i,e.value="",e.entry=[],e.output=[],e.col=1,e.row=1;let l=/"|,|\r\n|\n|\r|[^",\r\n]+/y,a=/^(\r\n|\n|\r)$/,u=[],o="",r=0;for(;(u=l.exec(t))!==null;)switch(o=u[0],r){case 0:switch(!0){case o==='"':r=3;break;case o===",":r=0,s(e);break;case a.test(o):r=0,s(e),c(e);break;default:e.value+=o,r=2;break}break;case 2:switch(!0){case o===",":r=0,s(e);break;case a.test(o):r=0,s(e),c(e);break;default:throw r=4,Error(`CSVError: Illegal state [row:${e.row}, col:${e.col}]`)}break;case 3:switch(!0){case o==='"':r=4;break;default:r=3,e.value+=o;break}break;case 4:switch(!0){case o==='"':r=3,e.value+=o;break;case o===",":r=0,s(e);break;case a.test(o):r=0,s(e),c(e);break;default:throw Error(`CSVError: Illegal state [row:${e.row}, col:${e.col}]`)}break}return e.entry.length!==0&&(s(e),c(e)),e.output}function w(t,n={},i=e=>e){let e=Object.create(null);e.options=n,e.options.eof=e.options.eof!==void 0?e.options.eof:!0,e.row=1,e.col=1,e.output="";let l=/"|,|\r\n|\n|\r/;return t.forEach((a,u)=>{let o="";switch(e.col=1,a.forEach((r,f)=>{typeof r=="string"&&(r=r.replace(/"/g,'""'),r=l.test(r)?`"${r}"`:r),o+=i(r,e.row,e.col),f!==a.length-1&&(o+=","),e.col++}),!0){case e.options.eof:case(!e.options.eof&&u!==t.length-1):e.output+=`${o}
`;break;default:e.output+=`${o}`;break}e.row++}),e.output}function s(t){let n=t.options.typed?p(t.value):t.value;t.entry.push(t.reviver(n,t.row,t.col)),t.value="",t.col++}function c(t){t.output.push(t.entry),t.entry=[],t.row++,t.col=1}function p(t){let n=/.\./;switch(!0){case t==="true":case t==="false":return t==="true";case n.test(t):return parseFloat(t);case isFinite(t):return parseInt(t);default:return t}}parse=b;stringify=w;


$(document).ready(function (event) {
    tryReplaceBtn(event);
});

function tryReplaceBtn(event) {
    var timer = setInterval(function () {
        var importBtn = $('.import-deck.pro-required');
        var exportBtn = $('.export-deck.pro-required');
        if (importBtn.length > 0) {
            importBtn = importBtn.get(0);
            var newImportBtn = importBtn.cloneNode(true);
            importBtn.replaceWith(newImportBtn);
            newImportBtn.classList.remove('pro-required');
            newImportBtn.addEventListener('click', importCSV);
        }
        if (exportBtn.length > 0) {
            exportBtn = exportBtn.get(0);
            var newExportBtn = exportBtn.cloneNode(true);
            exportBtn.replaceWith(newExportBtn);
            newExportBtn.classList.remove('pro-required');
            newExportBtn.addEventListener('click', exportCSV);
        }
    }, 50);

    event.stopImmediatePropagation();
}

function importCSV(event) {
    // create new deck
    var packId = $(event.target).parents('.pack-decks-section[data-pack-id]').attr('data-pack-id');
    var deckName = prompt('Enter the title of your new deck below');
    fetch(`https://www.brainscape.com/api/decks?packID=${packId}`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: 'text', name: deckName })
    })
        .then(res => res.json())
        .then(res => appendCSV(res['deckID']))
        .catch(err => alert(`failed to create new deck ${err}`));
}

function appendCSV(deckId) {
    var fileSelector = document.createElement('input');
    fileSelector.type = 'file';
    fileSelector.accept = '.csv';
    fileSelector.onchange = function (event) {
        var reader = new FileReader();
        reader.onload = function () {
            var parsedCSV = parse(reader.result);
            // validate
            for (let i = 0; i < parsedCSV.length; i++) {
                if (parsedCSV[i].length !== 2) {
                    alert(`The number of items in entry {i} does not equal to 2.`);
                    return;
                }
            }
            // convert to params
            var data = new FormData();
            var timestamp = Date.now()
            for (var entry of parsedCSV) {
                data.append(`deck[cards_attributes][${timestamp}][reveal]`, 'false');
                data.append(`deck[cards_attributes][${timestamp}][question]`, entry[0]);
                data.append(`deck[cards_attributes][${timestamp}][answer]`, entry[1]);
                timestamp++;
            }
            // send post request
            fetch(`https://www.brainscape.com/decks/${deckId}/cards/quick_add`, {
                method: 'POST',
                headers: { 'x-csrf-token': $("[name=csrf-token]").attr('content') },
                body: data
            }).then(response => location.reload());
        };
        reader.readAsText(event.target.files[0]);
    };
    fileSelector.click();
}

function exportCSV(event) {
    var packId = $(event.target).parents('.pack-decks-section[data-pack-id]').attr('data-pack-id');
    var deckId = $(event.target).parents('.deck-row[id]').attr('id');
    var deckName = $(event.target).parents('.deck-name').html();
    fetch(`https://www.brainscape.com/api/packs/${packId}/decks/${deckId}/preview`, {
        method: 'GET',
    })
        .then(res => res.json())
        .then(parseCSV)
    event.stopImmediatePropagation();
}

function parseCSV(data) {
    var csvData = data['cards'].map(card => [card['question'], card['answer']]);
    var fileDownloader = document.createElement('a');
    console.log(csvData);
    console.log(stringify(csvData));
    fileDownloader.setAttribute('href',
        'data:text/plain;charset=utf-8, ' + encodeURIComponent(stringify(csvData)));
    fileDownloader.setAttribute('download', data['deck']['name'] + '.csv');
    fileDownloader.click();
}
