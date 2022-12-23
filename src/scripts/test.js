// data -------------------------------------------------------------

var csv = '''L1,L2,L3,L4,L5,VL5,SewP,Ref,Fname,Old,VL1,VL2,VL3,VL4
2,30,00,DNP,X SHORT,XSHT,T,55L,55L_2_XSHT_T.pdf,55L_WP_SD_S_Data Set 1,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,SHORT,SHT,T,55L,55L_2_SHT_T.pdf,55L_WP_SD_S_Data Set 2,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,REGULAR,REG,T,55L,55L_2_REG_T.pdf,55L_WP_SD_S_Data Set 3,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,MEDIUM,MED,T,55L,55L_2_MED_T.pdf,55L_WP_SD_S_Data Set 4,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,LONG,LNG,T,55L,55L_2_LNG_T.pdf,55L_WP_SD_S_Data Set 5,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,X LONG,XLNG,T,55L,55L_2_XLNG_T.pdf,55L_WP_SD_S_Data Set 6,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,SHORT/REGULAR,SHT_REG,T,55L,55L_2_SHT_REG_T.pdf,55L_WP_SD_S_Data Set 7,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,REGULAR/LONG,REG_LNG,T,55L,55L_2_REG_LNG_T.pdf,55L_WP_SD_S_Data Set 8,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
2,30,00,DNP,LONG/X LONG,LNG_XLNG,T,55L,55L_2_LNG_XLNG_T.pdf,55L_WP_SD_S_Data Set 9,UK/AUS/NZ • 2,EUR • 30,CAN/US • 00,
4,32,0,152/176-76-84,X SHORT,XSHT,T,55L,55L_4_XSHT_T.pdf,55L_WP_SD_S_Data Set 10,UK/AUS/NZ • 4,EUR • 32,CAN/US • 0,RU • 152/176-76-84
4,32,0,152/176-76-84,SHORT,SHT,T,55L,55L_4_SHT_T.pdf,55L_WP_SD_S_Data Set 11,UK/AUS/NZ • 4,EUR • 32,CAN/US • 0,RU • 152/176-76-84'''

var lines = csv.split("\n");


// MAIN -------------------------------------------------------------

// make character styles
var FONT1 = make_style("font1", "ArialMT", 5.5);
var FONT2 = make_style("font2", "Verdana", 5.5);
var FONT3 = make_style("font3", "TimesNewRomanPSMT", 6.3);

// process lines
for (var i=1; i<lines.length; i++) {
    var data = get_data_from(lines[i]);
    make_layer(data.name)
    var text = make_text(data.contents);
    apply_styles(text);
    put_in_center(text);
}

// END

// functions --------------------------------------------------------

function make_style(style_name, font_name, size) {
    // try to add a new style
    try { var style = app.activeDocument.characterStyles.add(style_name) }
    // or pick a style with the same name if it exists already
    catch(e) { var style = app.activeDocument.characterStyles.getByName(style_name) }
    style.characterAttributes.size = size;
    style.characterAttributes.textFont = textFonts.getByName(font_name);
    return style;
}

function get_data_from(line) {
    var arr = line.split(",");
    var L5    = arr[4];
    var Fname = arr[8].replace(".pdf", "");
    var VL1   = arr[10];
    var VL2   = arr[11];
    var VL3   = arr[12];
    var VL4   = arr[13];
    return {"name":Fname, "contents":[VL1, VL2, VL3, VL4, L5]};
}

function make_layer(layer_name) {
    var new_layer = app.activeDocument.layers.add();
    new_layer.name = layer_name;
}

function make_text(array) {
    var text = app.activeDocument.textFrames.add();
        text.contents = array.join("\n");
    return text;
}

function apply_styles(text) {
    // not the best piece of code, I'm sure it can be done better
    text.textRange.paragraphAttributes.justification = Justification.CENTER;

    FONT1.applyTo(text.textRange);

    var chars = text.textRange.characters;
    for (var i=0; i<chars.length; i++) {
        var ch = chars[i];
        if (ch.contents == "•") {
            FONT2.applyTo(ch);
            i++;
            i++;
            for (var j=i; j<chars.length; j++) {
                ch = chars[j];
                if (ch.contents != "\r") {
                    FONT3.applyTo(ch);
                    continue;
                }
                i=j;
                break;
            }
        }
    }
}

function put_in_center(obj) {
    var rect = app.activeDocument.artboards[0].artboardRect;
    var page_w = rect[2] - rect[0];
    var page_h = rect[1] - rect[3];
    var shift_x = page_w/2 - obj.width/2;
    var shift_y = -page_h/2 + obj.height/2;
    obj.position = [rect[0] + shift_x, rect[1] + shift_y];
}






// Import Folder's Files as Layers - Illustrator CS3 script
// Description: Imports a series of images (from the designated folder) as named layers into a new document
// Author: Nathaniel V. KELSO (nathaniel@kelsocartography.com)
// Version: 1.0.0 on 10/March/2009
// Global script setting

const placement9pointAlignment = "mm";

/**
 * Get a folder in finder.
 * @returns The selected folder.
 */
function getFolder()
{
    return Folder.selectDialog('Please select the folder to be imported:', Folder('~'));

}

function importFolderAsLayers(selectedFolder)

{

    // if a folder was selected continue with action, otherwise quit

    var myDocument;

    if (selectedFolder)

    {

        // myDocument = app.documents.add();

        myDocument = app.activeDocument;

        var firstImageLayer = true;

        var newLayer;

        var thisPlacedItem;

        // create document list from files in selected folder

        var imageList = selectedFolder.getFiles();

        for (var i = 0; i < imageList.length; i++)

        {

            // open each document in file list

            if (imageList instanceof File)

            {

                // get the file name

                var fName = imageList.name.toLowerCase();

                // check for supported file formats

                if ((fName.indexOf(".eps") == -1))

                {

                    //if( (fName.indexOf(".eps") == -1) && (fName.indexOf(".gif") == -1) && (fName.indexOf(".jpg") == -1) && (fName.indexOf(".png") == -1) && (fName.indexOf(".bmp") == -1) && (fName.indexOf(".tif") == -1) && (fName.indexOf(".psd") == -1)) {

                    // skip unsupported formats

                    continue;

                }

                else

                {

                    if (firstImageLayer)

                    {

                        newLayer = myDocument.layers[0];

                        firstImageLayer = false;

                    }

                    else

                    {

                        newLayer = myDocument.layers.add();

                    }

                    // Give the layer the name of the image file

                    newLayer.name = fName.substring(0, fName.indexOf("."));

                    // Place the image on the artboard

                    thisPlacedItem = newLayer.placedItems.add()

                    thisPlacedItem.file = imageList;

                    switch (placement9pointAlignment)

                    {

                        default: break;

                        case "ul":

                                thisPlacedItem.top = myDocument.height;

                            thisPlacedItem.left = 0;

                            break;

                        case "ml":

                                thisPlacedItem.top = myDocument.height / 2 + thisPlacedItem.height / 2;

                            thisPlacedItem.left = 0;

                            break;

                        case "ll":

                                thisPlacedItem.top = thisPlacedItem.height;

                            thisPlacedItem.left = 0;

                            break;

                        case "ur":

                                thisPlacedItem.top = myDocument.height;

                            thisPlacedItem.left = myDocument.width - thisPlacedItem.width;

                            break;

                        case "mr":

                                thisPlacedItem.top = myDocument.height / 2 + thisPlacedItem.height / 2;

                            thisPlacedItem.left = myDocument.width - thisPlacedItem.width;

                            break;

                        case "lr":

                                thisPlacedItem.top = thisPlacedItem.height;

                            thisPlacedItem.left = myDocument.width - thisPlacedItem.width;

                            break;

                        case "um":

                                thisPlacedItem.top = myDocument.height;

                            thisPlacedItem.left = myDocument.width / 2 - thisPlacedItem.width / 2;

                            break;

                        case "mm":

                                thisPlacedItem.top = myDocument.height / 2 + thisPlacedItem.height / 2;

                            thisPlacedItem.left = myDocument.width / 2 - thisPlacedItem.width / 2;

                            break;

                        case "lm":

                                thisPlacedItem.top = thisPlacedItem.height;

                            thisPlacedItem.left = myDocument.width / 2 - thisPlacedItem.width / 2;

                            break;

                    }

                }

            }

        }

        if (firstImageLayer)

        {

            // alert("The action has been cancelled.");

            // display error message if no supported documents were found in the designated folder

            alert("Sorry, but the designated folder does not contain any recognized image formats.\n\nPlease choose another folder.");

            myDocument.close();

            importFolderAsLayers(getFolder());

        }

    }

    else

    {

        // alert("The action has been cancelled.");

        // display error message if no supported documents were found in the designated folder

        alert("Rerun the script and choose a folder with images.");

        //importFolderAsLayers(getFolder());

    }

}

// Start the script off

importFolderAsLayers(getFolder());
