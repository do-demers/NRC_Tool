//Var decs
let intext_en = "";
let intext_fr = "";
let maxLength = 750;

//TEST COMMENT FOR COMMIT

//Get elements
let selectBTN = d3.select("#submitBTN");
let clearBTN = d3.select("#clearBTN");
let out_en = d3.select("#output_en");
let out_fr = d3.select("#output_fr");
let in_en = d3.select("#input_en");
let in_fr = d3.select("#input_fr");
let charsEN = d3.select("#charsEN");
let charsFR = d3.select("#charsFR");

//remaining characters text
in_en.on("keyup", function() {
    let tLength = in_en.property("value").length;
    charsEN.text(tLength + "/" + maxLength);
});
in_fr.on("keyup", function() {
    let tLength = in_fr.property("value").length;
    charsFR.text(tLength + "/" + maxLength);
});

//Perform split/check
selectBTN.on("click", function() {
        intext_en = in_en.property("value");
        intext_en = intext_en.trim();

        intext_fr = in_fr.property("value");
        intext_fr = intext_fr.trim();

        if (intext_en.length === 0 || intext_fr.length === 0)
        {
            alert("Please enter text in both input boxes");
        }
        else
        {
            //Clear any previous results then continue
            out_en.selectAll("div").remove();
            out_fr.selectAll("div").remove();
            newLines();
        }
});

//Clear boxes and remove validated lines
clearBTN.on("click", function (){
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
    intext_en=intext_en.replace(/[*\t]/g,'');
    intext_en=intext_en.replace(/[¿]/g,"'");
    intext_fr=intext_fr.replace(/[*\t]/g,'');
    intext_fr=intext_fr.replace(/[¿]/g,"'");

    //Regex to find new line or sentences
    let regex = /[\n\r]|\. |\?|!/g;

    //Split text... no loops or arrays. Isn't javascript wonderful?
    let text_lines_en = intext_en.split(regex);
    let text_lines_fr = intext_fr.split(regex);

    //Quick cleaning text
    text_lines_en = elementClean(text_lines_en);
    text_lines_fr = elementClean(text_lines_fr);

    //Place lines in specific div
    if (text_lines_en.length !== text_lines_fr.length) {
        alert("Text does not match. One language has more sentences/qualifications than the other.")
    }
    else {
        let alertClass = (["alert alert-success","alert alert-warning","alert alert-danger"]);

        //Add eng
        out_en.selectAll("div")
            .data(text_lines_en)
            .enter().append("div")
            .attr("class", function (d,i){
                //just loops through alert styles... to be replaced.
                if (i>2)
                {
                    i = Math.floor(i/3)-1;
                    return alertClass[i];
                }
                else
                    return alertClass[i];
            })
            .style("opacity", "0")
            .style("height","84px")
            .style("padding","5px")
            .style("overflow-y", "auto")
            .text(function (d) {
                return d
            });

        //Add fre
        out_fr.selectAll("div")
            .data(text_lines_fr)
            .enter().append("div")
            .attr("class", function (d,i){
                //just loops through alert styles... to be replaced.
                if (i>2)
                {
                    i = Math.floor(i/3)-1;
                    return alertClass[i];
                }
                else
                    return alertClass[i];
            })
            .style("opacity", "0")
            .style("height","84px")
            .style("padding","5px")
            .style("overflow-y", "auto")
            .text(function (d) {
                return d
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
}

//Removes bullets, leading and trailing spaces, blanks, and enumeration lines
function elementClean (array)
{
    //Removes non-alphanumeric from beginning of lines
    let regex = /^[^a-zA-ZéÉàÀ0-9]*/g;

    for (let i in array)
    {
        array[i]=array[i].replace(regex,'');
        array[i]=array[i].trim();

       if (array[i].length <=2)
        {
            delete array[i];
        }
    }

    //remove blank rows
    array = array.filter(Boolean);

    return array;
}
