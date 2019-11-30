'use strict';

let gameData = {
    name: "Moon Miners",
    version: "0.00",
    session:    null, // will eventually hold live game data
    displayWidth:   80,
    displayHeight:  40,
    stageWidth: 200,
    stageHeight: 120,
    stageDepth: 1,
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
        x:  (main)=>console.log(main._currentScreen),
        y:  ()=>console.log('whyyyyyyyyy'),
        any: (main)=>console.log('any!'),
        esc: 'switch:menu',
        up: (main) => main.getScreen().move(0,-1),
        down: (main) => main.getScreen().move(0,1),
        left: (main) => main.getScreen().move(-1,0),
        right: (main) => main.getScreen().move(1,0),
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
    let stages = main.session.stages;

    if (stages === undefined) {
        let width = gameData.stageWidth;
        let height = gameData.stageHeight;
        let depth = gameData.stageDepth;
        main.session.stages = main.buildStages(width, height, depth);
        stages = main.session.stages;
    }

    let stage = stages[main.session.currentLevel];
    let screen = main.getScreen();
    screen.stage = stage;
    screen.screenWidth = screen.displayWidth();
    screen.screenHeight = screen.displayHeight();
    screen.stageWidth = stage.getWidth();
    screen.stageHeight = stage.getHeight();
};

// "Play" screen renderer
gameData.screenData.play.render = (main, display) => {
    //let stage = main.session.stages[main.session.currentLevel];
    let screen = main.getScreen();
    
    // keep cursor-x within left-bound
    screen.topLeftX = Math.max(0, screen._cursorX - (screen.screenWidth/2));
    screen.topLeftX = Math.min(
        screen.topLeftX, screen.stageWidth - screen.screenWidth);
    // keep cursor-y within top-bound
    screen.topLeftY = Math.max(0, screen._cursorY - (screen.screenHeight/2));
    screen.topLeftY = Math.min(
        screen.topLeftY, screen.stageHeight - screen.screenHeight);
    
    // render whole stage
    // to-do: only render whole stage when topLeftX/Y changes
    for (let x = screen.topLeftX; x < screen.topLeftX + screen.screenWidth; x++) {
        for (let y = screen.topLeftY; y < screen.topLeftY + screen.screenHeight; y++) {
            let glyph = screen.stage.getValue(x,y).getGlyph();
            display.draw(x - screen.topLeftX, y - screen.topLeftY,
                glyph.getChar(),
                glyph.getForeground(),
                glyph.getBackground()
            );
        }
    }

    // render cursor
    display.draw(
        screen._cursorX - screen.topLeftX,
        screen._cursorY - screen.topLeftY,
        '@');
};
