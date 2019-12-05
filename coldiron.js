'use strict';

class coldIron {
    constructor(data, inputHandler, handlerTarget) {
        this._name = data.name;
        this._version = data.version;
        // will eventually hold live game data
        this._display = undefined; // the ROT canvas object
        // !to-do: determine minimum screen size
        this._displayWidth = data.displayWidth || 80;
        this._displayHeight = data.displayHeight || 42;
        //this._screenData = data.screenData || null;
        this._world = data.world || undefined;
        this._screenList = {};
        this._currentScreen = undefined;
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

    set screen(screen) {
        this._currentScreen = screen;
    }

    get world() {
        return this._world;
    }

    refresh(display) {
        this.screen._render(display);
    }

    //
    // switch between screens
    // screen is the name of the target screen
    switchScreen(screen) {
        //
        // if we had a screen, call its exit function
        if (this.screen !== undefined) {
            this.screen._handleInput('exit');
            this.screen._exit();
        }
        // clear display
        this.display.clear();
        // update current screen, notify we entered and then render
        this.screen = this._screenList[screen];
        if (this.screen !== null) {
            this.screen._enter();
            this.refresh(this.display);
            this.screen._handleInput('enter');
        }
    }

    makeWorld(gameData, player) {
        this._world = new coldIron.World(gameData, player);
        this._world.main = this;
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
        // Positive dX moves right, negative dY moves down
        let newX = this.player.x + dX;
        let newY = this.player.y + dY;
        // attempt move
        let result = this.player.tryMove(newX, newY, this.stage);
        if (result) {
            this._render(this.main.display);
        }
        
        //// postive dX moves right
        //this._cursorX = Math.max(0,
        //    Math.min(this.stageWidth - 1, this._cursorX + dX));
        //// positive dY moves down
        //this._cursorY = Math.max(0,
        //    Math.min(this.stageHeight - 1, this._cursorY + dY));
        //
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
        this._traversable = properties.traversable || false;
        this._destructible = properties.destructible || false;
    }

    get glyph() {
        return this._glyph;
    }

    get traversable() {
        return this._traversable;
    }

    get destructible() {
        return this._destructible;
    }
};


coldIron.Tile.nullTile = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._traversable = properties.traversable || false;
        this._destructible = properties.destructible || false;
        this._character = '!';
        this._fgColor = 'pink';
        this._bgColor = 'red';
    }
};

coldIron.Tile.floorTile = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._traversable = properties.traversable || true;
        this._destructible = properties.destructible || false;
        this._character = properties.character || '.';
        this._fgColor = properties.fgColor || 'goldenrod';
        this._bgColor = properties.bgColor || 'black';
    }
};

coldIron.Tile.wallTile = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._traversable = properties.traversable || false;
        this._destructible = properties.destructible || true;
        this._character = properties.character || '#';
        this._fgColor = properties.fgColor || 'blue';
        this._bgColor = properties.bgColor || 'black';
    }
};

coldIron.Entity = class extends coldIron.Glyph {
    constructor(properties) {
        super(properties);
        this._name = properties.name || '';
        this._x = properties.x || undefined;
        this._y = properties.y || undefined;
        this._z = properties.z || undefined;
        this._world = properties.world || undefined;
        // entity's own record of attribute mixins
        this._ownAttributes = properties.ownAttributes || {};
        this._ownAttributeGroups = properties.ownAttributeGroups || {};
        let attributes = properties.attributes || [];
        for (let i = 0; i < attributes.length; i++) {
            // Copy over properties from each attribute mixin as long as it
            // isn't called name or init, nor an already-taken property name
            for (let key in attributes[i]) {
                if (key !== 'init' &&
                    key !== 'name' &&
                    !this.hasOwnProperty(key)) {
                    this[key] = attributes[i][key];
                }
            }
            // Add this name to attached attribute mixins
            this._ownAttributes[attributes[i].name] = true;
            // if a group name is present, add it
            if (attributes[i].groupName) {
                this._ownAttributeGroups[attributes[i].groupName] = true;
            }
            // call its init function if there is one
            if (attributes[i].init) {
                attributes[i].init.call(this, properties);
            }
        }
    }

    hasAttribute(attribute){
        if (typeof attribute === 'object') {
            return this._ownAttributes[attribute.name];
        } else {
            return this._ownAttributes[attribute] || this._ownAttributeGroups[attribute];
        }
    }
    
    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    get x() {
        return this._x;
    }

    set x(xPos) {
        this._x = xPos;
    }

    get y() {
        return this._y;
    }

    set y(yPos) {
        this._y = yPos;
    }

    get world() {
        return this._world;
    }

    set world(world) {
        this._world = world;
    }

};

coldIron.World = class  {
        constructor(gameData, player) {
        this._title = gameData.title || undefined;
        this._width = gameData.stageWidth || this._displayWidth;
        this._height = gameData.stageHeight || this._displayHeight;
        this._depth = gameData.stageDepth || 0;
        this._currentLevel = gameData.currentLevel || 0;
        this._stages = gameData.stages || undefined;
        this._player = gameData.player || player || undefined;
        this._main = undefined;
        // list of all entities
        this._entities = gameData.entities || [];
        // engine and scheduler objects
        // to-do: allow for different scheduler types
        // to-do: if loading a save, enter saved entities into scheduler
        this._scheduler = new ROT.Scheduler.Simple();
        // to-do: replace engine w/ async/await function:
        // http://ondras.github.io/rot.js/manual/#timing/engine
        this._engine = new ROT.Engine(this._scheduler);
        // change the following to stage-specific settings;
        this._fgColor = gameData.fgColor || 'rgb(255, 255, 255)';
        this._bgColor = gameData.bgColor || 'rgb(0, 0, 0)';
    
        if (!this._stages) {
            this.stages = this.buildStages(gameData, player);
        }
        // to-do: tie spawn types/amounts to floors in gameData
        this.addEntityAtRandom(player);

        let newEnt;

        for (let i = 0; i < 50; i++) {
            newEnt = new coldIron.Entity(gameData.entityData.fungus);
            this.addEntityAtRandom(newEnt);
        }
    }

    get stages() {
        return this._stages;
    }

    set stages(stages) {
        this._stages = stages;
    }

    get stage() {
        return this._stages[this._currentLevel];
    }

    get level() {
        return this._currentLevel;
    }

    set level(level) {
        this._currentLevel = level;
    }

    get engine() {
        return this._engine;
    }

    get scheduler() {
        return this._scheduler;
    }

    get entities() {
        return this._entities;
    }

    get main() {
        return this._main;
    }

    set main(main) {
        this._main = main;
    }

    addEntity(entity) {
        // check entity bounds
        if (entity.x < 0 || entity.x >= this._width ||
            entity.y < 0 || entity.y >= this._height) {
            throw new Error('Adding entity out of bounds');
        }
        // Update entity's map
        entity.world = this;
        // update entity list
        this._entities.push(entity);
        // if entity is an actor, add to scheduler
        if (entity.hasAttribute('Actor')) {
            this.scheduler.add(entity, true);
        }
    }

    addEntityAtRandom(entity) {
        let position = this.getRandomFloorXY();
        entity.x = position.x;
        entity.y = position.y;
        this.addEntity(entity);
    }

    getEntityAt(x, y) {
        let entNo = this._entities.length;
        let entity;
        for (let i = 0; i < entNo; i++) {
            entity = this._entities[i];
            if (entity.x === x && entity.y === y) {
                return entity;
            }
        }
        return false;
    }

    removeEntity(entity) {
        // find entity in list of present
        for (let i = 0; i< this._entities.length; i++) {
            if (this.entities[i] === entity) {
                this._entities.splice(i, 1);
                break;
            }
        }
        // if entity is an actor, remove from scheduler
        if (entity.hasAttribute('Actor')) {
            this._scheduler.remove(entity);
        }
    }

    destroy(x, y) {
        // to-do; level-specific floor replacement
        // to-do; destroying other objects
        let stage = this.stages[this.level];
        let target = stage.getValue(x,y);
        if (target.destructible) {
            stage.setValue(x, y,
                new coldIron.Tile.floorTile(gameData.stageOptions));
        }
    }

    isFloorTile(x, y) {
        let clear;
        if (!(this.stage.getValue(x, y) instanceof coldIron.Tile.floorTile) ||
        this.getEntityAt(x, y)) {
            clear = false;
        } else {
            clear = true;
        }
        return clear;
    }

    getRandomFloorXY() {
        let tile = {x: undefined, y: undefined};
        let stage = this.stages[this.level];
        let valid = false;
        while (!this.isFloorTile(tile.x, tile.y)) {
            tile.x = Math.floor(Math.random() * this._width);
            tile.y = Math.floor(Math.random() * this._height);
        }
        return tile;
    }

    //
    // Constructor for stages
    // Instance method on coldIron object
    buildStages(gameData) {

        let width = this._width;
        let height = this._height;
        let depth = this._depth;
        let options = gameData.stageOptions || {};
        let stages = [];
        let regions = [];
        let stage;

        //
        // actually assigns values from generated level
        let createCallback = (x,y,v) =>{
            if (v === 1) {
                stage.setValue(x, y, new coldIron.Tile.floorTile(options));
            } else {
                stage.setValue(x, y, new coldIron.Tile.wallTile(options));
            }
        };

        //
        // stage generator; employs ROT random level generation
        let generateStages = () => {
            //let floor = new coldIron.Tile.floorTile();
            //let wall = new coldIron.Tile.wallTile();
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
    }
};