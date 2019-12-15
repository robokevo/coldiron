'use strict';

class coldIron {
    constructor(appData, inputHandler, handlerTarget) {
        this._appData = appData;
        this._appName = appData.appName;
        this._version = appData.version;
        // will eventually hold live game data
        this._display = undefined; // the ROT canvas object
        // defaults to get passed to screens
        // !to-do: determine minimum screen size
        this._displayWidth = appData.maxDisplayWidth || 80;
        this._displayHeight = appData.maxDisplayHeight || 42;
        this._colors = appData.colors || ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'];
        this._fgColor = appData.fgColor || this._colors[0];
        this._bgColor = appData.bgColor || this._colors[1];
        this._font = appData.font || 'monospace';
        this._fontSize = appData.fontSize || 14;
        this._spacing = appData.spacing || 1;
        this._world = appData.world || undefined;
        this._screenList = {};
        this._currentScreen = undefined;
        this._lastScreen = [];
        this._gameOver = false;
        this.session =
        appData.session || {
            stages: undefined,
            currentDepth: 0,
            };
        this.handlerTarget = handlerTarget || window;

        //
        // Initialize input handler
        this.input = inputHandler;
        this.input.bindElement(this.handlerTarget);
        //this.input.setThrottle(100);
    }

    get appName() {
        return this._appName;
    }

    get appData() {
        return this._appData;
    }

    //
    // Returns display
    get display() {
        return this._display;
    }

    //
    // Returns app name
    get name() {
        return this._name;
    }

    get version() {
        return this._version;
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

    refresh() {
        this.screen._render(this.screen.display);
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

    makeWorld(appData, player) {
        this._world = new coldIron.World(appData, player);
        this._world.main = this;
    }

    //
    // Initializes game data
    init(gameDiv, launchScreen) {
        //
        // Initialize display and append to game area
        this._display = new ROT.Display();
        gameDiv.appendChild(this._display.getContainer());
                                
        //
        // Initialize screens
        let screenData = this._appData.screenData;
        let screens = Object.keys(screenData);
        screens.forEach((screen) => {
            this._screenList[screen] = new coldIron.Screen(screenData[screen], this);
        });
        // ROT caching option for performance
        // may need to disable if many tile types are used
        // (temporarily disabled to test performance)
        // to-do: enable for release
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
    this.main = main;
    this._title = screenData.title || "New Screen";
    this.getTitle = screenData.getTitle || undefined;
    this.commands = screenData.commands || undefined;
    this.render = screenData.render || undefined;
    this.enter = screenData.enter || undefined;
    this.exit = screenData.exit || undefined;
    this._origin = screenData.origin || {x: 0, y: 0};
    this._center = screenData.center || {x: undefined, y: undefined};
    this._stageCenter = screenData.stageCenter || {x: undefined, y: undefined};
    this._offset = screenData.offset || {x: undefined, y: undefined};
    this._panelData = screenData.panelData || undefined;
    this._panels = screenData.panels || undefined;
    this._panelNames = screenData.panelNames || undefined;
    // Screen specifics
    this._width = screenData.width || this.main._displayWidth;
    this._height = screenData.height || this.main._displayHeight;
    this._colors = screenData.colors || this.main._colors;
    this._corners = screenData.corners || ['/', '\\', '\\', '/'];
    this._borders = screenData.borders || ['_', '|'];
    // Main screen settings set on entering
    this._displayWidth = screenData.displayWidth || this.main._displayWidth;
    this._displayHeight = screenData.displayHeight || this.main._displayHeight;
    this._fgColor = screenData.fgColor || this._colors[0];
    this._bgColor = screenData.bgColor || this._colors[1];
    this._font = screenData.font || this.main._font;
    this._fontSize = screenData.fontSize || this.main._fontSize;
    this._spacing = screenData.spacing || this.main._spacing;

    // re-render if dirty = true
    this._dirty = false;
    this._cursor = undefined;
    }

    get display() {
        return this.main._display;
    }

    get width() {
        return this._width;
    }

    set width(width) {
        this._width = width;
    }

    get height() {
        return this._height;
    }

    set height(height) {
        this._height = height;
    }

    get displayWidth() {
        return this.main._displayWidth;
    }

    set displayWidth(width) {
        this.main._displayWidth = (width);
        this.display.setOptions({width: width});
    }

    get displayHeight() {
        return this.main._displayHeight;
    }

    set displayHeight(height) {
        this.main._displayHeight = (height);
        this.display.setOptions({height: height});
    }

    get panels() {
        return this._panels;
    }

    get panelNames() {
        return this._panelNames;
    }

    get origin() {
        return this._origin;
    }

    set origin(newOrigin) {
        this._origin.x = newOrigin.x;
        this._origin.y = newOrigin.y;
    }

    get center() {
        return this._center;
    }

    set center(coordinate) {
        this._center= {x: coordinate.x, y: coordinate.y};
    }

    get stageCenter() {
        return this._stageCenter;
    }

    set stageCenter(coordinate) {
        this._stageCenter.x = coordinate.x;
        this._stageCenter.y = coordinate.y;
    }

    get offset() {
        return this._offset;
    }

    set offset(coordinate) {
        this._offset.x = coordinate.x;
        this._offset.y = coordinate.y;
    }

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

    get font() {
        return this._font;
    }

    set font(fontFam) {
        this._font = fontFam;
    }

    get fontSize() {
        return this._fontSize;
    }

    set fontSize(size) {
        this._fontSize = size;
    }

    get spacing() {
        return this._spacing;
    }

    set spacing(spacing) {
        this._spacing = spacing;
    }

    get cursor() {
        return this._cursor;
    }

    get cursorX() {
        return this._cursor.x;
    }
    
    set cursorX(newX) {
        this._cursor.x = newX;
    }

    get cursorY() {
        return this._cursor.y;
    }

    set cursorY(newY) {
        this._cursor.y = newY;
    }

    //
    // initialize values upon entering screen
    _enter() {
        this.main.display.setOptions({
            fg: this.fgColor,
            bg: this.bgColor,
            width: this.displayWidth,
            height: this.displayHeight,
            fontFamily: this.font,
            fontSize: this.fontSize,
            spacing: this.spacing,            
        });
        console.log("entered " + this._title + " screen");
        if (this.enter) {
            this.enter(this.main);
            if (this._panels === undefined &&
                this._panelData) {
                this._panels = {};
                let pData = this._panelData;
                let pNames = Object.keys(pData);
                this._panelNames = pNames;
                let pName;
                for (let n = 0; n < pNames.length; n++) {
                    pName = pNames[n];
                    this._panels[pName] = new coldIron.Panel(pData[pName], this.main, this);
                }
            }
            if (this._panelNames) {
                let pName;
                for (let n = 0; n < this._panelNames.length; n++) {
                    pName = this._panelNames[n];
                    if (this._panels[pName].enter){
                        this._panels[pName].enter(this.main);
                    }
                }
            }
        }
    }

    //
    // cleanup upon leaving a screen   
    _exit() {
        console.log("exited " + this._title + " screen");
        if (this.exit) {
            this.exit(this.main);
        }
    }

    // 
    // passes display and main app context to screen-specific renderer
    _render(display) {
        if (this.render) {
            this.render(this.main, display);
            if (this.panelNames) {
                let name;
                for (let i = 0; i < this.panelNames.length; i++) {
                    name = this.panelNames[i];
                    if (this.panels[name].render) {
                        this.panels[name].render(this.main, display);
                    }
                }    
            }
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

    _getTitle() {
        if (this.getTitle) {
            //console.log(this.getTitle);
            return this.getTitle();
        } else {
            return this._title;
        }  
    }

    //
    // Draw the border,body, and title of a screen or panel
    // options: {
    //  border: true/false  // show the border lines
    //  body: true/false    // show the body
    //  title: true/false   // show the title at the top
    // }
    drawPanel(panelOptions) {
        let options = panelOptions || {};
        let topBar = "%b{" + this.bgColor + "}" +
            this._corners[0] + this._borders[0].repeat(this._width-2) + this._corners[1];
        let bodyLine;
        if (options.body) {
            bodyLine = "%b{" + this.bgColor + "}" +
            this._borders[1] + this._borders[0].repeat(this._width-2) + this._borders[1];
        } else {
            bodyLine = "%b{" + this.bgColor + "}" +
            this._borders[1] + " ".repeat(this._width-2) + this._borders[1];
        }
        let bottomBar = "%b{" + this.bgColor + "}" +
            this._corners[2] + this._borders[0].repeat(this._width-2) + this._corners[3];
        this.display.drawText(this.origin.x, this.origin.y, topBar);
        for (let i = 0; i < this._height-2; i++) {
            this.display.drawText(this.origin.x, this.origin.y+i+1, bodyLine);
        }
        this.display.drawText(this.origin.x, this.origin.y+this.height-1, bottomBar);

        if (options.title) {
            let title = this._getTitle();
            let titleX = this.origin.x + Math.round((this.width/2) - title.length/2);
            title = "%c{" + this.fgColor + "}" + "%b{" + this.bgColor + "}" + title;
            this.display.drawText(titleX, this.origin.y, title);
        }

    }

    resetFocus(coordinate) {
        this._cursor = {x: coordinate.x, y: coordinate.y};
    }

    // Screen-moving functions
    move(dX, dY) {
        // Positive dX moves right, negative dY moves down
        let newX = this.player.x + dX;
        let newY = this.player.y + dY;
        // attempt move
        let result = this.player.tryMove(newX, newY, this.stage);
        //if (result) {
        //    this._render(this.main.display);
        //}
        
        //// postive dX moves right
        //this._cursorX = Math.max(0,
        //    Math.min(this.stageWidth - 1, this._cursorX + dX));
        //// positive dY moves down
        //this._cursorY = Math.max(0,
        //    Math.min(this.stageHeight - 1, this._cursorY + dY));
        //
    }

};

coldIron.Panel = class extends coldIron.Screen {
    constructor(panelData, main, parent) {
        super(panelData, main);
        this._parent = parent;
        this._active = false;
        //this.getTitle = panelData.getTitle || undefined;
    }

    get parent() {
        return this._parent;
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
        this._passable = properties.passable || false;
        this._destructible = properties.destructible || false;
    }

    get glyph() {
        return this._glyph;
    }

    get passable() {
        return this._passable;
    }

    get destructible() {
        return this._destructible;
    }
};


coldIron.Tile.NullTile = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._passable = properties.passable || false;
        this._destructible = properties.destructible || false;
        this._character = '!';
        this._fgColor = 'pink';
        this._bgColor = 'red';
    }
};

coldIron.Tile.FloorTile = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._passable = properties.passable || true;
        this._destructible = properties.destructible || false;
        this._character = properties.character || '.';
        this._fgColor = properties.fgColor || 'goldenrod';
        this._bgColor = properties.bgColor || 'black';
    }
};

coldIron.Tile.WallTile = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._passable = properties.passable || false;
        this._destructible = properties.destructible || true;
        this._character = properties.character || '#';
        this._fgColor = properties.fgColor || 'blue';
        this._bgColor = properties.bgColor || 'black';
    }
};

coldIron.Tile.StairsUp = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._passable = properties.passable || true;
        this._destructible = properties.destructible || true;
        this._character = properties.character || '<';
        this._fgColor = properties.fgColor || 'yellow';
        this._bgColor = properties.bgColor || 'black';
    }
};

coldIron.Tile.StairsDown = class extends coldIron.Tile {
    constructor(properties) {
        super(properties);
        this._passable = properties.passable || true;
        this._destructible = properties.destructible || true;
        this._character = properties.character || '>';
        this._fgColor = properties.fgColor || 'orange';
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

    // unlocks game engine if entity locked it
    continue() {
        this.world.engine.unlock();
    }
};

coldIron.World = class  {
        constructor(appData, player) {
        // this._title = gameData.title || undefined;
        this._width = appData.stageWidth || this._displayWidth;
        this._height = appData.stageHeight || this._displayHeight;
        this._depth = appData.worldDepth || 0;
        this._currentDepth = appData.currentDepth || 0;
        this._stages = appData.stages || undefined;
        this._player = appData.player || player || undefined;
        this._main = undefined;
        // list of all entities
        this._entities = appData.entities || [];
        // engine and scheduler objects
        // to-do: allow for different scheduler types
        // to-do: if loading a save, enter saved entities into scheduler
        this._scheduler = new ROT.Scheduler.Simple();
        // to-do: replace engine w/ async/await function:
        // http://ondras.github.io/rot.js/manual/#timing/engine
        this._engine = new ROT.Engine(this._scheduler);
        // change the following to stage-specific settings;
        this._fgColor = appData.fgColor || 'rgb(255, 255, 255)';
        this._bgColor = appData.bgColor || 'rgb(0, 0, 0)';
    
        if (!this._stages) {
            this.stages = this.buildStages(appData);
        }
        // to-do: tie spawn types/amounts to floors in gameData
        this.addEntityAtRandom(player);

        let newEnt;

        for (let i = 0; i < 25; i++) {
            newEnt = new coldIron.Entity(appData.entityData.fungus);
            this.addEntityAtRandom(newEnt);
        }
    }

    get player() {
        return this._player;
    }

    get stages() {
        return this._stages;
    }

    set stages(stages) {
        this._stages = stages;
    }

    get stage() {
        return this._stages[this._currentDepth];
    }

    get depth() {
        return this._currentDepth;
    }

    set depth(depth) {
        this._currentDepth = depth;
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

    getTile(x, y, z) {
        let depth = z || this.depth;
        let stage = this.stages[depth];
        if (stage.contains(x, y)) {
            return stage.getValue(x,y);
        } else {
        // to-do: return level-specific wall tile
            return new coldIron.Tile.WallTile({});
        }
    }

    // returns list within specified range of coordinates of targets
    // targets - type of target:
    //    'floor': neighboring floor tiles
    //    'entity': neighboring entities
    //    'random': randomized tiles in range
    // range - range around entity to explore from
    findInRange(center, range, targets, sourceGrid) {
        let totalRange = [];
        let validTargets = [];
        let source = sourceGrid || this.stage;
        let entity;
        for (let x = -range; x <= range; x++) {
            for (let y = -range; y <= range; y++) {
                if (!(x === 0 && y === 0)) {
                    let point = {};
                    point.x = x + center.x;
                    point.y = y + center.y;
                    if (source.contains(point.x,point.y)) {
                        totalRange.push(point);
                    }
                }
            }
        }
        for (let i = 0; i < totalRange.length; i++) {
            let point = totalRange[i];
            entity = this.getEntityAt(point.x, point.y);
            if (targets === 'floor') {
                if (this.isFloorTile(point.x, point.y) &&
                    !entity) {
                    validTargets.push(point);
                }
            }
            if (targets === 'entity') {
                if (entity) {
                    validTargets.push(entity);
                }
            }
            if (targets === 'random') {
                coldIron.Math.shuffle(totalRange);
                validTargets = totalRange;
            }
        }
        return validTargets;
    }

    // Pass a message to an entity
    // to-do: toggle a flag once a monster has 'announced' its presence
    sendMessage(target, message) {
        // Make sure recipient can recieve message
        if (target.hasAttribute('messageRecipient')) {
            target.receiveMessage(message);
        }
    }


    // Passes a message within range
    // to-do: have option for 'sound' to work via pathing instead
    // of absolute distance
    sendMessageInRange(center, range, message) {
        let targets = this.findInRange(center, range, 'entity');
        let entity;
        for (let t = 0; t < targets.length; t++) {
            entity = targets[t];
            if (entity.hasAttribute('messageRecipient')) {
                this.sendMessage(entity, message);
            }
        }
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
        if (entity.hasAttribute('actor')) {
            let scheduler = this.scheduler;
            scheduler.add(entity, true);
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
        if (entity.hasAttribute('actor')) {
            this._scheduler.remove(entity);
        }
    }

    destroy(x, y, z) {
        let depth = z || this.depth;
        // to-do; level-specific floor replacement
        // to-do; destroying other objects
        let stage = this.stages[depth];
        let target = stage.getValue(x,y);
        if (target.destructible) {
            stage.setValue(x, y,
                new coldIron.Tile.FloorTile(this.main.appData.stageOptions));
        }
    }

    isFloorTile(x, y) {
        let clear;
        if (!(this.stage.getValue(x, y) instanceof coldIron.Tile.FloorTile) ||
        this.getEntityAt(x, y)) {
            clear = false;
        } else {
            clear = true;
        }
        return clear;
    }

    getRandomFloorXY() {
        let tile = {x: undefined, y: undefined};
        let stage = this.stages[this.depth];
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
    buildStages(appData) {
        let RegionHandler = class{
            constructor() {
                // depth level used as key for regions
                this.regions = {};
                this._currentDepth = 0;
                this.regionMaps = [];
            }

            get depth() {
                return this._currentDepth;
            }

            set depth(depthLevel) {
                this._currentDepth = depthLevel;
            }

            getRegion(regionNumber) {
                let regions = this.regions[this.depth];
                return regions.filter(r=>r.number === regionNumber)[0];
            }

            wallRegion(stage, regionNumber){
                let region = this.getRegion(regionNumber);
                let point = {};
                point.x = undefined;
                point.y = undefined;
                let pointStr;
                for (let i = 0; i < region.data.length; i++) {
                    pointStr = region.data[i]; 
                    [point.x, point.y] =
                        [parseInt(pointStr[0]), parseInt(pointStr[2])];
                    stage.setValue(point.x, point.y, new coldIron.Tile.WallTile(options));
                }
            }
        };

        let Region = class {
            constructor() {
                this.data = [];
                this.number = undefined;
                this.size = 0;
            }

            addValue(x, y) {
                this.data.push(x+','+y);
                this.size++;
            }

            contains(x, y) {
                if (this.data.indexOf(x+','+y) === -1) {
                    return false;
                } else {
                    return true;
                }
            }
        };

        let width = this._width;
        let height = this._height;
        let depth = appData.worldDepth | 1;
        let options = appData.stageOptions || {};
        let stages = [];
        let regionMaps = [];
        //let regionHandler = new RegionHandler();


        //
        // stage generator; employs ROT random level generation
        


        let generateStage = () => {
            let totalIterations = 4;
            let stage = new coldIron.Math.Grid(width, height);
            let regionMap = new coldIron.Math.Grid(width, height);
            
            //
            // actually assigns values from generated level
            let createCallback = (x,y,v) =>{
                if (v === 1) {
                    stage.setValue(x, y, new coldIron.Tile.FloorTile(options));
                    regionMap.setValue(x, y, 1);
                } else {
                    stage.setValue(x, y, new coldIron.Tile.WallTile(options));
                    regionMap.setValue(x, y, 0);
                }
            };
            
            // to-do: select different generators
            let generator = new ROT.Map.Cellular(width, height);
                    generator.randomize(0.5);
                    
            
            // -2 because one last iteration happens after
            for (let i = 0; i < totalIterations - 2; i++) {
                generator.create();
            }
            // stage values assigned from generator
            generator.create(createCallback);
        
            return [stage, regionMap];
        };

        for (let i = 0; i < depth; i++) {
            [stages[i], regionMaps[i]] = generateStage(width, height);
        }
        return stages;
    }
};