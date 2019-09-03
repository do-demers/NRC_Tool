//Var decs
var intext_en = "";
var intext_fr = "";
var maxLength = "...";

//Get elements
var selectBTN = d3.select("#submitBTN");
var clearBTN = d3.select("#clearBTN");
var expBTN = d3.select("#csvBTN");
var out_en = d3.select("#output_en");
var out_fr = d3.select("#output_fr");
var in_en = d3.select("#input_en");
var in_fr = d3.select("#input_fr");
var charsEN = d3.select("#charsEN");
var charsFR = d3.select("#charsFR");
var warning = d3.select("#warning");
var warnText = d3.select("#warnText");

var out_id = d3.select("#output_id");
var out_sc = d3.select("#output_sc");

//Remaining characters text
in_en.on("keyup", function () {
    var tLength = in_en.property("value").length;
    charsEN.text(tLength + "/" + maxLength);
});
in_fr.on("keyup", function () {
    var tLength = in_fr.property("value").length;
    charsFR.text(tLength + "/" + maxLength);
});

//Perform split/check
selectBTN.on("click", function () {
    //"remove" any warnings
    warning.transition()
        .delay(250)
        .style("opacity", "0");

    //Remove leading/trailing whitespace
    intext_en = in_en.property("value");
    intext_en = intext_en.trim();

    intext_fr = in_fr.property("value");
    intext_fr = intext_fr.trim();

    //If either input is blank, display error.
    if (intext_en.length === 0 || intext_fr.length === 0) {
        warning.transition()
            .delay(250)
            .style("opacity", "1");
        warnText.text("Please enter text in both input boxes");
    }
    //If text is the same in the two, alert user
    else if (intext_en === intext_fr) {
        warning.transition()
            .delay(250)
            .style("opacity", "1");
        warnText.text("English and French text is identical. Please check the input boxes.");
    }
    else {
        //Clear any previous results then continue
        out_en.selectAll("div").remove();
        out_fr.selectAll("div").remove();

        out_id.selectAll("div").remove();
        out_sc.selectAll("div").remove();

        newLines();
    }
});

//Clear boxes and remove validated lines
clearBTN.on("click", function () {
    //"remove" any warnings
    warning.transition()
        .delay(250)
        .style("opacity", "0");

    //D3 does not play well with setting textarea value...
    document.getElementById('input_en').value = "";
    document.getElementById('input_fr').value = "";

    //Reset remaining characters text
    charsEN.text(0 + "/" + maxLength);
    charsFR.text(0 + "/" + maxLength);

    out_en.selectAll("div").remove();
    out_fr.selectAll("div").remove();

    out_id.selectAll("div").remove();
    out_sc.selectAll("div").remove();
});

//Find line returns, periods with spaces (differs from loops and conditions in SAS code)
function newLines() {
    //Fix specific characters that can cause problems splitting lines later (hence not in cleaner function)
    intext_en = intext_en.replace(/[*\t]/g, ' ');
    intext_en = intext_en.replace(/[¿]/g, "'");
    intext_fr = intext_fr.replace(/[*\t]/g, ' ');
    intext_fr = intext_fr.replace(/[¿]/g, "'");

    //Regex to find new line or sentences
    //Algorithm is sensitive to punctuation at end of lines.
    var regex = /[\n\r](?!\. |\?|!)/g;

    //Split text... no loops or arrays. Isn't javascript wonderful?
    var text_lines_en = intext_en.split(regex);
    var text_lines_fr = intext_fr.split(regex);

    //Quick cleaning text
    text_lines_en = elementClean(text_lines_en);
    text_lines_fr = elementClean(text_lines_fr);

    //If one language has more lines of text than the other, display error.
    if (text_lines_en.length !== text_lines_fr.length) {
        warning.transition()
            .delay(250)
            .style("opacity", "1");
        warnText.text("Text does not match. One language has more sentences/qualifications than the other.");
    }
    else {
        //Display results
        results(text_lines_en, text_lines_fr);
    }
}

//Removes bullets, leading and trailing spaces, blanks, and enumeration lines
function elementClean(array) {
    //Removes non-alphanumeric from beginning of lines
    var regex = /^\w{0,4}[^a-zA-ZéÉàÀ0-9«»\s]|^[^a-zA-ZéÉàÀ0-9«»\s]*/g;
    var nalpha = /^[^a-zA-ZéÉàÀ0-9«»]*/g;

    //Do some checks for enumerated points
    for (var i in array) {
        array[i] = array[i].replace(nalpha, '');
        array[i] = array[i].replace(regex, '');
        array[i] = array[i].replace(nalpha, '');
        array[i] = array[i].trim();

        if (array[i].length <= 2) {
            delete array[i];
        }
    }

    //Remove blank rows
    array = array.filter(Boolean);

    return array;
}

function results(text_en, text_fr) {

    var alertClass = (["alert alert-success", "alert alert-warning", "alert alert-danger"]);

    //Prepare server request
    var xhr = new XMLHttpRequest();
    var url = "http://167.43.6.69/api/teelive_batch";
    var data;

    //Prepare text
    var length = text_en.length;
    var pairs = [];

    for (var i = 0; i < length; i++) {
        //Must initiate first, otherwise get error
        pairs[i] = {};
        pairs[i].en = text_en[i];
        pairs[i].fr = text_fr[i];
        pairs[i].score = 1;
    }

    //Send text to algorithm
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");

    data = JSON.stringify(pairs);
    xhr.send(data);

    //Handle algorithm response
    xhr.onreadystatechange = function () {

        //Good response handler
        if (xhr.readyState === 4 && xhr.status === 201) {
            pairs = JSON.parse(xhr.responseText);

            //Add ID
            out_id.selectAll("div")
                .data(pairs)
                .enter().append("div")
                .attr("class", function (d) {
                    //good score
                    if (d.score >= 0.5) {
                        return alertClass[0];
                    }
                    //bad score
                    else if (d.score < 0.3) {
                        return alertClass[2];
                    }
                    //marginal score
                    else
                        return alertClass[1];
                })
                .style("opacity", "0")
                .style("height", "84px")
                .style("width", "100%")
                .style("padding", "5px")
                .style("overflow-y", "auto")
                .append("p")
                .text(function (d, i) {
                    d.id = i;
                    return "ID: line " + d.id;
                });

            //Add English results
            out_en.selectAll("div")
                .data(pairs)
                .enter().append("div")
                .attr("class", function (d) {
                    //good score
                    if (d.score >= 0.5) {
                        return alertClass[0];
                    }
                    //bad score
                    else if (d.score < 0.3) {
                        return alertClass[2];
                    }
                    //marginal score
                    else
                        return alertClass[1];
                })
                .style("opacity", "0")
                .style("height", "84px")
                .style("width", "100%")
                .style("padding", "5px")
                .style("overflow-y", "auto")
                .append("p")
                .text(function (d) {
                    return d.en;
                });

            //Add French results
            out_fr.selectAll("div")
                .data(pairs)
                .enter().append("div")
                .attr("class", function (d) {
                    //Good score
                    if (d.score >= 0.5) {
                        return alertClass[0];
                    }
                    //Bad score
                    else if (d.score < 0.3) {
                        return alertClass[2];
                    }
                    //Marginal score
                    else
                        return alertClass[1];
                })
                .style("opacity", "0")
                .style("height", "84px")
                .style("width", "100%")
                .style("padding", "5px")
                .style("overflow-y", "auto")
                .append("p")
                .text(function (d) {
                    return d.fr;
                });

            //Add Score
            out_sc.selectAll("div")
                .data(pairs)
                .enter().append("div")
                .attr("class", function (d) {
                    //good score
                    if (d.score >= 0.5) {
                        return alertClass[0];
                    }
                    //bad score
                    else if (d.score < 0.3) {
                        return alertClass[2];
                    }
                    //marginal score
                    else
                        return alertClass[1];
                })
                .style("opacity", "0")
                .style("height", "84px")
                .style("width", "100%")
                .style("padding", "5px")
                .style("overflow-y", "auto")
                .append("p")
                .text(function (d) {
                    return d.score;
                });

            //transition appearance
            out_id.selectAll("div")
                .transition()
                .delay(500)
                .style("opacity", "1");

            out_en.selectAll("div")
                .transition()
                .delay(500)
                .style("opacity", "1");

            out_fr.selectAll("div")
                .transition()
                .delay(500)
                .style("opacity", "1");

            out_sc.selectAll("div")
                .transition()
                .delay(500)
                .style("opacity", "1");
        }

        //Error response handler
        else if (xhr.status !== 201) {
            //Handle errors here
            console.log(JSON.parse(JSON.stringify(xhr.responseText)));
        }
    };

    //Place CSV export here so it has easy access to results
    expBTN.on("click", function () {
        console.log(pairs);

        var csv = 'Line ID,English,French,Score\n';
        pairs.forEach(function (row) {
            csv += row.id + ',\"' + row.en + '\",\"' + row.fr + '\",' + row.score + '\n';
        });

        console.log(csv);

        //Need to add BOM since Excel will default to the wrong encoding when opening CSV.
        //Use of BOM is not otherwise recommended.
        var universalBOM = "\uFEFF";

        //Download CSV file
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(universalBOM + csv);
        hiddenElement.target = '_blank';
        hiddenElement.download = 'results.csv';

        //For browser compatibility
        document.body.appendChild(hiddenElement);
        hiddenElement.click();
        document.body.removeChild(hiddenElement);

    });

}
