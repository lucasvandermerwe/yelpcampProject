//like
function like(e) {
    e.preventDefault();
    e.stopPropagation();

    var actionUrl = "/campgrounds/" + $(this).data("campgroundid") + "/like"

    $.ajax({
        url: actionUrl,
        type: "GET",
        contentType: "application/json",
        success: function(data) {
            $("#likeButton").removeClass("btn-primary");
            $("#likeButton").addClass("btn-secondary");
            $("#likeButton").addClass("btn-secondary");
            $("#likeButton").html("Unlike");
            $("#likeButton").attr("id", "unlikeButton");
            setBinds();

        }
    });
}

//unlike
function unlike(e) {
    console.log("unlike");
    e.preventDefault();
    e.stopPropagation();

    var actionUrl = "/campgrounds/" + $(this).data("campgroundid") + "/like"

    $.ajax({
        url: actionUrl,
        type: "GET",
        contentType: "application/json",
        success: function(data) {
            $("#unlikeButton").removeClass("btn-secondary");
            $("#unlikeButton").addClass("btn-primary");
            $("#unlikeButton").html("Like");
            $("#unlikeButton").attr("id", "likeButton");
            setBinds();
        }
    });
}



//google hoe om id te replace met ajax - dit doen.