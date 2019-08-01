//Var decs
var intext_en = "";
var intext_fr = "";
var maxLength = 750;

//Get elements
var selectBTN = d3.select("#submitBTN");
var clearBTN = d3.select("#clearBTN");
var out_en = d3.select("#output_en");
var out_fr = d3.select("#output_fr");
var in_en = d3.select("#input_en");
var in_fr = d3.select("#input_fr");
var charsEN = d3.select("#charsEN");
var charsFR = d3.select("#charsFR");
var warning = d3.select("#warning");
var warnText = d3.select("#warnText");

//remaining characters text
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

    intext_en = in_en.property("value");
    intext_en = intext_en.trim();

    intext_fr = in_fr.property("value");
    intext_fr = intext_fr.trim();

    if (intext_en.length === 0 || intext_fr.length === 0) {
        warning.transition()
            .delay(250)
            .style("opacity", "1");
        warnText.text("Please enter text in both input boxes");

    }
    else {
        //Clear any previous results then continue
        out_en.selectAll("div").remove();
        out_fr.selectAll("div").remove();
        newLines();
    }
});

//Clear boxes and remove validated lines
clearBTN.on("click", function () {
    //"remove" any warnings
    warning.transition()
        .delay(250)
        .style("opacity", "0");

    //d3 does not play well with setting textarea value...
    document.getElementById('input_en').value = "";
    document.getElementById('input_fr').value = "";

    charsEN.text(0 + "/" + maxLength);
    charsFR.text(0 + "/" + maxLength);

    out_en.selectAll("div").remove();
    out_fr.selectAll("div").remove();
});

//Find line returns, periods with spaces (differs from loops and conditions in SAS code)
function newLines() {
    //Fix specific characters that can cause problems splitting lines later (hence not in cleaner function)
    intext_en = intext_en.replace(/[*\t]/g, '');
    intext_en = intext_en.replace(/[¿]/g, "'");
    intext_fr = intext_fr.replace(/[*\t]/g, '');
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

    //Place lines in specific div
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
    var regex = /^\w{0,4}[^a-zA-ZéÉàÀ0-9«»]|^\d{0,4}[^a-zA-ZéÉàÀ0-9«»]|^[^a-zA-ZéÉàÀ0-9«»]*/g;
    var nalpha = /^[^a-zA-ZéÉàÀ0-9«»]*/g;

    for (var i in array) {
        array[i] = array[i].replace(nalpha, '');
        array[i] = array[i].replace(regex, '');
        array[i] = array[i].replace(nalpha, '');
        array[i] = array[i].trim();

        if (array[i].length <= 2) {
            delete array[i];
        }
    }

    //remove blank rows
    array = array.filter(Boolean);

    return array;
}

function results(text_en, text_fr) {

    var alertClass = (["alert alert-success", "alert alert-warning", "alert alert-danger"]);

    //Prepare server request
    var xhr = new XMLHttpRequest();
    var url = "http://172.22.23.29/api/teelive_batch";
    var data;

    //Prepare text
    var length = text_en.length;
    var pairs = [];

    for (var i = 0; i < length; i++) {
        //must initiate first, otherwise get error
        pairs[i] = {};
        pairs[i].en = text_en[i];
        pairs[i].fr = text_fr[i];
        pairs[i].score = 1;
    }

    //Send text to algorithm
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    data = JSON.stringify(pairs);
    xhr.send(data);

    //Handle algorithm response
    xhr.onreadystatechange = function () {

        //Good response handler
        if (xhr.readyState === 4 && xhr.status === 201) {
            pairs = JSON.parse(xhr.responseText);

            console.log(pairs);

            //Add eng
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
                .style("padding", "5px")
                .style("overflow-y", "auto")
                .append("p")
                .text(function (d) {
                    return d.en;
                });

            //Add fre
            out_fr.selectAll("div")
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
                .style("padding", "5px")
                .style("overflow-y", "auto")
                .append("p")
                .text(function (d) {
                    return d.fr;
                });

            out_en.selectAll("div")
                .transition()
                .delay(500)
                .style("opacity", "1");

            out_fr.selectAll("div")
                .transition()
                .delay(500)
                .style("opacity", "1");
        }

        //Error response handler
        else if (xhr.status !== 201) {
            //Handle errors here
            console.log(JSON.parse(xhr.responseText));
        }
    };
}
