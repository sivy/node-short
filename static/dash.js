/**
 * "dashboard" widgets scripts for home page
 */ 

// add new content

function addmsg(type, msg){
    /* Simple helper to add a div.
    type is the name of a CSS class (old/new/error).
    msg is the contents of the div */
    $("#resolved").prepend(
        "<li class=\'msg "+ type +"\'>"+ msg +"</li>"
    );
}

function waitForData(){
    /* This requests the url /data/resolved
    When it complete (or errors) */
    $.ajax({
        type: "GET",
        url: "/data/resolved",

        async: true, /* If set to non-async, browser shows page as "Loading.."*/
        cache: false,
        timeout:50000, /* Timeout in ms */

        success: function(data){ /* called when request completes */
            data = JSON.parse(data);
            for (var i=0;i<data.msgs.length;i++) {
               var msg=data.msgs[i];
               addmsg("new", '<a href="'+msg.url.url+'">'+msg.url.url+'</a> from <a href="'+ msg.hit.referer+'">' + msg.hit.referer + '</a>'); /* Add response to a .msg div (with the "new" class) */
            }
            setTimeout(
                'waitForData()', /* Request next message */
                1000 /* ..after 1 seconds */
            );
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
            console.log("error", textStatus + " (" + errorThrown + ")");
            setTimeout(
                'waitForData()', /* Try again after.. */
                2000 /* milliseconds (2 seconds) */
            );
        },
    });
};

$(document).ready(function(){
    waitForData(); /* Start the initial request */
});