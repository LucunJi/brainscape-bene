// ==UserScript==
// @name        Brainscape Bene
// @namespace	https://www.brainscape.com/
// @version     1
// @description	Import/export your Brainscape decks from/into csv files without a Pro account.
// @author	    LucunJi
// @match		https://www.brainscape.com/l/dashboard/*/decks*
// @grant       none
// @require     https://code.jquery.com/jquery-3.6.0.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js
// @license     MIT
// ==/UserScript==

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
    var packId = $(event.target).parents('.pack-decks-section[data-pack-id]').attr('data-pack-id');
    var deckName = prompt('Enter the title of your new deck below');
    var fileSelector = document.createElement('input');
    fileSelector.type = 'file';
    fileSelector.accept = '.csv';

    fileSelector.onchange = function (event) {
        var reader = new FileReader();
        reader.onload = function () {
            var parsedCSV = Papa.parse(reader.result);
            if (parsedCSV['errors'].length > 0) {
                alert(`The csv file is not illegal: ${parsedCSV['errors'][0]['message']}`);
                return;
            }

            // convert to params
            var data = new FormData();
            var timestamp = Date.now()
            for (var entry of parsedCSV['data']) if (entry.length >= 2) {
                data.append(`deck[cards_attributes][${timestamp}][reveal]`, 'false');
                data.append(`deck[cards_attributes][${timestamp}][question]`, entry[0]);
                data.append(`deck[cards_attributes][${timestamp}][answer]`, entry[1]);
                timestamp++;
            }

            // send post request
            fetch(`https://www.brainscape.com/api/decks?packID=${packId}`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content_type: 'text', name: deckName })
            })
                .then(res => res.json())
                .then(res => fetch(`https://www.brainscape.com/decks/${res['deckID']}/cards/quick_add`, {
                        method: 'POST',
                        headers: { 'x-csrf-token': $("[name=csrf-token]").attr('content') },
                        body: data
                    })
                )
                .then(response => location.reload())
                .catch(err => alert(`failed to import new deck ${err}`));
        };
        reader.readAsText(event.target.files[0]);
    };

    fileSelector.click();

    event.stopImmediatePropagation();
}

function exportCSV(event) {
    var packId = $(event.target).parents('.pack-decks-section[data-pack-id]').attr('data-pack-id');
    var deckId = $(event.target).parents('.deck-row[id]').attr('id');
    var deckName = $(event.target).parents('.deck-name').html();
    fetch(`https://www.brainscape.com/api/packs/${packId}/decks/${deckId}/preview`, {
        method: 'GET',
    })
        .then(res => res.json())
        .then(res => {
            var csvData = res['cards'].map(card => [card['question'], card['answer']]);
            var fileDownloader = document.createElement('a');
            fileDownloader.setAttribute('href',
                'data:text/plain;charset=utf-8, ' + encodeURIComponent(Papa.unparse(csvData)));
            fileDownloader.setAttribute('download', res['deck']['name'] + '.csv');
            fileDownloader.click();
        })

    event.stopImmediatePropagation();
}
