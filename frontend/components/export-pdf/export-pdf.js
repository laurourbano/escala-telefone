function exportSchedulePDF() {
    var days = getWorkingDays();
    var html = '\
        <div id="pdf-export" style="\
            font-family: Arial, sans-serif;\
            padding: 8px;\
            color: #111;\
            background: white;\
        ">\
            <div style="\
                display:flex;\
                justify-content:space-between;\
                align-items:center;\
                margin-bottom:10px;\
                border-bottom:2px solid #7c3aed;\
                padding-bottom:6px;\
            ">\
                <div>\
                    <h1 style="margin:0;color:#7c3aed;font-size:22px;">Escala de Trabalho</h1>\
                    <p style="margin:4px 0 0;font-size:11px;color:#666;">\
                        ' + formatDate(days[0]) + ' ate ' + formatDate(days[days.length - 1]) + '\
                    </p>\
                </div>\
                <div style="text-align:right;color:#666;font-size:10px;">\
                    <div><strong>EscalaAI</strong></div>\
                    <div>' + new Date().toLocaleDateString('pt-BR') + '</div>\
                </div>\
            </div>\
            <table style="width:100%;border-collapse:collapse;table-layout:fixed;">\
                <thead>\
                    <tr>\
                        <th style="background:#7c3aed;color:white;padding:6px;border:1px solid #ddd;width:120px;font-size:11px;">Turno</th>\
                        ' + days.map(function (day) {
        return '<th style="background:#7c3aed;color:white;padding:6px;border:1px solid #ddd;font-size:10px;">' + formatDate(day) + '</th>';
    }).join('') + '\
                    </tr>\
                </thead>\
                <tbody>\
    ';
    state.shifts.forEach(function (shift, index) {
        html += '\
                <tr style="background:' + (index % 2 === 0 ? '#fafafa' : '#ffffff') + ';">\
                    <td style="border:1px solid #ddd;padding:8px;vertical-align:top;">\
                        <div style="font-size:11px;font-weight:bold;margin-bottom:4px;color:#111;">' + shift.name + '</div>\
                        <div style="font-size:10px;color:#666;">' + shift.time + '</div>\
                    </td>\
        ';
        days.forEach(function (day) {
            var key = shift.id + '-' + day;
            var peopleIds = (function () {
                if (state.schedule[key] && state.schedule[key].length) {
                    return state.schedule[key];
                }
                var dropzone = document.querySelector('.shift-dropzone[data-shift-id="' + shift.id + '"][data-day="' + day + '"]');
                if (!dropzone) return [];
                return Array.from(dropzone.querySelectorAll('.scheduled-person')).map(function (el) { return el.dataset.personId; });
            })();
            html += '\
                    <td style="border:1px solid #ddd;padding:4px;vertical-align:top;height:70px;">\
            ';
            if (peopleIds.length === 0) {
                html += '<div style="color:#bbb;text-align:center;padding-top:10px;font-size:10px;">-</div>';
            } else {
                peopleIds.forEach(function (personId) {
                    var person = state.people.find(function (p) { return p.id === personId; });
                    if (!person) return;
                    html += '\
                        <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:6px;padding:5px;margin-bottom:4px;text-align:center;font-size:11px;font-weight:600;color:#4c1d95;line-height:1.2;">\
                            ' + getFirstName(person.name) + '\
                        </div>\
                    ';
                });
            }
            html += '</td>';
        });
        html += '</tr>';
    });
    html += '\
                </tbody>\
            </table>\
        </div>\
    ';
    var container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    var previewWindow = window.open('', '_blank');
    previewWindow.document.write('\
        <html>\
        <head>\
            <title>Pre-visualizacao da Escala</title>\
            <style>\
                body{margin:0;padding:12px;background:#e5e7eb;font-family:Arial,sans-serif;}\
                .toolbar{position:sticky;top:0;z-index:999;background:white;padding:10px;margin-bottom:12px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.08);display:flex;gap:10px;align-items:center;}\
                button{border:none;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;}\
                .download{background:#7c3aed;color:white;}\
                .close{background:#ef4444;color:white;}\
                #preview-container{background:white;padding:10px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.10);overflow:auto;}\
            </style>\
        </head>\
        <body>\
            <div class="toolbar">\
                <button class="download" id="btn-download">Baixar PDF</button>\
                <button class="close" onclick="window.close()">Fechar</button>\
            </div>\
            <div id="preview-container">' + html + '</div>\
        </body>\
        </html>\
    ');
    previewWindow.document.close();
    previewWindow.onload = function () {
        previewWindow.document.getElementById('btn-download').addEventListener('click', function () {
            var pdfElement = previewWindow.document.querySelector('#pdf-export');
            html2pdf()
                .set({
                    margin: 0.1,
                    filename: 'escala-' + state.scheduleStartDate + '.pdf',
                    image: { type: 'jpeg', quality: 1 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                })
                .from(pdfElement)
                .save();
        });
    };
    document.body.removeChild(container);
}
