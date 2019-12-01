'use strict';

class coldIron {
    constructor(data, inputHandler, handlerTarget) {
        this._name = data.name;
        this._version = data.version;
        // will eventually hold live game data
        this._display = null; // the ROT canvas object
        // !to-do: determine minimum screen size
        this._displayWidth = data.displayWidth || 80;
        this._displayHeight = data.displayHeight || 42;
        //this._screenData = data.screenData || null;
        this._screenList = {};
        this._currentScreen = null;
        this._lastScreen = [];
        this._gameOver = false;
        this.session =
        data.session || {
            stages: undefined,
            currentLevel: 0,
            };
        this.handlerTarget = handlerTarget || window;

        //
        // Initialize input handler
        this.input = inputHandler;
        this.input.bindElement(this.handlerTarget);
    }

    //
    // Returns display
    get display() {
        return this._display;
    }

    //
    // Returns current screen
    get screen() {
        return this._currentScreen;
    }

    //
    // switch between screens
    // screen is the name of the target screen
    switchScreen(screen) {
        //
        // if we had a screen, call its exit function
        if (this._currentScreen !== null) {
            this._currentScreen._handleInput('exit');
            this._currentScreen._exit();
        }
        // clear display
        this.display.clear();
        // update current screen, notify we entered and then render
        this._currentScreen = this._screenList[screen];
        if (this._currentScreen !== null) {
            this._currentScreen._enter();
            this._currentScreen._render(this.display);
            this._currentScreen._handleInput('enter');
        }
    }

    //
    // Initializes game data
    init(gameDiv, launchScreen) {
        //
        // Initialize display and append to game area
        this._display = new ROT.Display({
                                        width: this._displayWidth,
                                        height: this._displayHeight,
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                    });
        gameDiv.appendChild(this._display.getContainer());
                                
        //
        // Initialize screens
        let screenData = gameData.screenData;
        let screens = Object.keys(screenData);
        screens.forEach((screen) => {
            this._screenList[screen] = new coldIron.Screen(screenData[screen], this);
        });
        // ROT caching option for performance
        // may need to disable if many tile types are used
        // (temporarily disabled to test performance)
        // ROT.Display.Rect.cache = true;
        //
        // Launch into first screen
        this.switchScreen(launchScreen);
    }
}

//
// Screen class

coldIron.Screen = class {
    constructor(screenData, main) {
    this.name = screenData.name || "New Screen";
    this.commands = screenData.commands || null;
    this.render = screenData.render || null;
    this.enter = screenData.enter || null;
    this.exit = screenData.exit || null;
    // center of screen focus, set programatically
    this._cursorX = 0;
    this._cursorY = 0;
    this.main = main;
    }

    get displayWidth() {
        return this.main._displayWidth;
    }

    set displayWidth(width) {
        this.main._displayWidth = (width);
    }

    get displayHeight() {
        return this.main._displayHeight;
    }

    set displayHeight(height) {
        this.main._displayHeight = (height);
    }

    //
    // initialize values upon entering screen
    _enter() {
        console.log("entered " + this.name + "screen");
        if (this.enter) {
            this.enter(this.main);
        }
    }

    //
    // cleanup upon leaving a screen   
    _exit() {
        console.log("exited " + this.name + "screen");
        if (this.exit) {
            this.exit(this.main);
        }
    }

    // 
    // passes display and main app context to screen-specific renderer
    _render(display) {
        if (this.render) {
            this.render(this.main, display);
        }
    }

    // screen-specific commands
    // main is "this" passed along to preserve context for switching
    _handleInput(mode) {
        let main = this.main;
        let handler = main.input;

        let keyList,keys,shortcutList,shortcuts,sequenceList,sequences;
        if (this.commands.keys !== undefined) {
            keyList = this.commands.keys;
            keys = Object.keys(keyList);
        }
        if (this.commands.shortcuts !== undefined) {
            shortcutList = this.commands.shortcuts;
            shortcuts = Object.keys(shortcutList);
        }
        if (this.commands.sequences !== undefined) {
            sequenceList = this.commands.sequences;
            sequences = Object.keys(sequenceList);
        }  
        if (mode === 'enter') {
            if (keys !== undefined) {
                keys.forEach(key => {
                    if (typeof keyList[key] === 'string' &&
                        keyList[key].slice(0,7) === 'switch:') {
                        let target = keyList[key].slice(7);
                        handler.bindKey(key, ()=>main.switchScreen(target));
                    } else {
                    handler.bindKey(key, ()=>keyList[key](main));
                    }
                });
            }
            if (shortcuts !== undefined) {
                shortcuts.forEach(sc => {
                    handler.bindShortcut(sc, ()=>shortcutList[sc](main));
                });
            }
            if (sequences !== undefined) {
                sequences.forEach(sq => {
                    handler.bindSequence(sq, ()=>sequenceList[sq](main));
                });
            }
        } else if (mode === 'exit') {
            if (keys !== undefined) {
                keys.forEach(key => {
                    handler.unbindKey(key);
                });
            }
            if (shortcuts !== undefined) {
                shortcuts.forEach(sc => {
                    handler.unbindShortcut(sc);
                });
            }
            if (sequences !== undefined) {
                sequences.forEach(sq => {
                    handler.unbindSequence(sq);
                });
            }
        }
    }

    // Screen-moving functions
    move(dX, dY) {
        // postive dX moves right
        this._cursorX = Math.max(0,
            Math.min(this.stageWidth - 1, this._cursorX + dX));
        // positive dY moves down
        this._cursorY = Math.max(0,
            Math.min(this.stageHeight - 1, this._cursorY + dY));
        this._render(this.main.display);
    }
};

//
// Glyph class
coldIron.Glyph = class {
    constructor(properties) {
    this._character = properties.character || ' ';
    this._fgColor = properties.fgColor || 'white';
    this._bgColor = properties.bgColor || 'black';
    }

    // returns representing character
    get character() {
        return this._character;
    }
    
    // sets character
    set character(character) {
        this._character = character;
    }

    // 
    get bgColor() {
        return this._bgColor;
    }

    set bgColor(color) {
        this._bgColor = color;
    }

    get fgColor() {
        return this._fgColor;
    }    

    set fgColor(color) {
        this._fgColor = color;
    }    
    
};

//
// Tile constructor

coldIron.Tile = class extends coldIron.Glyph {
    constructor(properties) {
        super(properties);
        this._traversable = properties.traversable || true;
        this._destructible = properties.destructible || false;
    }

    get glyph() {
        return this._glyph;
    }
};


coldIron.Tile.nullTile = new coldIron.Tile({
        character: '!',
        fgColor: 'pink',
        bgColor: 'red'
    }
);
coldIron.Tile.floorTile = new coldIron.Tile({
        character: '.',
        fgColor: 'goldenrod',
        bgColor: 'black'
    }
);
coldIron.Tile.wallTile = new coldIron.Tile({
        character: '#',
        fgColor: 'blue',
        bgColor: 'black'
    }
);

//
// Map constructor
// Instance method on coldIron object
coldIron.prototype.buildStages = function(
    stageWidth, stageHeight, gameDepth, stageOptions) {

    let width = stageWidth || this._displayWidth;
    let height = stageHeight || this._displayHeight;
    let depth = gameDepth || 1;
    let options = stageOptions || undefined;
    let stages = [];
    let regions = [];
    let stage;

    //
    // actually assigns values from generated level
    let createCallback = (x,y,v) =>{
        if (v === 1) {
            stage.setValue(x, y, coldIron.Tile.floorTile);
        } else {
            stage.setValue(x, y, coldIron.Tile.wallTile);
        }
    };

    //
    // stage generator; employs ROT random level generation
    let generateStages = (width, height, depth) => {
        let floor = coldIron.Tile.floorTile;
        let wall = coldIron.Tile.wallTile;
        let totalIterations = 4;
        let generator, success;
        // will instantiate generators until successful stage condition is met
        for (let i = 0; i < depth; i++) {
            stage = new coldIron.Geometry.Grid(width, height);
            while (!success) {
                generator = new ROT.Map.Cellular(width, height);
                generator.randomize(0.5);
                if (true) {
                    success = true;
                }
            }
            // -2 because one last iteration happens after
            for (let i = 0; i < totalIterations - 2; i++) {
                generator.create();
            }
            // stage values assigned from generator
            generator.create(createCallback);

            stages.push(stage);
        }
    };
    generateStages(width, height, depth);
    return stages;
};