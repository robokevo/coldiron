window.addEventListener("load", function() {
    if (false) {
    //// ROT got rid of isSupported()??? to-do: informative links
    //// if (!ROT.isSupported()) {
    ////     // !to-do: change game div to paragraph w/
    ////     // links to supported browsers
    ////     alert("Your browser is old and sad");
    //// } 
    } else {
        let gameDiv = document.getElementById("gameDiv");
        let game = new coldIron(gameData, silverKey);
        game.init(gameDiv, "start");
    }

});