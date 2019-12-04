'use strict';

let gameData = {
    name: "Moon Miners",
    version: "0.00",
    session:    null, // will eventually hold live game data
    // keep widths and heights even! messes w/ display math otherwise
    // to-do: prevent errors if stage is smaller than display
    displayWidth:   80,
    displayHeight: 40,
    stageWidth: 200,
    stageHeight: 100,
    stageDepth: 1,
    stageOptions: {},
    screenData: {
        start:  {
            name:   'Start',
        },
        menu:   {
            name:   'Menu',
        },
        play:   {
            name:   'Play',
            _stage:   null,
        },
    }
};

///////////////////////////////////////////////////////////////////
// Tile data
gameData.tileData = {
    floorTile: {
        character:  '.',
        foreground: 'goldenrod',
        background: 'black',
    },
    wallTile: {
        character: '#',
        foreground: 'blue',
        background: 'black'
    },
};


////////////////////////////////////////////////////////////////////
// "Start" screen data

// "Start" screen command list
gameData.screenData.start.commands = {
    keys:   {
        a:  ()=>console.log('ayyyy'),
        b:  ()=>console.log('beeee'),
        any: ()=>console.log('any?'),
        enter: 'switch:menu',
    },
    shortcuts: {
        'ctrl,z':   ()=>console.log('undo?'),
    },
    sequences: {
        'up,down,left,right,b,a,enter': ()=>console.log('baby konami'),
    }
};

// "Start" enter function
// gameData.screenData.start.enter = (main) => {
//     if (main.session.stages === undefined) {
//         let width = gameData.stageWidth;
//         let height = gameData.stageHeight;
//         let depth = gameData.stageDepth;
//         main.session.stages = main.buildStages(width, height, depth);
//     }
// };


// "Start" screen renderer
gameData.screenData.start.render = (main, display) => {
    display.drawText(9,9, "start!");
};

////////////////////////////////////////////////////////////////////
// "Menu" screen data

// "Menu" command list
gameData.screenData.menu.commands = {
    keys:   {
        x:  ()=>console.log(this),
        y:  ()=>console.log('whyyyyyyyyy'),
        any: ()=>console.log('any!'),
        esc: 'switch:start',
        enter: 'switch:play',
    },
    shortcuts: {
        'ctrl,z':   ()=>console.log('undo!'),
    },
    sequences: {
        'up,down,left,right,b,a': ()=>console.log('baby konamiiiiii'),
    }
};

// "Menu" screen renderer
gameData.screenData.menu.render = (main, display) => {
    display.drawText(9,9, "menu!");
};

////////////////////////////////////////////////////////////////////
// "Play" screen data

// "Play" command list
gameData.screenData.play.commands = {
    keys:   {
        d:  (main)=>main.world.destroy(
                main.screen._cursorX,
                main.screen._cursorY),
        g:  (main)=>console.log(
                main.screen.player.world.getEntityAt(
                    main.screen.player.x,
                    main.screen.player.y)
                ),
        e:  (main)=> {
            let entities = main.world.entities;
            let result = entities.indexOf(main.screen.player);
            console.log(result);
        },
        x:  (main)=>console.log(main.world.stages[main.world.level]),
        y:  (main)=>
            console.log(
                main.screen._cursorX,
                main.screen._cursorY
            ),
        z:  (main)=>
            console.log(main.world.getRandomFloorXY()
        ),
        any: (main)=>console.log('any!'),
        esc: 'switch:menu',
        up: (main) => main.screen.move(0,-1),
        down: (main) => main.screen.move(0,1),
        left: (main) => main.screen.move(-1,0),
        right: (main) => main.screen.move(1,0),
    },
    shortcuts: {
        'ctrl,z':   ()=>console.log('undo!'),
    },
    sequences: {
        'up,down,left,right,b,a': ()=>console.log('baby konamiiiiii'),
    }
};

//
// "Play" enter screen
gameData.screenData.play.enter = (main) => {
    // initialize stage data
    let screen = main.screen;
    let stages;
    if (main._world === undefined) {
        let player = new coldIron.Entity(gameData.entityData.player);
        screen.player = player;
        main.makeWorld(gameData, player);
        stages = main.world.stages;
    }
    let stage = main.world.stage;
    screen.stage = stage;
    screen.screenWidth = screen.displayWidth;
    screen.screenHeight = screen.displayHeight;
    screen.stageWidth = stage.width;
    screen.stageHeight = stage.height;
};

// "Play" screen renderer
gameData.screenData.play.render = (main, display) => {
    let screen = main.screen;
    
    // keep cursor-x within left-bound
    screen.topLeftX = Math.max(0, screen.player.x - (screen.screenWidth/2));
    screen.topLeftX = Math.min(
        screen.topLeftX, screen.stageWidth - screen.screenWidth);
    // keep cursor-y within top-bound
    screen.topLeftY = Math.max(0, screen.player.y - (screen.screenHeight/2));
    screen.topLeftY = Math.min(
        screen.topLeftY, screen.stageHeight - screen.screenHeight);
    
    // render whole stage
    // to-do: center on cursor, not stage borders
    for (let x = screen.topLeftX; x < screen.topLeftX + screen.screenWidth; x++) {
        for (let y = screen.topLeftY; y < screen.topLeftY + screen.screenHeight; y++) {
            let glyph = screen.stage.getValue(x,y);
            display.draw(x - screen.topLeftX, y - screen.topLeftY,
                glyph.character,
                glyph.fgColor,
                glyph.bgColor
            );
        }
    }

    // render entities
    let entities = main.world.entities;
    let entity;
    for (let i=0; i< entities.length; i++) {
        entity = entities[i];
        //only render if visible
        if (entity.x >= screen.topLeftX && entity.y >= screen.topLeftY &&
            entity.x < screen.topLeftX + screen.screenWidth &&
            entity.y < screen.topLeftY + screen.screenHeight) {
            
            display.draw(
                entity.x - screen.topLeftX,
                entity.y - screen.topLeftY,
                entity.character,
                entity.fgColor,
                entity.bgColor
            );
        
        }
    }

    //// render player
    //console.log(screen);
    //display.draw(
    //    screen.player.x - screen.topLeftX,
    //    screen.player.y - screen.topLeftY,
    //    screen.player.character,
    //    screen.fgColor,
    //    screen.bgColor
    //);


};

/////////////////////////////////////////////////////////////
// Attribute mixin data
gameData.attributeData = {};

gameData.attributeData.mobile = {
    // to-do: more interactions on bump
    name:   'mobile',
    tryMove: function(x, y, stage) {
        let tile;
        let target;
        if (stage.contains(x, y)) {
            tile = stage.getValue(x, y);
            target = this.world.getEntityAt(x, y);
            if (target) {
                return false;
            // check if tile is traversable before walking
            } else if (tile.traversable){
                this._x = x;
                this._y = y;
                return true;
            // or see if tile is destructible
            // to-do: make incumbent on skill or tool
            } else if (tile.destructible) {
                this.world.destroy(x, y);
                return true;
            }
        } 
        
        return false;
        
    }
};

gameData.attributeData.playerActor = {
    name: 'playerActor',
    groupName: 'Actor',
    act: function() {
        // re-render screen
        // to-do: only re-render scene window
        this.world.main.refresh(this._world.main.display);
        // Lock engine and wait asynchronously
        // for player to press key
        // to-do: replace w/ async/await function
        // to-do: only trigger when on same floor
        this.world.getEngine().lock();
    }
};

gameData.attributeData.fungusActor = {
    name: 'fungusActor',
    groupName: 'Actor',
    act: function() {}
};

/////////////////////////////////////////////////////
// Entity data
gameData.entityData = {};

gameData.entityData.player = {
    character: '@',
    fgColor: 'white',
    bgColor: 'black',
    attributes: [
        gameData.attributeData.mobile,
        gameData.attributeData.playerActor,
    ]
};

gameData.entityData.fungus = {
    character: 'F',
    fgColor: 'green',
    attributes: [
        gameData.attributeData.fungusActor,
    ]
};