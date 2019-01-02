import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {parseCode, itercode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let inputsToPars = $('#inputsPlaceholder').val();
        let parsedInputs = parseCode(inputsToPars);
        let strDiagram =itercode(parsedCode, parsedInputs);

        let diagram = flowchart.parse(strDiagram);

        //let p = document.getElementById('diagram');
        //p.innerHTML = strDiagram;

        styleDiagram(diagram);
        //$('#parsedCode').val(JSON.stringify(itercode(parsedCode, parsedInputs)));
    });
});


function styleDiagram(diagram) {
    diagram.drawSVG('diagram', {
        'x': 0,
        'y': 0,
        'line-width': 3,
        'line-length': 50,
        'text-margin': 10,
        'font-size': 14,
        'font-color': 'black',
        'line-color': 'black',
        'element-color': 'black',
        'fill': 'white',
        'yes-text': 'T',
        'no-text': 'F',
        'arrow-end': 'block',
        'scale': 1,
        'flowstate' : {
            'thePath': {'fill':'#58C4A3'}
        }});}
